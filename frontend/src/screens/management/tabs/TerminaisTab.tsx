import { Trash2 } from 'lucide-react'
type Terminal = {
  id: number
  terminal: string
  departamento: string
}

type TerminaisTabProps = {
  terminais: Terminal[]
  onNovoTerminal: () => void
  onExcluir: (id: number, nome: string) => void
}

export default function TerminaisTab({
  terminais,
  onNovoTerminal,
  onExcluir,
}: TerminaisTabProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Terminais
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {terminais.length} terminal(is) cadastrado(s).
          </p>
        </div>

        <button
          type="button"
          onClick={onNovoTerminal}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
        >
          <span className="text-lg leading-none">
            +
          </span>

          Terminal
        </button>
      </div>

      <div className="mt-6 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm min-w-[560px] sm:min-w-0">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">
                Terminal
              </th>

              <th className="px-4 py-3 text-left">
                Departamento
              </th>
              <th className="px-4 py-3 text-center"></th>
            </tr>
          </thead>

          <tbody>
            {terminais.map((terminal) => (
              <tr
                key={terminal.id}
                className="border-t border-gray-50"
              >
                <td className="px-4 py-4 text-gray-700">
                  {terminal.terminal}
                </td>

                <td className="px-4 py-4 text-gray-600">
                  {terminal.departamento}
                </td>
                <td className="px-4 py-4 text-center">
                  <button type="button" onClick={() => onExcluir(terminal.id, terminal.terminal)}
                    title="Desativar terminal" aria-label={`Desativar terminal ${terminal.terminal}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#b20000a4] transition-colors hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}