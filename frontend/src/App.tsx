import { useState, useEffect } from 'react'

import { apiFetch } from './services/api'

import Login from './components/Login'
import SurveyScreen from './screens/SurveyScreen'
import HomeScreen from './screens/HomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import DepartmentScreen from './screens/DepartmentScreen'

import type {
  Screen,
  Usuario,
} from './types'

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [departamentoId, setDepartamentoId] = useState<number | null>(null)
  const [mostrarDepartamento, setMostrarDepartamento] = useState(false)

  useEffect(() => {
    const verificarSessao = async () => {
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
          throw new Error(`Erro HTTP ${response.status}`)
        }

        const usuarioAtual: Usuario = await response.json()

        setUsuario(usuarioAtual)
        setScreen('home')
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)

        setUsuario(null)
        setScreen('login')
      } finally {
        setVerificandoSessao(false)
      }
    }

    verificarSessao()
  }, [])

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

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error)
    } finally {
      setUsuario(null)
      setScreen('login')
    }
  }

  return (
    <>
      {screen === 'login' && (
        <Login
          onLogin={(usuarioAutenticado) => {
            setUsuario(usuarioAutenticado)
            setScreen('home')
          }}
        />
      )}

      {screen === 'home' && (
        <>
          <HomeScreen
            usuario={usuario}
            onNav={setScreen}
            onLogout={handleLogout}
            onStartSurvey={() => setMostrarDepartamento(true)}
          />

          {mostrarDepartamento && (
            <DepartmentScreen
              onStart={(id) => {
                setDepartamentoId(id)
                setMostrarDepartamento(false)
                setScreen('survey')
              }}
              onBack={() => {
                setMostrarDepartamento(false)
              }}
            />
          )}
        </>
      )}

      {screen === 'survey' && departamentoId !== null && (
        <SurveyScreen
          departamentoId={departamentoId}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'dashboard' && (
        <DashboardScreen
          onBack={() => setScreen('home')}
          onLogout={handleLogout}
          usuario={usuario}
        />
      )}
    </>
  )
}