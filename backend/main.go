package main

import (
	f "fmt"
	"log"
	"time"
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

	loginLimiter := middleware.NewLoginLimiter()

	authHandler := &handlers.AuthHandler{
		DB: db,
	}

	avaliacaoHandler := &handlers.AvaliacaoHandler{
		DB: db,
	}

	departamentoHandler := &handlers.DepartamentoHandler{
		DB: db,
	}

	rateLimiter := middleware.NewRateLimiter(
		100,
		time.Minute,
	)

	handler := configurarRotas(
		authHandler,
		avaliacaoHandler,
		departamentoHandler,
		loginLimiter,
		rateLimiter,
	)

	f.Println("Servidor iniciado!")

	servidor := criarServidor(cfg.Port, handler)

	log.Fatal(servidor.ListenAndServe())
}

