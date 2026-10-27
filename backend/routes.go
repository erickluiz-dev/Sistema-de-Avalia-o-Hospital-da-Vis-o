package main

import (
	"backend/atendimento"
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
	atendimentoManagers ...*atendimento.Manager,
) http.Handler {
	mux := http.NewServeMux()

	// ============================================================
	// ROTAS PÚBLICAS EXISTENTES
	// ============================================================

	mux.HandleFunc("/csrf", middleware.CSRFTokenHandler(authHandler.CookieSecure))

	mux.Handle(
		"/login",
		loginLimiter.Middleware(http.HandlerFunc(authHandler.Login)),
	)

	mux.HandleFunc("/recuperacao-senha", authHandler.SolicitarRecuperacaoSenha)
	mux.HandleFunc("/redefinir-senha", authHandler.RedefinirSenha)
	mux.HandleFunc("/departamentos", departamentoHandler.Listar)
	mux.HandleFunc("/terminais", terminalHandler.Listar)
	mux.HandleFunc("/funcionarios/disponibilidade", terminalHandler.VerificarFuncionario)

	// Criar avaliação permanece público; a listagem exige autenticação e perfil admin.
	mux.Handle("/avaliacoes", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			avaliacaoHandler.Criar(w, r)
		case http.MethodGet:
			middleware.ExigirAutenticacao(
				authHandler.Authenticate,
				middleware.ExigirAdmin(http.HandlerFunc(avaliacaoHandler.Listar)),
			).ServeHTTP(w, r)
		default:
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	}))

	// ============================================================
	// MIDDLEWARES DE AUTENTICAÇÃO
	// ============================================================

	auth := func(next http.HandlerFunc) http.Handler {
		return middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			http.HandlerFunc(next),
		)
	}

	admin := func(next http.HandlerFunc) http.Handler {
		return middleware.ExigirAutenticacao(
			authHandler.Authenticate,
			middleware.ExigirAdmin(http.HandlerFunc(next)),
		)
	}

	// ============================================================
	// ROTAS DE ATENDIMENTO
	// ============================================================

	// Mantém compatibilidade com chamadas antigas que não fornecem manager.
	// Em produção, main.go deve sempre passar o manager para habilitar as rotas.
	if len(atendimentoManagers) > 0 && atendimentoManagers[0] != nil {
		atendimentoHandler := &handlers.AtendimentoHandler{
			Manager: atendimentoManagers[0],
		}

		// POSTs permanecem sob o middleware global CSRF.
		mux.Handle("/atendimento/presenca", http.HandlerFunc(atendimentoHandler.Presence))
		mux.Handle("/atendimento/status", http.HandlerFunc(atendimentoHandler.Status))
		// O GET de dados é exclusivo do papel paciente; o POST exige autenticação.
		mux.Handle("/atendimento/dados", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodPost {
				auth(atendimentoHandler.PatientData).ServeHTTP(w, r)
				return
			}
			atendimentoHandler.PatientData(w, r)
		}))
		// O tablet envia a conferência; apenas funcionário autenticado consulta o resultado.
		mux.Handle("/atendimento/revisao", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet {
				auth(atendimentoHandler.PatientReview).ServeHTTP(w, r)
				return
			}
			atendimentoHandler.PatientReview(w, r)
		}))
		mux.Handle("/atendimento/autorizar", auth(atendimentoHandler.Authorize))
		mux.Handle("/atendimento/sair", http.HandlerFunc(atendimentoHandler.Leave))
	}

	// ============================================================
	// ROTAS AUTENTICADAS EXISTENTES
	// ============================================================

	mux.Handle("/me", auth(authHandler.Me))
	mux.Handle("/logout", auth(authHandler.Logout))

	// ============================================================
	// ROTAS ADMINISTRATIVAS EXISTENTES
	// ============================================================

	mux.Handle("/admin/avaliacoes", admin(avaliacaoHandler.Listar))
	mux.Handle("/avaliacoes/estatisticas", admin(avaliacaoHandler.Estatisticas))

	mux.Handle("/admin/usuarios", admin(gerenciamentoHandler.Usuarios))
	mux.Handle("/admin/usuarios/", admin(gerenciamentoHandler.AtualizarUsuario))

	mux.Handle("/admin/funcionarios", admin(gerenciamentoHandler.Funcionarios))
	mux.Handle("/admin/funcionarios/{id}/terminal", admin(gerenciamentoHandler.VincularTerminal))
	mux.Handle("/admin/funcionarios/{id}", admin(gerenciamentoHandler.FuncionarioPorID))

	mux.Handle("/admin/terminais", admin(gerenciamentoHandler.Terminais))
	mux.Handle("/admin/terminais/{id}", admin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			gerenciamentoHandler.AtualizarTerminal(w, r)
		case http.MethodDelete:
			gerenciamentoHandler.DesativarTerminal(w, r)
		default:
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})))

	mux.Handle("/admin/departamentos", admin(gerenciamentoHandler.Departamentos))
	mux.Handle("/admin/departamentos/", admin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			gerenciamentoHandler.AtualizarDepartamento(w, r)
		case http.MethodDelete:
			gerenciamentoHandler.DesativarDepartamento(w, r)
		default:
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})))

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
