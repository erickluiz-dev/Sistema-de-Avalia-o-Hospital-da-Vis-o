import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import Logo from '../components/Logo'
import { apiFetch } from '../services/api'

type ForgotPasswordScreenProps = {
  onBack: () => void
}

const FORGOT_PASSWORD_FLOATING_STYLE = `
  @keyframes forgot-float-1 {
    0% {
      transform: translate3d(0, 0, 0);
    }
    25% {
      transform: translate3d(55px, -35px, 0);
    }
    50% {
      transform: translate3d(-30px, -55px, 0);
    }
    75% {
      transform: translate3d(-55px, 20px, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes forgot-float-2 {
    0% {
      transform: translate3d(0, 0, 0);
    }
    25% {
      transform: translate3d(-45px, 35px, 0);
    }
    50% {
      transform: translate3d(35px, 60px, 0);
    }
    75% {
      transform: translate3d(60px, -25px, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes forgot-float-3 {
    0% {
      transform: translate3d(0, 0, 0);
    }
    25% {
      transform: translate3d(50px, 40px, 0);
    }
    50% {
      transform: translate3d(-50px, 20px, 0);
    }
    75% {
      transform: translate3d(-30px, -50px, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  .forgot-floating-circle-1 {
    animation: forgot-float-1 14s ease-in-out infinite;
    will-change: transform;
  }

  .forgot-floating-circle-2 {
    animation: forgot-float-2 18s ease-in-out infinite;
    will-change: transform;
  }

  .forgot-floating-circle-3 {
    animation: forgot-float-3 16s ease-in-out infinite;
    will-change: transform;
  }

`

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
        <style>{FORGOT_PASSWORD_FLOATING_STYLE}</style>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            aria-hidden="true"
            className="forgot-floating-circle-1 absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'white' }}
          />

          <div
            aria-hidden="true"
            className="forgot-floating-circle-2 absolute top-1/3 -left-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'white' }}
          />

          <div
            aria-hidden="true"
            className="forgot-floating-circle-3 absolute -bottom-16 right-1/4 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'white' }}
          />
        </div>

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
        <div className="w-full max-w-md">
          <div
            className="bg-white rounded-3xl min-h-[450px] p-8 sm:p-10"
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
                style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
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