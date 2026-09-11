package main

import (
	"backend/handlers"
	"backend/middleware"
	"net/http"
)

func configurarRotas(
	authHandler *handlers.AuthHandler,
	avaliacaoHandler *handlers.AvaliacaoHandler,
	departamentoHandler *handlers.DepartamentoHandler,
	terminalHandler *handlers.TerminalHandler,
	gerenciamentoHandler *handlers.GerenciamentoHandler,
	loginLimiter *middleware.LoginLimiter,
	rateLimiter *middleware.RateLimiter,
	allowedOrigins string,
) http.Handler {

	mux := http.NewServeMux()

	// ============================================================
	// ROTAS PÚBLICAS
	// ============================================================

	// Login
	mux.Handle(
		"/login",
		loginLimiter.Middleware(
			http.HandlerFunc(authHandler.Login),
		),
	)

	// Recuperação de senha
	mux.HandleFunc(
		"/recuperacao-senha",
		authHandler.SolicitarRecuperacaoSenha,
	)

	// Redefinição de senha
	mux.HandleFunc(
		"/redefinir-senha",
		authHandler.RedefinirSenha,
	)

	// Departamentos disponíveis para a pesquisa
	mux.HandleFunc(
		"/departamentos",
		departamentoHandler.Listar,
	)

	// Terminais disponíveis para a pesquisa
	mux.HandleFunc(
		"/terminais",
		terminalHandler.Listar,
	)

	// Criar avaliação
	//
	// Esta rota permanece pública porque o usuário
	// responde à pesquisa sem precisar estar autenticado.
	mux.HandleFunc(
		"/avaliacoes",
		func(w http.ResponseWriter, r *http.Request) {

			switch r.Method {

			case http.MethodPost:
				avaliacaoHandler.Criar(w, r)

			case http.MethodGet:
				// GET /avaliacoes NÃO é público.
				// A listagem administrativa é tratada abaixo.
				middleware.ExigirAutenticacao(
					authHandler.Authenticate,
					middleware.ExigirAdmin(
						http.HandlerFunc(avaliacaoHandler.Listar),
					),
				).ServeHTTP(w, r)

			default:
				http.Error(
					w,
					"Método não permitido",
					http.StatusMethodNotAllowed,
				)
			}
		},
	)

	// ============================================================
	// ROTAS AUTENTICADAS
	// ============================================================

	// Usuário autenticado
	mux.Handle(
		"/me",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(authHandler.Me),
		),
	)

	// Logout
	mux.Handle(
		"/logout",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(authHandler.Logout),
		),
	)

	// ============================================================
	// ROTAS ADMINISTRATIVAS
	// ============================================================

	// ------------------------------------------------------------
	// Avaliações
	// ------------------------------------------------------------

	// Listagem das avaliações
	mux.Handle(
		"/admin/avaliacoes",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(avaliacaoHandler.Listar),
			),
		),
	)

	// Estatísticas das avaliações
	mux.Handle(
		"/avaliacoes/estatisticas",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(avaliacaoHandler.Estatisticas),
			),
		),
	)

	// ------------------------------------------------------------
	// Usuários
	// ------------------------------------------------------------

	mux.Handle(
		"/admin/usuarios",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.Usuarios),
			),
		),
	)

	mux.Handle(
		"/admin/usuarios/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.AtualizarUsuario),
			),
		),
	)

	// ------------------------------------------------------------
	// Funcionários
	// ------------------------------------------------------------

	mux.Handle(
		"/admin/funcionarios",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.Funcionarios),
			),
		),
	)

	mux.Handle(
		"/admin/funcionarios/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.FuncionarioPorID),
			),
		),
	)

	// ------------------------------------------------------------
	// Terminais
	// ------------------------------------------------------------

	mux.Handle(
		"/admin/terminais",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.Terminais),
			),
		),
	)

	mux.Handle(
		"/admin/terminais/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.AtualizarTerminal),
			),
		),
	)

	// ------------------------------------------------------------
	// Departamentos
	// ------------------------------------------------------------

	mux.Handle(
		"/admin/departamentos",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.Departamentos),
			),
		),
	)

	mux.Handle(
		"/admin/departamentos/",
		middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(
				http.HandlerFunc(gerenciamentoHandler.AtualizarDepartamento),
			),
		),
	)

	// ============================================================
	// MIDDLEWARES GLOBAIS
	// ============================================================

	return middleware.SecurityHeaders(
		middleware.CORS(
			allowedOrigins,
			rateLimiter.Middleware(
				middleware.ExigirCSRF(mux),
			),
		),
	)
}
