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

	"github.com/jackc/pgx/v5/pgxpool"
	"tailscale.com/tsnet"
)

func main() {
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	// Conexão com o banco de dados existente.
	var (
		db       *pgxpool.Pool
		tsServer *tsnet.Server
		err      error
	)

	log.Println("Iniciando configuração do banco de dados...")
	log.Printf("Tailscale configurado: %t", cfg.TailscaleAuthKey != "")

	if cfg.TailscaleAuthKey != "" {
		hostname := cfg.TailscaleHostname
		if hostname == "" {
			hostname = "hv-backend"
		}

		tsServer = &tsnet.Server{
			Hostname:  hostname,
			AuthKey:   cfg.TailscaleAuthKey,
			Ephemeral: true,
		}

		if err = tsServer.Start(); err != nil {
			log.Fatal("Erro ao iniciar Tailscale: ", err)
		}
		defer tsServer.Close()

		log.Println("Tailscale iniciado.")

		db, err = database.ConnectWithDialer(
			cfg.DatabaseURL,
			tsServer.Dial,
		)
	} else {
		// Mantém a conexão convencional no desenvolvimento local.
		db, err = database.Connect(cfg.DatabaseURL)
	}

	if err != nil {
		log.Fatal("Erro ao criar conexão: ", err)
	}
	defer db.Close()

	log.Println("Verificando conexão com o PostgreSQL...")

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

	log.Println("Inicializando servidor HTTP...")

	// Mantém a criação do servidor existente.
	servidor := criarServidor(cfg.Port, handler)

	log.Printf("Servidor iniciado na porta %s", cfg.Port)

	if err := servidor.ListenAndServe(); err != nil {
		log.Fatal("Erro no servidor: ", err)
	}
}
