package main

import (
	"fmt"
	"log"
	"time"

	"backend/jobs"
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
	imprimirSeparador()
	
	fmt.Println("Banco de dados conectado!")

	jobs.IniciarLimpezaSessoes(
		db,
		1*time.Hour,
	)

	loginLimiter := middleware.NewLoginLimiter()

	authHandler := &handlers.AuthHandler{
		DB: db,
	}

	avaliacaoHandler := &handlers.AvaliacaoHandler{
		DB: db,
	}

	terminalHandler := &handlers.TerminalHandler{
		DB: db,
	}

	departamentoHandler := &handlers.DepartamentoHandler{
		DB: db,
	}

	rateLimiter := middleware.NewRateLimiter(
		100,
		time.Minute,
	)

	gerenciamentoHandler := &handlers.GerenciamentoHandler{
		DB: db,
	}

	handler := configurarRotas(
		authHandler,
		avaliacaoHandler,
		departamentoHandler,
		terminalHandler,
		gerenciamentoHandler,
		loginLimiter,
		rateLimiter,
	)

	fmt.Println("Servidor iniciado!")

	imprimirSeparador()

	servidor := criarServidor(cfg.Port, handler)

	log.Fatal(servidor.ListenAndServe())
}

func imprimirSeparador() {
	for i := 0; i < 26; i++ {
		fmt.Print("=")
	}

	fmt.Println()
}
