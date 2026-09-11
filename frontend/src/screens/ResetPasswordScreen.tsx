import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { apiFetch } from '../services/api'

type ResetPasswordScreenProps = {
  token: string
  onBack: () => void
}

export default function ResetPasswordScreen({
  token,
  onBack,
}: ResetPasswordScreenProps) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async () => {
    setErro('')

    if (!senha || !confirmacao) {
      setErro('Preencha os dois campos de senha.')
      return
    }

    if (senha.length < 8) {
      setErro(
        'A senha deve possuir pelo menos 8 caracteres.',
      )
      return
    }

    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    if (!token) {
      setErro('Link de recuperação inválido.')
      return
    }

    setLoading(true)

    try {
      const response = await apiFetch(
        '/redefinir-senha',
        {
          method: 'POST',
          body: JSON.stringify({
            token,
            senha,
          }),
        },
      )

      if (!response.ok) {
        const mensagem = await response.text()

        throw new Error(
          mensagem || 'Não foi possível redefinir a senha.',
        )
      }

      setSucesso(true)
    } catch (error) {
      console.error(
        'Erro ao redefinir senha:',
        error,
      )

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível redefinir a senha.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div
          className="w-full max-w-sm bg-white rounded-3xl p-10 text-center"
          style={{
            boxShadow:
              '0 8px 40px rgba(0,0,0,0.10)',
          }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg,#04c7e0,#028496)',
            }}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mt-6">
            Senha redefinida
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            Sua senha foi alterada com sucesso.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="w-full mt-8 py-3 rounded-xl text-white font-semibold text-sm cursor-pointer"
            style={{
              background: '#00B5CC',
            }}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-8 sm:p-10"
        style={{
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.10)',
        }}
      >
        <div className="flex justify-center mb-8">
          <img
            src="/logo.png"
            alt="Hospital da Visão"
            width="150"
            height="100"
          />
        </div>

        <h1 className="text-center text-gray-700 text-xl font-bold">
          Criar nova senha
        </h1>

        <p className="text-center text-gray-400 text-sm mt-2 mb-8">
          Informe sua nova senha abaixo.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-4 uppercase tracking-wide">
              Nova senha
            </label>

            <div className="relative">
              <input
                type={
                  mostrarSenha ? 'text' : 'password'
                }
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                disabled={loading}
                className="w-full mb-8 px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha((value) => !value)
                }
                className="absolute  right-3 top-1/2 -translate-y-6 text-gray-400 cursor-pointer"
              >
                {mostrarSenha ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-4 uppercase tracking-wide">
              Confirmar nova senha
            </label>

            <div className="relative">
              <input
                type={
                  mostrarConfirmacao
                    ? 'text'
                    : 'password'
                }
                value={confirmacao}
                onChange={(e) =>
                  setConfirmacao(e.target.value)
                }
                disabled={loading}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacao(
                    (value) => !value,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              >
                {mostrarConfirmacao ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-500 text-center">
              {erro}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: '#00B5CC',
            }}
          >
            {loading
              ? 'Redefinindo...'
              : 'Redefinir senha'}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  )
}
