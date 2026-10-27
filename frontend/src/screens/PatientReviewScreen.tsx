
import { useEffect, useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import NavBar from '../components/NavBar'
import type { Usuario } from '../types'
import type { PatientData } from './EmployeeValidationScreen'

interface PatientReviewScreenProps {
  initialData: PatientData
  departamentoNome: string
  terminalNome: string
  usuario: Usuario | null
  onSubmitCorrections: (
    data: PatientData,
  ) => void | Promise<void>
  onBack: () => void
}

export default function PatientReviewScreen({
  initialData,
  departamentoNome,
  terminalNome,
  usuario,
  onSubmitCorrections,
  onBack,
}: PatientReviewScreenProps) {
  const [form, setForm] = useState<PatientData>(initialData)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setForm(initialData)
  }, [initialData.nome, initialData.telefone, initialData.email])

  const update = (key: keyof PatientData, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
    setErro('')
  }

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.nome.trim()) {
      setErro('Informe seu nome antes de enviar.')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      await onSubmitCorrections({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
      })
    } catch {
      setErro('Não foi possível enviar agora. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const fields: {
    key: keyof PatientData
    label: string
    type: string
    maxLength: number
    autoComplete: string
  }[] = [
    {
      key: 'nome',
      label: 'Nome para conferência',
      type: 'text',
      maxLength: 200,
      autoComplete: 'name',
    },
    {
      key: 'telefone',
      label: 'Telefone para retorno',
      type: 'tel',
      maxLength: 32,
      autoComplete: 'tel',
    },
    {
      key: 'email',
      label: 'E-mail',
      type: 'email',
      maxLength: 254,
      autoComplete: 'email',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-500">
      {/* Cabeçalho institucional compartilhado com o sistema */}
    
      <main className="mx-auto w-full max-w-4xl px-2 pb-8 pt-10 sm:px-6 sm:pt-11">
        <div className="flex justify-center items-center w-full mb-15">
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
        <div className="mb-10 text-center">

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-700">
            Confira seus dados
          </h1>

          <p className="mt-2 text-base text-slate-600 sm:text-lg">
            Confira as informações e corrija somente o que for necessário.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-blue-100 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8"
        >

          <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2">
            {fields.map(field => (
              <label
                key={field.key}
                className={`flex flex-col gap-4 ${
                  field.key === 'email' ? 'sm:col-span-2' : ''
                }`}
              >
                <span className="text-sm font-semibold text-slate-700">
                  {field.label}
                </span>

                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={event =>
                    update(field.key, event.target.value)
                  }
                  autoComplete={field.autoComplete}
                  maxLength={field.maxLength}
                  disabled={enviando}
                  required={field.key === 'nome'}
                  className="h-[58px] w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-[#00B5CC] focus:ring-2 focus:ring-cyan-100 disabled:cursor-wait disabled:bg-slate-50"
                />
              </label>
            ))}
          </div>

          {erro && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-8 mx-auto flex min-h-[60px] w-fit items-center justify-center gap-2 rounded-2xl bg-[#00B5CC] px-2 py-4 font-semibold text-white transition hover:bg-[#01899b] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
            style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
          >
            <Send size={20} />
            {enviando
              ? 'Enviando conferência...'
              : 'Confirmar Dados'}
          </button>
        </form>

      </main>
    </div>
  )
}
