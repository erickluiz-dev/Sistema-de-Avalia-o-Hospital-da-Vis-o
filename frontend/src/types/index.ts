export type Screen =
  | 'login'
  | 'forgot-password'
  | 'reset-password'
  | 'home'
  | 'department'
  | 'survey'
  | 'dashboard'
  | 'management'

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
  terminal: string
  funcionario: string
}

export type Usuario = {
  id: number
  nome: string
  login: string
  administrador: boolean
}

export type Departamento = {
  id: number
  nome: string
}

export type Terminal = {
  id: number
  terminal: string
  departamento_id: number
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

  satisfacao_geral: number

  avaliacoes_semana_atual: number
  avaliacoes_semana_anterior: number

  pontuacao_media: number
  pontuacao_semana_atual: number
  pontuacao_semana_anterior: number

  satisfacao_semana_atual: number
  satisfacao_semana_anterior: number

  avaliacoes_ultimos_7_dias: AvaliacaoPorDia[]
  historico_pontuacao: HistoricoPontuacao[]
  satisfacao_por_mes: SatisfacaoPorMes[]
  avaliacao_por_departamento: AvaliacaoPorDepartamento[]
  avaliacao_por_funcionario: AvaliacaoPorFuncionario[]
}

export type AvaliacaoPorDia = {
  day: string
  quantidade: number
}

export type HistoricoPontuacao = {
  semana: string
  pontuacao: number
}

export type SatisfacaoPorMes = {
  mes: string
  satisfacao: number
}

export type AvaliacaoPorDepartamento = {
  departamento_id: number
  departamento: string
  pontuacao: number
}

export type AvaliacaoPorFuncionario = {
  funcionario_id: number
  funcionario: string

  excelente: number
  bom: number
  razoavel: number
  ruim: number
  pessimo: number
}