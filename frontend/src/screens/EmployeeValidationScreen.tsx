import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Clock3,
  MapPin,
  MessageSquareText,
  Send,
  Smile,
  UserRound,
  Wifi,
} from 'lucide-react'
import NavBar from '../components/NavBar'
import type { Usuario } from '../types'

export type PatientData = {
  nome: string
  telefone: string
  email: string
}

type FlowStatus = 'waiting' | 'checking' | 'corrections' | 'validated' | 'survey'
type ConnectionConfig = { department: string; terminal: string }

interface EmployeeValidationScreenProps {
  usuario: Usuario | null
  onLogout: () => void
  departamentoId: number
  terminalId: number
  departamentoNome: string
  terminalNome: string
  onBack: () => void
  onContinueToReview: (data: PatientData) => void | Promise<void>
  onOpenPatient?: () => void
  onValidate?: (data: PatientData) => void
  onReleaseSurvey?: () => void | Promise<void>
  initialData?: PatientData
  originalData?: PatientData
  corrections?: Partial<PatientData>
  status?: FlowStatus
}

function BackButton({ onClick, label = 'Voltar' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#00B5CC]">
      <ArrowLeft size={16} /> {label}
    </button>
  )
}

function ConnectionBadge({ config }: { config: ConnectionConfig }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"><Building2 size={14} />{config.department}</span>
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"><MapPin size={14} />{config.terminal}</span>
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#00B5CC]/30 bg-[#E0F2FE] px-3 py-2 text-xs font-semibold text-[#00B5CC]"><Wifi size={14} />Conectado</span>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</label>{children}</div>
}

const emptyPatient: PatientData = { nome: '', telefone: '', email: '' }

export default function EmployeeValidationScreen({
  usuario, onLogout, departamentoNome, terminalNome, onBack,
  onContinueToReview, onValidate, onReleaseSurvey,
  initialData = emptyPatient, originalData = emptyPatient, corrections = {}, status = 'waiting',
}: EmployeeValidationScreenProps) {
  const [form, setForm] = useState<PatientData>(initialData)
  const [enviando, setEnviando] = useState(false)
  const hasCorrections = Object.keys(corrections).length > 0
  const canRelease = status === 'validated'

  useEffect(() => {
    setForm(initialData)
  }, [initialData.nome, initialData.telefone, initialData.email])

  const config: ConnectionConfig = {
    department: `Departamento: ${departamentoNome}`,
    terminal: `Terminal: ${terminalNome}`,
  }

  const update = (key: keyof PatientData, value: string) => setForm(current => ({ ...current, [key]: value }))

  const validate = async () => {
    const merged = { ...form, ...corrections }
    if (!merged.nome.trim()) {
      alert('Informe o nome do paciente para continuar.')
      return
    }
    setEnviando(true)
    try {
      onValidate?.(merged)
      await onContinueToReview({ nome: merged.nome.trim(), telefone: merged.telefone.trim(), email: merged.email.trim() })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar onLogout={onLogout} subtitle="Atendimento do funcionário" usuario={usuario} />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <BackButton onClick={onBack} label="Voltar à conexão" />
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Página do Funcioário</h1>
            <p className="mt-1 text-sm text-gray-500">Validação dos dados do paciente</p>
          </div>
          <ConnectionBadge config={config} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between">
              <div><h2 className="font-bold text-gray-900">Dados para conferência</h2><p className="mt-1 text-xs text-gray-500">Preencha apenas os campos necessários neste atendimento.</p></div>
              <UserRound size={22} className="text-[#00B5CC]" />
            </div>
            <div className="mt-6 space-y-4">
              {([
                ['nome', 'Nome para conferência', 'Nome completo'],
                ['telefone', 'Telefone para retorno autorizado', '(00) 00000-0000'],
                ['email', 'E-mail', 'email@exemplo.com'],
              ] as [keyof PatientData, string, string][]).map(([key, label, placeholder]) => (
                <FieldGroup key={key} label={label}>
                  <input value={form[key]} onChange={event => update(key, event.target.value)} placeholder={placeholder} autoComplete="off" maxLength={key === 'nome' ? 200 : key === 'telefone' ? 32 : 254} className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00b4cc59] ${corrections[key] !== undefined ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`} />
                </FieldGroup>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2"><MessageSquareText size={20} className="text-[#00B5CC]" /><h2 className="font-bold text-gray-900">Correções recebidas</h2></div>
            {!hasCorrections ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <Clock3 size={34} className="text-gray-300" />
                <p className="mt-3 text-sm font-semibold text-gray-600">{status === 'checking' ? 'Aguardando conferência no tablet' : 'Nenhuma correção recebida'}</p>
                <p className="mt-1 text-xs text-gray-400">Envie os dados e aguarde o paciente conferir as informações.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {(Object.keys(corrections) as (keyof PatientData)[]).map(key => (
                  <div key={key} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-semibold uppercase text-amber-700">{key}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div><span className="text-xs text-gray-500">Original</span><p className="mt-1 text-sm text-gray-500 line-through">{originalData[key] || 'Não informado'}</p></div>
                      <div><span className="text-xs text-gray-500">Correção</span><p className="mt-1 text-sm font-semibold text-gray-900">{corrections[key]}</p></div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500">Confira as alterações antes de liberar a avaliação.</p>
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-3 flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg sm:flex-row">
          <div className="flex-1 px-2 text-xs text-gray-500">
            {status === 'waiting' ? 'Preencha os dados e envie para o tablet.' : status === 'checking' ? 'Paciente conferindo os dados.' : status === 'corrections' ? 'Correções recebidas. Confira antes de liberar.' : status === 'validated' ? 'Conferência concluída. A avaliação pode ser liberada.' : 'Avaliação liberada; aguardando o tablet iniciar a pesquisa.'}
          </div>
          <button type="button" disabled={enviando || status === 'survey'} onClick={() => void validate()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B5CC] px-6 py-3 text-sm font-semibold text-white hover:bg-[#01899b] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
          >
            <Send size={17} />{enviando ? 'Enviando...' : hasCorrections ? 'Reenviar dados' : 'Validar e enviar'}
          </button>
          <button type="button" disabled={!canRelease} onClick={() => void onReleaseSurvey?.()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-7 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:w-auto">
            <Smile size={18} />Avaliar
          </button>
        </div>
      </main>
    </div>
  )
}
