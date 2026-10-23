import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Monitor,
  Tablet,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { apiFetch } from '../services/api'
import type { ModoAtendimento } from '../types'

type ConnectionStatus = {
  connected: boolean
  counterpart_online: boolean
  authorized: boolean
  role: ModoAtendimento
  message: string
}

interface ConnectionScreenProps {
  departamentoId: number
  terminalId: number
  modo: ModoAtendimento
  onAuthorized: () => void
  onBack: () => void
}

/**
 * Compartilha a identidade do dispositivo com DepartmentScreen e App.
 * sessionStorage mantém IDs diferentes em navegadores/dispositivos distintos.
 */
function getClientId(): string {
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

export default function ConnectionScreen({
  departamentoId,
  terminalId,
  modo,
  onAuthorized,
  onBack,
}: ConnectionScreenProps) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [erro, setErro] = useState('')
  const [liberando, setLiberando] = useState(false)

  const clientId = useRef<string | null>(null)
  if (clientId.current === null) {
    clientId.current = getClientId()
  }

  const authorizedCalled = useRef(false)
  const onAuthorizedRef = useRef(onAuthorized)
  const emExecucaoRef = useRef(false)
  const leaveTimerRef = useRef<number | null>(null)

  // Mantém o callback atualizado sem reiniciar o heartbeat a cada render.
  onAuthorizedRef.current = onAuthorized

  const payload = useCallback(
    () => ({
      department_id: departamentoId,
      terminal_id: terminalId,
      client_id: clientId.current as string,
      role: modo,
    }),
    [departamentoId, terminalId, modo],
  )

  useEffect(() => {
    let ativo = true

    // Evita que o cleanup de verificação do React StrictMode encerre a presença
    // antes de o efeito ser montado novamente.
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }

    const atualizarPresenca = async () => {
      if (emExecucaoRef.current) return
      emExecucaoRef.current = true

      try {
        // O POST registra/renova a presença e devolve o estado da conexão.
        const response = await apiFetch('/atendimento/presenca', {
          method: 'POST',
          body: JSON.stringify(payload()),
        })

        if (!response.ok) {
          throw new Error(`Não foi possível registrar presença (${response.status}).`)
        }

        const data = (await response.json()) as ConnectionStatus

        if (!ativo) return

        setStatus(data)
        setErro('')

        // Marca antes da navegação para impedir que o cleanup remova a presença
        // quando o paciente avança para a tela de avaliação.
        if (modo === 'paciente' && data.authorized && !authorizedCalled.current) {
          authorizedCalled.current = true
          onAuthorizedRef.current()
        }
      } catch (error) {
        if (ativo) {
          setStatus(null)
          setErro(
            error instanceof Error
              ? error.message
              : 'Falha ao conectar ao servidor.',
          )
        }
      } finally {
        emExecucaoRef.current = false
      }
    }

    void atualizarPresenca()
    const intervalId = window.setInterval(() => {
      void atualizarPresenca()
    }, 2000)

    return () => {
      ativo = false
      window.clearInterval(intervalId)

      // Se o paciente foi autorizado, App.tsx assume a presença durante a
      // avaliação usando o mesmo client_id. Não remova essa presença aqui.
      if (!(modo === 'paciente' && authorizedCalled.current)) {
        // Pequeno atraso para distinguir um unmount real de uma remontagem imediata.
        leaveTimerRef.current = window.setTimeout(() => {
          leaveTimerRef.current = null
          void apiFetch('/atendimento/sair', {
            method: 'POST',
            body: JSON.stringify(payload()),
          }).catch((error) => {
            // A presença expira pelo TTL do backend se a saída não puder ser enviada.
            console.warn('Não foi possível encerrar a presença do dispositivo:', error)
          })
        }, 250)
      }
    }
  }, [modo, payload])

  const autorizar = async () => {
    if (modo !== 'funcionario' || liberando || !status?.connected) return

    setLiberando(true)
    setErro('')

    try {
      const response = await apiFetch('/atendimento/autorizar', {
        method: 'POST',
        body: JSON.stringify(payload()),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Não foi possível liberar a avaliação.')
      }

      setStatus((current) =>
        current
          ? {
              ...current,
              authorized: true,
              message: 'Avaliação liberada. O tablet avançará automaticamente.',
            }
          : current,
      )
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Falha ao liberar a avaliação.',
      )
    } finally {
      setLiberando(false)
    }
  }

  const conectado = Boolean(status?.connected && status?.counterpart_online && !erro)
  const isFuncionario = modo === 'funcionario'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <main className="w-full max-w-xl rounded-3xl bg-white p-7 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#00A5BB]">
          {isFuncionario ? <Monitor size={32} strokeWidth={1.6} /> : <Tablet size={32} strokeWidth={1.6} />}
        </div>

        <h1 className="text-center text-2xl font-bold text-gray-900">
          {isFuncionario ? 'Conexão com o tablet' : 'Conexão com o atendente'}
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
          Departamento #{departamentoId} · Terminal #{terminalId}
        </p>

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
              <CircleAlert className="mt-0.5 shrink-0 text-red-500" size={22} />
            ) : conectado ? (
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} />
            ) : status ? (
              <WifiOff className="mt-0.5 shrink-0 text-gray-400" size={22} />
            ) : (
              <LoaderCircle className="mt-0.5 shrink-0 animate-spin text-[#00A5BB]" size={22} />
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
                {erro || status?.message || 'Estabelecendo conexão com o servidor...'}
              </p>
            </div>
          </div>
        </div>

        {isFuncionario && (
          <div className="mt-6 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 text-gray-800">
              <Wifi size={18} className={conectado ? 'text-emerald-600' : 'text-gray-400'} />
              <h2 className="font-semibold">Conferência do paciente</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {conectado
                ? 'A conexão foi confirmada. Quando a conferência dos dados estiver concluída, libere a avaliação para o tablet.'
                : 'Assim que o tablet selecionar o mesmo departamento e terminal, ele aparecerá como conectado aqui.'}
            </p>
            <button
              type="button"
              disabled={!conectado || liberando || Boolean(status?.authorized)}
              onClick={() => void autorizar()}
              className="mt-5 w-full rounded-xl bg-[#00AFC4] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0096AA] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {liberando
                ? 'Liberando avaliação...'
                : status?.authorized
                  ? 'Avaliação liberada'
                  : 'Liberar avaliação no tablet'}
            </button>
          </div>
        )}

        {!isFuncionario && (
          <p className="mt-6 text-center text-sm leading-relaxed text-gray-500">
            Esta tela permanecerá aguardando. A avaliação só será aberta depois que o funcionário conferir e liberar o atendimento.
          </p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
        >
          Voltar ao menu inicial
        </button>
      </main>
    </div>
  )
}
