import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import LoginPresentation from './login/LoginPresentation'
import { apiFetch } from '../services/api'
import type { Usuario } from '../types'

interface LoginScreenProps {
  onLogin: (usuario: Usuario) => void
  onForgotPassword: () => void
}

function LoginScreen({ onLogin, onForgotPassword, }: LoginScreenProps) {
  const REMEMBERED_LOGIN_KEY = 'remembered_login'
  const [email, setEmail] = useState(() => {
    return localStorage.getItem(REMEMBERED_LOGIN_KEY) ?? ''
  })
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => {
    return localStorage.getItem(REMEMBERED_LOGIN_KEY) !== null
  })
  const [showPassword, setShowPassword] = useState(false)

  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = async () => {
    setLoginError("")

    if (!email.trim() || !password) {
      setLoginError("Preencha o email e a senha.")
      return
    }

    setLoginLoading(true)

    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({
          login: email.trim(),
          senha: password,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Email ou senha inválidos.")
        }

        throw new Error("Não foi possível realizar o login.")
      }

      const usuario = await response.json()

      if (remember) {
        localStorage.setItem(
          REMEMBERED_LOGIN_KEY,
          email.trim(),
        )
      } else {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY)
      }

      onLogin(usuario)

    } catch (error) {
      console.error("Erro no login:", error)

      setLoginError(
        error instanceof Error
          ? error.message
          : "Erro ao realizar login."
      )
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LoginPresentation />

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md ">
          <div
            className="bg-white rounded-3xl min-h-[460px] p-8 sm:p-10"
            style={{
              boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            }}
          >
            <div className="flex justify-center mb-12">
              <img
                src="/logo.png"
                alt="logo-HV"
                width="150"
                height="100"
              />
            </div>

            <h1
              className="text-center text-gray-600 text-xl font-bold mb-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Satisfação do Paciente
            </h1>

            <p className="text-center text-gray-400 text-sm mb-8">
              Acesse sua conta
            </p>

            <div className="flex flex-col gap-4">
              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    '--tw-ring-color': '#00B5CC',
                  } as React.CSSProperties}
                />
              </div>

              {/* SENHA */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  SENHA
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{
                      '--tw-ring-color': '#00B5CC',
                    } as React.CSSProperties}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(value => !value)
                    }
                    title={
                      showPassword
                        ? 'Ocultar senha'
                        : 'Mostrar senha'
                    }
                    aria-label={
                      showPassword
                        ? 'Ocultar senha'
                        : 'Mostrar senha'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* LEMBRE-SE / ESQUECI A SENHA */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) =>
                      setRemember(e.target.checked)
                    }
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />

                  <span className="text-sm text-gray-600">
                    Lembre-se
                  </span>
                </label>

                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-[#00B5CC] hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  Esqueci a senha?
                </button>
              </div>

              {/* BOTÃO ENTRAR */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>

              {/* ERRO DE LOGIN */}
              {loginError && (
                <p className="text-sm text-red-500 text-center">
                  {loginError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen