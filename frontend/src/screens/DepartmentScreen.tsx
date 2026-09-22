import { useEffect, useState } from 'react'

import { apiFetch } from '../services/api'

import type {
  Departamento,
  Terminal,
} from '../types'

function DepartmentScreen({
  onStart,
  onBack,
}: {
  onStart: (
    departamentoId: number,
    terminalId: number,
  ) => void
  onBack: () => void
}) {
  const [departamentos, setDepartamentos] = useState<
    Departamento[]
  >([])

  const [terminais, setTerminais] = useState<Terminal[]>([])

  const [departamentoSelecionado, setDepartamentoSelecionado] =
    useState('')

  const [terminalSelecionado, setTerminalSelecionado] =
    useState('')

  const [loadingDepartamentos, setLoadingDepartamentos] =
    useState(true)

  const [loadingTerminais, setLoadingTerminais] =
    useState(true)

  useEffect(() => {
    async function carregarDepartamentos() {
      try {
        setLoadingDepartamentos(true)

        const response = await apiFetch('/departamentos')

        if (!response.ok) {
          throw new Error(
            'Erro ao buscar departamentos',
          )
        }

        const data: Departamento[] =
          await response.json()

        setDepartamentos(data)
      } catch (error) {
        console.error(
          'Erro ao carregar departamentos:',
          error,
        )
      } finally {
        setLoadingDepartamentos(false)
      }
    }

    carregarDepartamentos()
  }, [])

  useEffect(() => {
    async function carregarTerminais() {
      try {
        setLoadingTerminais(true)

        const response = await apiFetch('/terminais')

        if (!response.ok) {
          throw new Error(
            'Erro ao buscar terminais',
          )
        }

        const data: Terminal[] =
          await response.json()

        setTerminais(data)
      } catch (error) {
        console.error(
          'Erro ao carregar terminais:',
          error,
        )
      } finally {
        setLoadingTerminais(false)
      }
    }

    carregarTerminais()
  }, [])

  const terminaisDoDepartamento =
    terminais.filter(
      (terminal) =>
        terminal.departamento_id ===
        Number(departamentoSelecionado),
    )

  const handleDepartamentoChange = (
    valor: string,
  ) => {
    setDepartamentoSelecionado(valor)

    // O terminal anterior não pode permanecer
    // selecionado quando o departamento mudar.
    setTerminalSelecionado('')
  }

  const handleStart = () => {
    if (
      !departamentoSelecionado ||
      !terminalSelecionado
    ) {
      return
    }

    onStart(
      Number(departamentoSelecionado),
      Number(terminalSelecionado),
    )
  }

  const carregando =
    loadingDepartamentos || loadingTerminais

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-6">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-8"
        style={{
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Página de Avaliação
        </h1>

        <p className="text-gray-500 text-sm text-center mt-2 mb-8">
          Selecione o departamento que deseja avaliar.
        </p>

        {/* Departamento */}
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Departamento
        </label>

        <select
          value={departamentoSelecionado}
          onChange={(e) =>
            handleDepartamentoChange(
              e.target.value,
            )
          }
          disabled={loadingDepartamentos}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00B5CC] focus:border-[#00B5CC]"
        >
          <option value="">
            {loadingDepartamentos
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

        {/* Terminal */}
        <label className="block text-xs font-semibold text-gray-600 mb-2 mt-8 uppercase tracking-wide">
          Terminal
        </label>

        <select
          value={terminalSelecionado}
          onChange={(e) =>
            setTerminalSelecionado(
              e.target.value,
            )
          }
          disabled={
            !departamentoSelecionado ||
            loadingTerminais
          }
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00B5CC] focus:border-[#00B5CC] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">
            {!departamentoSelecionado
              ? 'Selecione um terminal'
              : loadingTerminais
                ? 'Carregando terminais...'
                : terminaisDoDepartamento.length === 0
                  ? 'Nenhum terminal disponível'
                  : 'Selecione um terminal'}
          </option>

          {terminaisDoDepartamento.map(
            (terminal) => (
              <option
                key={terminal.id}
                value={terminal.id}
              >
                {terminal.terminal}
              </option>
            ),
          )}
        </select>

        {/* Começar */}
        <button
          type="button"
          disabled={
            !departamentoSelecionado ||
            !terminalSelecionado ||
            carregando
          }
          onClick={handleStart}
          className="w-full mt-6 py-3.5 rounded-xl text-white font-semibold transition-all disabled:opacity-55"
          style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
        >
          Começar Avaliação
        </button>

        {/* Voltar */}
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