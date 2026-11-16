import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Star,
  Tablet,
  UsersRound,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import NavBar from '../components/NavBar'
import { apiFetch } from '../services/api'
import type { Estatisticas, ModoAtendimento, Screen, Usuario } from '../types'

type HomeScreenProps = {
  onNav: (screen: Screen) => void
  onLogout: () => void
  usuario: Usuario | null
  onStartSurvey: (modo: ModoAtendimento) => void
}

type Shortcut = {
  title: string
  description: string
  icon: typeof Monitor
  action?: () => void
  soon?: boolean
  tone: 'cyan' | 'blue' | 'violet' | 'slate' | 'amber' | 'green'
}

const EMPTY_STATS: Estatisticas = {
  total_avaliacoes: 0,
  excelente: 0,
  bom: 0,
  razoavel: 0,
  ruim: 0,
  pessimo: 0,
  avaliacoes_hoje: 0,
  avaliacoes_ontem: 0,
  satisfacao_geral: 0,
  avaliacoes_semana_atual: 0,
  avaliacoes_semana_anterior: 0,
  pontuacao_media: 0,
  pontuacao_semana_atual: 0,
  pontuacao_semana_anterior: 0,
  satisfacao_semana_atual: 0,
  satisfacao_semana_anterior: 0,
  avaliacoes_ultimos_7_dias: [],
  historico_pontuacao: [],
  satisfacao_por_mes: [],
  avaliacao_por_departamento: [],
  avaliacao_por_funcionario: [],
}

const DISTRIBUTION = [
  { key: 'excelente', label: 'Excelente', color: '#08AFC2' },
  { key: 'bom', label: 'Bom', color: '#16A36A' },
  { key: 'razoavel', label: 'Razoável', color: '#E5A52B' },
  { key: 'ruim', label: 'Ruim', color: '#F07836' },
  { key: 'pessimo', label: 'Péssimo', color: '#D94B55' },
] as const

const TONE_STYLES: Record<Shortcut['tone'], { icon: string; surface: string }> = {
  cyan: { icon: 'text-[#079FB4]', surface: 'bg-[#E8F8FA]' },
  blue: { icon: 'text-[#3976C6]', surface: 'bg-[#EDF4FE]' },
  violet: { icon: 'text-[#8065C8]', surface: 'bg-[#F2EEFC]' },
  slate: { icon: 'text-[#607080]', surface: 'bg-[#F0F3F6]' },
  amber: { icon: 'text-[#B7832B]', surface: 'bg-[#FBF5E9]' },
  green: { icon: 'text-[#21865D]', surface: 'bg-[#EAF6F0]' },
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR')
}

