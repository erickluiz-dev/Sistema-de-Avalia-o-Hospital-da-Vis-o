package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL     string
	Port            string
	ALLOWED_ORIGINS string
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
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		Port:            port,
		ALLOWED_ORIGINS: os.Getenv("ALLOWED_ORIGINS"),
	}
}
