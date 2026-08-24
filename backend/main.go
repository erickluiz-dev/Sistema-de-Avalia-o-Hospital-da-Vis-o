package main

import (
	f "fmt"
	"log"

	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/middleware"

	"github.com/jackc/pgx/v5/pgxpool"
)

var db *pgxpool.Pool

func main() {
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	var err error

	db, err = database.Connect(cfg.DatabaseURL)

	if err != nil {
		log.Fatal("Erro ao criar conexão:", err)
	}

	defer db.Close()

	if err := database.Ping(db); err != nil {
		log.Fatal("Erro ao conectar ao PostgreSQL:", err)
	}

	f.Println("Banco de dados conectado!")

	authHandler := &handlers.AuthHandler{
		DB: db,
	}

	avaliacaoHandler := &handlers.AvaliacaoHandler{
		DB: db,
	}

	departamentoHandler := &handlers.DepartamentoHandler{
		DB: db,
	}

	loginLimiter := middleware.NewLoginLimiter()

	handler := configurarRotas(
		authHandler,
		avaliacaoHandler,
		departamentoHandler,
		loginLimiter,
	)

	f.Println("Servidor iniciado!")

	servidor := criarServidor(cfg.Port, handler)

	log.Fatal(servidor.ListenAndServe())
}