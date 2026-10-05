import { useState } from 'react'
import { ratingColor, ratingLabel } from '../../../utils/ratings'
import type { Avaliacao } from '../../../types'

type Props = {
  avaliacoes: Avaliacao[]
  search: string
  setSearch: (value: string) => void
  dataInicio: string
  setDataInicio: (value: string) => void
  dataFim: string
  setDataFim: (value: string) => void
  pagina: number
  totalPaginas: number
  totalAvaliacoes: number
  carregando: boolean
  carregarAvaliacoes: (paginaAtual?: number) => Promise<void>
  setPagina: (pagina: number) => void
}

export default function AvaliacoesRecentesTable({
  avaliacoes,
  search,
  setSearch,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  pagina,
  totalPaginas,
  totalAvaliacoes,
  carregando,
  carregarAvaliacoes,
  setPagina,
}: Props) {
  // NOVO: avaliação selecionada para abrir a tela de detalhes
  const [selectedEval, setSelectedEval] = useState<Avaliacao | null>(null)

  const recentEvals = avaliacoes.map((avaliacao) => ({
    ...avaliacao,
    date: new Date(avaliacao.data).toLocaleString('pt-BR'),
    rating: ratingLabel(avaliacao.avaliacao),
    departamento: avaliacao.departamento,
    terminal: avaliacao.terminal,
    funcionario: avaliacao.funcionario,
  }))

  return (
    <>
      <div
        className="bg-white rounded-2xl"
        style={{
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '1px solid #f3f4f6',
          overflow: 'hidden',
        }}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Avaliações Recentes
              </h3>

              <p className="text-xs text-gray-400 mt-0.5">
                Últimos Envios
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />

              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />

              <button
                onClick={() => {
                  setPagina(1)
                  void carregarAvaliacoes(1)
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{
                  background:
                    'linear-gradient(135deg,#04c7e0,#0697aa)',
                  boxShadow: '0 2px 8px #00b4cc59',
                }}
              >
                Filtrar
              </button>

              <button
                onClick={() => {
                  setDataInicio('')
                  setDataFim('')
                  setPagina(1)

                  setTimeout(() => {
                    void carregarAvaliacoes(1)
                  }, 0)
                }}
                className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200"
              >
                Limpar
              </button>

              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC] w-52"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Data</th>

                <th className="px-5 py-3 text-left">Avaliação</th>

                <th className="px-5 py-3 text-left">Funcionário</th>

                <th className="px-5 py-3 text-left">Departamento</th>

                <th className="px-5 py-3 text-left">Terminal</th>
              </tr>
            </thead>

            <tbody>
              {recentEvals.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedEval(row)}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                    {row.date}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className="font-semibold"
                      style={{
                        color: ratingColor(row.rating),
                      }}
                    >
                      {row.rating}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {row.funcionario || '-'}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {row.departamento}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {row.terminal || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {totalAvaliacoes === 0
                ? 'Nenhuma avaliação encontrada'
                : `Página ${pagina} de ${totalPaginas} · ${totalAvaliacoes} avaliações`}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagina <= 1 || carregando}
                onClick={() =>
                  void carregarAvaliacoes(pagina - 1)
                }
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                Anterior
              </button>

              <button
                disabled={
                  pagina >= totalPaginas || carregando
                }
                onClick={() =>
                  void carregarAvaliacoes(pagina + 1)
                }
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          NOVO: TELA DE DETALHES DA AVALIAÇÃO
          ===================================================== */}

      {selectedEval && (() => {
        const color = ratingColor(
          ratingLabel(selectedEval.avaliacao),
        )

        const rating = ratingLabel(
          selectedEval.avaliacao,
        )

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setSelectedEval(null)}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-md flex flex-col"
              style={{
                boxShadow:
                  '0 32px 80px rgba(0,0,0,0.22)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 pt-7 pb-8 flex flex-col gap-6">

                {/* Título */}
                <div className="text-center">
                  <h2
                    className="text-2xl font-bold text-gray-900"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Detalhes da Avaliação
                  </h2>

                  <p className="text-gray-400 text-sm mt-1">
                    Registro de feedback do cliente
                  </p>
                </div>

                {/* Avaliação */}
                <div className="flex justify-center">
                  <div
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-white text-base"
                    style={{
                      background: color,
                      boxShadow: `0 4px 16px ${color}40`,
                    }}
                  >
                    {rating}
                  </div>
                </div>

                {/* Informações */}
                <div className="grid grid-cols-2 gap-3">

                  {/* Data */}
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-1 col-span-2"
                    style={{
                      background: '#f8fafc',
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-400 tracking-wide">
                      DATA E HORA
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {new Date(
                        selectedEval.data,
                      ).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Funcionário */}
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-1"
                    style={{
                      background: '#f8fafc',
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-400 tracking-wide">
                      FUNCIONÁRIO
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEval.funcionario || '-'}
                    </span>
                  </div>

                  {/* Departamento */}
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-1"
                    style={{
                      background: '#f8fafc',
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-400 tracking-wide">
                      DEPARTAMENTO
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEval.departamento || '-'}
                    </span>
                  </div>
                

                  {/* Terminal */}
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-1"
                    style={{
                      background: '#f8fafc',
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-400 tracking-wide">
                      TERMINAL
                    </span>

                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEval.terminal || '-'}
                    </span>
                  </div>
                </div>

                {/* Comentário */}
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{
                    background: '#f8fafc',
                  }}
                >
                  <span className="text-xs font-semibold text-gray-400 tracking-wide">
                    MOTIVO / COMENTÁRIO
                  </span>

                  {selectedEval.comentario?.trim() ? (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedEval.comentario.trim()}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Nenhum comentário registrado.
                    </p>
                  )}
                </div>

                {/* Fechar */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setSelectedEval(null)}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm cursor-pointer transition-all text-gray-500 hover:text-gray-700"
                    style={{
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    Voltar
                  </button>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}