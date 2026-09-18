import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'

import NavBar from '../components/NavBar'
import { ratingColor } from '../utils/ratings'
import type { Usuario } from '../types'

import AvaliacaoPorDepartamentoChart from './dashboard/components/AvaliacaoPorDepartamentoChart'
import AvaliacaoPorFuncionarioChart from './dashboard/components/AvaliacaoPorFuncionarioChart'
import AvaliacoesPorDiaChart from './dashboard/components/AvaliacoesPorDiaChart'
import AvaliacoesRecentesTable from './dashboard/components/AvaliacoesRecentesTable'
import DashboardKpiCards from './dashboard/components/DashboardKpiCards'
import DashboardLoadingOverlay from './dashboard/components/DashboardLoadingOverlay'
import DashboardStatCards from './dashboard/components/DashboardStatCards'
import DistribuicaoSatisfacaoChart from './dashboard/components/DistribuicaoSatisfacaoChart'
import HistoricoPontuacaoChart from './dashboard/components/HistoricoPontuacaoChart'
import SatisfacaoPorMesChart from './dashboard/components/SatisfacaoPorMesChart'
import { useDashboardData } from './dashboard/hooks/useDashboardData'

type DashboardScreenProps = {
  onBack: () => void
  onLogout: () => void
  usuario: Usuario | null
}

