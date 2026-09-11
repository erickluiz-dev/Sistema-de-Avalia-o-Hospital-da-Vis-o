package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"net"
	"strconv"

	"backend/middleware"
	"backend/models"
	"backend/services"

	"golang.org/x/crypto/bcrypt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GerenciamentoHandler struct {
	DB *pgxpool.Pool
	AuditoriaService *services.AuditoriaService	
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 10<<10)

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(dst); err != nil {
		http.Error(
			w,
			"Dados inválidos",
			http.StatusBadRequest,
		)
		return err
	}

	return nil
}

func (h *GerenciamentoHandler) ListarUsuarios(
	w http.ResponseWriter,
	r *http.Request,
) {
	rows, err := h.DB.Query(
		r.Context(),
		`
		SELECT id, nome, login, administrador 
		FROM usuarios
		ORDER BY nome
		`,
	)

	if err != nil {
		log.Println("Erro ao listar usuários:", err)
		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)
		return
	}

	defer rows.Close()

	usuarios := []models.UsuarioGerenciamento{}

	for rows.Next() {
		var usuario models.UsuarioGerenciamento

		if err := rows.Scan(
			&usuario.ID,
			&usuario.Nome,
			&usuario.Login,
			&usuario.Administrador,
		); err != nil {
			log.Println("Erro ao ler usuário:", err)
			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)
			return
		}

		usuarios = append(usuarios, usuario)
	}

	if err := rows.Err(); err != nil {
		log.Println("Erro nas linhas de usuários:", err)
		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usuarios)
}

func (h *GerenciamentoHandler) CriarUsuario(
	w http.ResponseWriter,
	r *http.Request,
) {
	var req models.CriarUsuarioRequest

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Nome = strings.TrimSpace(req.Nome)
	req.Login = strings.TrimSpace(req.Login)

	if req.Nome == "" ||
		req.Login == "" ||
		req.Senha == "" {
		http.Error(
			w,
			"Nome, login e senha são obrigatórios",
			http.StatusBadRequest,
		)
		return
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Senha),
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Println("Erro ao gerar senha:", err)
		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)
		return
	}

	var usuario models.UsuarioGerenciamento

	err = h.DB.QueryRow(
		r.Context(),
		`
		INSERT INTO usuarios (
			nome,
			login,
			senha_hash,
			administrador
		)
		VALUES ($1, $2, $3, $4)
		RETURNING id, nome, login, administrador
		`,
		req.Nome,
		req.Login,
		string(hash),
		req.Administrador,
	).Scan(
		&usuario.ID,
		&usuario.Nome,
		&usuario.Login,
		&usuario.Administrador,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(
				w,
				"Não foi possível criar usuário",
				http.StatusInternalServerError,
			)
			return
		}

		log.Println("Erro ao criar usuário:", err)
		http.Error(
			w,
			"Não foi possível criar usuário",
			http.StatusInternalServerError,
		)
		return
	}
	h.registrarAuditoria(
		r,
		"CRIAR_USUARIO",
		"usuario",
		usuario.ID,
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(usuario)
}

