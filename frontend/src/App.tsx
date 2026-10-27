import { useState, useEffect, useCallback } from 'react'

import { apiFetch } from './services/api'

import Login from './components/Login'
import SurveyScreen from './screens/SurveyScreen'
import HomeScreen from './screens/HomeScreen'
import DepartmentScreen from './screens/DepartmentScreen'
import ConnectionScreen from './screens/ConnectionScreen'
import EmployeeValidationScreen from './screens/EmployeeValidationScreen'
import DashboardScreen from './screens/DashboardScreen'
import ManagementScreen from './screens/ManagementScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import PatientReviewScreen from './screens/PatientReviewScreen'

import type {
  Screen,
  Usuario,
  ModoAtendimento,
} from './types'

type PatientData = { nome: string; telefone: string; email: string }

function getClientId(): string | null {
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

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)

  const [departamentoId, setDepartamentoId] = useState<number | null>(null)
  const [terminalId, setTerminalId] = useState<number | null>(null)
  const [mostrarDepartamento, setMostrarDepartamento] = useState(false)
  const [dadosValidacao, setDadosValidacao] = useState<PatientData>({ nome: '', telefone: '', email: '' })
  const [dadosOriginais, setDadosOriginais] = useState<PatientData>({ nome: '', telefone: '', email: '' })
  const [correcoesValidacao, setCorrecoesValidacao] = useState<Partial<PatientData>>({})
  const [statusValidacao, setStatusValidacao] = useState<'waiting' | 'checking' | 'corrections' | 'validated' | 'survey'>('waiting')
  const [modoAtendimento, setModoAtendimento] =
    useState<ModoAtendimento>('paciente')

  const [resetToken, setResetToken] = useState('')
  const [departamentoNome, setDepartamentoNome] = useState('')
  const [terminalNome, setTerminalNome] = useState('')

  // ─── Verificação inicial ───────────────────────────────────────────────────

  useEffect(() => {
    let ativo = true

    const inicializarAplicacao = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (
        window.location.pathname === '/redefinir-senha' &&
        token
      ) {
        if (ativo) {
          setResetToken(token)
          setScreen('reset-password')
          setVerificandoSessao(false)
        }
        return
      }

      try {
        const response = await apiFetch('/me', { method: 'GET' })

        if (response.status === 401) {
          if (ativo) {
            setUsuario(null)
            setScreen('login')
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`)
        }

        const usuarioAtual: Usuario = await response.json()

        if (ativo) {
          setUsuario(usuarioAtual)
          setScreen('home')
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)

        if (ativo) {
          setUsuario(null)
          setScreen('login')
        }
      } finally {
        if (ativo) {
          setVerificandoSessao(false)
        }
      }
    }

    void inicializarAplicacao()

    return () => {
      ativo = false
    }
  }, [])

  // ─── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', { method: 'POST' })
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error)
    } finally {
      setUsuario(null)
      setMostrarDepartamento(false)
      setDadosValidacao({ nome: '', telefone: '', email: '' })
      setStatusValidacao('waiting')
      setDepartamentoId(null)
      setTerminalId(null)
      setScreen('login')
    }
  }

  const handlePatientAuthorized = useCallback(() => {
    setScreen('survey')
  }, [])

  const handleEmployeeConnected = useCallback(() => {
    setStatusValidacao('waiting')
    setScreen('employee-validation')
  }, [])

  /*
   * Mantém a presença do tablet durante a avaliação.
   *
   * ConnectionScreen mantém o heartbeat enquanto o paciente aguarda autorização.
   * Quando a autorização muda a tela para "survey", este efeito assume a renovação
   * da presença. A saída só é enviada quando o efeito é encerrado, isto é, quando
   * o fluxo da avaliação é abandonado ou os IDs/modo realmente mudam.
   */
  useEffect(() => {
    if (
      screen !== 'survey' ||
      modoAtendimento !== 'paciente' ||
      departamentoId === null ||
      terminalId === null
    ) {
      return
    }

    const clientId = getClientId()
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
      if (!ativo || emExecucao) return

      emExecucao = true
      try {
        const response = await apiFetch('/atendimento/presenca', {
          method: 'POST',
          body: payload,
        })

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status} ao renovar presença`)
        }
      } catch (error) {
        if (ativo) {
          console.error('Erro ao renovar presença do tablet:', error)
        }
      } finally {
        emExecucao = false
      }
    }

    void heartbeat()

    const interval = window.setInterval(() => {
      void heartbeat()
    }, 2000)

    return () => {
      ativo = false
      window.clearInterval(interval)

      // Não envia /sair durante uma troca interna de telas. Este efeito só
      // é montado na tela de avaliação; seu cleanup indica que ela foi deixada.
      void apiFetch('/atendimento/sair', {
        method: 'POST',
        body: payload,
      }).catch((error) => {
        console.warn('Não foi possível encerrar a presença do tablet:', error)
      })
    }
  }, [screen, modoAtendimento, departamentoId, terminalId])

  // Mantém a presença do computador enquanto a tela de validação está aberta.
  useEffect(() => {
    if (
      !['employee-validation', 'patient-review'].includes(screen) ||
      modoAtendimento !== 'funcionario' ||
      departamentoId === null ||
      terminalId === null
    ) {
      return
    }

    const clientId = getClientId()
    if (!clientId) return
    const payload = JSON.stringify({ department_id: departamentoId, terminal_id: terminalId, client_id: clientId, role: 'funcionario' })
    let ativo = true
    let emExecucao = false

    const heartbeat = async () => {
      if (!ativo || emExecucao) return
      emExecucao = true
      try {
        const response = await apiFetch('/atendimento/presenca', { method: 'POST', body: payload })
        if (!response.ok) throw new Error(`Erro HTTP ${response.status} ao renovar presença do funcionário`)
      } catch (error) {
        if (ativo) console.error('Erro ao renovar presença do funcionário:', error)
      } finally {
        emExecucao = false
      }
    }

    void heartbeat()
    const interval = window.setInterval(() => void heartbeat(), 2000)
    return () => { ativo = false; window.clearInterval(interval) }
  }, [screen, modoAtendimento, departamentoId, terminalId])


  // O tablet consulta o backend enquanto aguarda. A conferência só aparece
  // depois que o funcionário envia os dados iniciais.
  useEffect(() => {
    if (
      screen !== 'connection' ||
      modoAtendimento !== 'paciente' ||
      departamentoId === null ||
      terminalId === null
    ) return

    const clientId = getClientId()
    if (!clientId) return
    let ativo = true
    let emExecucao = false

    const consultarDadosIniciais = async () => {
      if (!ativo || emExecucao) return
      emExecucao = true
      try {
        const query = new URLSearchParams({
          department_id: String(departamentoId),
          terminal_id: String(terminalId),
          client_id: clientId,
          role: 'paciente',
        })
        const response = await apiFetch(`/atendimento/dados?${query.toString()}`, { method: 'GET' })
        if (!response.ok) return
        const state = await response.json() as {
          data_submitted?: boolean
          review_submitted?: boolean
          authorized?: boolean
          data?: PatientData
        }
        if (ativo && state.data_submitted && state.data) {
          setDadosValidacao(state.data)
          setDadosOriginais(state.data)
          setScreen('patient-review')
        }
      } catch (error) {
        if (ativo) console.warn('Não foi possível consultar os dados para conferência:', error)
      } finally {
        emExecucao = false
      }
    }

    void consultarDadosIniciais()
    const interval = window.setInterval(() => void consultarDadosIniciais(), 2000)
    return () => {
      ativo = false
      window.clearInterval(interval)
    }
  }, [screen, modoAtendimento, departamentoId, terminalId])

  // O computador consulta o resultado enviado pelo tablet. Só habilita a
  // liberação depois que o backend confirma review_submitted.
  useEffect(() => {
    if (
      screen !== 'employee-validation' ||
      modoAtendimento !== 'funcionario' ||
      departamentoId === null ||
      terminalId === null
    ) return

    const clientId = getClientId()
    if (!clientId) return
    let ativo = true
    let emExecucao = false

    const consultarRevisao = async () => {
      if (!ativo || emExecucao) return
      emExecucao = true
      try {
        const query = new URLSearchParams({
          department_id: String(departamentoId),
          terminal_id: String(terminalId),
          client_id: clientId,
          role: 'funcionario',
        })
        const response = await apiFetch(`/atendimento/revisao?${query.toString()}`, { method: 'GET' })
        if (!response.ok) return
        const state = await response.json() as {
          data_submitted?: boolean
          review_submitted?: boolean
          authorized?: boolean
          data?: PatientData
        }
        if (ativo && state.review_submitted && state.data) {
          const corrigidos = state.data
          setDadosValidacao(corrigidos)
          setCorrecoesValidacao({
            ...(corrigidos.nome !== dadosOriginais.nome ? { nome: corrigidos.nome } : {}),
            ...(corrigidos.telefone !== dadosOriginais.telefone ? { telefone: corrigidos.telefone } : {}),
            ...(corrigidos.email !== dadosOriginais.email ? { email: corrigidos.email } : {}),
          })
          setStatusValidacao('validated')
        }
      } catch (error) {
        if (ativo) console.warn('Não foi possível consultar a conferência do paciente:', error)
      } finally {
        emExecucao = false
      }
    }

    void consultarRevisao()
    const interval = window.setInterval(() => void consultarRevisao(), 2000)
    return () => {
      ativo = false
      window.clearInterval(interval)
    }
  }, [screen, modoAtendimento, departamentoId, terminalId, dadosOriginais])

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
            window.history.replaceState({}, '', '/')
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
                departamentoNomeSelecionado,
                terminalNomeSelecionado,
              ) => {
                setDepartamentoId(departamentoIdSelecionado)
                setTerminalId(terminalIdSelecionado)
                setDepartamentoNome(departamentoNomeSelecionado)
                setTerminalNome(terminalNomeSelecionado)
                setMostrarDepartamento(false)

                setStatusValidacao('waiting')
                const dadosVazios = { nome: '', telefone: '', email: '' }
                setDadosValidacao(dadosVazios)
                setDadosOriginais(dadosVazios)
                setCorrecoesValidacao({})

                // O funcionário vai para a tela atual de atendimento.
                // O paciente continua seguindo o fluxo de conexão.
                if (modoAtendimento === 'funcionario') {
                  setScreen('employee-validation')
                } else {
                  setScreen('connection')
                }
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
            onConnected={handleEmployeeConnected}
            onBack={() => {
              setDepartamentoId(null)
              setTerminalId(null)
              setScreen('home')
            }}
          />
        )}

      {/* VALIDAÇÃO DOS DADOS DO FUNCIONÁRIO */}
      {screen === 'employee-validation' &&
        modoAtendimento === 'funcionario' &&
        departamentoId !== null &&
        terminalId !== null && (
          <EmployeeValidationScreen
            usuario={usuario}
            onLogout={handleLogout}
            departamentoId={departamentoId}
            terminalId={terminalId}
            departamentoNome={departamentoNome}
            terminalNome={terminalNome}
            onContinueToReview={async (dados) => {
              const clientId = getClientId()
              if (!clientId) return
              const response = await apiFetch('/atendimento/dados', {
                method: 'POST',
                body: JSON.stringify({
                  department_id: departamentoId,
                  terminal_id: terminalId,
                  client_id: clientId,
                  role: 'funcionario',
                  ...dados,
                }),
              })
              if (!response.ok) {
                alert('Não foi possível enviar os dados ao tablet. Verifique a conexão e tente novamente.')
                return
              }
              setDadosOriginais(dados)
              setDadosValidacao(dados)
              setCorrecoesValidacao({})
              setStatusValidacao('checking')
            }}
            initialData={dadosValidacao}
            originalData={dadosOriginais}
            corrections={correcoesValidacao}
            status={statusValidacao}
            onValidate={(dados) => {
              setDadosValidacao(dados)
            }}
            onReleaseSurvey={async () => {
              const clientId = getClientId()
              if (!clientId) return
              const response = await apiFetch('/atendimento/autorizar', {
                method: 'POST',
                body: JSON.stringify({
                  department_id: departamentoId,
                  terminal_id: terminalId,
                  client_id: clientId,
                  role: 'funcionario',
                }),
              })
              if (!response.ok) {
                alert('Não foi possível liberar a avaliação. Confirme se o paciente enviou a conferência.')
                return
              }
              setStatusValidacao('survey')
            }}
            onBack={() => setScreen('connection')}
          />
        )}

      {/* CONFERÊNCIA DOS DADOS — exibida no tablet após envio pelo funcionário */}
      {screen === 'patient-review' &&
        modoAtendimento === 'paciente' &&
        departamentoId !== null &&
        terminalId !== null && (
          <PatientReviewScreen
            initialData={dadosValidacao}
            departamentoNome={departamentoNome}
            terminalNome={terminalNome}
            usuario={usuario}
            onSubmitCorrections={async (dados) => {
              const clientId = getClientId()
              if (!clientId) return
              const response = await apiFetch('/atendimento/revisao', {
                method: 'POST',
                body: JSON.stringify({
                  department_id: departamentoId,
                  terminal_id: terminalId,
                  client_id: clientId,
                  role: 'paciente',
                  ...dados,
                }),
              })
              if (!response.ok) {
                alert('Não foi possível enviar a conferência. Verifique a conexão e tente novamente.')
                return
              }
              setDadosValidacao(dados)
              setScreen('connection')
            }}
            onBack={() => setScreen('connection')}
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
