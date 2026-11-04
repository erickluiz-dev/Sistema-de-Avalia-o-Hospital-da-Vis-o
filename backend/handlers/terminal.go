package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"backend/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TerminalHandler struct {
	DB *pgxpool.Pool
}

// Listar retorna os terminais ativos vinculados a departamentos ativos.
func (h *TerminalHandler) Listar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	rows, err := h.DB.Query(
		r.Context(),
		`
		SELECT
			t.id,
			t.terminal,
			t.departamento_id
		FROM terminais AS t
		INNER JOIN departamentos AS d
			ON d.id = t.departamento_id
		WHERE t.ativo = TRUE
		  AND d.ativo = TRUE
		ORDER BY t.id
		`,
	)
	if err != nil {
		log.Println("Erro ao buscar terminais:", err)
		http.Error(w, "Erro ao buscar terminais", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	terminais := make([]models.Terminal, 0)
	for rows.Next() {
		var terminal models.Terminal
		if err := rows.Scan(
			&terminal.ID,
			&terminal.Terminal,
			&terminal.DepartamentoID,
		); err != nil {
			log.Println("Erro ao ler terminal:", err)
			http.Error(w, "Erro ao processar terminais", http.StatusInternalServerError)
			return
		}
		terminais = append(terminais, terminal)
	}

	if err := rows.Err(); err != nil {
		log.Println("Erro nas linhas de terminais:", err)
		http.Error(w, "Erro ao processar terminais", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(terminais); err != nil {
		log.Println("Erro ao serializar terminais:", err)
	}
}

// VerificarFuncionario informa se existe funcionário ativo associado ao terminal.
func (h *TerminalHandler) VerificarFuncionario(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	departamentoID := r.URL.Query().Get("departamento_id")
	terminalID := r.URL.Query().Get("terminal_id")
	if departamentoID == "" || terminalID == "" {
		http.Error(w, "departamento_id e terminal_id são obrigatórios", http.StatusBadRequest)
		return
	}

	var disponivel bool
	err := h.DB.QueryRow(
		r.Context(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM funcionarios AS f
			INNER JOIN terminais AS t
				ON t.id = f.terminal_id
			INNER JOIN departamentos AS d
				ON d.id = t.departamento_id
			WHERE f.ativo = TRUE
			  AND t.ativo = TRUE
			  AND d.ativo = TRUE
			  AND f.terminal_id = $1
			  AND t.departamento_id = $2
		)
		`,
		terminalID,
		departamentoID,
	).Scan(&disponivel)
	if err != nil {
		log.Println("Erro ao verificar funcionário:", err)
		http.Error(w, "Erro ao verificar disponibilidade", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(map[string]bool{"disponivel": disponivel}); err != nil {
		log.Println("Erro ao serializar disponibilidade de funcionário:", err)
	}
}
