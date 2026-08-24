import { useState, useEffect, useRef } from 'react'

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'

import { toPng } from 'html-to-image'

import NavBar from '../components/NavBar'
import StatCard from '../components/StatCard'

import { apiFetch } from '../services/api'

import type {
  Avaliacao,
  AvaliacoesPaginadas,
  Usuario,
  Estatisticas,
} from '../types'

function ratingLabel(r: string) {
  const rating = r
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (rating === "excelente") return "Excelente"
  if (rating === "bom") return "Bom"
  if (rating === "razoavel") return "Razoável"
  if (rating === "ruim") return "Ruim"
  if (rating === "pessimo") return "Péssimo"

  return r
}

function ratingColor(r: string) {
  const rating = r
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (rating === "excelente") return "#00B5CC"
  if (rating === "bom") return "#0eb374"
  if (rating === "razoavel") return "#EAB308"
  if (rating === "ruim") return "#F97316"
  if (rating === "pessimo") return "#EF4444"

  return "#6b7280"
}
// ─── Screen 4: Admin Dashboard ────────────────────────────────────────────────

export default function DashboardScreen({ onBack, onLogout, usuario }: { onBack: () => void; onLogout: () => void;  usuario: Usuario | null }) {
  const [search, setSearch] = useState('')
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])

  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0)

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [carregando, setCarregando] = useState(true)
  const relatorioRef = useRef<HTMLDivElement>(null)
  const [exportando, setExportando] = useState(false)
  const [estatisticas, setEstatisticas] =
    useState<Estatisticas | null>(null)

  const carregarEstatisticas = async () => {
    try {
      const response = await apiFetch(
        '/avaliacoes/estatisticas',
        {
          method: 'GET',
        },
      )

      if (!response.ok) {
        throw new Error(
          'Erro ao buscar estatísticas',
        )
      }

      const dados: Estatisticas =
        await response.json()

      setEstatisticas(dados)
    } catch (error) {
      console.error(
        'Erro ao carregar estatísticas:',
        error,
      )
    }
  }

  const recentEvals = avaliacoes
    .map((avaliacao) => ({
      date: new Date(avaliacao.data).toLocaleString("pt-BR"),
      rating: ratingLabel(avaliacao.avaliacao),
      terminal: avaliacao.departamento,
    }))

  const carregarAvaliacoes = async (
    paginaAtual = pagina,
  ) => {
    try {
      setCarregando(true)

      const params = new URLSearchParams()

      params.set('page', paginaAtual.toString())
      params.set('limit', '10')

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (dataInicio) {
        params.set('data_inicio', dataInicio)
      }

      if (dataFim) {
        params.set('data_fim', dataFim)
      }

      const response = await apiFetch(
        `/avaliacoes?${params.toString()}`,
        {
          method: 'GET',
        },
      )

      if (!response.ok) {
        throw new Error(
          'Erro ao buscar avaliações',
        )
      }

      const dados: AvaliacoesPaginadas =
        await response.json()

      setAvaliacoes(dados.avaliacoes)
      setPagina(dados.pagina)
      setTotalPaginas(dados.total_paginas)
      setTotalAvaliacoes(dados.total)
    } catch (error) {
      console.error(
        'Erro ao carregar avaliações:',
        error,
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarAvaliacoes(1)
    carregarEstatisticas()
  }, [])

  const exportarRelatorio = async () => {
    if (!relatorioRef.current) {
      return
    }

    const elemento = relatorioRef.current

    try {
      setExportando(true)

      // Cria uma cópia do relatório
      const clone = elemento.cloneNode(true) as HTMLDivElement

      // Remove os elementos que não devem aparecer na imagem
      clone.querySelectorAll('.nao-exportar').forEach((el) => {
        el.remove()
      })

      // Define uma largura fixa para o relatório exportado
      const largura = elemento.getBoundingClientRect().width

      clone.setAttribute('data-export-clone', 'true')
      clone.style.width = `${largura}px`
      clone.style.maxWidth = 'none'
      clone.style.margin = '0'
      clone.style.padding = '24px'
      clone.style.boxSizing = 'border-box'
      clone.style.background = '#f8fafc'
      clone.style.position = 'fixed'
      clone.style.left = '0'
      clone.style.top = '0'
      clone.style.zIndex = '-9999'
      clone.style.display = 'flex'
      clone.style.flexDirection = 'column'
      clone.style.gap = '24px'

      // Adiciona temporariamente ao documento
      document.body.appendChild(clone)

      // Aguarda a renderização
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Gera a imagem
      const imagem = await toPng(clone, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      })

      // Remove a cópia temporária
      document.body.removeChild(clone)

      // Faz o download
      const link = document.createElement('a')
      link.download = 'relatorio-avaliacoes.png'
      link.href = imagem
      link.click()

    } catch (error) {
      console.error('Erro ao exportar relatório:', error)

      const cloneExistente = document.querySelector(
        'main[data-export-clone="true"]'
      )

      if (cloneExistente) {
        cloneExistente.remove()
      }

      alert('Não foi possível exportar o relatório.')

    } finally {
      setExportando(false)
    }
  }

  const quantidadeExcelente =
    estatisticas?.excelente ?? 0

  const quantidadeBom =
    estatisticas?.bom ?? 0

  const quantidadeRazoavel =
    estatisticas?.razoavel ?? 0

  const quantidadeRuim =
    estatisticas?.ruim ?? 0

  const quantidadePessimo =
    estatisticas?.pessimo ?? 0

  const totalAvaliacoesGeral =
    estatisticas?.total_avaliacoes ?? 0

  const quantidadeRuimPessimo =
    quantidadeRuim + quantidadePessimo

  const pontuacaoMedia =
    estatisticas?.pontuacao_media ?? 0

  const pontuacaoMediaFormatada =
  pontuacaoMedia.toFixed(2).replace('.', ',')

  const satisfacaoGeral =
    totalAvaliacoesGeral > 0
      ? (
          (
            (quantidadeExcelente + quantidadeBom) /
            totalAvaliacoesGeral
          ) * 100
        )
      : 0

  const hoje = new Date()

  const avaliacoesHoje =
    estatisticas?.avaliacoes_hoje ?? 0

  const avaliacoesOntem =
    estatisticas?.avaliacoes_ontem ?? 0

  const variacaoAvaliacoesHoje =
    avaliacoesHoje - avaliacoesOntem

  const avaliacoesSemanaAtual =
    estatisticas?.avaliacoes_semana_atual ?? 0

  const avaliacoesSemanaAnterior =
    estatisticas?.avaliacoes_semana_anterior ?? 0

  const pontuacaoSemanaAtual =
    estatisticas?.pontuacao_semana_atual ?? 0

  const pontuacaoSemanaAnterior =
    estatisticas?.pontuacao_semana_anterior ?? 0

  const variacaoPontuacao =
    pontuacaoSemanaAtual - pontuacaoSemanaAnterior

  const crescimentoSemanal =
    avaliacoesSemanaAnterior > 0
      ? Math.round(
          (
            (avaliacoesSemanaAtual -
              avaliacoesSemanaAnterior) /
            avaliacoesSemanaAnterior
          ) * 100
        )
      : 0

  const barData =
    estatisticas?.avaliacoes_ultimos_7_dias ?? []

  const historicoPontuacao =
    estatisticas?.historico_pontuacao ?? []

  const satisfacaoSemanaAtual =
    estatisticas?.satisfacao_semana_atual ?? 0

  const satisfacaoSemanaAnterior =
    estatisticas?.satisfacao_semana_anterior ?? 0

  const variacaoSatisfacao =
    satisfacaoSemanaAtual - satisfacaoSemanaAnterior
    
  const porcentagem = (quantidade: number) => {
    if (totalAvaliacoesGeral === 0) return 0

    return Math.round(
      (quantidade / totalAvaliacoesGeral) * 100
    )
  }

  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date()
    data.setHours(0, 0, 0, 0)
    data.setDate(data.getDate() - (6 - i))

    return data
  })

  const dadosUltimos7Dias = ultimos7Dias.map(data => {

   const quantidade = avaliacoes.filter(avaliacao => {
      const dataAvaliacao = new Date(avaliacao.data)

      return (
        dataAvaliacao.getFullYear() === data.getFullYear() &&
        dataAvaliacao.getMonth() === data.getMonth() &&
        dataAvaliacao.getDate() === data.getDate()
      )
    }).length

    const dia = data
      .toLocaleDateString('pt-BR', {
        weekday: 'long'
      })
      .replace('-feira', '')

    return {
      dia: dia.charAt(0).toUpperCase() + dia.slice(1),
      quantidade,
    }
  })

  const contagemAvaliacoes = {
    Excelente: quantidadeExcelente,
    Bom: quantidadeBom,
    Razoável: quantidadeRazoavel,
    Ruim: quantidadeRuim,
    Péssimo: quantidadePessimo,
  }

  const pieDataReal = [
    {
      name: 'Excelente',
      value: contagemAvaliacoes.Excelente,
      color: '#00B5CC',
    },
    {
      name: 'Bom',
      value: contagemAvaliacoes.Bom,
      color: '#0eb374',
    },
    {
      name: 'Razoável',
      value: contagemAvaliacoes.Razoável,
      color: '#EAB308',
    },
    {
      name: 'Ruim',
      value: contagemAvaliacoes.Ruim,
      color: '#F97316',
    },
    {
      name: 'Péssimo',
      value: contagemAvaliacoes.Péssimo,
      color: '#EF4444',
    },
  ]

  const statCards = [
    { label: 'Total de Avaliações', value: totalAvaliacoesGeral.toLocaleString('pt-BR'), sub: `${avaliacoesHoje} hoje`, color: '#00B5CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
    },
    { label: 'Excelente', value: quantidadeExcelente.toString(), sub: `${porcentagem(quantidadeExcelente)}% do total`, color: '#00B5CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
    },
    { label: 'Bom', value: quantidadeBom.toString(), sub: `${porcentagem(quantidadeBom)}% do total`, color: '#0eb374',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    },
    { label: 'Razoável', value: quantidadeRazoavel.toString(), sub: `${porcentagem(quantidadeRazoavel)}% do total`, color: '#EAB308',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
    },
    { label: 'Ruim + Péssimo', value: quantidadeRuimPessimo.toString(), sub: `${porcentagem(quantidadeRuimPessimo)}% do total`, color: '#EF4444',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
    },
  ]

  const kpiCards = [
    {
      label: 'Satisfação Geral',
      value: `${pontuacaoMediaFormatada} / 5.0`,
      trend: `${variacaoPontuacao >= 0 ? '↑' : '↓'} ${Math.abs(variacaoPontuacao).toFixed(1)} pts vs semana anterior`,
      pos: variacaoPontuacao > 0 ? true : variacaoPontuacao < 0 ? false : null,
    },

    {
      label: 'Pontuação Média',
      value: `${satisfacaoGeral.toFixed(2).replace('.', '.')}%`,
      trend: `${variacaoSatisfacao >= 0 ? '↑' : '↓'} ${Math.abs(variacaoSatisfacao).toFixed(2).replace('.', ',')}% vs última semana`,
      pos: variacaoSatisfacao > 0 ? true : variacaoSatisfacao < 0 ? false : null,
    },

    {
      label: 'Avaliações de Hoje',
      value: avaliacoesHoje.toString(),
      trend: `${variacaoAvaliacoesHoje >= 0 ? '↑' : '↓'} ${Math.abs(variacaoAvaliacoesHoje)} vs ontem`,
      pos: variacaoAvaliacoesHoje > 0 ? true : variacaoAvaliacoesHoje < 0 ? false : null,
    },

    {
      label: 'Crescimento Semanal',
      value: `${crescimentoSemanal >= 0 ? '+' : ''}${crescimentoSemanal}%`,
      trend: `${avaliacoesSemanaAtual} avaliações nos últimos 7 dias`,
      pos: crescimentoSemanal > 0 ? true : crescimentoSemanal < 0 ? false : null,
    },

  ]

  const LoadingOverlay = () => {
    if (!carregando && !exportando) return null

    const mensagem = exportando
      ? 'Exportando relatório...'
      : 'Carregando avaliações...'

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
        <div className="flex min-w-[220px] flex-col items-center justify-center rounded-2xl bg-white px-8 py-7 shadow-xl">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />

          <p className="mt-4 text-sm font-medium text-gray-700">
            {mensagem}
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <LoadingOverlay />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavBar onLogout={onLogout} subtitle="Menu Administrativo" usuario={usuario}/>
        <main
          ref={relatorioRef}
          className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6"
        >
          {/* Page title + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1 mb-1 transition-colors nao-exportar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                Voltar ao menu principal
              </button>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Análise Geral</h1>
              <p className="text-gray-500 text-sm">Hospital da Visão</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors nao-exportar"
                onClick={() => carregarAvaliacoes(1)}
                disabled={carregando || exportando}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Recarregar
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all nao-exportar disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg,#04c7e0,#0697aa)',
                  boxShadow: '0 2px 8px #00b4cc59'
                }}
                onClick={exportarRelatorio}
                disabled={carregando || exportando}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 20h14v-2H5v2zm7-18l-7 7h4v4h6v-4h4l-7-7z"/></svg>
                Exportar Relatório
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map(k => (
              <div key={k.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                <div className="text-xs font-medium text-gray-500">{k.label}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{k.value}</div>
                <div
                  className={`text-xs mt-1 ${
                    k.pos === true
                      ? 'text-[#0eb374]'
                      : k.pos === false
                        ? 'text-red-400'
                        : 'text-[#00B5CC]'
                  }`}
                >
                  {k.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map(s => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} icon={s.icon} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Avaliação por Dia</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Últimos 7 dias</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#00B5CC]" />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="quantidade" fill="#00B5CC" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">Distribuição de Satisfação</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sempre</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieDataReal} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieDataReal.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {pieDataReal.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{porcentagem(d.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Histórico de Pontuação de Satisfação</h3>
                <p className="text-xs text-gray-400 mt-0.5">tendência de 8 semanas</p>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0eb374] bg-green-50">↑ Tendência de Crescimento</div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={historicoPontuacao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[3, 5]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toFixed(2).replace('.', '.'),
                    'Pontuação',
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="pontuacao" stroke="#00B5CC" strokeWidth={2.5} dot={{ fill: '#00B5CC', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent evaluations table */}  
            <div className="bg-white rounded-2xl" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>

              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">

                  {/* Título */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Avaliações Recentes
                    </h3>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Últimos Envios
                    </p>
                  </div>

                  {/* Filtros à direita */}
                  <div className="flex flex-wrap items-center gap-2">

                    {/* Data inicial */}
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
                    />

                    {/* Data final */}
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
                    />

                    {/* Filtrar */}
                    <button
                      onClick={() => {
                        setPagina(1)
                        carregarAvaliacoes(1)
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ background: '#00B5CC' }}
                    >
                      Filtrar
                    </button>

                    {/* Limpar */}
                    <button
                      onClick={() => {
                        setDataInicio('')
                        setDataFim('')
                        setPagina(1)

                        setTimeout(() => {
                          carregarAvaliacoes(1)
                        }, 0)
                      }}
                      className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200"
                    >
                      Limpar
                    </button>

                    {/* Pesquisa */}
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pesquisar..."
                        className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC] w-52"
                      />
                    </div>

                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    <th className="px-15 py-3 text-left">Data</th>
                    <th className="px-15 py-3 text-left">Avaliação</th>
                    <th className="px-0 py-3 text-left">Departamento</th>
                  </tr>
                </thead>        
                <tbody>
                  {recentEvals.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                        {row.date}
                      </td>

                      <td className="px-15 py-3.5 whitespace-nowrap">
                        <span
                          className="font-semibold"
                          style={{ color: ratingColor(row.rating) }}
                        >
                          {row.rating}
                        </span>
                      </td>

                      <td className="px-1 py-3.5 text-gray-600">
                        {row.terminal}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>

                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {totalAvaliacoes === 0
                      ? 'Nenhuma avaliação encontrada'
                      : `Página ${pagina} de ${totalPaginas} · ${totalAvaliacoes} avaliações`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagina <= 1 || carregando}
                      onClick={() => carregarAvaliacoes(pagina - 1)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <button
                      disabled={pagina >= totalPaginas || carregando}
                      onClick={() => carregarAvaliacoes(pagina + 1)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}