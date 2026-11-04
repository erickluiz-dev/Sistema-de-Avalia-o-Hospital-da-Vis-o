import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../services/api'
import type { ModoAtendimento } from '../types'

async function obterMensagemErro(response: Response, fallback: string): Promise<string> {
  const texto = (await response.text()).trim()
  if (!texto) return `${fallback} (HTTP ${response.status})`

  try {
    const dados = JSON.parse(texto) as { message?: string; error?: string }
    return dados.message || dados.error || texto
  } catch {
    return texto
  }
}

type ConnectionStatus = {
  connected: boolean
  counterpart_online: boolean
  authorized: boolean
  data_submitted?: boolean
  review_submitted?: boolean
  role: ModoAtendimento
  message: string
}

type ConnectionScreenProps = {
  departamentoId: number
  terminalId: number
  modo: ModoAtendimento
  onAuthorized: () => void
  onConnected: () => void
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
  onConnected,
}: ConnectionScreenProps) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [erro, setErro] = useState('')

  const clientId = useRef<string | null>(null)
  if (clientId.current === null) {
    clientId.current = getClientId()
  }

  const authorizedCalled = useRef(false)
  const onAuthorizedRef = useRef(onAuthorized)
  const onConnectedRef = useRef(onConnected)
  const connectedCalled = useRef(false)
  const emExecucaoRef = useRef(false)
  const leaveTimerRef = useRef<number | null>(null)

  // Mantém o callback atualizado sem reiniciar o heartbeat a cada render.
  onAuthorizedRef.current = onAuthorized
  onConnectedRef.current = onConnected

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
          throw new Error(
            await obterMensagemErro(response, 'Não foi possível registrar a presença'),
          )
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

      // O App assume/continua o heartbeat do tablet em patient-review e survey.
      // A desmontagem também ocorre em transições internas; enviar /sair aqui
      // poderia apagar a presença antes do POST /atendimento/revisao.
      if (modo !== 'paciente') {
        leaveTimerRef.current = window.setTimeout(() => {
          leaveTimerRef.current = null
          void apiFetch('/atendimento/sair', {
            method: 'POST',
            body: JSON.stringify(payload()),
          }).catch((error) => {
            console.warn('Não foi possível encerrar a presença do dispositivo:', error)
          })
        }, 250)
      }
    }
  }, [modo, payload])

  // No computador, sai automaticamente da tela intermediária assim que o
  // backend confirmar que tablet e computador estão conectados.
  useEffect(() => {
    if (
      modo !== 'funcionario' ||
      !status?.connected ||
      !status?.counterpart_online ||
      Boolean(erro) ||
      connectedCalled.current
    ) {
      return
    }

    connectedCalled.current = true
    onConnectedRef.current()
  }, [modo, status?.connected, status?.counterpart_online, erro])


  return (
    <div className="flex min-h-[100dvh] w-full items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-10">
      <main className="w-full max-w-3xl">

         <div className="mb-8 mt-2 flex w-full items-center justify-center sm:mb-12 sm:mt-4">
            <img
            src="/logo.png"
            alt="Hospital da Visão"
            width="270"
            height="110"
            className="h-auto w-44 object-contain sm:w-56 md:w-[270px]"
            style={{ objectPosition: 'center' }}
        /></div>

        <div className="mx-auto w-full max-w-2xl text-center">
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#50626E] sm:text-4xl lg:text-6xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Seja bem-vindo!
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-gray-500 sm:mt-10 sm:text-lg lg:text-xl">
              Que bom ter você aqui. Fique à vontade, seu atendimento começará em breve.
            </p>

            <div className="mx-auto mt-8 inline-flex max-w-full items-center justify-center gap-3 rounded-full border border-[#00B5CC]/30 bg-[#E0F2FE] px-4 py-3 text-sm font-medium text-[#00B5CC] sm:mt-10 sm:px-5">
              <img
                src="/icon.ico"
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0 object-contain"
              />
              <span>Fale com um de nossos atendentes</span>
            </div>

            {erro && (
              <p role="alert" className="mx-auto mt-6 max-w-lg rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </p>
            )}
          </div>

      </main>
    </div>
  )
}
