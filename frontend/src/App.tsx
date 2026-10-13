import { useState, useEffect, useCallback } from 'react'

import { apiFetch } from './services/api'

import Login from './components/Login'
import SurveyScreen from './screens/SurveyScreen'
import HomeScreen from './screens/HomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import DepartmentScreen from './screens/DepartmentScreen'
import ConnectionScreen from './screens/ConnectionScreen'
import ManagementScreen from './screens/ManagementScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'

import type {
  Screen,
  Usuario,
  ModoAtendimento,
} from './types'

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)

  const [departamentoId, setDepartamentoId] = useState<number | null>(null)
  const [terminalId, setTerminalId] = useState<number | null>(null)
  const [mostrarDepartamento, setMostrarDepartamento] = useState(false)
  const [modoAtendimento, setModoAtendimento] = useState<ModoAtendimento>('paciente')

  const [resetToken, setResetToken] = useState('')

  // ─── Verificação inicial ───────────────────────────────────────────────────

  useEffect(() => {
    const inicializarAplicacao = async () => {
      // Verifica se o usuário chegou através do link
      // de recuperação de senha.
      const params = new URLSearchParams(
        window.location.search,
      )

      const token = params.get('token')

      if (
        window.location.pathname === '/redefinir-senha' &&
        token
      ) {
        setResetToken(token)
        setScreen('reset-password')
        setVerificandoSessao(false)

        return
      }

      // Caso contrário, verifica a sessão normalmente.
      try {
        const response = await apiFetch('/me', {
          method: 'GET',
        })

        if (response.status === 401) {
          setUsuario(null)
          setScreen('login')
          return
        }

        if (!response.ok) {
          throw new Error(
            `Erro HTTP ${response.status}`,
          )
        }

        const usuarioAtual: Usuario =
          await response.json()

        setUsuario(usuarioAtual)
        setScreen('home')
      } catch (error) {
        console.error(
          'Erro ao verificar sessão:',
          error,
        )

        setUsuario(null)
        setScreen('login')
      } finally {
        setVerificandoSessao(false)
      }
    }

    inicializarAplicacao()
  }, [])

  // ─── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error(
        'Erro ao encerrar sessão:',
        error,
      )
    } finally {
      setUsuario(null)
      setScreen('login')
    }
  }

  const handlePatientAuthorized = useCallback(() => {
    setScreen('survey')
  }, [])

  // Mantém a presença do tablet durante toda a avaliação, não apenas na espera.
  useEffect(() => {
    if (
      screen !== 'survey' ||
      modoAtendimento !== 'paciente' ||
      departamentoId === null ||
      terminalId === null
    ) {
      return
    }

    const clientId = sessionStorage.getItem('hv-atendimento-client-id')
    if (!clientId) return

    const payload = JSON.stringify({
      department_id: departamentoId,
      terminal_id: terminalId,
      client_id: clientId,
      role: 'paciente',
    })
    let ativo = true
    let emExecucao = false

    const heartbeat = async () => {
      if (emExecucao) return
      emExecucao = true
      try {
        await apiFetch('/atendimento/presenca', { method: 'POST', body: payload })
      } catch (error) {
        console.error('Erro ao renovar presença do tablet:', error)
      } finally {
        emExecucao = false
      }
    }

    void heartbeat()
    const interval = window.setInterval(() => { if (ativo) void heartbeat() }, 2000)
    return () => {
      ativo = false
      window.clearInterval(interval)
      void apiFetch('/atendimento/sair', { method: 'POST', body: payload }).catch(() => undefined)
    }
  }, [screen, modoAtendimento, departamentoId, terminalId])

  // ─── Tela de carregamento ──────────────────────────────────────────────────

  if (verificandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00B5CC] rounded-full animate-spin" />

          <span className="text-sm text-gray-500">
            Verificando sessão...
          </span>
        </div>
      </div>
    )
  }

  // ─── Renderização das telas ────────────────────────────────────────────────

  return (
    <>
      {/* LOGIN */}

      {screen === 'login' && (
        <Login
          onLogin={(usuarioAutenticado) => {
            setUsuario(usuarioAutenticado)
            setScreen('home')
          }}
          onForgotPassword={() => {
            setScreen('forgot-password')
          }}
        />
      )}

      {/* RECUPERAÇÃO DE SENHA */}

      {screen === 'forgot-password' && (
        <ForgotPasswordScreen
          onBack={() => {
            setScreen('login')
          }}
        />
      )}

      {/* REDEFINIÇÃO DE SENHA */}

      {screen === 'reset-password' && (
        <ResetPasswordScreen
          token={resetToken}
          onBack={() => {
            window.history.replaceState(
              {},
              '',
              '/',
            )

            setResetToken('')
            setScreen('login')
          }}
        />
      )}

      {/* HOME */}

      {screen === 'home' && (
        <>
          <HomeScreen
            usuario={usuario}
            onNav={setScreen}
            onLogout={handleLogout}
            onStartSurvey={(modo) => {
              setModoAtendimento(modo)
              setMostrarDepartamento(true)
            }}
          />

          {mostrarDepartamento && (
            <DepartmentScreen
              modo={modoAtendimento}
              onStart={(
                departamentoIdSelecionado,
                terminalIdSelecionado,
              ) => {
                setDepartamentoId(
                  departamentoIdSelecionado,
                )

                setTerminalId(
                  terminalIdSelecionado,
                )

                setMostrarDepartamento(false)
                setScreen('connection')
              }}
              onBack={() => {
                setMostrarDepartamento(false)
              }}
            />
          )}
        </>
      )}

      {/* CONEXÃO ENTRE COMPUTADOR E TABLET */}

      {screen === 'connection' &&
        departamentoId !== null &&
        terminalId !== null && (
          <ConnectionScreen
            departamentoId={departamentoId}
            terminalId={terminalId}
            modo={modoAtendimento}
            onAuthorized={handlePatientAuthorized}
            onBack={() => {
              setDepartamentoId(null)
              setTerminalId(null)
              setScreen('home')
            }}
          />
        )}

      {/* PESQUISA */}

      {screen === 'survey' &&
        departamentoId !== null &&
        terminalId !== null && (
          <SurveyScreen
            departamentoId={departamentoId}
            terminalId={terminalId}
            onBack={() => {
              setDepartamentoId(null)
              setTerminalId(null)
              setScreen('home')
            }}
          />
        )}

      {/* DASHBOARD */}

      {screen === 'dashboard' && (
        <DashboardScreen
          onBack={() => {
            setScreen('home')
          }}
          onLogout={handleLogout}
          usuario={usuario}
        />
      )}

      {/* GERENCIAMENTO */}

      {screen === 'management' && (
        <ManagementScreen
          onBack={() => {
            setScreen('home')
          }}
          onLogout={handleLogout}
          usuario={usuario}
        />
      )}
    </>
  )
}