package main

import (
	"log"
	"time"

	"backend/atendimento"
	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/jobs"
	"backend/middleware"
	"backend/services"
)

func main() {
	// Configuração existente.
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	// Conexão com o banco de dados existente.
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Erro ao criar conexão: ", err)
	}
	defer db.Close()

	if err := database.Ping(db); err != nil {
		log.Fatal("Erro ao conectar ao PostgreSQL: ", err)
	}

	log.Println("Banco de dados conectado!")

	// Serviços existentes.
	emailService := services.NewEmailService(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
		cfg.SMTPFrom,
	)

	auditoriaService := services.NewAuditoriaService(db)

	// Mantém a limpeza periódica das sessões existentes.
	jobs.IniciarLimpezaSessoes(db, time.Hour)

	// Middlewares existentes.
	loginLimiter := middleware.NewLoginLimiter()

	rateLimiter := middleware.NewRateLimiter(
		100,
		time.Minute,
	)

	clientIPResolver := middleware.NewClientIPResolver()

	// Handlers existentes.
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

	gerenciamentoHandler := &handlers.GerenciamentoHandler{
		DB:               db,
		ClientIPResolver: clientIPResolver,
		AuditoriaService: auditoriaService,
	}

	// Novo: gerenciador compartilhado das conexões de atendimento.
	// O mesmo manager deve ser usado por todas as rotas desta instância.
	atendimentoManager := atendimento.NewManager()

	// Configuração das rotas antigas e novas.
	handler := configurarRotas(
		authHandler,
		avaliacaoHandler,
		departamentoHandler,
		terminalHandler,
		gerenciamentoHandler,
		loginLimiter,
		rateLimiter,
		cfg.AllowedOrigins,
		atendimentoManager,
	)

	// Mantém a criação do servidor existente.
	servidor := criarServidor(cfg.Port, handler)

	log.Printf("Servidor iniciado na porta %s", cfg.Port)

	if err := servidor.ListenAndServe(); err != nil {
		log.Fatal("Erro no servidor: ", err)
	}
}
