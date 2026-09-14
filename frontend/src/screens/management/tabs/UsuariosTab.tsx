import type { Usuario } from '../../../types'

type UsuariosTabProps = {
  usuarios: Usuario[]
  onNovoUsuario: () => void
}

export default function UsuariosTab({
  usuarios,
  onNovoUsuario,
}: UsuariosTabProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Usuários
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Gerencie os usuários que possuem acesso ao sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={onNovoUsuario}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: '#00B5CC',
          }}
        >
          <span className="text-lg leading-none">+</span>
          Usuário
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">
                NOME
              </th>

              <th className="px-4 py-3 text-left">
                LOGIN
              </th>

              <th className="px-4 py-3 text-center">
                ADMINISTRADOR
              </th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuarioItem) => (
              <tr
                key={usuarioItem.id}
                className="border-t border-gray-50"
              >
                <td className="px-4 py-4 text-gray-700">
                  {usuarioItem.nome}
                </td>

                <td className="px-4 py-4 text-gray-600">
                  {usuarioItem.login}
                </td>

                <td className="px-4 py-4 text-center">
                  {usuarioItem.administrador ? (
                    <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      Não
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}