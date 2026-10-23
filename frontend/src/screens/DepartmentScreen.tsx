
import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  WifiOff,
} from 'lucide-react'

import { apiFetch } from '../services/api'
import type {
  Departamento,
  ModoAtendimento,
  Terminal,
} from '../types'

type ConnectionStatus = {
  connected: boolean
  counterpart_online: boolean
  authorized: boolean
  role: ModoAtendimento
  message: string
}

interface DepartmentScreenProps {
  modo: ModoAtendimento
  onStart: (
    departamentoId: number,
    terminalId: number,
  ) => void
  onBack: () => void
}

function getClientId() {
  const key = 'hv-atendimento-client-id'
  let id = sessionStorage.getItem(key)

  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    sessionStorage.setItem(key, id)
  }

  return id
}

function DepartmentScreen({
  modo,
  onStart,
  onBack,
}: DepartmentScreenProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [terminais, setTerminais] = useState<Terminal[]>([])

  const [departamentoSelecionado, setDepartamentoSelecionado] =
    useState('')

  const [terminalSelecionado, setTerminalSelecionado] = useState('')

  const [loadingDepartamentos, setLoadingDepartamentos] = useState(true)
  const [loadingTerminais, setLoadingTerminais] = useState(true)
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)

  const [possuiFuncionario, setPossuiFuncionario] = useState(false)

  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [erro, setErro] = useState('')
  const [verificandoConexao, setVerificandoConexao] = useState(false)

  const clientId = useRef(getClientId())

  const departamentoId = Number(departamentoSelecionado)
  const terminalId = Number(terminalSelecionado)

  const selecaoCompleta = Boolean(
    departamentoSelecionado && terminalSelecionado,
  )

  const terminaisDoDepartamento = terminais.filter(
    (terminal) =>
      terminal.departamento_id === departamentoId,
  )

  // Carrega os departamentos disponíveis.
  useEffect(() => {
    let ativo = true

    async function carregarDepartamentos() {
      try {
        setLoadingDepartamentos(true)

        const response = await apiFetch('/departamentos')

        if (!response.ok) {
          throw new Error('Erro ao buscar departamentos.')
        }

        const data: Departamento[] = await response.json()

        if (ativo) {
          setDepartamentos(data)
        }
      } catch (error) {
        if (ativo) {
          console.error('Erro ao carregar departamentos:', error)
        }
      } finally {
        if (ativo) {
          setLoadingDepartamentos(false)
        }
      }
    }

    void carregarDepartamentos()

    return () => {
      ativo = false
    }
  }, [])

  // Carrega os terminais disponíveis.
  useEffect(() => {
    let ativo = true

    async function carregarTerminais() {
      try {
        setLoadingTerminais(true)

        const response = await apiFetch('/terminais')

        if (!response.ok) {
          throw new Error('Erro ao buscar terminais.')
        }

        const data: Terminal[] = await response.json()

        if (ativo) {
          setTerminais(data)
        }
      } catch (error) {
        if (ativo) {
          console.error('Erro ao carregar terminais:', error)
        }
      } finally {
        if (ativo) {
          setLoadingTerminais(false)
        }
      }
    }

    void carregarTerminais()

    return () => {
      ativo = false
    }
  }, [])

  // Verifica se há funcionário ativo para a seleção atual.
  useEffect(() => {
    let ativo = true

    setPossuiFuncionario(false)

    if (!selecaoCompleta) {
      setLoadingFuncionarios(false)
      return
    }

    async function verificarFuncionario() {
      try {
        setLoadingFuncionarios(true)

        const params = new URLSearchParams({
          departamento_id: String(departamentoId),
          terminal_id: String(terminalId),
        })

        const response = await apiFetch(
          `/funcionarios/disponibilidade?${params.toString()}`,
        )

        if (!response.ok) {
          throw new Error('Erro ao verificar funcionário.')
        }

        const data: { disponivel: boolean } = await response.json()

        if (ativo) {
          setPossuiFuncionario(data.disponivel)
        }
      } catch (error) {
        if (ativo) {
          console.error('Erro ao verificar funcionário:', error)
          setPossuiFuncionario(false)
        }
      } finally {
        if (ativo) {
          setLoadingFuncionarios(false)
        }
      }
    }

    void verificarFuncionario()

    return () => {
      ativo = false
    }
  }, [departamentoId, terminalId, selecaoCompleta])

  // Registra a presença deste dispositivo e usa a resposta do backend
  // para atualizar o estado da conexão. Não chama /atendimento/sair no
  // cleanup: a tela seguinte (ConnectionScreen) continua o heartbeat.
  useEffect(() => {
    let ativo = true
    let emExecucao = false

    if (!selecaoCompleta) {
      setStatus(null)
      setErro('')
      setVerificandoConexao(false)
      return
    }

    const registrarPresenca = async () => {
      if (emExecucao) return
      emExecucao = true

      try {
        const response = await apiFetch('/atendimento/presenca', {
          method: 'POST',
          body: JSON.stringify({
            department_id: departamentoId,
            terminal_id: terminalId,
            client_id: clientId.current,
            role: modo,
          }),
        })

        if (!response.ok) {
          let mensagem = 'Não foi possível registrar a presença do dispositivo.'

          try {
            const data = await response.json() as { error?: string; message?: string }
            mensagem = data.message || data.error || mensagem
          } catch {
            // Mantém a mensagem padrão se a resposta não for JSON.
          }

          throw new Error(mensagem)
        }

        const data = await response.json() as ConnectionStatus

        if (ativo) {
          setStatus(data)
          setErro('')
        }
      } catch (error) {
        if (ativo) {
          setStatus(null)
          setErro(
            error instanceof Error
              ? error.message
              : 'Falha ao registrar a presença no servidor.',
          )
        }
      } finally {
        emExecucao = false

        if (ativo) {
          setVerificandoConexao(false)
        }
      }
    }

    setStatus(null)
    setErro('')
    setVerificandoConexao(true)

    void registrarPresenca()

    const interval = window.setInterval(() => {
      void registrarPresenca()
    }, 2000)

    return () => {
      ativo = false
      window.clearInterval(interval)
      // Não enviar /atendimento/sair aqui: a navegação para ConnectionScreen
      // precisa manter a presença viva para que a outra tela assuma o heartbeat.
    }
  }, [
    departamentoId,
    terminalId,
    modo,
    selecaoCompleta,
  ])

  const handleDepartamentoChange = (valor: string) => {
    setDepartamentoSelecionado(valor)
    setTerminalSelecionado('')
    setPossuiFuncionario(false)
    setStatus(null)
    setErro('')
  }

  const handleTerminalChange = (valor: string) => {
    setTerminalSelecionado(valor)
    setPossuiFuncionario(false)
    setStatus(null)
    setErro('')
  }

  const conectado = Boolean(
    status?.connected &&
    status?.counterpart_online &&
    !erro,
  )

  const carregando =
    loadingDepartamentos || loadingTerminais

  const podeConectar =
    selecaoCompleta &&
    possuiFuncionario &&
    !carregando &&
    !loadingFuncionarios &&
    !verificandoConexao &&
    conectado

  const handleStart = () => {
    if (!podeConectar) return

    onStart(departamentoId, terminalId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-6">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <h1 className="text-center text-2xl font-bold text-gray-900">
          {modo === 'funcionario'
            ? 'Computador do Atendente'
            : 'Tablet do Paciente'}
        </h1>

        <p className="mt-2 mb-8 text-center text-sm text-gray-500">
          Selecione o mesmo departamento e terminal que serão usados no outro dispositivo.
        </p>

        <label
          htmlFor="departamento"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600"
        >
          Departamento
        </label>

        <select
          id="departamento"
          value={departamentoSelecionado}
          onChange={(event) =>
            handleDepartamentoChange(event.target.value)
          }
          disabled={loadingDepartamentos}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#00B5CC] focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
        >
          <option value="">
            {loadingDepartamentos
              ? 'Carregando departamentos...'
              : 'Selecione um departamento'}
          </option>

          {departamentos.map((departamento) => (
            <option
              key={departamento.id}
              value={departamento.id}
            >
              {departamento.nome}
            </option>
          ))}
        </select>

        <label
          htmlFor="terminal"
          className="mt-8 mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600"
        >
          Terminal
        </label>

        <select
          id="terminal"
          value={terminalSelecionado}
          onChange={(event) =>
            handleTerminalChange(event.target.value)
          }
          disabled={
            !departamentoSelecionado ||
            loadingTerminais
          }
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-[#00B5CC] focus:outline-none focus:ring-2 focus:ring-[#00B5CC] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">
            {!departamentoSelecionado
              ? 'Selecione um terminal'
              : loadingTerminais
                ? 'Carregando terminais...'
                : terminaisDoDepartamento.length === 0
                  ? 'Nenhum terminal disponível'
                  : 'Selecione um terminal'}
          </option>

          {terminaisDoDepartamento.map((terminal) => (
            <option
              key={terminal.id}
              value={terminal.id}
            >
              {terminal.terminal}
            </option>
          ))}
        </select>

        {/* Único painel de status, acima do botão de conexão. */}
        
        {selecaoCompleta && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-7 rounded-2xl border p-5 ${
              erro
                ? 'border-red-200 bg-red-50'
                : conectado
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {erro ? (
                <CircleAlert
                  className="mt-0.5 shrink-0 text-red-500"
                  size={22}
                />
              ) : conectado ? (
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-600"
                  size={22}
                />
              ) : verificandoConexao ? (
                <LoaderCircle
                  className="mt-0.5 shrink-0 animate-spin text-[#00A5BB]"
                  size={22}
                />
              ) : (
                <WifiOff
                  className="mt-0.5 shrink-0 text-gray-400"
                  size={22}
                />
              )}

              <div>
                <p className="font-semibold text-gray-900">
                  {erro
                    ? 'Problema de conexão'
                    : conectado
                      ? 'Dispositivos conectados'
                      : 'Aguardando conexão'}
                </p>

                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {erro ||
                    status?.message ||
                    'Aguardando o outro dispositivo selecionar o mesmo departamento e terminal.'}
                </p>
              </div>
            </div>
          </div>
        )}


        <button
          type="button"
          disabled={!podeConectar}
          onClick={handleStart}
          className="mt-4 w-full rounded-xl py-3.5 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg,#04c7e0,#0697aa)',
            boxShadow: '0 2px 8px #00b4cc59',
          }}
        >
          Conectar dispositivo
        </button>

        {selecaoCompleta &&
          !loadingFuncionarios &&
          !possuiFuncionario && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Não existe funcionário ativo vinculado a este departamento e terminal.
            </p>
          )}

        {loadingFuncionarios && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Verificando disponibilidade do funcionário...
          </p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-3 w-full rounded-xl py-3 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

export default DepartmentScreen
