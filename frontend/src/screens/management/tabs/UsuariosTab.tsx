import { Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import ManagementPagination from '../components/ManagementPagination'
import type { Usuario } from '../../../types'

type UsuariosTabProps = {
  usuarios: Usuario[]
  onNovoUsuario: () => void
  onExcluir: (id: number, nome: string) => void
  onAlterarAdministrador: (id: number, administrador: boolean) => Promise<void>
  aplicandoPermissaoId: number | null
}

export default function UsuariosTab({
  usuarios,
  onNovoUsuario,
  onExcluir,
  onAlterarAdministrador,
  aplicandoPermissaoId,
}: UsuariosTabProps) {
  const [busca, setBusca] = useState('')
  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return usuarios
    return usuarios.filter((usuario) =>
      [usuario.nome, usuario.login, usuario.administrador ? 'administrador sim' : 'administrador não']
        .some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo)),
    )
  }, [busca, usuarios])

  const ITENS_POR_PAGINA = 10
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const usuariosFiltradosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [usuariosFiltrados, paginaAtual])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Usuários
          </h2>

          <div className="relative mt-3 w-full sm:w-[min(100%,360px)]">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} placeholder="Buscar usuário..." aria-label="Buscar usuário por nome ou login" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#00B5CC] focus:ring-2 focus:ring-[#00B5CC]/20 placeholder:text-gray-400" />
            {busca && <button type="button" onClick={() => { setBusca(''); setPagina(1) }} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X size={16} /></button>}
          </div>
        </div>

        <button
          type="button"
          onClick={onNovoUsuario}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00B5CC]"
        >
          Novo usuário
        </button>
      </div>

      <div className="mt-6 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm min-w-[620px] sm:min-w-0">
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
              <th className="px-4 py-3 text-center"></th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltradosPaginados.map((usuarioItem) => (
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
                  <div className="inline-flex min-w-[112px] items-center justify-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={usuarioItem.administrador}
                      aria-label={`${usuarioItem.administrador ? 'Remover' : 'Conceder'} permissão de administrador para ${usuarioItem.nome}`}
                      disabled={aplicandoPermissaoId === usuarioItem.id}
                      onClick={() => onAlterarAdministrador(
                        usuarioItem.id,
                        !usuarioItem.administrador,
                      )}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B5CC] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
                        usuarioItem.administrador ? 'bg-[#00B5CC]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          usuarioItem.administrador ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${
                      usuarioItem.administrador ? 'text-[#00B5CC]' : 'text-gray-400'
                    }`}>
                      {aplicandoPermissaoId === usuarioItem.id
                        ? 'Salvando...'
                        : usuarioItem.administrador ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <button type="button" onClick={() => onExcluir(usuarioItem.id, usuarioItem.nome)}
                    title="Desativar usuário" aria-label={`Desativar usuário ${usuarioItem.nome}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#b20000a4] transition-colors hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">{busca ? 'Nenhum usuário encontrado para essa pesquisa.' : 'Nenhum usuário cadastrado.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ManagementPagination
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        totalItens={usuariosFiltrados.length}
        nomeItens="usuários"
        onChange={setPagina}
      />
    </div>
  )
}