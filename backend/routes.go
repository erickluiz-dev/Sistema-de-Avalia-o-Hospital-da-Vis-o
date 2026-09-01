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
	terminalHandler *handlers.TerminalHandler,
	gerenciamentoHandler *handlers.GerenciamentoHandler,
	loginLimiter *middleware.LoginLimiter,
	rateLimiter *middleware.RateLimiter,
) http.Handler {

	mux := http.NewServeMux()

	mux.Handle(
		"/avaliacoes/estatisticas",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(avaliacaoHandler.Estatisticas),
		),
	)

	mux.HandleFunc("/avaliacoes", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {

		case http.MethodGet:
			middleware.ExigirAutenticacao(
				authHandler.Authenticate,
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

	mux.HandleFunc(
		"/terminais",
		terminalHandler.Listar,
	)

	mux.Handle(
		"/admin/usuarios",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.Usuarios),
		),
	)

	mux.Handle(
  		"/admin/funcionarios",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.Funcionarios),
		),
	)

	mux.Handle(
		"/admin/funcionarios/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.FuncionarioPorID),
		),
	)

	mux.Handle(
		"/admin/terminais",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.Terminais),
		),
	)

	mux.Handle(
		"/admin/terminais/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.AtualizarTerminal),
		),
	)

	mux.Handle(
		"/admin/departamentos",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.Departamentos),
		),
	)

	mux.Handle(
		"/admin/departamentos/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.AtualizarDepartamento),
		),
	)

	mux.Handle(
		"/admin/usuarios/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(gerenciamentoHandler.AtualizarUsuario),
		),
	)

	return middleware.SecurityHeaders(
		middleware.CORS(
			rateLimiter.Middleware(mux),
		),
	)
}