export default function DashboardScreen({ onBack, onLogout, usuario }: DashboardScreenProps) {
  const {
    search,
    setSearch,
    avaliacoes,
    pagina,
    setPagina,
    totalPaginas,
    totalAvaliacoes,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    carregando,
    estatisticas,
    carregarAvaliacoes,
  } = useDashboardData()

  const [exportando, setExportando] = useState(false)
  const relatorioRef = useRef<HTMLDivElement>(null)

  const quantidadeExcelente = estatisticas?.excelente ?? 0
  const quantidadeBom = estatisticas?.bom ?? 0
  const quantidadeRazoavel = estatisticas?.razoavel ?? 0
  const quantidadeRuim = estatisticas?.ruim ?? 0
  const quantidadePessimo = estatisticas?.pessimo ?? 0
  const totalAvaliacoesGeral = estatisticas?.total_avaliacoes ?? 0
  const quantidadeRuimPessimo = quantidadeRuim + quantidadePessimo
  const pontuacaoMedia = estatisticas?.pontuacao_media ?? 0
  const pontuacaoMediaFormatada = pontuacaoMedia.toFixed(2)
  const avaliacoesHoje = estatisticas?.avaliacoes_hoje ?? 0
  const avaliacoesOntem = estatisticas?.avaliacoes_ontem ?? 0
  const variacaoAvaliacoesHoje = avaliacoesHoje - avaliacoesOntem
  const avaliacoesSemanaAtual = estatisticas?.avaliacoes_semana_atual ?? 0
  const avaliacoesSemanaAnterior = estatisticas?.avaliacoes_semana_anterior ?? 0
  const crescimentoSemanal = avaliacoesSemanaAnterior > 0
    ? Math.round(((avaliacoesSemanaAtual - avaliacoesSemanaAnterior) / avaliacoesSemanaAnterior) * 100)
    : 0
  const satisfacaoGeral = estatisticas?.satisfacao_geral ?? 0
  const barData = estatisticas?.avaliacoes_ultimos_7_dias ?? []
  const avaliacaoDepartamentos = estatisticas?.avaliacao_por_departamento ?? []
  const historicoPontuacao = estatisticas?.historico_pontuacao ?? []
  const satisfacaoPorMes = estatisticas?.satisfacao_por_mes ?? []
  const avaliacaoFuncionarios = estatisticas?.avaliacao_por_funcionario ?? []

  const porcentagem = (quantidade: number) => {
    if (totalAvaliacoesGeral === 0) return 0
    return Math.round((quantidade / totalAvaliacoesGeral) * 100)
  }

  const pieDataReal = [
    { name: 'Excelente', value: quantidadeExcelente, color: '#00B5CC' },
    { name: 'Bom', value: quantidadeBom, color: '#0eb374' },
    { name: 'Razoável', value: quantidadeRazoavel, color: '#EAB308' },
    { name: 'Ruim', value: quantidadeRuim, color: '#F97316' },
    { name: 'Péssimo', value: quantidadePessimo, color: '#EF4444' },
  ]

  const statCards = [
    {
      label: 'Total de Avaliações',
      value: totalAvaliacoesGeral.toLocaleString('pt-BR'),
      sub: `${avaliacoesHoje} hoje`,
      color: '#00B5CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>,
    },
    {
      label: 'Excelente',
      value: quantidadeExcelente.toString(),
      sub: `${porcentagem(quantidadeExcelente)}% do total`,
      color: '#00B5CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
    },
    {
      label: 'Bom',
      value: quantidadeBom.toString(),
      sub: `${porcentagem(quantidadeBom)}% do total`,
      color: '#0eb374',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
    },
    {
      label: 'Razoável',
      value: quantidadeRazoavel.toString(),
      sub: `${porcentagem(quantidadeRazoavel)}% do total`,
      color: '#EAB308',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>,
    },
    {
      label: 'Ruim + Péssimo',
      value: quantidadeRuimPessimo.toString(),
      sub: `${porcentagem(quantidadeRuimPessimo)}% do total`,
      color: '#EF4444',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>,
    },
  ]

  const kpiCards = [
    { label: 'Satisfação Geral', value: `${pontuacaoMediaFormatada} / 5.0`, trend: 'Todo o período', pos: null },
    { label: 'Pontuação Média', value: `${satisfacaoGeral.toFixed(2)}%`, trend: 'Todo o período', pos: null },
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

  const exportarRelatorio = async () => {
    if (!relatorioRef.current) return

    const elemento = relatorioRef.current

    try {
      setExportando(true)
      const clone = elemento.cloneNode(true) as HTMLDivElement

      clone.querySelectorAll('.nao-exportar').forEach((el) => el.remove())

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

      document.body.appendChild(clone)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const imagem = await toPng(clone, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      })

      document.body.removeChild(clone)

      const link = document.createElement('a')
      link.download = 'relatorio-avaliacoes.png'
      link.href = imagem
      link.click()
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)

      const cloneExistente = document.querySelector('main[data-export-clone="true"]')
      if (cloneExistente) cloneExistente.remove()

      alert('Não foi possível exportar o relatório.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <DashboardLoadingOverlay carregando={carregando} exportando={exportando} />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavBar onLogout={onLogout} subtitle="Menu Administrativo" usuario={usuario} />
        <main ref={relatorioRef} className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
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
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors nao-exportar" onClick={() => void carregarAvaliacoes(1)} disabled={carregando || exportando}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Recarregar
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all nao-exportar disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }} onClick={exportarRelatorio} disabled={carregando || exportando}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 20h14v-2H5v2zm7-18l-7 7h4v4h6v-4h4l-7-7z"/></svg>
                Exportar Relatório
              </button>
            </div>
          </div>

          <DashboardKpiCards cards={kpiCards} />
          <DashboardStatCards cards={statCards} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AvaliacoesPorDiaChart data={barData} />
            <DistribuicaoSatisfacaoChart data={pieDataReal} porcentagem={porcentagem} />
          </div>

          <HistoricoPontuacaoChart data={historicoPontuacao} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AvaliacaoPorDepartamentoChart data={avaliacaoDepartamentos} />
            <AvaliacaoPorFuncionarioChart data={avaliacaoFuncionarios} />
          </div>

          <SatisfacaoPorMesChart data={satisfacaoPorMes} />

          <AvaliacoesRecentesTable
            avaliacoes={avaliacoes}
            search={search}
            setSearch={setSearch}
            dataInicio={dataInicio}
            setDataInicio={setDataInicio}
            dataFim={dataFim}
            setDataFim={setDataFim}
            pagina={pagina}
            setPagina={setPagina}
            totalPaginas={totalPaginas}
            totalAvaliacoes={totalAvaliacoes}
            carregando={carregando}
            carregarAvaliacoes={carregarAvaliacoes}
          />
        </main>
      </div>
    </div>
  )
}
