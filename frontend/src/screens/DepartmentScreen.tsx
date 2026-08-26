import { useEffect, useState } from 'react'

import { apiFetch } from '../services/api'

import type { Departamento } from '../types'

function DepartmentScreen({
  onStart,
  onBack,
}: {
  onStart: (departamentoId: number) => void
  onBack: () => void
}) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState('')
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    async function carregarDepartamentos() {
      try {
        setLoading(true)

        const response = await apiFetch('/departamentos')

        if (!response.ok) {
          throw new Error('Erro ao buscar departamentos')
        }

        const data: Departamento[] = await response.json()

        setDepartamentos(data)
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDepartamentos()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-6">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-8"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Página de Avaliação
        </h1>

        <p className="text-gray-500 text-sm text-center mt-2 mb-8">
          Selecione o departamento que deseja avaliar.
        </p>

        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Departamento
        </label>

        <select
          value={departamentoSelecionado}
          onChange={(e) =>
            setDepartamentoSelecionado(e.target.value)
          }
          disabled={loading}
          className=" w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00B5CC] focus:border-[#00B5CC]"
        >
          <option value="">
            {loading
              ? 'Carregando departamentos...'
              : 'Selecione um departamento'}
          </option>

          {departamentos.map((departamento) => (
            <option
              key={departamento.id}
              value={departamento.id}
            >
              {departamento.nome}
            </option>
          ))}
        </select>

        


        <button
          type="button"
          disabled={!departamentoSelecionado || loading}
          onClick={() =>
            onStart(Number(departamentoSelecionado))
          }
          className="w-full mt-6 py-3.5 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
          style={{
            background: '#00B5CC',
          }}
        >
          Começar Avaliação
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full mt-3 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

export default DepartmentScreen