package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"
	"strings"
	f "fmt"

	"backend/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AvaliacaoHandler struct {
	DB *pgxpool.Pool
}

func (h *AvaliacaoHandler) Criar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<10)

	var req models.NovaAvaliacaoRequest

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(
			w,
			"Requisição inválida",
			http.StatusBadRequest,
		)
		return
	}

	avaliacoesPermitidas := map[string]bool{
		"pessimo":   true,
		"ruim":      true,
		"razoavel":  true,
		"bom":       true,
		"excelente": true,
	}

	if !avaliacoesPermitidas[req.Avaliacao] {
		http.Error(
			w,
			"Avaliação inválida",
			http.StatusBadRequest,
		)
		return
	}

	if req.DepartamentoID <= 0 {
		http.Error(
			w,
			"Departamento inválido",
			http.StatusBadRequest,
		)
		return
	}

	_, err = h.DB.Exec(
		r.Context(),
		`
		INSERT INTO avaliacoes (
			avaliacao,
			departamento_id
		)
		VALUES ($1, $2)
		`,
		req.Avaliacao,
		req.DepartamentoID,
	)

	if err != nil {
		log.Println("Erro ao salvar avaliação:", err)

		http.Error(
			w,
			"Erro ao salvar avaliação",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]string{
		"mensagem": "Avaliação registrada com sucesso",
	})
}

