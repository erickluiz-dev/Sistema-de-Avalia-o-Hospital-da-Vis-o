import { Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import ManagementPagination from '../components/ManagementPagination'
import type { Departamento } from '../../../types'

type DepartamentosTabProps = {
  departamentos: Departamento[]
  onNovoDepartamento: () => void
  onExcluir: (id: number, nome: string) => void
}

export default function DepartamentosTab({
  departamentos,
  onNovoDepartamento,
  onExcluir,
}: DepartamentosTabProps) {
  const [busca, setBusca] = useState('')
  const departamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return departamentos
    return departamentos.filter((departamento) =>
      departamento.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      String(departamento.id).includes(termo),
    )
  }, [busca, departamentos])

  const ITENS_POR_PAGINA = 10
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(departamentosFiltrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const departamentosFiltradosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return departamentosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [departamentosFiltrados, paginaAtual])

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Departamentos
          </h2>

          <div className="relative mt-3 w-full sm:w-[min(100%,360px)]">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} placeholder="Buscar departamento..." aria-label="Buscar departamento por nome ou código" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#00B5CC] focus:ring-2 focus:ring-[#00B5CC]/20 placeholder:text-gray-400" />
            {busca && <button type="button" onClick={() => { setBusca(''); setPagina(1) }} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X size={16} /></button>}
          </div>
        </div>

        <button
          type="button"
          onClick={onNovoDepartamento}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
        >
          <span className="text-lg leading-none">+</span>
          Departamento
        </button>
      </div>

      {/* Tabela */}
      <div className="mt-6 min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
        <table className="w-full table-fixed text-sm min-w-[560px] sm:min-w-0">
          <colgroup>
            <col className="w-[33%]" />
            <col className="w-[53%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">
                ID
              </th>

              <th className="px-4 py-3 text-left">
                Nome
              </th>
              <th className="px-4 py-3 text-center"></th>
            </tr>
          </thead>

          <tbody>
            {departamentosFiltradosPaginados.map((departamento) => (
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
                <td className="px-4 py-4 text-center">
                  <button type="button" onClick={() => onExcluir(departamento.id, departamento.nome)}
                    title="Desativar departamento" aria-label={`Desativar departamento ${departamento.nome}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#b20000a4] transition-colors hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {departamentosFiltrados.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">{busca ? 'Nenhum departamento encontrado para essa pesquisa.' : 'Nenhum departamento cadastrado.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ManagementPagination
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        totalItens={departamentosFiltrados.length}
        nomeItens="departamentos"
        onChange={setPagina}
      />
    </div>
  )
}