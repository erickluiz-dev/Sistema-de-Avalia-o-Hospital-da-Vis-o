package main

import (
	"net/http"
	"time"
)

func criarServidor(porta string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              ":" + porta,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}