func (h *AvaliacaoHandler) Listar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(
			w,
			"Método não permitido",
			http.StatusMethodNotAllowed,
		)
		return
	}

	// Paginação
	pagina := 1
	limite := 10

	if valor := r.URL.Query().Get("page"); valor != "" {
		if numero, err := strconv.Atoi(valor); err == nil && numero > 0 {
			pagina = numero
		}
	}

	if valor := r.URL.Query().Get("limit"); valor != "" {
		if numero, err := strconv.Atoi(valor); err == nil && numero > 0 {
			limite = numero
		}
	}

	// Evita requisições exageradamente grandes.
	if limite > 100 {
		limite = 100
	}

	offset := (pagina - 1) * limite

	dataInicio := r.URL.Query().Get("data_inicio")
	dataFim := r.URL.Query().Get("data_fim")

	search := strings.TrimSpace(
		r.URL.Query().Get("search"),
	)

	var inicio *time.Time
	var fim *time.Time

	if dataInicio != "" {
		data, err := time.Parse("2006-01-02", dataInicio)

		if err != nil {
			http.Error(
				w,
				"Data inicial inválida",
				http.StatusBadRequest,
			)
			return
		}

		inicio = &data
	}

	if dataFim != "" {
		data, err := time.Parse(
			"2006-01-02",
			dataFim,
		)

		if err != nil {
			http.Error(
				w,
				"Data final inválida",
				http.StatusBadRequest,
			)
			return
		}

		// Inclui o dia inteiro.
		data = data.Add(24*time.Hour - time.Nanosecond)

		fim = &data
	}

	baseWhere := `
		FROM avaliacoes a
		INNER JOIN departamentos d
			ON d.id = a.departamento_id
		WHERE 1 = 1
	`

	args := []interface{}{}
	argIndex := 1

	if search != "" {
		baseWhere += `
			AND (
				a.avaliacao ILIKE $` + strconv.Itoa(argIndex) + `
				OR d.nome ILIKE $` + strconv.Itoa(argIndex) + `
			)
		`

		args = append(args, "%"+search+"%")
		argIndex++
	}

	if inicio != nil {
		baseWhere += " AND a.data_criacao >= $" +
			strconv.Itoa(argIndex)

		args = append(args, *inicio)
		argIndex++
	}

	if fim != nil {
		baseWhere += " AND a.data_criacao <= $" +
			strconv.Itoa(argIndex)

		args = append(args, *fim)
		argIndex++
	}

	// Total de registros.
	var total int64

	countQuery := `
		SELECT COUNT(*)
	` + baseWhere

	err := h.DB.QueryRow(
		r.Context(),
		countQuery,
		args...,
	).Scan(&total)

	if err != nil {
		log.Println("Erro ao contar avaliações:", err)

		http.Error(
			w,
			"Erro ao buscar avaliações",
			http.StatusInternalServerError,
		)

		return
	}

	// Avaliações da página.
	query := `
		SELECT
			a.id,
			a.avaliacao,
			a.data_criacao,
			a.departamento_id,
			d.nome
	` + baseWhere + `
		ORDER BY a.id DESC
		LIMIT $` + strconv.Itoa(argIndex) + `
		OFFSET $` + strconv.Itoa(argIndex+1)

	argsConsulta := append(args, limite, offset)

	rows, err := h.DB.Query(
		r.Context(),
		query,
		argsConsulta...,
	)

	if err != nil {
		log.Println("Erro ao buscar avaliações:", err)

		http.Error(
			w,
			"Erro ao buscar avaliações",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	avaliacoes := []models.Avaliacoes{}

	for rows.Next() {
		var avaliacao models.Avaliacoes

		err := rows.Scan(
			&avaliacao.Id,
			&avaliacao.Avaliacao,
			&avaliacao.Data,
			&avaliacao.DepartamentoID,
			&avaliacao.Departamento,
		)

		if err != nil {
			log.Println("Erro ao ler avaliação:", err)

			http.Error(
				w,
				"Erro ao ler avaliação",
				http.StatusInternalServerError,
			)

			return
		}

		avaliacoes = append(
			avaliacoes,
			avaliacao,
		)
	}

	if err := rows.Err(); err != nil {
		log.Println("Erro nas linhas:", err)

		http.Error(
			w,
			"Erro ao processar avaliações",
			http.StatusInternalServerError,
		)

		return
	}

	totalPaginas := 0

	if total > 0 {
		totalPaginas = int(
			(total + int64(limite) - 1) /
				int64(limite),
		)
	}

	resposta := models.AvaliacoesPaginadas{
		Avaliacoes:   avaliacoes,
		Pagina:       pagina,
		Limite:       limite,
		Total:        total,
		TotalPaginas: totalPaginas,
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(resposta)
}

func (h *AvaliacaoHandler) Estatisticas(
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

	query := `
	WITH base AS (
		SELECT
			avaliacao,
			data_criacao,
			CASE avaliacao
				WHEN 'pessimo' THEN 1
				WHEN 'ruim' THEN 2
				WHEN 'razoavel' THEN 3
				WHEN 'bom' THEN 4
				WHEN 'excelente' THEN 5
			END AS nota
		FROM avaliacoes
	),
	estatisticas AS (
		SELECT
			COUNT(*) AS total,

			COUNT(*) FILTER (
				WHERE avaliacao = 'excelente'
			) AS excelente,

			COUNT(*) FILTER (
				WHERE avaliacao = 'bom'
			) AS bom,

			COUNT(*) FILTER (
				WHERE avaliacao = 'razoavel'
			) AS razoavel,

			COUNT(*) FILTER (
				WHERE avaliacao = 'ruim'
			) AS ruim,

			COUNT(*) FILTER (
				WHERE avaliacao = 'pessimo'
			) AS pessimo,

			COUNT(*) FILTER (
				WHERE DATE(
					data_criacao AT TIME ZONE 'America/Sao_Paulo'
				) = CURRENT_DATE
			) AS hoje,

			COUNT(*) FILTER (
				WHERE DATE(
					data_criacao AT TIME ZONE 'America/Sao_Paulo'
				) = CURRENT_DATE - 1
			) AS ontem,

			COUNT(*) FILTER (
				WHERE data_criacao >= NOW() - INTERVAL '7 days'
			) AS semana_atual,

			COUNT(*) FILTER (
				WHERE data_criacao >= NOW() - INTERVAL '14 days'
				  AND data_criacao < NOW() - INTERVAL '7 days'
			) AS semana_anterior,

			COALESCE(AVG(nota), 0) AS pontuacao_media,

			COALESCE(
				AVG(nota) FILTER (
					WHERE data_criacao >= NOW() - INTERVAL '7 days'
				),
				0
			) AS pontuacao_semana_atual,

			COALESCE(
				AVG(nota) FILTER (
					WHERE data_criacao >= NOW() - INTERVAL '14 days'
					  AND data_criacao < NOW() - INTERVAL '7 days'
				),
				0
			) AS pontuacao_semana_anterior,

			COALESCE(
				(
					COUNT(*) FILTER (
						WHERE avaliacao IN ('excelente', 'bom')
						  AND data_criacao >= NOW() - INTERVAL '7 days'
					)::numeric
					/
					NULLIF(
						COUNT(*) FILTER (
							WHERE data_criacao >= NOW() - INTERVAL '7 days'
						),
						0
					)
				) * 100,
				0
			) AS satisfacao_semana_atual,

			COALESCE(
				(
					COUNT(*) FILTER (
						WHERE avaliacao IN ('excelente', 'bom')
						  AND data_criacao >= NOW() - INTERVAL '14 days'
						  AND data_criacao < NOW() - INTERVAL '7 days'
					)::numeric
					/
					NULLIF(
						COUNT(*) FILTER (
							WHERE data_criacao >= NOW() - INTERVAL '14 days'
							  AND data_criacao < NOW() - INTERVAL '7 days'
						),
						0
					)
				) * 100,
				0
			) AS satisfacao_semana_anterior

		FROM base
	)

	SELECT
		total,
		excelente,
		bom,
		razoavel,
		ruim,
		pessimo,
		hoje,
		ontem,
		semana_atual,
		semana_anterior,
		pontuacao_media,
		pontuacao_semana_atual,
		pontuacao_semana_anterior,
		satisfacao_semana_atual,
		satisfacao_semana_anterior
	FROM estatisticas
	`

	var stats models.Estatisticas

	err := h.DB.QueryRow(
		r.Context(),
		query,
	).Scan(
		&stats.TotalAvaliacoes,
		&stats.Excelente,
		&stats.Bom,
		&stats.Razoavel,
		&stats.Ruim,
		&stats.Pessimo,
		&stats.AvaliacoesHoje,
		&stats.AvaliacoesOntem,
		&stats.AvaliacoesSemanaAtual,
		&stats.AvaliacoesSemanaAnterior,
		&stats.PontuacaoMedia,
		&stats.PontuacaoSemanaAtual,
		&stats.PontuacaoSemanaAnterior,
		&stats.SatisfacaoSemanaAtual,
		&stats.SatisfacaoSemanaAnterior,
	)

	if err != nil {
		log.Println("Erro ao buscar estatísticas:", err)

		http.Error(
			w,
			"Erro ao buscar estatísticas",
			http.StatusInternalServerError,
		)

		return
	}

	// ─────────────────────────────────────────────
	// Últimos 7 dias
	// ─────────────────────────────────────────────

	queryDias := `
	WITH dias AS (
		SELECT generate_series(
			(
				CURRENT_TIMESTAMP
				AT TIME ZONE 'America/Sao_Paulo'
			)::date - INTERVAL '6 days',

			(
				CURRENT_TIMESTAMP
				AT TIME ZONE 'America/Sao_Paulo'
			)::date,

			INTERVAL '1 day'
		)::date AS dia
	)
	SELECT
		d.dia,
		COUNT(a.id)
	FROM dias d
	LEFT JOIN avaliacoes a
		ON (
			a.data_criacao
			AT TIME ZONE 'America/Sao_Paulo'
		)::date = d.dia
	GROUP BY d.dia
	ORDER BY d.dia
	`

	rowsDias, err := h.DB.Query(
		r.Context(),
		queryDias,
	)

	if err != nil {
		log.Println(
			"Erro ao buscar avaliações por dia:",
			err,
		)

		http.Error(
			w,
			"Erro ao buscar avaliações por dia",
			http.StatusInternalServerError,
		)

		return
	}

	defer rowsDias.Close()

	for rowsDias.Next() {
		var data time.Time
		var quantidade int64

		err := rowsDias.Scan(
			&data,
			&quantidade,
		)

		if err != nil {
			log.Println(
				"Erro ao ler avaliações por dia:",
				err,
			)

			http.Error(
				w,
				"Erro ao processar avaliações por dia",
				http.StatusInternalServerError,
			)

			return
		}

		nomeDia := map[time.Weekday]string{
			time.Sunday:    "Domingo",
			time.Monday:    "Segunda",
			time.Tuesday:   "Terça",
			time.Wednesday: "Quarta",
			time.Thursday:  "Quinta",
			time.Friday:    "Sexta",
			time.Saturday:  "Sábado",
		}[data.Weekday()]

		stats.AvaliacoesUltimos7Dias = append(
			stats.AvaliacoesUltimos7Dias,
			models.AvaliacaoPorDia{
				Dia:        nomeDia,
				Quantidade: quantidade,
			},
		)
	}

	if err := rowsDias.Err(); err != nil {
		log.Println(
			"Erro nas linhas dos últimos 7 dias:",
			err,
		)

		http.Error(
			w,
			"Erro ao processar avaliações por dia",
			http.StatusInternalServerError,
		)

		return
	}

	// ─────────────────────────────────────────────
	// Histórico de 8 semanas
	// ─────────────────────────────────────────────

	querySemanas := `
	WITH semanas AS (
		SELECT generate_series(
			date_trunc(
				'week',
				CURRENT_TIMESTAMP
				AT TIME ZONE 'America/Sao_Paulo'
			) - INTERVAL '7 weeks',

			date_trunc(
				'week',
				CURRENT_TIMESTAMP
				AT TIME ZONE 'America/Sao_Paulo'
			),

			INTERVAL '1 week'
		) AS inicio
	),
	medias AS (
		SELECT
			date_trunc(
				'week',
				data_criacao
				AT TIME ZONE 'America/Sao_Paulo'
			) AS inicio,

			AVG(
				CASE avaliacao
					WHEN 'pessimo' THEN 1
					WHEN 'ruim' THEN 2
					WHEN 'razoavel' THEN 3
					WHEN 'bom' THEN 4
					WHEN 'excelente' THEN 5
				END
			) AS media

		FROM avaliacoes

		WHERE data_criacao >=
			(
				date_trunc(
					'week',
					CURRENT_TIMESTAMP
					AT TIME ZONE 'America/Sao_Paulo'
				) - INTERVAL '7 weeks'
			)

		GROUP BY 1
	)

	SELECT
		s.inicio,
		COALESCE(m.media, 0)
	FROM semanas s
	LEFT JOIN medias m
		ON m.inicio = s.inicio
	ORDER BY s.inicio
	`

	rowsSemanas, err := h.DB.Query(
		r.Context(),
		querySemanas,
	)

	if err != nil {
		log.Println(
			"Erro ao buscar histórico:",
			err,
		)

		http.Error(
			w,
			"Erro ao buscar histórico",
			http.StatusInternalServerError,
		)

		return
	}

	defer rowsSemanas.Close()

	indiceSemana := 1

	for rowsSemanas.Next() {
		var inicio time.Time
		var pontuacao float64

		err := rowsSemanas.Scan(
			&inicio,
			&pontuacao,
		)

		if err != nil {
			log.Println(
				"Erro ao ler histórico:",
				err,
			)

			http.Error(
				w,
				"Erro ao processar histórico",
				http.StatusInternalServerError,
			)

			return
		}

		stats.HistoricoPontuacao = append(
			stats.HistoricoPontuacao,
			models.HistoricoPontuacao{
				Semana: f.Sprintf(
					"Semana %d",
					indiceSemana,
				),
				Pontuacao: pontuacao,
			},
		)

		indiceSemana++
	}

	if err := rowsSemanas.Err(); err != nil {
		log.Println(
			"Erro nas linhas do histórico:",
			err,
		)

		http.Error(
			w,
			"Erro ao processar histórico",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(stats)
}