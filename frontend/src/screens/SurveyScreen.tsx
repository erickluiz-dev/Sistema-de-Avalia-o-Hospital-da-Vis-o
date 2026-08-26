
import type { RatingKey} from '../types'
import { useState } from 'react'
import { apiFetch } from '../services/api'
import { RATINGS } from '../constants/ratings'




type SurveyScreenProps = {
  onBack: () => void
  departamentoId: number
}

export default function SurveyScreen({
  onBack,
  departamentoId,
}: SurveyScreenProps) {
  const [selected, setSelected] = useState<RatingKey | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(2)

  const enviarAvaliacao = async (nota: RatingKey) => {
    try {
      const response = await apiFetch('/avaliacoes', {
        method: 'POST',

        body: JSON.stringify({
          avaliacao: nota,
          departamento_id: departamentoId,
        }),
      })

      if (!response.ok) {
        const mensagem = await response.text()

        console.error('Erro do backend:', mensagem)

        throw new Error('Erro ao enviar avaliação')
      }

      return true
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)

      return false
    }
  }

  const handleSubmit = async () => {

    if (!selected) {
      alert('Selecione uma avaliação.')
      return
    }

    const sucesso = await enviarAvaliacao(selected)

    if (!sucesso) {
      alert('Não foi possível registrar a avaliação.')
      return
    }

    setSubmitted(true)
    setCountdown(2)

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)

          setSelected(null)
          setSubmitted(false)

          return 2
        }

        return prev - 1
      })
    }, 1000)
  }


  if (submitted) {
    const sel = RATINGS.find((r) => r.key === selected)

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-6"
        style={{ background: '#f8fafc' }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg,#04c7e0,#028496)',
              boxShadow: '0 8px 32px #00B5CC',
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>

          <div>
            <h2
              className="text-4xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Obrigado!
            </h2>

            <p className="text-gray-500 mt-2 text-lg">
              Sua avaliação foi registrada com sucesso.
            </p>

            {sel && (
              <div
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold"
                style={{ background: '#00B5CC' }}
              >
                {sel.label.replace('\n', ' ')}
              </div>
            )}
          </div>

          <p className="text-gray-400 text-sm">
            Redirecionando em{' '}
            <span className="font-bold text-gray-600">
              {countdown}s
            </span>
            …
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#f8fafc' }}
    >
      <div
        className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
      >
        <img
          src="/logo.png"
          alt="Hospital da Visão"
          width="270"
          height="110"
          style={{
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />

        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Voltar
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">
        <div className="text-center">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 max-w-xl mx-auto leading-tight"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Como você avalia o nosso Atendimento?
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl">
          {RATINGS.map((r) => {
            const isSelected = selected === r.key

            return (
              <div
                key={r.key}
                onClick={() => setSelected(r.key)}
                className="flex-1 flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected ? r.bg : 'white',
                  border: `2px solid ${
                    isSelected ? r.color : '#f3f4f6'
                  }`,
                  boxShadow: isSelected
                    ? `0 8px 32px ${r.shadow}`
                    : '0 2px 12px rgba(0,0,0,0.05)',
                  transform: isSelected
                    ? 'scale(1.04)'
                    : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor =
                      r.color + '60'

                    e.currentTarget.style.boxShadow =
                      `0 6px 20px ${r.shadow}`

                    e.currentTarget.style.transform =
                      'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor =
                      '#f3f4f6'

                    e.currentTarget.style.boxShadow =
                      '0 2px 12px rgba(0,0,0,0.05)'

                    e.currentTarget.style.transform =
                      'scale(1)'
                  }
                }}
              >
                <r.Icon
                  size={64}
                  color={r.color}
                  strokeWidth={1.5}
                />

                <div className="text-center">
                  {r.label.split('\n').map((line, i) => (
                    <div
                      key={i}
                      className="text-sm sm:text-base font-bold leading-snug"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: isSelected
                          ? r.color
                          : '#374151',
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: r.color }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="h-14 flex items-center">
          {selected && (
            <button
              onClick={handleSubmit}
              className="px-12 py-4 rounded-2xl text-white font-semibold text-base transition-all duration-200 cursor-pointer"
              style={{
                background:
                  'linear-gradient(135deg,#04c7e0,#0697aa)',
                boxShadow: '0 6px 20px #00b4cc59',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform =
                  'translateY(-2px)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  'translateY(0)')
              }
            >
              Enviar Avaliação
            </button>
          )}
        </div>
      </main>
    </div>
  )
}