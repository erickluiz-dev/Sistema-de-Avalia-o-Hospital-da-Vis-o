import { Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import ManagementPagination from '../components/ManagementPagination'
import type { Dispatch, SetStateAction } from 'react'

type Funcionario = {
  id: number
  nome: string
  terminal_id: number | null
  terminal: string
  departamento_id: number | null
  departamento: string
  ativo: boolean
}

type Departamento = {
  id: number
  nome: string
}

type Terminal = {
  id: number
  terminal: string
  departamento_id: number
  departamento: string
}

type FuncionariosTabProps = {
  funcionarios: Funcionario[]
  departamentos: Departamento[]
  terminais: Terminal[]

  departamentosPendentes: Record<number, number | ''>
  setDepartamentosPendentes: Dispatch<
    SetStateAction<Record<number, number | ''>>
  >

  terminaisPendentes: Record<number, number | ''>
  setTerminaisPendentes: Dispatch<
    SetStateAction<Record<number, number | ''>>
  >

  aplicandoFuncionario: number | null

  aplicarTerminal: (funcionario: Funcionario) => Promise<void>

  getTerminaisDoDepartamento: (
    departamentoId: number | '',
  ) => Terminal[]

  onNovoFuncionario: () => void
  onExcluir: (id: number, nome: string) => void
}

export default function FuncionariosTab({
  funcionarios,
  departamentos,
  terminais,
  departamentosPendentes,
  setDepartamentosPendentes,
  terminaisPendentes,
  setTerminaisPendentes,
  aplicandoFuncionario,
  aplicarTerminal,
  getTerminaisDoDepartamento,
  onNovoFuncionario,
  onExcluir,
}: FuncionariosTabProps) {
  const [busca, setBusca] = useState('')
  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return funcionarios
    return funcionarios.filter((funcionario) =>
      [funcionario.nome, funcionario.departamento, funcionario.terminal]
        .some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo)),
    )
  }, [busca, funcionarios])

  const ITENS_POR_PAGINA = 10
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(funcionariosFiltrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const funcionariosFiltradosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return funcionariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [funcionariosFiltrados, paginaAtual])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Funcionários
          </h2>

          <div className="relative mt-3 w-full sm:w-[min(100%,360px)]">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
              placeholder="Buscar funcionário..."
              aria-label="Buscar funcionário por nome, departamento ou terminal"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#00B5CC] focus:ring-2 focus:ring-[#00B5CC]/20 placeholder:text-gray-400"
            />
            {busca && (
              <button type="button" onClick={() => { setBusca(''); setPagina(1) }} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onNovoFuncionario}
          className="w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00B5CC]"
          >
          Novo funcionário
        </button>
      </div>

      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm min-w-[900px] sm:min-w-0">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">
                Funcionário
              </th>

              <th className="px-4 py-3 text-left">
                Departamento
              </th>

              <th className="px-4 py-3 text-left">
                Terminal
              </th>

              <th className="px-4 py-3 text-left">
                
              </th>

              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>

          <tbody>
            {funcionariosFiltradosPaginados.map((funcionario) => {
              const departamentoSelecionado =
                departamentosPendentes[funcionario.id] ?? ''

              const terminaisDisponiveis =
                getTerminaisDoDepartamento(
                  departamentoSelecionado,
                )

              return (
                <tr
                  key={funcionario.id}
                  className="border-t border-gray-50"
                >
                  <td className="px-4 py-4 text-gray-700">
                    {funcionario.nome}
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={departamentoSelecionado}
                      onChange={(e) => {
                        const valor = e.target.value

                        const departamentoId =
                          valor === ''
                            ? ''
                            : Number(valor)

                        setDepartamentosPendentes(
                          (anterior) => ({
                            ...anterior,
                            [funcionario.id]:
                              departamentoId,
                          }),
                        )

                        setTerminaisPendentes(
                          (anterior) => ({
                            ...anterior,
                            [funcionario.id]: '',
                          }),
                        )
                      }}
                      className="w-full min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
                    >
                      <option value="">
                        Selecione um departamento
                      </option>

                      {departamentos.map(
                        (departamento) => (
                          <option
                            key={departamento.id}
                            value={departamento.id}
                          >
                            {departamento.nome}
                          </option>
                        ),
                      )}
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={
                        terminaisPendentes[
                          funcionario.id
                        ] ?? ''
                      }
                      disabled={
                        departamentoSelecionado === ''
                      }
                      onChange={(e) => {
                        const valor = e.target.value

                        setTerminaisPendentes(
                          (anterior) => ({
                            ...anterior,
                            [funcionario.id]:
                              valor === ''
                                ? ''
                                : Number(valor),
                          }),
                        )
                      }}
                      className="w-full min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">
                        {departamentoSelecionado === ''
                          ? 'Selecione o departamento'
                          : terminaisDisponiveis.length === 0
                            ? 'Nenhum terminal disponível'
                            : 'Selecione um terminal'}
                      </option>

                      {terminaisDisponiveis.map(
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
                  </td>

                  <td className="px-4 py-4">
                    
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        aplicarTerminal(funcionario)
                      }
                      disabled={
                        aplicandoFuncionario ===
                          funcionario.id ||
                        terminaisPendentes[
                          funcionario.id
                        ] === ''
                      }
                      className="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aplicandoFuncionario ===
                      funcionario.id
                        ? 'Aplicando...'
                        : 'Aplicar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onExcluir(funcionario.id, funcionario.nome)}
                      disabled={!funcionario.ativo}
                      title="Desativar funcionário"
                      aria-label={`Desativar funcionário ${funcionario.nome}`}
                      className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#b20000a4] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {funcionariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  {busca ? 'Nenhum funcionário encontrado para essa pesquisa.' : 'Nenhum funcionário cadastrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ManagementPagination
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        totalItens={funcionariosFiltrados.length}
        nomeItens="funcionários"
        onChange={setPagina}
      />
    </div>
  )
}