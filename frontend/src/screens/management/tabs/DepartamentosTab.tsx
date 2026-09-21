import type { Departamento } from '../../../types'

type DepartamentosTabProps = {
  departamentos: Departamento[]
  onNovoDepartamento: () => void
}

export default function DepartamentosTab({
  departamentos,
  onNovoDepartamento,
}: DepartamentosTabProps) {
  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Departamentos
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Gerencie os departamentos do sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={onNovoDepartamento}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
        >
          <span className="text-lg leading-none">+</span>
          Departamento
        </button>
      </div>

      {/* Tabela */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">
                ID
              </th>

              <th className="px-4 py-3 text-left">
                Nome
              </th>
            </tr>
          </thead>

          <tbody>
            {departamentos.map((departamento) => (
              <tr
                key={departamento.id}
                className="border-t border-gray-50"
              >
                <td className="px-4 py-4 text-gray-500">
                  {departamento.id}
                </td>

                <td className="px-4 py-4 text-gray-700">
                  {departamento.nome}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}