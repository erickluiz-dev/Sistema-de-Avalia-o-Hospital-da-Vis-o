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
            ? 'text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
        style={
          aba === 'funcionarios'
            ? { background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }
            : {}
        }
      >
        Funcionários
      </button>

      <button
        type="button"
        onClick={() => setAba('terminais')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'terminais'
            ? 'text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
        style={
          aba === 'terminais'
            ? { background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }
            : {}
        }
      >
        Terminais
      </button>

      <button
        type="button"
        onClick={() => setAba('departamentos')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'departamentos'
            ? 'text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
        style={
          aba === 'departamentos'
            ? { background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }
            : {}
        }
      >
        Departamentos
      </button>

      <button
        type="button"
        onClick={() => setAba('usuarios')}
        className={`px-4 py-2 rounded-xl text-sm font-medium ${
          aba === 'usuarios'
            ? 'text-white'
            : 'bg-white text-gray-600 border border-gray-200'
        }`}
        style={
          aba === 'usuarios'
            ? { background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }
            : {}
        }
      >
        Usuários
      </button>

    </div>
  )
}