package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"backend/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DepartamentoHandler struct {
	DB *pgxpool.Pool
}

func (h *DepartamentoHandler) Listar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	rows, err := h.DB.Query(
		r.Context(),
		`
		SELECT id, nome
		FROM departamentos
		WHERE ativo = TRUE
		ORDER BY nome
		`,
	)

	if err != nil {
		log.Println("Erro ao buscar departamentos:", err)

		http.Error(
			w,
			"Erro ao buscar departamentos",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	departamentos := []models.Departamento{}

	for rows.Next() {
		var departamento models.Departamento

		err := rows.Scan(
			&departamento.Id,
			&departamento.Nome,
		)

		if err != nil {
			log.Println("Erro ao ler departamento:", err)

			http.Error(
				w,
				"Erro ao ler departamentos",
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
		log.Println("Erro ao processar departamentos:", err)

		http.Error(
			w,
			"Erro ao processar departamentos",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(departamentos)
}
