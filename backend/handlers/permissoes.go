package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"backend/middleware"
	"strconv"
	"strings"

	"backend/services"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PermissoesHandler struct {
	DB               *pgxpool.Pool
	AuditoriaService *services.AuditoriaService
}

type permissaoCatalogo struct {
	ID            int64  `json:"id"`
	Codigo        string `json:"codigo"`
	Tema          string `json:"tema"`
	Nome          string `json:"nome"`
	Descricao     string `json:"descricao"`
	Permitido     bool   `json:"permitido"`
	Personalizado bool   `json:"personalizado"`
}

type usuarioPermissoesResposta struct {
	ID            int64               `json:"id"`
	Nome          string              `json:"nome"`
	Login         string              `json:"login"`
	Administrador bool                `json:"administrador"`
	FuncaoID      int64               `json:"funcao_id"`
	Funcao        string              `json:"funcao"`
	Permissoes    []permissaoCatalogo `json:"permissoes"`
	Overrides     map[string]bool     `json:"overrides"`
}

func (h *PermissoesHandler) Catalogo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}
	rows, err := h.DB.Query(r.Context(), `SELECT id, codigo, tema, nome, descricao FROM permissoes ORDER BY tema, nome`)
	if err != nil {
		http.Error(w, "Erro ao consultar permissões", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	items := make([]permissaoCatalogo, 0)
	for rows.Next() {
		var p permissaoCatalogo
		if err := rows.Scan(&p.ID, &p.Codigo, &p.Tema, &p.Nome, &p.Descricao); err != nil {
			http.Error(w, "Erro ao ler permissões", 500)
			return
		}
		items = append(items, p)
	}
	if rows.Err() != nil {
		http.Error(w, "Erro ao ler permissões", 500)
		return
	}
	roleRows, err := h.DB.Query(r.Context(), `SELECT id,nome,codigo FROM funcoes ORDER BY id`)
	if err != nil {
		http.Error(w, "Erro ao consultar funções", 500)
		return
	}
	defer roleRows.Close()
	roles := make([]struct {
		ID     int64  `json:"id"`
		Nome   string `json:"nome"`
		Codigo string `json:"codigo"`
	}, 0)
	for roleRows.Next() {
		var role struct {
			ID     int64  `json:"id"`
			Nome   string `json:"nome"`
			Codigo string `json:"codigo"`
		}
		if err := roleRows.Scan(&role.ID, &role.Nome, &role.Codigo); err != nil {
			http.Error(w, "Erro ao ler funções", 500)
			return
		}
		roles = append(roles, role)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"permissoes": items, "roles": roles})
}

