package main

import (
	"backend/atendimento"
	"backend/handlers"
	"backend/middleware"
	"encoding/json"
	"net/http"
	"strings"
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
	// O limite é por IP; tablets e computadores do hospital podem compartilhar
	// o mesmo IP público (NAT). O valor maior evita bloquear atendimentos
	// simultâneos por causa do polling de presença e conferência.
	atendimentoLimiter := middleware.NewRateLimiter(600, time.Minute)
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
			middleware.ExigirAutenticacao(authHandler.Authenticate, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				usuario, ok := middleware.UsuarioDoContexto(r)
				if !ok {
					http.Error(w, "Não autenticado", http.StatusUnauthorized)
					return
				}
				if !usuario.Administrador {
					var permitido bool
					err := gerenciamentoHandler.DB.QueryRow(r.Context(), `
						SELECT COALESCE(up.permitido, fp.permitido, FALSE)
						FROM permissoes p JOIN usuarios u ON u.id=$1
						LEFT JOIN funcao_permissoes fp ON fp.permissao_id=p.id AND fp.funcao_id=u.funcao_id
						LEFT JOIN usuario_permissoes up ON up.permissao_id=p.id AND up.usuario_id=u.id
						WHERE p.codigo='painel.visualizar' AND u.ativo=TRUE`, usuario.ID).Scan(&permitido)
					if err != nil || !permitido {
						http.Error(w, "Você não possui permissão para visualizar o painel administrativo", http.StatusForbidden)
						return
					}
				}
				avaliacaoHandler.Listar(w, r)
			})).ServeHTTP(w, r)
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

	// Protege rotas com permissões específicas. Administradores mantêm acesso total.
	permission := func(code string, next http.Handler) http.Handler {
		return middleware.ExigirAutenticacao(authHandler.Authenticate, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			usuario, ok := middleware.UsuarioDoContexto(r)
			if !ok {
				http.Error(w, "Não autenticado", http.StatusUnauthorized)
				return
			}
			if usuario.Administrador {
				next.ServeHTTP(w, r)
				return
			}
			var allowed bool
			err := gerenciamentoHandler.DB.QueryRow(r.Context(), `
				SELECT COALESCE(up.permitido, fp.permitido, FALSE)
				FROM permissoes p JOIN usuarios u ON u.id=$1 AND u.ativo=TRUE
				LEFT JOIN funcao_permissoes fp ON fp.permissao_id=p.id AND fp.funcao_id=u.funcao_id
				LEFT JOIN usuario_permissoes up ON up.permissao_id=p.id AND up.usuario_id=u.id
				WHERE p.codigo=$2`, usuario.ID, code).Scan(&allowed)
			if err != nil || !allowed {
				http.Error(w, "Você não possui permissão para esta operação", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}

	// Rotas de atendimento recebem o limitador próprio, não o limite geral.
	// A autenticação e o CSRF continuam ativos conforme a regra de cada rota.
	if len(atendimentoManagers) > 0 && atendimentoManagers[0] != nil {
		atendimentoHandler := &handlers.AtendimentoHandler{
			Manager: atendimentoManagers[0],
			DB:      terminalHandler.DB,
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

	// Retorna o mapa completo de permissões efetivas para montar a navegação.
	mux.Handle("/me/permissoes", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		usuario, ok := middleware.UsuarioDoContexto(r)
		if !ok {
			http.Error(w, "Não autenticado", http.StatusUnauthorized)
			return
		}
		rows, err := gerenciamentoHandler.DB.Query(r.Context(), `
			SELECT p.codigo, CASE WHEN $2 THEN TRUE ELSE COALESCE(up.permitido, fp.permitido, FALSE) END
			FROM permissoes p
			JOIN usuarios u ON u.id=$1 AND u.ativo=TRUE
			LEFT JOIN funcao_permissoes fp ON fp.permissao_id=p.id AND fp.funcao_id=u.funcao_id
			LEFT JOIN usuario_permissoes up ON up.permissao_id=p.id AND up.usuario_id=u.id
		`, usuario.ID, usuario.Administrador)
		if err != nil {
			http.Error(w, "Não foi possível consultar permissões", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		result := map[string]bool{}
		for rows.Next() {
			var code string
			var allowed bool
			if err := rows.Scan(&code, &allowed); err != nil {
				http.Error(w, "Erro ao ler permissões", 500)
				return
			}
			result[code] = allowed
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(result)
	})))

	// Acesso ao painel é controlado pela permissão específica, não apenas pelo perfil administrador.
	painel := func(next http.Handler) http.Handler {
		return middleware.ExigirAutenticacao(authHandler.Authenticate, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			usuario, ok := middleware.UsuarioDoContexto(r)
			if !ok {
				http.Error(w, "Não autenticado", http.StatusUnauthorized)
				return
			}
			if usuario.Administrador {
				next.ServeHTTP(w, r)
				return
			}
			var permitido bool
			err := gerenciamentoHandler.DB.QueryRow(r.Context(), `
				SELECT COALESCE(up.permitido, fp.permitido, FALSE)
				FROM permissoes p
				JOIN usuarios u ON u.id = $1
				LEFT JOIN funcao_permissoes fp ON fp.permissao_id = p.id AND fp.funcao_id = u.funcao_id
				LEFT JOIN usuario_permissoes up ON up.permissao_id = p.id AND up.usuario_id = u.id
				WHERE p.codigo = 'painel.visualizar' AND u.ativo = TRUE`, usuario.ID).Scan(&permitido)
			if err != nil || !permitido {
				http.Error(w, "Você não possui permissão para visualizar o painel administrativo", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}

	mux.Handle("/admin/avaliacoes", painel(http.HandlerFunc(avaliacaoHandler.Listar)))
	mux.Handle("/avaliacoes/estatisticas", painel(http.HandlerFunc(avaliacaoHandler.Estatisticas)))

	permissoesHandler := &handlers.PermissoesHandler{
		DB:               gerenciamentoHandler.DB,
		AuditoriaService: gerenciamentoHandler.AuditoriaService,
	}
	mux.Handle("/admin/permissoes/catalogo", permission("permissoes.acessar", http.HandlerFunc(permissoesHandler.Catalogo)))
	mux.Handle("/admin/permissoes/usuarios", permission("permissoes.acessar", http.HandlerFunc(permissoesHandler.Usuarios)))
	mux.Handle("/admin/permissoes/usuarios/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := "permissoes.acessar"
		if r.Method == http.MethodPut {
			code = "permissoes.alterar"
		}
		permission(code, http.HandlerFunc(permissoesHandler.Usuario)).ServeHTTP(w, r)
	}))

	// Usuários: acesso ao módulo para leitura; criação, edição e exclusão são separados.
	mux.Handle("/admin/usuarios", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := "gerenciamento.acessar"
		if r.Method == http.MethodPost {
			code = "gerenciamento.usuarios.criar"
		}
		permission(code, http.HandlerFunc(gerenciamentoHandler.Usuarios)).ServeHTTP(w, r)
	}))
	mux.Handle("/admin/usuarios/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/administrador") {
			admin(http.HandlerFunc(gerenciamentoHandler.AtualizarPermissaoAdministrador)).ServeHTTP(w, r)
			return
		}
		code := "gerenciamento.usuarios.editar"
		var next http.HandlerFunc = gerenciamentoHandler.AtualizarUsuario
		if r.Method == http.MethodDelete {
			code = "gerenciamento.usuarios.excluir"
			next = gerenciamentoHandler.DesativarUsuario
		}
		if r.Method != http.MethodPut && r.Method != http.MethodDelete {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		permission(code, http.HandlerFunc(next)).ServeHTTP(w, r)
	}))

	// Funcionários: leitura exige acesso ao módulo; criação/edição/exclusão têm permissões próprias.
	mux.Handle("/admin/funcionarios", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := "gerenciamento.acessar"
		if r.Method == http.MethodPost {
			code = "gerenciamento.funcionarios.criar"
		}
		permission(code, http.HandlerFunc(gerenciamentoHandler.Funcionarios)).ServeHTTP(w, r)
	}))
	mux.Handle("/admin/funcionarios/{id}/terminal", permission("gerenciamento.funcionarios.editar", http.HandlerFunc(gerenciamentoHandler.VincularTerminal)))
	mux.Handle("/admin/funcionarios/{id}", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := "gerenciamento.funcionarios.editar"
		if r.Method == http.MethodDelete {
			code = "gerenciamento.funcionarios.excluir"
		}
		permission(code, http.HandlerFunc(gerenciamentoHandler.FuncionarioPorID)).ServeHTTP(w, r)
	}))

	// Terminais: criar e apagar são ações independentes.
	mux.Handle("/admin/terminais", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := "gerenciamento.acessar"
		if r.Method == http.MethodPost {
			code = "gerenciamento.terminais.criar"
		}
		permission(code, http.HandlerFunc(gerenciamentoHandler.Terminais)).ServeHTTP(w, r)
	}))
	mux.Handle("/admin/terminais/{id}", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		permission("gerenciamento.terminais.excluir", http.HandlerFunc(gerenciamentoHandler.DesativarTerminal)).ServeHTTP(w, r)
	}))

	// Departamentos: criar e apagar são ações independentes.
	mux.Handle("/admin/departamentos", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := "gerenciamento.acessar"
		if r.Method == http.MethodPost {
			code = "gerenciamento.departamentos.criar"
		}
		permission(code, http.HandlerFunc(gerenciamentoHandler.Departamentos)).ServeHTTP(w, r)
	}))
	mux.Handle("/admin/departamentos/{id}", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		permission("gerenciamento.departamentos.excluir", http.HandlerFunc(gerenciamentoHandler.DesativarDepartamento)).ServeHTTP(w, r)
	}))

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
