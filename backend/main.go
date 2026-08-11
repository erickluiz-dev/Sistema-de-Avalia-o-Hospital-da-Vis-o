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
)

type Avaliacoes struct {
	Id        int64
	Avaliacao string
	Data      time.Time
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

	http.HandleFunc("/pessimo", incrementarPessimo)
	http.HandleFunc("/ruim", incrementarRuim)
	http.HandleFunc("/razoavel", incrementarRazoavel)
	http.HandleFunc("/bom", incrementarBom)
	http.HandleFunc("/excelente", incrementarExcelente)

	http.HandleFunc("/avaliacoes", listarAvaliacoes)

	f.Println("Servidor iniciado!")

	handler := corsMiddleware(http.DefaultServeMux)

	log.Fatal(http.ListenAndServe(":8080", handler))
}

func corsMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "*")		
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

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