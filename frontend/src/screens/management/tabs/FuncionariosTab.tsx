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
}: FuncionariosTabProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Funcionários
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Gerencie funcionários e seus terminais.
          </p>
        </div>

        <button
          type="button"
          onClick={onNovoFuncionario}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
        >
          <span className="text-lg leading-none">+</span>
          Funcionário
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
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
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Ação
              </th>
            </tr>
          </thead>

          <tbody>
            {funcionarios.map((funcionario) => {
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
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
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
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC] disabled:bg-gray-50 disabled:text-gray-400"
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
                    <span
                      className={
                        funcionario.ativo
                          ? 'text-green-600'
                          : 'text-red-500'
                      }
                    >
                      {funcionario.ativo
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
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
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
                    >
                      {aplicandoFuncionario ===
                      funcionario.id
                        ? 'Aplicando...'
                        : 'Aplicar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}