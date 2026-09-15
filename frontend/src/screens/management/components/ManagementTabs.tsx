import type { Aba } from '../types'

type ManagementTabsProps = {
  aba: Aba
  setAba: (aba: Aba) => void
}

export default function ManagementTabs({
  aba,
  setAba,
}: ManagementTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">

      <button
        type="button"
        onClick={() => setAba('funcionarios')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'funcionarios'
            ? 'bg-[#00B5CC] text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
      >
        Funcionários
      </button>

      <button
        type="button"
        onClick={() => setAba('terminais')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'terminais'
            ? 'bg-[#00B5CC] text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
      >
        Terminais
      </button>

      <button
        type="button"
        onClick={() => setAba('departamentos')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'departamentos'
            ? 'bg-[#00B5CC] text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
      >
        Departamentos
      </button>

      <button
        type="button"
        onClick={() => setAba('usuarios')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'usuarios'
            ? 'bg-[#00B5CC] text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
      >
        Usuários
      </button>

    </div>
  )
}