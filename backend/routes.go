package main

import (
	"net/http"
	"backend/handlers"
	"backend/middleware"
)

func configurarRotas(
	authHandler *handlers.AuthHandler,
	avaliacaoHandler *handlers.AvaliacaoHandler,
	departamentoHandler *handlers.DepartamentoHandler,
	loginLimiter *middleware.LoginLimiter,
	rateLimiter *middleware.RateLimiter,
) http.Handler {

	mux := http.NewServeMux()

	mux.Handle(
		"/avaliacoes/estatisticas",
		middleware.ExigirAutenticacao(
			authHandler,
			http.HandlerFunc(avaliacaoHandler.Estatisticas),
		),
	)

	mux.HandleFunc("/avaliacoes", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {

		case http.MethodGet:
			middleware.ExigirAutenticacao(
				authHandler,
				http.HandlerFunc(avaliacaoHandler.Listar),
			).ServeHTTP(w, r)

		case http.MethodPost:
			avaliacaoHandler.Criar(w, r)

		default:
			http.Error(
				w,
				"Método não permitido",
				http.StatusMethodNotAllowed,
			)
		}
	})

	mux.Handle(
		"/login",
		loginLimiter.Middleware(
			http.HandlerFunc(authHandler.Login),
		),
	)

	mux.HandleFunc("/me", authHandler.Me)

	mux.HandleFunc("/logout", authHandler.Logout)

	mux.HandleFunc("/departamentos", departamentoHandler.Listar)

	return middleware.CORS(
		rateLimiter.Middleware(mux),
	)
}