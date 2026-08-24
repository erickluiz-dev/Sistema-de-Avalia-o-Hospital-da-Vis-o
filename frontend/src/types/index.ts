export type Screen =
  | 'login'
  | 'home'
  | 'department'
  | 'survey'
  | 'dashboard'

export type RatingKey =
  | 'pessimo'
  | 'ruim'
  | 'razoavel'
  | 'bom'
  | 'excelente'

export type Avaliacao = {
  id: number
  avaliacao: string
  data: string
  departamento_id: number
  departamento: string
}

export type Usuario = {
  id: number
  nome: string
  login: string
}

export type Departamento = {
  id: number
  nome: string
}

export type AvaliacoesPaginadas = {
  avaliacoes: Avaliacao[]
  pagina: number
  limite: number
  total: number
  total_paginas: number
}

export type Estatisticas = {
  total_avaliacoes: number
  excelente: number
  bom: number
  razoavel: number
  ruim: number
  pessimo: number

  avaliacoes_hoje: number
  avaliacoes_ontem: number

  avaliacoes_semana_atual: number
  avaliacoes_semana_anterior: number

  pontuacao_media: number
  pontuacao_semana_atual: number
  pontuacao_semana_anterior: number

  satisfacao_semana_atual: number
  satisfacao_semana_anterior: number
  avaliacoes_ultimos_7_dias: AvaliacaoPorDia[]
  historico_pontuacao: HistoricoPontuacao[]

}

export type AvaliacaoPorDia = {
  day: string
  quantidade: number
}

export type HistoricoPontuacao = {
  semana: string
  pontuacao: number
}