export default function HomeScreen({
  onNav,
  onLogout,
  usuario,
  onStartSurvey,
}: HomeScreenProps) {
  const [estatisticas, setEstatisticas] = useState<Estatisticas>(EMPTY_STATS)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const carregarEstatisticas = useCallback(async () => {
    setCarregando(true)
    setErro(false)

    try {
      const response = await apiFetch('/avaliacoes/estatisticas', { method: 'GET' })
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`)
      const dados = (await response.json()) as Estatisticas
      setEstatisticas({ ...EMPTY_STATS, ...dados })
    } catch (error) {
      console.error('Erro ao carregar indicadores do Dashboard:', error)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregarEstatisticas()
  }, [carregarEstatisticas])

  const distribuicao = useMemo(
    () => DISTRIBUTION.map((item) => ({
      name: item.label,
      value: Number(estatisticas[item.key] ?? 0),
      color: item.color,
    })),
    [estatisticas],
  )

  const totalDistribuicao = distribuicao.reduce((total, item) => total + item.value, 0)
  const pontuacaoMedia = Number(estatisticas.pontuacao_media ?? 0)
  const satisfacaoGeral = Number(estatisticas.satisfacao_geral ?? 0)
  const avaliacoesHoje = Number(estatisticas.avaliacoes_hoje ?? 0)
  const isAdmin = Boolean(usuario?.administrador)

  const shortcuts: Shortcut[] = [
    {
      title: 'Computador do Atendente',
      description: 'Conectar ao tablet e validar os dados do paciente.',
      icon: Monitor,
      action: () => onStartSurvey('funcionario'),
      tone: 'cyan',
    },
    {
      title: 'Tablet do Paciente',
      description: 'Abrir a experiência de avaliação do paciente.',
      icon: Tablet,
      action: () => onStartSurvey('paciente'),
      tone: 'blue',
    },
    ...(isAdmin
      ? [
          {
            title: 'Painel Administrativo',
            description: 'Consultar indicadores, avaliações e relatórios.',
            icon: BarChart3,
            action: () => onNav('dashboard'),
            tone: 'violet' as const,
          },
          {
            title: 'Gerenciamento',
            description: 'Administrar usuários, departamentos e terminais.',
            icon: UsersRound,
            action: () => onNav('management'),
            tone: 'slate' as const,
          },
          {
            title: 'Permissões',
            description: 'Controle de acesso e permissões dos usuários.',
            icon: ShieldCheck,
            soon: true,
            tone: 'amber' as const,
          },
          {
            title: 'Academy',
            description: 'Conteúdos de aprendizagem e capacitação.',
            icon: GraduationCap,
            soon: true,
            tone: 'green' as const,
          },
        ]
      : []),
  ]

  const dataAtual = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <NavBar onLogout={onLogout} subtitle="Menu Principal" usuario={usuario} />

      <main className="w-full max-w-[1440px] mx-auto flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00AFC4]">
              Visão geral
            </p>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#202B3A] sm:text-[32px]">
              Menu Principal
            </h1>
            <p className="mt-1.5 text-sm text-[#7A8795]">
              Acompanhe a experiência dos pacientes e acesse as áreas do sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs capitalize text-[#8995A2] sm:inline">{dataAtual}</span>
            <button
              type="button"
              onClick={() => void carregarEstatisticas()}
              disabled={carregando}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E3E8ED] bg-white px-3.5 text-sm font-medium text-[#536170] shadow-sm transition hover:border-[#B8DDE2] hover:text-[#078FA2] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </section>

        <section aria-label="Indicadores de satisfação" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-[0_2px_9px_rgba(27,45,64,0.035)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#788695]">Pontuação Média</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9F8FA] text-[#08AFC2]"><Star size={17} /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <strong className="text-[34px] font-semibold leading-none tracking-tight text-[#202B3A]">
                {carregando ? '—' : pontuacaoMedia.toFixed(2).replace('.', ',')}
              </strong>
              <span className="text-sm text-[#9AA5B0]">/ 5,00</span>
            </div>
            <p className="mt-2 text-xs text-[#9AA5B0]">Média das avaliações registradas</p>
          </article>

          <article className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-[0_2px_9px_rgba(27,45,64,0.035)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#788695]">Satisfação Geral</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF7F0] text-[#229765]"><CheckCircle2 size={18} /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <strong className="text-[34px] font-semibold leading-none tracking-tight text-[#202B3A]">
                {carregando ? '—' : satisfacaoGeral.toFixed(1).replace('.', ',')}
              </strong>
              <span className="text-sm text-[#9AA5B0]">%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF1F3]">
              <div className="h-full rounded-full bg-[#20A875] transition-all" style={{ width: `${Math.min(100, Math.max(0, satisfacaoGeral))}%` }} />
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-[0_2px_9px_rgba(27,45,64,0.035)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#788695]">Avaliações de Hoje</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF4FE] text-[#3976C6]"><Clock3 size={18} /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <strong className="text-[34px] font-semibold leading-none tracking-tight text-[#202B3A]">
                {carregando ? '—' : formatNumber(avaliacoesHoje)}
              </strong>
              <span className="text-xs text-[#9AA5B0]">registros</span>
            </div>
            <p className="mt-2 text-xs text-[#9AA5B0]">Avaliações recebidas no dia de hoje</p>
          </article>
        </section>

        {erro && (
          <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F2D6B9] bg-[#FFF9F1] px-4 py-3 text-sm text-[#8B5B25]">
            <span>Não foi possível carregar os indicadores. Verifique a conexão e tente novamente.</span>
            <button type="button" onClick={() => void carregarEstatisticas()} className="font-semibold underline underline-offset-2">Tentar novamente</button>
          </div>
        )}

        <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,1fr)]">
          <article className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-[0_2px_9px_rgba(27,45,64,0.035)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EEF1F4] pb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[#273445]">Distribuição de Satisfação</h2>
                <p className="mt-1 text-xs text-[#929EAA]">Distribuição das avaliações por classificação</p>
              </div>
              <span className="rounded-full bg-[#F3F7F8] px-2.5 py-1 text-[11px] font-medium text-[#748391]">
                {formatNumber(totalDistribuicao)} avaliações
              </span>
            </div>

            <div className="grid grid-cols-1 items-center gap-3 pt-3 sm:grid-cols-[minmax(220px,0.95fr)_minmax(180px,1fr)]">
              <div className="relative h-[245px] min-w-0">
                {totalDistribuicao > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distribuicao} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={66} outerRadius={94} paddingAngle={3} stroke="none">
                          {distribuicao.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [formatNumber(Number(value)), 'Avaliações']}
                          contentStyle={{ border: '1px solid #E8EDF0', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,43,58,0.10)', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <strong className="text-[27px] font-semibold leading-none text-[#263344]">{formatNumber(totalDistribuicao)}</strong>
                      <span className="mt-1 text-[11px] text-[#97A2AD]">avaliações</span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F6] text-[#9AA7B2]"><Activity size={23} /></div>
                    <p className="text-sm font-medium text-[#687786]">Sem avaliações disponíveis</p>
                    <p className="mt-1 text-xs text-[#A0AAB4]">O gráfico será atualizado quando houver registros.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 py-2">
                {distribuicao.map((item) => {
                  const percentage = totalDistribuicao > 0 ? (item.value / totalDistribuicao) * 100 : 0
                  return (
                    <div key={item.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 text-[#647281]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                        <span className="font-semibold tabular-nums text-[#344253]">{formatNumber(item.value)} <span className="font-normal text-[#98A3AD]">({percentage.toFixed(1).replace('.', ',')}%)</span></span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#F0F3F5]">
                        <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E7EBEF] bg-white p-5 shadow-[0_2px_9px_rgba(27,45,64,0.035)] sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[#273445]">Acesso Rápido</h2>
                <p className="mt-1 text-xs text-[#929EAA]">Acesse as principais áreas do sistema</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F7F8] text-[#08AFC2]"><ArrowUpRight size={16} /></span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon
                const tone = TONE_STYLES[shortcut.tone]
                return (
                  <button
                    key={shortcut.title}
                    type="button"
                    onClick={shortcut.action}
                    disabled={shortcut.soon}
                    title={shortcut.soon ? `${shortcut.title} — módulo em desenvolvimento` : undefined}
                    className="group flex min-h-[76px] min-w-0 items-center gap-3 rounded-xl border border-[#EDF0F2] bg-white p-3 text-left transition duration-150 hover:-translate-y-0.5 hover:border-[#D7E8EB] hover:bg-[#FBFDFD] hover:shadow-[0_5px_15px_rgba(25,57,70,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFC4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.surface} ${tone.icon}`}>
                      <Icon size={19} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold leading-snug text-[#344253]">
                        {shortcut.title}
                        {shortcut.soon && <span className="rounded-full bg-[#F5F1E8] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9A793C]">Em breve</span>}
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-[#929EAA]">{shortcut.description}</span>
                    </span>
                    {!shortcut.soon && <ChevronRight size={15} className="shrink-0 text-[#AAB4BD] transition group-hover:translate-x-0.5 group-hover:text-[#08AFC2]" />}
                  </button>
                )
              })}
            </div>
          </article>
        </section>

        <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7EBEF] pt-4 text-[11px] text-[#A0AAB4]">
          <span>Hospital da Visão · Sistema de Avaliação de Satisfação</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#22A879]" /> Indicadores conectados ao sistema</span>
        </footer>
      </main>
    </div>
  )
}
