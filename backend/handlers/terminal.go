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

func (h *TerminalHandler) Listar(
	w http.ResponseWriter,
	r *http.Request,
) {
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
		SELECT
			id,
			terminal,
			departamento_id
		FROM terminais
		ORDER BY id
		`,
	)

	if err != nil {
		log.Println(
			"Erro ao buscar terminais:",
			err,
		)

		http.Error(
			w,
			"Erro ao buscar terminais",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	terminais := []models.Terminal{}

	for rows.Next() {
		var terminal models.Terminal

		if err := rows.Scan(
			&terminal.ID,
			&terminal.Terminal,
			&terminal.DepartamentoID,
		); err != nil {
			log.Println(
				"Erro ao ler terminal:",
				err,
			)

			http.Error(
				w,
				"Erro ao processar terminais",
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
		log.Println(
			"Erro nas linhas de terminais:",
			err,
		)

		http.Error(
			w,
			"Erro ao processar terminais",
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
