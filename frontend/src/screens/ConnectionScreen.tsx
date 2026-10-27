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
  const reviewRequested = useRef(false)
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
        if (modo === 'paciente' && data.data_submitted) {
          reviewRequested.current = true
        }

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
      if (!(modo === 'paciente' && (authorizedCalled.current || reviewRequested.current))) {
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

        <h1 className="text-center text-[50px] font-bold text-gray-600 mb-8">
          Seja Bem Vindo!
        </h1>
        <p className="mt-2 text-center text-[20px] text-sm leading-relaxed text-gray-500">
          Fale com um de nossos atendentes
        </p>

      </main>
    </div>
  )
}
