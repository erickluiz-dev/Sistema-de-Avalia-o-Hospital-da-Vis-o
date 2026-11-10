import { Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import ManagementPagination from '../components/ManagementPagination'
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
  const [busca, setBusca] = useState('')
  const terminaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return terminais
    return terminais.filter((terminal) =>
      [terminal.terminal, terminal.departamento]
        .some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo)),
    )
  }, [busca, terminais])

  const ITENS_POR_PAGINA = 10
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(terminaisFiltrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const terminaisFiltradosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return terminaisFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [terminaisFiltrados, paginaAtual])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Terminais
          </h2>

          <div className="relative mt-3 w-full sm:w-[min(100%,360px)]">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} placeholder="Buscar terminal..." aria-label="Buscar terminal por nome ou departamento" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#00B5CC] focus:ring-2 focus:ring-[#00B5CC]/20 placeholder:text-gray-400" />
            {busca && <button type="button" onClick={() => { setBusca(''); setPagina(1) }} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X size={16} /></button>}
          </div>
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
        <table className="w-full table-fixed text-sm min-w-[560px] sm:min-w-0">
          <colgroup>
            <col className="w-[33%]" />
            <col className="w-[53%]" />
            <col className="w-[14%]" />
          </colgroup>
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
            {terminaisFiltradosPaginados.map((terminal) => (
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
            {terminaisFiltrados.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">{busca ? 'Nenhum terminal encontrado para essa pesquisa.' : 'Nenhum terminal cadastrado.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ManagementPagination
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        totalItens={terminaisFiltrados.length}
        nomeItens="terminais"
        onChange={setPagina}
      />
    </div>
  )
}