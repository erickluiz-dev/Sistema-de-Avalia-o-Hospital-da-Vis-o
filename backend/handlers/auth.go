package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"backend/models"
	"backend/middleware"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB           *pgxpool.Pool
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(
		w,
		r.Body,
		10<<10,
	)

	var req models.LoginRequest

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	if req.Login == "" || req.Senha == "" {
		http.Error(
			w,
			"Login e senha são obrigatórios",
			http.StatusBadRequest,
		)
		return
	}

	var id int64
	var nome string
	var login string
	var senhaHash string
	var administrador bool

	err = h.DB.QueryRow(
		r.Context(),
		`
		SELECT id, nome, login, senha_hash, administrador
		FROM usuarios
		WHERE login = $1
		`,
		req.Login,
	).Scan(
		&id,
		&nome,
		&login,
		&senhaHash,
		&administrador,
	)

	if err != nil {
		http.Error(
			w,
			"Login ou senha inválidos",
			http.StatusUnauthorized,
		)
		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(senhaHash),
		[]byte(req.Senha),
	)

	if err != nil {
		http.Error(
			w,
			"Login ou senha inválidos",
			http.StatusUnauthorized,
		)
		return
	}

	sessionID := uuid.New()
	expiraEm := time.Now().Add(8 * time.Hour)

	_, err = h.DB.Exec(
		r.Context(),
		`
		INSERT INTO sessoes (id, usuario_id, expira_em)
		VALUES ($1, $2, $3)
		`,
		sessionID,
		id,
		expiraEm,
	)

	if err != nil {
		log.Println("Erro ao criar sessão:", err)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	if err := middleware.DefinirCSRFToken(w); err != nil {
		log.Println("Erro ao criar token CSRF:", err)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID.String(),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   8 * 60 * 60,
	})

	resposta := models.UsuarioResposta{
		Id:    id,
		Nome:  nome,
		Login: login,
		Administrador: administrador,
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(resposta)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	cookie, err := r.Cookie("session_id")

	if err != nil {
		http.Error(
			w,
			"Não autenticado",
			http.StatusUnauthorized,
		)
		return
	}

	var usuario models.UsuarioResposta

	err = h.DB.QueryRow(
		r.Context(),
		`
		SELECT
			u.id,
			u.nome,
			u.login,
			u.administrador
		FROM usuarios u
		INNER JOIN sessoes s
			ON s.usuario_id = u.id
		WHERE s.id = $1
		AND s.expira_em > NOW()
		`,
		cookie.Value,
	).Scan(
		&usuario.Id,
		&usuario.Nome,
		&usuario.Login,
		&usuario.Administrador,
	)

	if err != nil {
		http.Error(
			w,
			"Não autenticado",
			http.StatusUnauthorized,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(usuario)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	cookie, err := r.Cookie("session_id")

	if err == nil {
		_, err = h.DB.Exec(
			r.Context(),
			`
			DELETE FROM sessoes
			WHERE id = $1
			`,
			cookie.Value,
		)

		if err != nil {
			log.Println("Erro ao encerrar sessão:", err)

			http.Error(
				w,
				"Erro ao encerrar sessão",
				http.StatusInternalServerError,
			)

			return
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   -1,
	})

	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Authenticate(r *http.Request) (int64, error) {
	cookie, err := r.Cookie("session_id")

	if err != nil {
		return 0, err
	}

	var usuarioID int64

	err = h.DB.QueryRow(
		r.Context(),
		`
		SELECT usuario_id
		FROM sessoes
		WHERE id = $1
		  AND expira_em > NOW()
		`,
		cookie.Value,
	).Scan(&usuarioID)

	if err != nil {
		return 0, err
	}

	return usuarioID, nil
}