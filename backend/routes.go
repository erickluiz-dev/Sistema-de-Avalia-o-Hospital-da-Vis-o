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

	// Emite token CSRF legível pela aplicação frontend através da resposta JSON.
	// Token CSRF: permite que o frontend obtenha o valor sem tentar ler
	// cookies do domínio da API via document.cookie.
	mux.HandleFunc("/csrf", middleware.CSRFTokenHandler(authHandler.CookieSecure))

	// Login.
	mux.Handle(
		"/login",
		loginLimiter.Middleware(
			http.HandlerFunc(authHandler.Login),
		),
	)

	// Recuperação de senha.
	mux.HandleFunc(
		"/recuperacao-senha",
		authHandler.SolicitarRecuperacaoSenha,
	)

	// Redefinição de senha.
	mux.HandleFunc(
		"/redefinir-senha",
		authHandler.RedefinirSenha,
	)

	// Departamentos disponíveis para avaliação.
	mux.HandleFunc(
		"/departamentos",
		departamentoHandler.Listar,
	)

	// Terminais disponíveis para avaliação.
	mux.HandleFunc(
		"/terminais",
		terminalHandler.Listar,
	)

	// Verifica funcionário ativo vinculado ao terminal.
	mux.HandleFunc(
		"/funcionarios/disponibilidade",
		terminalHandler.VerificarFuncionario,
	)

	// Criar avaliação permanece público.
	// A listagem por GET continua restrita a administradores.
	mux.Handle(
		"/avaliacoes",
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPost:
				avaliacaoHandler.Criar(w, r)

			case http.MethodGet:
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
		}),
	)

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
			middleware.ExigirAdmin(
				http.HandlerFunc(next),
			),
		)
	}

	// ============================================================
	// NOVAS ROTAS DE ATENDIMENTO
	// ============================================================

	// O manager é opcional para manter compatibilidade com chamadas
	// antigas de configurarRotas que ainda não o fornecem.
	if len(atendimentoManagers) > 0 &&
		atendimentoManagers[0] != nil {

		atendimentoHandler := &handlers.AtendimentoHandler{
			Manager: atendimentoManagers[0],
		}

		// Presença: permite registrar o computador e o tablet.
		// O manager valida departamento, terminal, cliente e função.
		mux.Handle(
			"/atendimento/presenca",
			http.HandlerFunc(atendimentoHandler.Presence),
		)

		// Status: permite que cada dispositivo consulte a conexão.
		mux.Handle(
			"/atendimento/status",
			http.HandlerFunc(atendimentoHandler.Status),
		)

		// A liberação exige uma sessão autenticada.
		// O handler também verifica a função declarada e o estado
		// da conexão antes de autorizar a avaliação.
		mux.Handle(
			"/atendimento/autorizar",
			auth(atendimentoHandler.Authorize),
		)

		// Saída: remove a presença do dispositivo.
		mux.Handle(
			"/atendimento/sair",
			http.HandlerFunc(atendimentoHandler.Leave),
		)
	}

	// ============================================================
	// ROTAS AUTENTICADAS EXISTENTES
	// ============================================================

	mux.Handle(
		"/me",
		auth(authHandler.Me),
	)

	mux.Handle(
		"/logout",
		auth(authHandler.Logout),
	)

	// ============================================================
	// ROTAS ADMINISTRATIVAS EXISTENTES
	// ============================================================

	// Avaliações.
	mux.Handle(
		"/admin/avaliacoes",
		admin(avaliacaoHandler.Listar),
	)

	mux.Handle(
		"/avaliacoes/estatisticas",
		admin(avaliacaoHandler.Estatisticas),
	)

	// Usuários.
	mux.Handle(
		"/admin/usuarios",
		admin(gerenciamentoHandler.Usuarios),
	)

	mux.Handle(
		"/admin/usuarios/",
		admin(gerenciamentoHandler.AtualizarUsuario),
	)

	// Funcionários.
	mux.Handle(
		"/admin/funcionarios",
		admin(gerenciamentoHandler.Funcionarios),
	)

	mux.Handle(
		"/admin/funcionarios/{id}/terminal",
		admin(gerenciamentoHandler.VincularTerminal),
	)

	mux.Handle(
		"/admin/funcionarios/{id}",
		admin(gerenciamentoHandler.FuncionarioPorID),
	)

	// Terminais.
	mux.Handle(
		"/admin/terminais",
		admin(gerenciamentoHandler.Terminais),
	)

	mux.Handle(
		"/admin/terminais/{id}",
		admin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPut:
				gerenciamentoHandler.AtualizarTerminal(w, r)

			case http.MethodDelete:
				gerenciamentoHandler.DesativarTerminal(w, r)

			default:
				http.Error(
					w,
					"Método não permitido",
					http.StatusMethodNotAllowed,
				)
			}
		})),
	)

	// Departamentos.
	mux.Handle(
		"/admin/departamentos",
		admin(gerenciamentoHandler.Departamentos),
	)

	mux.Handle(
		"/admin/departamentos/",
		admin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPut:
				gerenciamentoHandler.AtualizarDepartamento(w, r)

			case http.MethodDelete:
				gerenciamentoHandler.DesativarDepartamento(w, r)

			default:
				http.Error(
					w,
					"Método não permitido",
					http.StatusMethodNotAllowed,
				)
			}
		})),
	)

	// ============================================================
	// MIDDLEWARES GLOBAIS EXISTENTES
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
