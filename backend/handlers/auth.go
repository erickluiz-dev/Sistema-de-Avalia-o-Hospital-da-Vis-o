package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"backend/middleware"
	"backend/models"
	"backend/services"

	"crypto/rand"
	"encoding/hex"
	"net/url"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"crypto/sha256"
)

type AuthHandler struct {
	DB          *pgxpool.Pool
	EmailService *services.EmailService
	FrontendURL string
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


	sessionToken := uuid.New().String()
	sessionHash := hashSessionToken(sessionToken)
	expiraEm := time.Now().Add(8 * time.Hour)

	_, err = h.DB.Exec(
		r.Context(),
		`
		INSERT INTO sessoes (id, usuario_id, expira_em)
		VALUES ($1, $2, $3)
		`,
		sessionHash,
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
		Value:    sessionToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   8 * 60 * 60,
	})

	resposta := models.UsuarioResposta{
		Id:            id,
		Nome:          nome,
		Login:         login,
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

	sessionHash := hashSessionToken(cookie.Value)

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
		sessionHash,
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
		sessionHash := hashSessionToken(cookie.Value)

		_, err = h.DB.Exec(
			r.Context(),
			`
			DELETE FROM sessoes
			WHERE id = $1
			`,
			sessionHash,
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

	middleware.LimparCSRFToken(w)

	w.WriteHeader(http.StatusNoContent)	
}

func (h *AuthHandler) Authenticate(
	r *http.Request,
) (middleware.UsuarioAutenticado, error) {

	cookie, err := r.Cookie("session_id")
	if err != nil {
		return middleware.UsuarioAutenticado{}, err
	}

	sessionHash := hashSessionToken(cookie.Value)

	var usuario middleware.UsuarioAutenticado

	err = h.DB.QueryRow(
		r.Context(),
		`
		SELECT
			u.id,
			u.administrador
		FROM sessoes s
		INNER JOIN usuarios u
			ON u.id = s.usuario_id
		WHERE s.id = $1
		  AND s.expira_em > NOW()
		`,
		sessionHash,
	).Scan(
		&usuario.ID,
		&usuario.Administrador,
	)

	if err != nil {
		return middleware.UsuarioAutenticado{}, err
	}

	return usuario, nil
}

func hashSessionToken(token string) uuid.UUID {
	hash := sha256.Sum256([]byte(token))

	sessionID, err := uuid.FromBytes(hash[:16])
	if err != nil {
		panic(err)
	}

	return sessionID
}

func (h *AuthHandler) SolicitarRecuperacaoSenha(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	r.Body = http.MaxBytesReader(
		w,
		r.Body,
		10<<10,
	)

	var req models.RecuperacaoSenhaRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"Dados inválidos",
			http.StatusBadRequest,
		)
		return
	}

	login := strings.TrimSpace(req.Login)

	if login == "" {
		http.Error(
			w,
			"Login é obrigatório",
			http.StatusBadRequest,
		)
		return
	}

	var usuarioID int64

	err := h.DB.QueryRow(
		r.Context(),
		`
		SELECT id
		FROM usuarios
		WHERE login = $1
		`,
		login,
	).Scan(&usuarioID)

	// Resposta propositalmente igual para usuário existente
	// ou inexistente.
	mensagem := map[string]string{
		"mensagem": "E-mail enviado",
	}

	if err != nil {
		w.Header().Set(
			"Content-Type",
			"application/json",
		)

		json.NewEncoder(w).Encode(mensagem)
		return
	}

	tokenBytes := make([]byte, 32)

	if _, err := rand.Read(tokenBytes); err != nil {
		log.Println(
			"Erro ao gerar token de recuperação:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	token := hex.EncodeToString(tokenBytes)

	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	tokenID := uuid.New()

	expiraEm := time.Now().UTC().Add(30 * time.Minute)

	tx, err := h.DB.Begin(r.Context())

	if err != nil {
		log.Println(
			"Erro ao iniciar transação:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	defer tx.Rollback(r.Context())

	_, err = tx.Exec(
		r.Context(),
		`
		DELETE FROM password_reset_tokens
		WHERE usuario_id = $1
		`,
		usuarioID,
	)

	if err != nil {
		log.Println(
			"Erro ao remover tokens anteriores:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	_, err = tx.Exec(
		r.Context(),
		`
		INSERT INTO password_reset_tokens (
			id,
			usuario_id,
			token_hash,
			expira_em
		)
		VALUES ($1, $2, $3, $4)
		`,
		tokenID,
		usuarioID,
		tokenHash,
		expiraEm,
	)

	if err != nil {
		log.Println(
			"Erro ao salvar token de recuperação:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		log.Println(
			"Erro ao confirmar token:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	frontendURL := strings.TrimRight(h.FrontendURL, "/")

	link := frontendURL +
		"/redefinir-senha?token=" +
		url.QueryEscape(token)

	if h.EmailService == nil {
		log.Println(
			"Serviço de e-mail não configurado",
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	if err := h.EmailService.EnviarRecuperacaoSenha(
		login,
		link,
	); err != nil {
		log.Println(
			"Erro ao enviar e-mail de recuperação:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(mensagem)
}

func (h *AuthHandler) RedefinirSenha(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	r.Body = http.MaxBytesReader(
		w,
		r.Body,
		10<<10,
	)

	var req models.RedefinicaoSenhaRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(
			w,
			"Dados inválidos",
			http.StatusBadRequest,
		)
		return
	}

	req.Token = strings.TrimSpace(req.Token)

	if req.Token == "" || req.Senha == "" {
		http.Error(
			w,
			"Token e nova senha são obrigatórios",
			http.StatusBadRequest,
		)
		return
	}

	if len(req.Senha) < 8 {
		http.Error(
			w,
			"A nova senha deve possuir pelo menos 8 caracteres",
			http.StatusBadRequest,
		)
		return
	}

	hash := sha256.Sum256([]byte(req.Token))
	tokenHash := hex.EncodeToString(hash[:])

	var tokenID uuid.UUID
	var usuarioID int64

	var (
		expiraEm time.Time
		usadoEm  *time.Time
	)

	err := h.DB.QueryRow(
		r.Context(),
		`
		SELECT id, usuario_id, expira_em, usado_em
		FROM password_reset_tokens
		WHERE token_hash = $1
		`,
		tokenHash,
	).Scan(
		&tokenID,
		&usuarioID,
		&expiraEm,
		&usadoEm,
	)

	if err != nil {
		log.Println("TOKEN NÃO ENCONTRADO:", err)

		http.Error(
			w,
			"Token inválido ou expirado",
			http.StatusBadRequest,
		)

		return
	}

	if !expiraEm.After(time.Now()) {
		log.Println("TOKEN EXPIRADO")

		http.Error(
			w,
			"Token inválido ou expirado",
			http.StatusBadRequest,
		)

		return
	}

	if usadoEm != nil {
		log.Println("TOKEN JÁ UTILIZADO")

		http.Error(
			w,
			"Token inválido ou expirado",
			http.StatusBadRequest,
		)

		return
	}

	if err != nil {
		http.Error(
			w,
			"Token inválido ou expirado",
			http.StatusBadRequest,
		)
		return
	}

	senhaHash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Senha),
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Println(
			"Erro ao gerar nova senha:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	tx, err := h.DB.Begin(r.Context())

	if err != nil {
		log.Println(
			"Erro ao iniciar transação:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	defer tx.Rollback(r.Context())

	result, err := tx.Exec(
		r.Context(),
		`
		UPDATE usuarios
		SET senha_hash = $1
		WHERE id = $2
		`,
		string(senhaHash),
		usuarioID,
	)

	if err != nil {
		log.Println(
			"Erro ao atualizar senha:",
			err,
		)

		http.Error(
			w,
			"Não foi possível redefinir a senha",
			http.StatusInternalServerError,
		)

		return
	}

	if result.RowsAffected() != 1 {
		http.Error(
			w,
			"Usuário não encontrado",
			http.StatusBadRequest,
		)

		return
	}

	// Invalida todas as sessões existentes.
	_, err = tx.Exec(
		r.Context(),
		`
		DELETE FROM sessoes
		WHERE usuario_id = $1
		`,
		usuarioID,
	)

	if err != nil {
		log.Println(
			"Erro ao invalidar sessões:",
			err,
		)

		http.Error(
			w,
			"Não foi possível concluir a redefinição",
			http.StatusInternalServerError,
		)

		return
	}

	// Token de recuperação torna-se inutilizável.
	_, err = tx.Exec(
		r.Context(),
		`
		UPDATE password_reset_tokens
		SET usado_em = NOW()
		WHERE id = $1
		`,
		tokenID,
	)

	if err != nil {
		log.Println(
			"Erro ao invalidar token:",
			err,
		)

		http.Error(
			w,
			"Não foi possível concluir a redefinição",
			http.StatusInternalServerError,
		)

		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		log.Println(
			"Erro ao confirmar redefinição:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(
		map[string]string{
			"mensagem": "Senha redefinida com sucesso",
		},
	)
}