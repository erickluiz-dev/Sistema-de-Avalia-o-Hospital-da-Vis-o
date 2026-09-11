import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import Logo from '../components/Logo'
import { apiFetch } from '../services/api'

type ForgotPasswordScreenProps = {
  onBack: () => void
}

export default function ForgotPasswordScreen({
  onBack,
}: ForgotPasswordScreenProps) {
  const [login, setLogin] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = async () => {
    setMensagem('')
    setErro('')

    if (!login.trim()) {
      setErro('Informe seu login.')
      return
    }

    setLoading(true)

    try {
      const response = await apiFetch(
        '/recuperacao-senha',
        {
          method: 'POST',
          body: JSON.stringify({
            login: login.trim(),
          }),
        },
      )

      if (!response.ok) {
        throw new Error(
          'Não foi possível processar a solicitação.',
        )
      }

      const data = await response.json()

      setMensagem(data.mensagem)
    } catch (error) {
      console.error(
        'Erro ao solicitar recuperação:',
        error,
      )

      setErro(
        'Não foi possível processar a solicitação. Tente novamente mais tarde.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div
        className="hidden lg:flex flex-col justify-between p-12 lg:w-1/2 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, #00cca0 0%, #00B5CC 45%, #009ccc 100%)',
        }}
      >
        <div className="relative z-10">
          <Logo size="lg" />

          <div
            className="mt-2"
            style={{
              color: 'rgba(255, 255, 255, 0.94)',
              fontSize: 13,
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}
          >
            SISTEMA DE AVALIAÇÃO DA SATISFAÇÃO DO PACIENTE
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center">
            <Mail
              size={56}
              color="white"
              strokeWidth={1.5}
            />
          </div>

          <h2
            className="text-white text-2xl font-bold mt-8"
            style={{
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Recuperação de acesso
          </h2>

          <p className="text-blue-100 text-sm mt-2 max-w-xs text-center leading-relaxed">
            Enviaremos instruções para criar uma nova senha.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <div
            className="bg-white rounded-3xl p-8 sm:p-10"
            style={{
              boxShadow:
                '0 8px 40px rgba(0,0,0,0.10)',
            }}
          >
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <div className="flex justify-center mb-12">
              <img
                src="/logo.png"
                alt="Hospital da Visão"
                width="150"
                height="100"
              />
            </div>

            <h1
              className="text-center text-gray-700 text-xl font-bold mb-6"
              style={{
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Recuperar senha
            </h1>

            <p className="text-center text-gray-400 text-sm mt-2 mb-8">
              Informe seu login para receber as instruções.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Login
                </label>

                <input
                  type="email"
                  value={login}
                  onChange={(e) =>
                    setLogin(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit()
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                  style={{
                    '--tw-ring-color': '#00B5CC',
                  } as React.CSSProperties}
                  placeholder="seu@email.com"
                />
              </div>

              {mensagem && (
                <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                  <p className="text-sm text-green-700">
                    {mensagem}
                  </p>
                </div>
              )}

              {erro && (
                <p className="text-sm text-red-500 text-center">
                  {erro}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: '#00B5CC',
                }}
              >
                {loading
                  ? 'Enviando...'
                  : 'Enviar instruções'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

