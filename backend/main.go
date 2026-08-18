package main

import (
	"context"
	f "fmt"
	"log"
	"net/http"
	"os"
	"time"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
)

type Avaliacoes struct {
	Id        int64
	Avaliacao string
	Data      time.Time
}

type LoginRequest struct {
	Login string `json:"login"`
	Senha string `json:"senha"`
}

type UsuarioResposta struct {
	Id    int64  `json:"id"`
	Nome  string `json:"nome"`
	Login string `json:"login"`
}

var db *pgxpool.Pool

func main() {

	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	var err error

	db, err = pgxpool.New(
		context.Background(),
		databaseURL,
	)

	if err != nil {
		log.Fatal("Erro ao criar conexão:", err)
	}

	defer db.Close()

	if err := db.Ping(context.Background()); err != nil {
		log.Fatal("Erro ao conectar ao PostgreSQL:", err)
	}

	f.Println("Banco de dados conectado!")

	//salva as avaliações n db
	http.HandleFunc("/pessimo", incrementarPessimo)
	http.HandleFunc("/ruim", incrementarRuim)
	http.HandleFunc("/razoavel", incrementarRazoavel)
	http.HandleFunc("/bom", incrementarBom)
	http.HandleFunc("/excelente", incrementarExcelente)

	//lista as avaliações do db
	http.Handle(
		"/avaliacoes",
		exigirAutenticacao(
			http.HandlerFunc(listarAvaliacoes),
		),
	)

	//faz verificação do login
	http.HandleFunc("/login", loginHandler)

	//usário atual
	http.HandleFunc("/me", usuarioAtualHandler)

	http.HandleFunc("/logout", logoutHandler)

	f.Println("Servidor iniciado!")

	handler := corsMiddleware(http.DefaultServeMux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		frontendURL := os.Getenv("FRONTEND_URL")

		w.Header().Set("Access-Control-Allow-Origin", frontendURL)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Vary", "Origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
func salvarAvaliacao(avaliacao string) error {

	_, err := db.Exec(
		context.Background(),
		`
		INSERT INTO avaliacoes (avaliacao)
		VALUES ($1)
		`,
		avaliacao,
	)

	return err
}

func incrementarPessimo(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
        return
    }

    err := salvarAvaliacao("pessimo")

    if err != nil {
        log.Println("Erro ao salvar avaliação:", err)
        http.Error(w, "Erro ao salvar avaliação", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    f.Fprintln(w, "Avaliação registrada!")
}

func incrementarRuim(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
        return
    }

    err := salvarAvaliacao("ruim")

    if err != nil {
        log.Println("Erro ao salvar avaliação:", err)
        http.Error(w, "Erro ao salvar avaliação", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    f.Fprintln(w, "Avaliação registrada!")
}

func incrementarRazoavel(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
        return
    }

    err := salvarAvaliacao("razoavel")

    if err != nil {
        log.Println("Erro ao salvar avaliação:", err)
        http.Error(w, "Erro ao salvar avaliação", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    f.Fprintln(w, "Avaliação registrada!")
}

func incrementarBom(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
        return
    }

    err := salvarAvaliacao("bom")

    if err != nil {
        log.Println("Erro ao salvar avaliação:", err)
        http.Error(w, "Erro ao salvar avaliação", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    f.Fprintln(w, "Avaliação registrada!")
}

func incrementarExcelente(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	err := salvarAvaliacao("excelente")

	if err != nil {
		log.Println("Erro ao salvar avaliação:", err)

		http.Error(
			w,
			"Erro ao salvar avaliação",
			http.StatusInternalServerError,
		)

		return
	}

	w.WriteHeader(http.StatusCreated)

	f.Fprintln(w, "Avaliação registrada!")
}

func listarAvaliacoes(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query(
		context.Background(),
		`
		SELECT id, avaliacao, data_criacao
		FROM avaliacoes
		ORDER BY id DESC
		`,
	)

	if err != nil {
		log.Println("Erro ao buscar avaliações:", err)
		http.Error(w, "Erro ao buscar avaliações", http.StatusInternalServerError)
		return
	}

	defer rows.Close()

	var avaliacoes []Avaliacoes

	for rows.Next() {

		var avaliacao Avaliacoes

		err := rows.Scan(
			&avaliacao.Id,
			&avaliacao.Avaliacao,
			&avaliacao.Data,
		)

		if err != nil {
			log.Println("Erro ao ler avaliação:", err)
			http.Error(w, "Erro ao ler avaliação", http.StatusInternalServerError)
			return
		}

		avaliacoes = append(avaliacoes, avaliacao)
	}

	if err := rows.Err(); err != nil {
		log.Println("Erro nas linhas:", err)
		http.Error(w, "Erro ao processar avaliações", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(avaliacoes)

	f.Println("Número de avaliações: ", len(avaliacoes))
}

func loginHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req LoginRequest

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(
			w,
			"Dados inválidos",
			http.StatusBadRequest,
		)
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

	err = db.QueryRow(
		context.Background(),
		`
		SELECT id, nome, login, senha_hash
		FROM usuarios
		WHERE login = $1
		`,
		req.Login,
	).Scan(
		&id,
		&nome,
		&login,
		&senhaHash,
	)

	if err != nil {
		http.Error(
			w,
			"Login ou senha inválidos",
			http.StatusUnauthorized,
		)
		return
	}

	// Verifica a senha ANTES de criar a sessão
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


	// Senha correta: cria a sessão
	sessionID := uuid.New()

	expiraEm := time.Now().Add(8 * time.Hour)

	_, err = db.Exec(
		context.Background(),
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

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID.String(),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   8 * 60 * 60,
	})
	resposta := UsuarioResposta{
		Id:    id,
		Nome:  nome,
		Login: login,
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(resposta)
}

func usuarioAtualHandler(w http.ResponseWriter, r *http.Request) {

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

    var usuario UsuarioResposta

    err = db.QueryRow(
        context.Background(),
        `
        SELECT u.id, u.nome, u.login
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

func autenticarUsuario(r *http.Request) (int64, error) {

	cookie, err := r.Cookie("session_id")

	if err != nil {

		return 0, err
	}

	var usuarioID int64

	err = db.QueryRow(
		context.Background(),
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

func exigirAutenticacao(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		_, err := autenticarUsuario(r)

		if err != nil {
			http.Error(
				w,
				"Não autenticado",
				http.StatusUnauthorized,
			)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {

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

		_, err = db.Exec(
			context.Background(),
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