func (h *PermissoesHandler) Usuarios(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", 405)
		return
	}
	rows, err := h.DB.Query(r.Context(), `
		SELECT u.id,u.nome,u.login,u.administrador, f.id, f.nome
		FROM usuarios u JOIN funcoes f ON f.id=u.funcao_id
		WHERE u.ativo=TRUE ORDER BY f.id,u.nome`)
	if err != nil {
		http.Error(w, "Erro ao consultar usuários e funções", 500)
		return
	}
	defer rows.Close()
	type item struct {
		ID            int64  `json:"id"`
		Nome          string `json:"nome"`
		Login         string `json:"login"`
		Administrador bool   `json:"administrador"`
		FuncaoID      int64  `json:"funcao_id"`
		Funcao        string `json:"funcao"`
	}
	out := make([]item, 0)
	for rows.Next() {
		var u item
		if err := rows.Scan(&u.ID, &u.Nome, &u.Login, &u.Administrador, &u.FuncaoID, &u.Funcao); err != nil {
			http.Error(w, "Erro ao ler usuários", 500)
			return
		}
		out = append(out, u)
	}
	if rows.Err() != nil {
		http.Error(w, "Erro ao ler usuários", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (h *PermissoesHandler) Usuario(w http.ResponseWriter, r *http.Request) {
	idText := strings.Trim(strings.TrimPrefix(r.URL.Path, "/admin/permissoes/usuarios/"), "/")
	id, err := strconv.ParseInt(idText, 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "ID de usuário inválido", 400)
		return
	}
	switch r.Method {
	case http.MethodGet:
		h.obterUsuario(w, r, id)
	case http.MethodPut:
		h.atualizarUsuario(w, r, id)
	default:
		http.Error(w, "Método não permitido", 405)
	}
}

func (h *PermissoesHandler) obterUsuario(w http.ResponseWriter, r *http.Request, id int64) {
	var out usuarioPermissoesResposta
	err := h.DB.QueryRow(r.Context(), `
		SELECT u.id,u.nome,u.login,u.administrador,f.id,f.nome
		FROM usuarios u JOIN funcoes f ON f.id=u.funcao_id
		WHERE u.id=$1 AND u.ativo=TRUE`, id).Scan(&out.ID, &out.Nome, &out.Login, &out.Administrador, &out.FuncaoID, &out.Funcao)
	if err == pgx.ErrNoRows {
		http.Error(w, "Usuário não encontrado", 404)
		return
	}
	if err != nil {
		http.Error(w, "Erro ao consultar usuário", 500)
		return
	}
	rows, err := h.DB.Query(r.Context(), `
		SELECT p.id,p.codigo,p.tema,p.nome,p.descricao,
		       CASE WHEN u.administrador THEN TRUE ELSE COALESCE(up.permitido, fp.permitido, FALSE) END AS permitido,
		       (up.usuario_id IS NOT NULL) AS personalizado
		FROM permissoes p
		CROSS JOIN usuarios u
		LEFT JOIN funcao_permissoes fp ON fp.permissao_id=p.id AND fp.funcao_id=$2
		LEFT JOIN usuario_permissoes up ON up.permissao_id=p.id AND up.usuario_id=$1
		WHERE u.id=$1
		ORDER BY p.tema,p.nome`, id, out.FuncaoID)
	if err != nil {
		http.Error(w, "Erro ao consultar catálogo", 500)
		return
	}
	out.Permissoes = make([]permissaoCatalogo, 0)
	for rows.Next() {
		var p permissaoCatalogo
		if err := rows.Scan(&p.ID, &p.Codigo, &p.Tema, &p.Nome, &p.Descricao, &p.Permitido, &p.Personalizado); err != nil {
			rows.Close()
			http.Error(w, "Erro ao ler catálogo", 500)
			return
		}
		out.Permissoes = append(out.Permissoes, p)
	}
	rows.Close()
	rows, err = h.DB.Query(r.Context(), `SELECT p.codigo, up.permitido FROM usuario_permissoes up JOIN permissoes p ON p.id=up.permissao_id WHERE up.usuario_id=$1`, id)
	if err != nil {
		http.Error(w, "Erro ao consultar exceções", 500)
		return
	}
	out.Overrides = map[string]bool{}
	for rows.Next() {
		var code string
		var allowed bool
		if err := rows.Scan(&code, &allowed); err != nil {
			rows.Close()
			http.Error(w, "Erro ao ler exceções", 500)
			return
		}
		out.Overrides[code] = allowed
	}
	rows.Close()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (h *PermissoesHandler) atualizarUsuario(w http.ResponseWriter, r *http.Request, id int64) {
	var req struct {
		FuncaoID   int64           `json:"funcao_id"`
		Permissoes map[string]bool `json:"permissoes"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 32<<10)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Corpo inválido", 400)
		return
	}
	if req.FuncaoID <= 0 {
		http.Error(w, "Função inválida", 400)
		return
	}
	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		http.Error(w, "Erro ao iniciar atualização", 500)
		return
	}
	defer tx.Rollback(r.Context())
	var exists, isAdmin bool
	err = tx.QueryRow(r.Context(), `SELECT administrador FROM usuarios WHERE id=$1 AND ativo=TRUE FOR UPDATE`, id).Scan(&isAdmin)
	if err == pgx.ErrNoRows {
		http.Error(w, "Usuário não encontrado", 404)
		return
	}
	if err != nil {
		http.Error(w, "Erro ao consultar usuário", 500)
		return
	}
	var roleCode string
	err = tx.QueryRow(r.Context(), `SELECT codigo FROM funcoes WHERE id=$1`, req.FuncaoID).Scan(&roleCode)
	if err != nil {
		http.Error(w, "Função não encontrada", 400)
		return
	}
	if isAdmin && roleCode != "administrador" {
		http.Error(w, "Não é possível remover a função de um administrador por esta tela.", 409)
		return
	}
	if !isAdmin && roleCode == "administrador" {
		http.Error(w, "A função Administrador deve ser concedida pela gestão de administradores.", 403)
		return
	}
	err = tx.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM funcoes WHERE id=$1)`, req.FuncaoID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Função não encontrada", 400)
		return
	}
	_, err = tx.Exec(r.Context(), `UPDATE usuarios SET funcao_id=$1 WHERE id=$2`, req.FuncaoID, id)
	if err != nil {
		http.Error(w, "Erro ao atualizar função", 500)
		return
	}
	if _, err = tx.Exec(r.Context(), `DELETE FROM usuario_permissoes WHERE usuario_id=$1`, id); err != nil {
		http.Error(w, "Erro ao atualizar permissões", 500)
		return
	}
	for code, allowed := range req.Permissoes {
		tag, err := tx.Exec(r.Context(), `
			INSERT INTO usuario_permissoes(usuario_id,permissao_id,permitido)
			SELECT $1,id,$3 FROM permissoes WHERE codigo=$2
			ON CONFLICT(usuario_id,permissao_id) DO UPDATE SET permitido=EXCLUDED.permitido, atualizado_em=NOW()`, id, code, allowed)
		if err != nil || tag.RowsAffected() != 1 {
			http.Error(w, "Código de permissão inválido", 400)
			return
		}
	}
	if err = tx.Commit(r.Context()); err != nil {
		http.Error(w, "Erro ao confirmar alterações", 500)
		return
	}
	if actor, ok := middleware.UsuarioDoContexto(r); ok && h.AuditoriaService != nil {
		targetID := id
		if auditErr := h.AuditoriaService.Registrar(r.Context(), actor.ID, "ATUALIZAR_PERMISSOES", "usuario", &targetID, "", "Função e permissões individuais atualizadas"); auditErr != nil {
			log.Println("Erro ao registrar auditoria de permissões:", auditErr)
		}
	}
	w.WriteHeader(http.StatusNoContent)
}
