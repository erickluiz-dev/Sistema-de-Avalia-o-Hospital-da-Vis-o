package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	Port           string
	AllowedOrigins string

	FrontendURL string

	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	SMTPFrom     string
}

func Load() Config {
	if err := godotenv.Load(); err != nil {
		if !os.IsNotExist(err) {
			log.Println("Aviso: erro ao carregar .env:", err)
		}
	}

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	return Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		Port:           port,
		AllowedOrigins: os.Getenv("ALLOWED_ORIGINS"),

		FrontendURL: os.Getenv("FRONTEND_URL"),

		SMTPHost:     os.Getenv("SMTP_HOST"),
		SMTPPort:     os.Getenv("SMTP_PORT"),
		SMTPUsername: os.Getenv("SMTP_USERNAME"),
		SMTPPassword: os.Getenv("SMTP_PASSWORD"),
		SMTPFrom:     os.Getenv("SMTP_FROM"),
	}
}