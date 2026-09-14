type Terminal = {
  id: number
  terminal: string
  departamento: string
}

type TerminaisTabProps = {
  terminais: Terminal[]
  onNovoTerminal: () => void
}

export default function TerminaisTab({
  terminais,
  onNovoTerminal,
}: TerminaisTabProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: '#00B5CC',
          }}
        >
          <span className="text-lg leading-none">
            +
          </span>

          Terminal
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">
                Terminal
              </th>

              <th className="px-4 py-3 text-left">
                Departamento
              </th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}