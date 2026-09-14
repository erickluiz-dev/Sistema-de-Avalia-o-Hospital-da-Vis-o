package main

import (
	"fmt"
	"log"
	"time"

	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/jobs"
	"backend/middleware"
	"backend/services"

	"github.com/jackc/pgx/v5/pgxpool"
)


var db *pgxpool.Pool

func main() {

	cfg := config.Load()

	emailService := services.NewEmailService(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
		cfg.SMTPFrom,
	)

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

	// Serviço de auditoria
	auditoriaService := services.NewAuditoriaService(db)

	jobs.IniciarLimpezaSessoes(
		db,
		1*time.Hour,
	)

	loginLimiter := middleware.NewLoginLimiter()

	authHandler := &handlers.AuthHandler{
		DB:           db,
		EmailService: emailService,
		FrontendURL:  cfg.FrontendURL,
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

	clientIPResolver := middleware.NewClientIPResolver()

	gerenciamentoHandler := &handlers.GerenciamentoHandler{
		DB:               db,
		ClientIPResolver: clientIPResolver,
		AuditoriaService: auditoriaService,
	}

	handler := configurarRotas(
		authHandler,
		avaliacaoHandler,
		departamentoHandler,
		terminalHandler,
		gerenciamentoHandler,
		loginLimiter,
		rateLimiter,
		cfg.AllowedOrigins,
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