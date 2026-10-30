package main

import (
	"backend/atendimento"
	"backend/handlers"
	"backend/middleware"
	"net/http"
	"time"
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

	// Limite separado para o fluxo tablet/computador.
	// Com polling de 5s, o fluxo normal usa aproximadamente 48 req/min
	// somando os dois dispositivos. O limite de 120/min mantém margem
	// para oscilações e outras chamadas sem desativar a proteção.
	atendimentoLimiter := middleware.NewRateLimiter(120, time.Minute)
	atendimentoLimit := func(next http.Handler) http.Handler {
		return atendimentoLimiter.Middleware(next)
	}

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

	// Rotas de atendimento recebem o limitador próprio, não o limite geral.
	// A autenticação e o CSRF continuam ativos conforme a regra de cada rota.
	if len(atendimentoManagers) > 0 && atendimentoManagers[0] != nil {
		atendimentoHandler := &handlers.AtendimentoHandler{
			Manager: atendimentoManagers[0],
		}

		mux.Handle(
			"/atendimento/presenca",
			atendimentoLimit(http.HandlerFunc(atendimentoHandler.Presence)),
		)
		mux.Handle(
			"/atendimento/status",
			atendimentoLimit(http.HandlerFunc(atendimentoHandler.Status)),
		)

		mux.Handle(
			"/atendimento/dados",
			atendimentoLimit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodPost {
					auth(atendimentoHandler.PatientData).ServeHTTP(w, r)
					return
				}
				atendimentoHandler.PatientData(w, r)
			})),
		)

		mux.Handle(
			"/atendimento/revisao",
			atendimentoLimit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodGet {
					auth(atendimentoHandler.PatientReview).ServeHTTP(w, r)
					return
				}
				atendimentoHandler.PatientReview(w, r)
			})),
		)

		mux.Handle(
			"/atendimento/autorizar",
			atendimentoLimit(auth(atendimentoHandler.Authorize)),
		)
		mux.Handle(
			"/atendimento/finalizar",
			atendimentoLimit(http.HandlerFunc(atendimentoHandler.Complete)),
		)
		mux.Handle(
			"/atendimento/sair",
			atendimentoLimit(http.HandlerFunc(atendimentoHandler.Leave)),
		)
	}

	mux.Handle("/me", auth(authHandler.Me))
	mux.Handle("/logout", auth(authHandler.Logout))

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

	// O limitador geral continua protegendo todas as demais rotas.
	// Somente /atendimento/ é excluído daqui, pois já possui limitador próprio.
	return middleware.SecurityHeaders(
		middleware.CORS(
			allowedOrigins,
			rateLimiter.MiddlewareExcept(
				middleware.ExigirCSRF(mux),
				"/atendimento/",
			),
		),
	)
}
