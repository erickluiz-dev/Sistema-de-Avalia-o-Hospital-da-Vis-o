package models

import "time"

type Avaliacoes struct {
	Id             int64     `json:"id"`
	Avaliacao      string    `json:"avaliacao"`
	Data           time.Time `json:"data"`
	DepartamentoID int64     `json:"departamento_id"`
	Departamento   string    `json:"departamento"`
}

type NovaAvaliacaoRequest struct {
	Avaliacao      string `json:"avaliacao"`
	DepartamentoID int64  `json:"departamento_id"`
}

type AvaliacoesPaginadas struct {
	Avaliacoes   []Avaliacoes `json:"avaliacoes"`
	Pagina       int          `json:"pagina"`
	Limite       int          `json:"limite"`
	Total        int64        `json:"total"`
	TotalPaginas int          `json:"total_paginas"`
}

type HistoricoPontuacao struct {
	Semana    string  `json:"semana"`
	Pontuacao float64 `json:"pontuacao"`
}

type AvaliacaoPorDia struct {
	Dia        string `json:"day"`
	Quantidade int64  `json:"quantidade"`
}

type Estatisticas struct {
	TotalAvaliacoes          int64   `json:"total_avaliacoes"`
	Excelente                int64   `json:"excelente"`
	Bom                      int64   `json:"bom"`
	Razoavel                 int64   `json:"razoavel"`
	Ruim                     int64   `json:"ruim"`
	Pessimo                  int64   `json:"pessimo"`

	AvaliacoesHoje           int64   `json:"avaliacoes_hoje"`
	AvaliacoesOntem          int64   `json:"avaliacoes_ontem"`
	AvaliacoesSemanaAtual    int64   `json:"avaliacoes_semana_atual"`
	AvaliacoesSemanaAnterior int64   `json:"avaliacoes_semana_anterior"`

	PontuacaoMedia          float64 `json:"pontuacao_media"`
	PontuacaoSemanaAtual    float64 `json:"pontuacao_semana_atual"`
	PontuacaoSemanaAnterior float64 `json:"pontuacao_semana_anterior"`

	SatisfacaoSemanaAtual    float64 `json:"satisfacao_semana_atual"`
	SatisfacaoSemanaAnterior float64 `json:"satisfacao_semana_anterior"`

	AvaliacoesUltimos7Dias []AvaliacaoPorDia   `json:"avaliacoes_ultimos_7_dias"`
	HistoricoPontuacao     []HistoricoPontuacao `json:"historico_pontuacao"`
}

