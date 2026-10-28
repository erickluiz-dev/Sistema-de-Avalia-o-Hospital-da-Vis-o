import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../services/api'
import type { ModoAtendimento } from '../types'

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
    <div className="min-h-screen flex  justify-center p-5">
      <main >

         <div className="flex justify-center items-center w-full mb-15 mt-12">
            <img
            src="/logo.png"
            alt="Hospital da Visão"
            width="270"
            height="110"
            style={{
                objectFit: 'contain',
                objectPosition: 'left center',
            }}
        /></div>

        <div className="w-full max-w-2xl text-center">
            
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold text-[#50626E] tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Seja bem-vindo!
            </h1>
            <p className="mt-12 mx-auto max-w-lg text-lg lg:text-xl leading-relaxed text-gray-500">
              Que bom ter você aqui. Fique à vontade, seu atendimento começará em breve.
            </p>

            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#00B5CC]/30 bg-[#E0F2FE] px-5 py-3 text-sm font-medium text-[#00B5CC]">
              <img 
                src="/icon.ico" 
                alt="Ícone" 
                style={{ 
                  width: '8%',  
                  height: '8%', 
                  objectFit: 'contain' 
                }} 
              />
              Fale com um de nossos atendentes 
            </div>
          </div>

      </main>
    </div>
  )
}