func (h *GerenciamentoHandler) CriarTerminal(
	w http.ResponseWriter,
	r *http.Request,
) {
	var req models.CriarTerminalRequest

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Terminal = strings.TrimSpace(req.Terminal)

	if req.Terminal == "" || req.DepartamentoID <= 0 {
		http.Error(
			w,
			"Terminal e departamento são obrigatórios",
			http.StatusBadRequest,
		)
		return
	}

	var terminal models.TerminalGerenciamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		INSERT INTO terminais (
			terminal,
			departamento_id,
			ativo
		)
		VALUES ($1, $2, TRUE)
		RETURNING id, terminal, departamento_id, ativo
		`,
		req.Terminal,
		req.DepartamentoID,
	).Scan(
		&terminal.ID,
		&terminal.Terminal,
		&terminal.DepartamentoID,
		&terminal.Ativo,
	)

	if err != nil {
		log.Println("Erro ao criar terminal:", err)
		http.Error(
			w,
			"Erro ao criar terminal",
			http.StatusInternalServerError,
		)
		return
	}

	h.registrarAuditoria(
		r,
		"CRIAR_TERMINAL",
		"terminal",
		terminal.ID,
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(terminal)
}

func (h *GerenciamentoHandler) CriarFuncionario(
	w http.ResponseWriter,
	r *http.Request,
) {
	var req models.CriarFuncionarioRequest

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Nome = strings.TrimSpace(req.Nome)

	if req.Nome == "" {
		http.Error(
			w,
			"Nome do funcionário é obrigatório",
			http.StatusBadRequest,
		)
		return
	}

	var funcionario models.FuncionarioGerenciamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		INSERT INTO funcionarios (
			nome,
			terminal_id,
			ativo
		)
		VALUES ($1, $2, TRUE)
		RETURNING id, nome, terminal_id, ativo
		`,
		req.Nome,
		req.TerminalID,
	).Scan(
		&funcionario.ID,
		&funcionario.Nome,
		&funcionario.TerminalID,
		&funcionario.Ativo,
	)

	if err != nil {
		log.Println("Erro ao criar funcionário:", err)
		http.Error(
			w,
			"Erro ao criar funcionário",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(funcionario)
}

func (h *GerenciamentoHandler) Usuarios(
	w http.ResponseWriter,
	r *http.Request,
) {
	switch r.Method {
	case http.MethodGet:
		h.ListarUsuarios(w, r)

	case http.MethodPost:
		h.CriarUsuario(w, r)

	default:
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
	}
}

func (h *GerenciamentoHandler) Funcionarios(
	w http.ResponseWriter,
	r *http.Request,
) {
	switch r.Method {
	case http.MethodGet:
		h.ListarFuncionarios(w, r)

	case http.MethodPost:
		h.CriarFuncionario(w, r)

	default:
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
	}
}

func (h *GerenciamentoHandler) Terminais(
	w http.ResponseWriter,
	r *http.Request,
) {
	switch r.Method {
	case http.MethodGet:
		h.ListarTerminais(w, r)

	case http.MethodPost:
		h.CriarTerminal(w, r)

	default:
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
	}
}

func (h *GerenciamentoHandler) ListarFuncionarios(
	w http.ResponseWriter,
	r *http.Request,
) {
	rows, err := h.DB.Query(
		r.Context(),
		`
		SELECT
			f.id,
			f.nome,
			f.terminal_id,
			COALESCE(t.terminal, ''),
			t.departamento_id,
			COALESCE(d.nome, ''),
			f.ativo
		FROM funcionarios f
		LEFT JOIN terminais t
			ON t.id = f.terminal_id
		LEFT JOIN departamentos d
			ON d.id = t.departamento_id
		ORDER BY f.nome
		`,
	)

	if err != nil {
		log.Println("Erro ao listar funcionários:", err)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	funcionarios := []models.FuncionarioGerenciamento{}

	for rows.Next() {
		var funcionario models.FuncionarioGerenciamento

		if err := rows.Scan(
			&funcionario.ID,
			&funcionario.Nome,
			&funcionario.TerminalID,
			&funcionario.Terminal,
			&funcionario.DepartamentoID,
			&funcionario.Departamento,
			&funcionario.Ativo,
		); err != nil {
			log.Println("Erro ao ler funcionário:", err)

			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)

			return
		}

		funcionarios = append(
			funcionarios,
			funcionario,
		)
	}

	if err := rows.Err(); err != nil {
		log.Println(
			"Erro nas linhas de funcionários:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(funcionarios)
}

func (h *GerenciamentoHandler) ListarTerminais(
	w http.ResponseWriter,
	r *http.Request,
) {
	rows, err := h.DB.Query(
		r.Context(),
		`
		SELECT
			t.id,
			t.terminal,
			t.departamento_id,
			d.nome,
			t.ativo
		FROM terminais t
		INNER JOIN departamentos d
			ON d.id = t.departamento_id
		WHERE t.ativo = TRUE
		ORDER BY t.id
		`,
	)

	if err != nil {
		log.Println("Erro ao listar terminais:", err)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	terminais := []models.TerminalGerenciamento{}

	for rows.Next() {
		var terminal models.TerminalGerenciamento

		if err := rows.Scan(
			&terminal.ID,
			&terminal.Terminal,
			&terminal.DepartamentoID,
			&terminal.Departamento,
			&terminal.Ativo,
		); err != nil {
			log.Println("Erro ao ler terminal:", err)

			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)

			return
		}

		terminais = append(
			terminais,
			terminal,
		)
	}

	if err := rows.Err(); err != nil {
		log.Println("Erro nas linhas de terminais:", err)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(terminais)
}

func (h *GerenciamentoHandler) Departamentos(
	w http.ResponseWriter,
	r *http.Request,
) {
	switch r.Method {
	case http.MethodGet:
		h.ListarDepartamentos(w, r)

	case http.MethodPost:
		h.CriarDepartamento(w, r)

	default:
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
	}
}

func (h *GerenciamentoHandler) ListarDepartamentos(
	w http.ResponseWriter,
	r *http.Request,
) {
	rows, err := h.DB.Query(
		r.Context(),
		`
		SELECT
			id,
			nome
		FROM departamentos
		ORDER BY nome
		`,
	)

	if err != nil {
		log.Println("Erro ao listar departamentos:", err)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	departamentos := []models.Departamento{}

	for rows.Next() {
		var departamento models.Departamento

		if err := rows.Scan(
			&departamento.Id,
			&departamento.Nome,
		); err != nil {
			log.Println(
				"Erro ao ler departamento:",
				err,
			)

			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)

			return
		}

		departamentos = append(
			departamentos,
			departamento,
		)
	}

	if err := rows.Err(); err != nil {
		log.Println(
			"Erro nas linhas de departamentos:",
			err,
		)

		http.Error(
			w,
			"Erro interno do servidor",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(departamentos)
}

func (h *GerenciamentoHandler) CriarDepartamento(
	w http.ResponseWriter,
	r *http.Request,
) {
	var req struct {
		Nome string `json:"nome"`
	}

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Nome = strings.TrimSpace(req.Nome)

	if req.Nome == "" {
		http.Error(
			w,
			"Nome do departamento é obrigatório",
			http.StatusBadRequest,
		)

		return
	}

	var departamento models.Departamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		INSERT INTO departamentos (
			nome
		)
		VALUES ($1)
		RETURNING id, nome
		`,
		req.Nome,
	).Scan(
		&departamento.Id,
		&departamento.Nome,
	)

	if err != nil {
		log.Println(
			"Erro ao criar departamento:",
			err,
		)

		http.Error(
			w,
			"Erro ao criar departamento",
			http.StatusInternalServerError,
		)

		return
	}

	h.registrarAuditoria(
		r,
		"CRIAR_DEPARTAMENTO",
		"departamento",
		departamento.Id,
	)

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(departamento)
}

func (h *GerenciamentoHandler) VincularTerminal(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPut {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req struct {
		TerminalID *int64 `json:"terminal_id"`
	}

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/funcionarios/",
	)

	idTexto = strings.TrimSuffix(
		idTexto,
		"/terminal",
	)

	var funcionarioID int64

	if _, err := fmt.Sscan(idTexto, &funcionarioID); err != nil || funcionarioID <= 0 {
		http.Error(
			w,
			"ID do funcionário inválido",
			http.StatusBadRequest,
		)
		return
	}

	if req.TerminalID != nil {
		var existe bool

		err := h.DB.QueryRow(
			r.Context(),
			`
			SELECT EXISTS(
				SELECT 1
				FROM terminais
				WHERE id = $1
			)
			`,
			*req.TerminalID,
		).Scan(&existe)

		if err != nil {
			log.Println(
				"Erro ao validar terminal:",
				err,
			)

			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)

			return
		}

		if !existe {
			http.Error(
				w,
				"Terminal não encontrado",
				http.StatusBadRequest,
			)

			return
		}
	}

	var funcionario models.FuncionarioGerenciamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		UPDATE funcionarios
		SET terminal_id = $1
		WHERE id = $2
		RETURNING id, nome, terminal_id, ativo
		`,
		req.TerminalID,
		funcionarioID,
	).Scan(
		&funcionario.ID,
		&funcionario.Nome,
		&funcionario.TerminalID,
		&funcionario.Ativo,
	)

	if err != nil {
		log.Println(
			"Erro ao vincular terminal:",
			err,
		)

		http.Error(
			w,
			"Funcionário não encontrado",
			http.StatusNotFound,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(funcionario)
}

func (h *GerenciamentoHandler) AtualizarFuncionario(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPut {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req struct {
		Nome string `json:"nome"`
	}

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Nome = strings.TrimSpace(req.Nome)

	if req.Nome == "" {
		http.Error(
			w,
			"Nome do funcionário é obrigatório",
			http.StatusBadRequest,
		)
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/funcionarios/",
	)

	var id int64

	if _, err := fmt.Sscan(idTexto, &id); err != nil || id <= 0 {
		http.Error(
			w,
			"ID do funcionário inválido",
			http.StatusBadRequest,
		)
		return
	}

	var funcionario models.FuncionarioGerenciamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		UPDATE funcionarios
		SET nome = $1
		WHERE id = $2
		RETURNING id, nome, terminal_id, ativo
		`,
		req.Nome,
		id,
	).Scan(
		&funcionario.ID,
		&funcionario.Nome,
		&funcionario.TerminalID,
		&funcionario.Ativo,
	)

	if err != nil {
		log.Println("Erro ao atualizar funcionário:", err)

		http.Error(
			w,
			"Funcionário não encontrado",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(funcionario)
}

func (h *GerenciamentoHandler) AtualizarTerminal(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPut {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req models.CriarTerminalRequest

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Terminal = strings.TrimSpace(req.Terminal)

	if req.Terminal == "" ||
		req.DepartamentoID <= 0 {
		http.Error(
			w,
			"Terminal e departamento são obrigatórios",
			http.StatusBadRequest,
		)
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/terminais/",
	)

	var id int64

	if _, err := fmt.Sscan(idTexto, &id); err != nil || id <= 0 {
		http.Error(
			w,
			"ID do terminal inválido",
			http.StatusBadRequest,
		)
		return
	}

	var terminal models.TerminalGerenciamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		UPDATE terminais
		SET
			terminal = $1,
			departamento_id = $2
		WHERE id = $3
		RETURNING id, terminal, departamento_id
		`,
		req.Terminal,
		req.DepartamentoID,
		id,
	).Scan(
		&terminal.ID,
		&terminal.Terminal,
		&terminal.DepartamentoID,
	)

	if err != nil {
		log.Println("Erro ao atualizar terminal:", err)

		http.Error(
			w,
			"Terminal não encontrado",
			http.StatusNotFound,
		)
		return
	}

	h.registrarAuditoria(
		r,
		"EDITAR_TERMINAL",
		"terminal",
		terminal.ID,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(terminal)
}

func (h *GerenciamentoHandler) AtualizarDepartamento(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPut {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req struct {
		Nome string `json:"nome"`
	}

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Nome = strings.TrimSpace(req.Nome)

	if req.Nome == "" {
		http.Error(
			w,
			"Nome do departamento é obrigatório",
			http.StatusBadRequest,
		)
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/departamentos/",
	)

	var id int64

	if _, err := fmt.Sscan(idTexto, &id); err != nil || id <= 0 {
		http.Error(
			w,
			"ID do departamento inválido",
			http.StatusBadRequest,
		)
		return
	}

	var departamento models.Departamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		UPDATE departamentos
		SET nome = $1
		WHERE id = $2
		RETURNING id, nome
		`,
		req.Nome,
		id,
	).Scan(
		&departamento.Id,
		&departamento.Nome,
	)

	if err != nil {
		log.Println(
			"Erro ao atualizar departamento:",
			err,
		)

		http.Error(
			w,
			"Departamento não encontrado",
			http.StatusNotFound,
		)
		return
	}

	h.registrarAuditoria(
		r,
		"EDITAR_DEPARTAMENTO",
		"departamento",
		departamento.Id,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(departamento)
}

func (h *GerenciamentoHandler) AtualizarUsuario(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPut {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	var req struct {
		Nome       string `json:"nome"`
		Login      string `json:"login"`
		Senha      string `json:"senha"`
		SenhaAtual string `json:"senha_atual"`
	}

	if err := decodeJSON(w, r, &req); err != nil {
		return
	}

	req.Nome = strings.TrimSpace(req.Nome)
	req.Login = strings.TrimSpace(req.Login)

	if req.Nome == "" || req.Login == "" {
		http.Error(
			w,
			"Nome e login são obrigatórios",
			http.StatusBadRequest,
		)
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/usuarios/",
	)

	var id int64

	if _, err := fmt.Sscan(idTexto, &id); err != nil || id <= 0 {
		http.Error(
			w,
			"ID do usuário inválido",
			http.StatusBadRequest,
		)
		return
	}

	// Atualização de senha exige confirmação da senha do administrador autenticado.
	if req.Senha != "" {
		usuario, ok := middleware.UsuarioDoContexto(r)

		if !ok {
			http.Error(
				w,
				"Não autenticado",
				http.StatusUnauthorized,
			)
			return
		}

		if req.SenhaAtual == "" {
			http.Error(
				w,
				"Senha atual é obrigatória para alterar a senha",
				http.StatusBadRequest,
			)
			return
		}

		var senhaHashAtual string

		err := h.DB.QueryRow(
			r.Context(),
			`
			SELECT senha_hash
			FROM usuarios
			WHERE id = $1
			`,
			usuario.ID,
		).Scan(&senhaHashAtual)

		if err != nil {
			log.Println(
				"Erro ao buscar senha do administrador:",
				err,
			)

			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)
			return
		}

		if err := bcrypt.CompareHashAndPassword(
			[]byte(senhaHashAtual),
			[]byte(req.SenhaAtual),
		); err != nil {
			http.Error(
				w,
				"Senha atual inválida",
				http.StatusUnauthorized,
			)
			return
		}

		hash, err := bcrypt.GenerateFromPassword(
			[]byte(req.Senha),
			bcrypt.DefaultCost,
		)

		if err != nil {
			log.Println("Erro ao gerar senha:", err)

			http.Error(
				w,
				"Erro interno do servidor",
				http.StatusInternalServerError,
			)
			return
		}

		_, err = h.DB.Exec(
			r.Context(),
			`
			UPDATE usuarios
			SET
				nome = $1,
				login = $2,
				senha_hash = $3
			WHERE id = $4
			`,
			req.Nome,
			req.Login,
			string(hash),
			id,
		)

		_, err = h.DB.Exec(
			r.Context(),
			`
			DELETE FROM sessoes
			WHERE usuario_id = $1
			`,
			id,
		)

		if err != nil {
			log.Println("Erro ao revogar sessões após alteração de senha:", err)

			http.Error(
				w,
				"Não foi possível concluir a alteração da senha",
				http.StatusInternalServerError,
			)

			return
		}

		h.registrarAuditoria(
			r,
			"TROCAR_SENHA",
			"usuario",
			id,
		)

		if err != nil {
			log.Println("Erro ao atualizar usuário:", err)

			http.Error(
				w,
				"Não foi possível atualizar usuário",
				http.StatusInternalServerError,
			)
			return
		}
	} else {
		_, err := h.DB.Exec(
			r.Context(),
			`
			UPDATE usuarios
			SET
				nome = $1,
				login = $2
			WHERE id = $3
			`,
			req.Nome,
			req.Login,
			id,
		)

		if err != nil {
			log.Println("Erro ao atualizar usuário:", err)

			http.Error(
				w,
				"Não foi possível atualizar usuário",
				http.StatusInternalServerError,
			)
			return
		}

		h.registrarAuditoria(
			r,
			"EDITAR_USUARIO",
			"usuario",
			id,
		)
	}

	var usuario models.UsuarioGerenciamento

	err := h.DB.QueryRow(
		r.Context(),
		`
		SELECT
			id,
			nome,
			login,
			administrador
		FROM usuarios
		WHERE id = $1
		`,
		id,
	).Scan(
		&usuario.ID,
		&usuario.Nome,
		&usuario.Login,
		&usuario.Administrador,
	)

	if err != nil {
		http.Error(
			w,
			"Usuário não encontrado",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usuario)
}

func (h *GerenciamentoHandler) FuncionarioPorID(
	w http.ResponseWriter,
	r *http.Request,
) {
	if strings.HasSuffix(r.URL.Path, "/terminal") {
		h.VincularTerminal(w, r)
		return
	}

	switch r.Method {
	case http.MethodPut:
		h.AtualizarFuncionario(w, r)

	default:
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
	}
}

func (h *GerenciamentoHandler) registrarAuditoria(
	r *http.Request,
	acao string,
	entidade string,
	entidadeID int64,
) {
	if h.AuditoriaService == nil {
		log.Println("Serviço de auditoria não configurado")
		return
	}

	usuario, ok := middleware.UsuarioDoContexto(r)

	if !ok {
		log.Println("Usuário autenticado não encontrado no contexto")
		return
	}

	ip := r.RemoteAddr

	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		ip = host
	}

	if err := h.AuditoriaService.Registrar(
		r.Context(),
		usuario.ID,
		acao,
		entidade,
		&entidadeID,
		ip,
		"",
	); err != nil {
		log.Println("Erro ao registrar auditoria:", err)
	}
}

func (h *GerenciamentoHandler) DesativarTerminal(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodDelete {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/terminais/",
	)

	var id int64

	if _, err := fmt.Sscan(idTexto, &id); err != nil || id <= 0 {
		http.Error(
			w,
			"ID do terminal inválido",
			http.StatusBadRequest,
		)
		return
	}

	result, err := h.DB.Exec(
		r.Context(),
		`
		UPDATE terminais
		SET ativo = FALSE
		WHERE id = $1
		  AND ativo = TRUE
		`,
		id,
	)

	if err != nil {
		log.Println("Erro ao desativar terminal:", err)

		http.Error(
			w,
			"Não foi possível desativar o terminal",
			http.StatusInternalServerError,
		)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(
			w,
			"Terminal não encontrado ou já desativado",
			http.StatusNotFound,
		)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *GerenciamentoHandler) DesativarDepartamento(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodDelete {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	idTexto := strings.TrimPrefix(
		r.URL.Path,
		"/admin/departamentos/",
	)

	var id int64

	if _, err := fmt.Sscan(idTexto, &id); err != nil || id <= 0 {
		http.Error(
			w,
			"ID do departamento inválido",
			http.StatusBadRequest,
		)
		return
	}

	result, err := h.DB.Exec(
		r.Context(),
		`
		UPDATE departamentos
		SET ativo = FALSE
		WHERE id = $1
		  AND ativo = TRUE
		`,
		id,
	)

	if err != nil {
		log.Println("Erro ao desativar departamento:", err)

		http.Error(
			w,
			"Não foi possível desativar o departamento",
			http.StatusInternalServerError,
		)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(
			w,
			"Departamento não encontrado ou já desativado",
			http.StatusNotFound,
		)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *GerenciamentoHandler) DesativarFuncionario(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodDelete {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	id, err := strconv.ParseInt(
		r.PathValue("id"),
		10,
		64,
	)

	if err != nil || id <= 0 {
		http.Error(
			w,
			"ID do funcionário inválido",
			http.StatusBadRequest,
		)
		return
	}

	result, err := h.DB.Exec(
		r.Context(),
		`
		UPDATE funcionarios
		SET ativo = FALSE
		WHERE id = $1
		  AND ativo = TRUE
		`,
		id,
	)

	if err != nil {
		log.Println("Erro ao desativar funcionário:", err)

		http.Error(
			w,
			"Não foi possível desativar o funcionário",
			http.StatusInternalServerError,
		)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(
			w,
			"Funcionário não encontrado ou já desativado",
			http.StatusNotFound,
		)
		return
	}

	h.registrarAuditoria(
		r,
		"DESATIVAR_FUNCIONARIO",
		"funcionario",
		id,
	)

	w.WriteHeader(http.StatusNoContent)
}
