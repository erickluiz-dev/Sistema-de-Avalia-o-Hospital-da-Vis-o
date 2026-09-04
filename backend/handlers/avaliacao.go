package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/models"

	"github.com/jackc/pgx/v5"
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

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
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

	if req.TerminalID <= 0 {
		http.Error(
			w,
			"Terminal inválido",
			http.StatusBadRequest,
		)
		return
	}

	// Descobre o funcionário responsável pelo terminal.
	var funcionarioID int64

	err := h.DB.QueryRow(
		r.Context(),
		`
		SELECT f.id
		FROM funcionarios f
		INNER JOIN terminais t
			ON t.id = f.terminal_id
		WHERE t.id = $1
		  AND t.departamento_id = $2
		  AND f.ativo = TRUE
		`,
		req.TerminalID,
		req.DepartamentoID,
	).Scan(&funcionarioID)

	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(
				w,
				"Terminal não possui funcionário vinculado ou não pertence ao departamento selecionado",
				http.StatusBadRequest,
			)
			return
		}

		log.Println(
			"Erro ao buscar funcionário do terminal:",
			err,
		)

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
		INSERT INTO avaliacoes (
			avaliacao,
			departamento_id,
			terminal_id,
			funcionario_id
		)
		VALUES ($1, $2, $3, $4)
		`,
		req.Avaliacao,
		req.DepartamentoID,
		req.TerminalID,
		funcionarioID,
	)

	if err != nil {
		log.Println(
			"Erro ao salvar avaliação:",
			err,
		)

		http.Error(
			w,
			"Erro ao salvar avaliação",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

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
		LEFT JOIN terminais t
			ON t.id = a.terminal_id
		LEFT JOIN funcionarios f
			ON f.id = a.funcionario_id
		WHERE 1 = 1
	`

	args := []interface{}{}
	argIndex := 1

	if search != "" {
		baseWhere += `
			AND (
				a.avaliacao ILIKE $` + strconv.Itoa(argIndex) + `
				OR d.nome ILIKE $` + strconv.Itoa(argIndex) + `
				OR t.terminal ILIKE $` + strconv.Itoa(argIndex) + `
				OR f.nome ILIKE $` + strconv.Itoa(argIndex) + `
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
			d.nome,
			a.terminal_id,
			COALESCE(t.terminal, '') AS terminal,
			a.funcionario_id,
			COALESCE(f.nome, '') AS funcionario
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
			&avaliacao.TerminalID,
			&avaliacao.Terminal,
			&avaliacao.FuncionarioID,
			&avaliacao.Funcionario,
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
			-- TODO O PERÍODO
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

			-- HOJE
			COUNT(*) FILTER (
				WHERE DATE(
					data_criacao AT TIME ZONE 'America/Sao_Paulo'
				) = CURRENT_DATE
			) AS hoje,

			-- ONTEM
			COUNT(*) FILTER (
				WHERE DATE(
					data_criacao AT TIME ZONE 'America/Sao_Paulo'
				) = CURRENT_DATE - 1
			) AS ontem,

			-- ÚLTIMOS 7 DIAS
			COUNT(*) FILTER (
				WHERE data_criacao >= NOW() - INTERVAL '7 days'
			) AS semana_atual,

			-- 7 DIAS ANTERIORES
			COUNT(*) FILTER (
				WHERE data_criacao >= NOW() - INTERVAL '14 days'
				  AND data_criacao < NOW() - INTERVAL '7 days'
			) AS semana_anterior,

			-- PONTUAÇÃO MÉDIA DE TODO O PERÍODO
			COALESCE(
				AVG(nota),
				0
			) AS pontuacao_media,

			-- SATISFAÇÃO GERAL DE TODO O PERÍODO
			COALESCE(
				(
					COUNT(*) FILTER (
						WHERE avaliacao IN ('excelente', 'bom')
					)::numeric
					/
					NULLIF(COUNT(*), 0)
				) * 100,
				0
			) AS satisfacao_geral

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
		satisfacao_geral
	FROM estatisticas
	`

	stats := models.Estatisticas{
		AvaliacoesUltimos7Dias:   []models.AvaliacaoPorDia{},
		HistoricoPontuacao:       []models.HistoricoPontuacao{},
		SatisfacaoPorMes:         []models.SatisfacaoPorMes{},
		AvaliacaoPorDepartamento: []models.AvaliacaoPorDepartamento{},
		AvaliacaoPorFuncionario:  []models.AvaliacaoPorFuncionario{},
	}

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
		&stats.SatisfacaoGeral,
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
				Semana: fmt.Sprintf(
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

	queryMeses := `
	WITH meses AS (
		SELECT generate_series(
			date_trunc(
				'month',
				CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
			) - INTERVAL '7 months',

			date_trunc(
				'month',
				CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
			),

			INTERVAL '1 month'
		) AS inicio
	),
	dados AS (
		SELECT
			date_trunc(
				'month',
				a.data_criacao AT TIME ZONE 'America/Sao_Paulo'
			) AS inicio,

			COALESCE(
				(
					COUNT(*) FILTER (
						WHERE a.avaliacao IN ('excelente', 'bom')
					)::numeric
					/
					NULLIF(COUNT(*), 0)
				) * 100,
				0
			) AS satisfacao

		FROM avaliacoes a

		WHERE a.data_criacao >= (
			date_trunc(
				'month',
				CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
			) - INTERVAL '7 months'
		)

		GROUP BY 1
	)
	SELECT
		m.inicio,
		COALESCE(d.satisfacao, 0)
	FROM meses m
	LEFT JOIN dados d
		ON d.inicio = m.inicio
	ORDER BY m.inicio
	`

	rowsMeses, err := h.DB.Query(
		r.Context(),
		queryMeses,
	)

	if err != nil {
		log.Println(
			"Erro ao buscar satisfação por mês:",
			err,
		)

		http.Error(
			w,
			"Erro ao buscar satisfação por mês",
			http.StatusInternalServerError,
		)

		return
	}

	defer rowsMeses.Close()

	nomesMeses := map[time.Month]string{
		time.January:   "Jan",
		time.February:  "Fev",
		time.March:     "Mar",
		time.April:     "Abr",
		time.May:       "Mai",
		time.June:      "Jun",
		time.July:      "Jul",
		time.August:    "Ago",
		time.September: "Set",
		time.October:   "Out",
		time.November:  "Nov",
		time.December:  "Dez",
	}

	for rowsMeses.Next() {
		var inicio time.Time
		var satisfacao float64

		err := rowsMeses.Scan(
			&inicio,
			&satisfacao,
		)

		if err != nil {
			log.Println(
				"Erro ao ler satisfação por mês:",
				err,
			)

			http.Error(
				w,
				"Erro ao processar satisfação por mês",
				http.StatusInternalServerError,
			)

			return
		}

		stats.SatisfacaoPorMes = append(
			stats.SatisfacaoPorMes,
			models.SatisfacaoPorMes{
				Mes: fmt.Sprintf(
					"%s/%02d",
					nomesMeses[inicio.Month()],
					inicio.Year()%100,
				),
				Satisfacao: satisfacao,
			},
		)
	}

	if err := rowsMeses.Err(); err != nil {
		log.Println(
			"Erro nas linhas de satisfação por mês:",
			err,
		)

		http.Error(
			w,
			"Erro ao processar satisfação por mês",
			http.StatusInternalServerError,
		)

		return
	}

	queryDepartamentos := `
	SELECT
		d.id,
		d.nome,
		COALESCE(
			AVG(
				CASE a.avaliacao
					WHEN 'pessimo' THEN 1
					WHEN 'ruim' THEN 2
					WHEN 'razoavel' THEN 3
					WHEN 'bom' THEN 4
					WHEN 'excelente' THEN 5
				END
			),
			0
		) AS pontuacao
	FROM departamentos d
	LEFT JOIN avaliacoes a
		ON a.departamento_id = d.id
	WHERE d.ativo = TRUE
	GROUP BY d.id, d.nome
	ORDER BY d.nome
	`
	rowsDepartamentos, err := h.DB.Query(
		r.Context(),
		queryDepartamentos,
	)

	if err != nil {
		log.Println("Erro ao buscar avaliações por departamento:", err)

		http.Error(
			w,
			"Erro ao buscar avaliações por departamento",
			http.StatusInternalServerError,
		)

		return
	}

	defer rowsDepartamentos.Close()

	for rowsDepartamentos.Next() {
		var departamentoID int64
		var departamento string
		var pontuacao float64

		if err := rowsDepartamentos.Scan(
			&departamentoID,
			&departamento,
			&pontuacao,
		); err != nil {
			log.Println("Erro ao ler avaliação por departamento:", err)

			http.Error(
				w,
				"Erro ao processar avaliação por departamento",
				http.StatusInternalServerError,
			)

			return
		}

		stats.AvaliacaoPorDepartamento = append(
			stats.AvaliacaoPorDepartamento,
			models.AvaliacaoPorDepartamento{
				DepartamentoID: departamentoID,
				Departamento:   departamento,
				Pontuacao:      pontuacao,
			},
		)
	}

	if err := rowsDepartamentos.Err(); err != nil {
		log.Println("Erro nas linhas de departamentos:", err)

		http.Error(
			w,
			"Erro ao processar avaliações por departamento",
			http.StatusInternalServerError,
		)

		return
	}

	queryFuncionarios := `
	SELECT
		f.id,
		f.nome,

		COUNT(a.id) FILTER (
			WHERE a.avaliacao = 'excelente'
		) AS excelente,

		COUNT(a.id) FILTER (
			WHERE a.avaliacao = 'bom'
		) AS bom,

		COUNT(a.id) FILTER (
			WHERE a.avaliacao = 'razoavel'
		) AS razoavel,

		COUNT(a.id) FILTER (
			WHERE a.avaliacao = 'ruim'
		) AS ruim,

		COUNT(a.id) FILTER (
			WHERE a.avaliacao = 'pessimo'
		) AS pessimo

	FROM funcionarios f

	LEFT JOIN avaliacoes a
		ON a.funcionario_id = f.id

	WHERE f.ativo = TRUE

	GROUP BY f.id, f.nome

	ORDER BY f.nome
	`

	rowsFuncionarios, err := h.DB.Query(
		r.Context(),
		queryFuncionarios,
	)

	if err != nil {
		log.Println(
			"Erro ao buscar avaliações por funcionário:",
			err,
		)

		http.Error(
			w,
			"Erro ao buscar avaliações por funcionário",
			http.StatusInternalServerError,
		)

		return
	}

	defer rowsFuncionarios.Close()

	for rowsFuncionarios.Next() {
		var funcionario models.AvaliacaoPorFuncionario

		if err := rowsFuncionarios.Scan(
			&funcionario.FuncionarioID,
			&funcionario.Funcionario,
			&funcionario.Excelente,
			&funcionario.Bom,
			&funcionario.Razoavel,
			&funcionario.Ruim,
			&funcionario.Pessimo,
		); err != nil {
			log.Println(
				"Erro ao ler avaliação por funcionário:",
				err,
			)

			http.Error(
				w,
				"Erro ao processar avaliação por funcionário",
				http.StatusInternalServerError,
			)

			return
		}

		stats.AvaliacaoPorFuncionario =
			append(
				stats.AvaliacaoPorFuncionario,
				funcionario,
			)
	}

	if err := rowsFuncionarios.Err(); err != nil {
		log.Println(
			"Erro nas linhas de funcionários:",
			err,
		)

		http.Error(
			w,
			"Erro ao processar avaliações por funcionário",
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
