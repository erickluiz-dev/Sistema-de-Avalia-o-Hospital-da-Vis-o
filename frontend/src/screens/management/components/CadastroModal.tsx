import type { Dispatch, SetStateAction } from 'react'

import type {
  Departamento,
  Terminal,
} from '../../../types'

type Aba =
  | 'usuarios'
  | 'funcionarios'
  | 'departamentos'
  | 'terminais'

type CadastroModalProps = {
  aba: Aba

  mostrarModal: boolean
  salvando: boolean

  nome: string
  setNome: Dispatch<SetStateAction<string>>

  login: string
  setLogin: Dispatch<SetStateAction<string>>

  senha: string
  setSenha: Dispatch<SetStateAction<string>>

  administrador: boolean
  setAdministrador: Dispatch<SetStateAction<boolean>>

  departamentoFormulario: string
  setDepartamentoFormulario: Dispatch<SetStateAction<string>>

  terminalFormulario: string
  setTerminalFormulario: Dispatch<SetStateAction<string>>

  departamentos: Departamento[]
  terminaisDoDepartamentoFormulario: Terminal[]

  fecharModal: () => void
  salvarCadastro: () => void
}

export default function CadastroModal({
  aba,
  mostrarModal,
  salvando,

  nome,
  setNome,

  login,
  setLogin,

  senha,
  setSenha,

  administrador,
  setAdministrador,

  departamentoFormulario,
  setDepartamentoFormulario,

  terminalFormulario,
  setTerminalFormulario,

  departamentos,
  terminaisDoDepartamentoFormulario,

  fecharModal,
  salvarCadastro,
}: CadastroModalProps) {
  if (!mostrarModal) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-6">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6"
        style={{
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {aba === 'usuarios' && 'Novo Usuário'}

              {aba === 'funcionarios' &&
                'Novo Funcionário'}

              {aba === 'departamentos' &&
                'Novo Departamento'}

              {aba === 'terminais' &&
                'Novo Terminal'}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Preencha os dados abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={salvando}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* ================================================== */}
        {/* USUÁRIO */}
        {/* ================================================== */}

        {aba === 'usuarios' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Nome
              </label>

              <input
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                placeholder="Nome do usuário"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Login
              </label>

              <input
                value={login}
                onChange={(e) =>
                  setLogin(e.target.value)
                }
                placeholder="Login"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                placeholder="Senha"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="administrador"
                type="checkbox"
                checked={administrador}
                onChange={(e) =>
                  setAdministrador(
                    e.target.checked,
                  )
                }
                className="w-4 h-4 accent-[#00B5CC] cursor-pointer"
              />

              <label
                htmlFor="administrador"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Usuário administrador
              </label>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* FUNCIONÁRIO */}
        {/* ================================================== */}

        {aba === 'funcionarios' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Nome
              </label>

              <input
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                placeholder="Nome do funcionário"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Departamento
              </label>

              <select
                value={departamentoFormulario}
                onChange={(e) => {
                  setDepartamentoFormulario(
                    e.target.value,
                  )

                  setTerminalFormulario('')
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Terminal
              </label>

              <select
                value={terminalFormulario}
                onChange={(e) =>
                  setTerminalFormulario(
                    e.target.value,
                  )
                }
                disabled={
                  departamentoFormulario === ''
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {departamentoFormulario === ''
                    ? 'Selecione primeiro um departamento'
                    : terminaisDoDepartamentoFormulario.length ===
                        0
                    ? 'Nenhum terminal disponível'
                    : 'Selecione um terminal'}
                </option>

                {terminaisDoDepartamentoFormulario.map(
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
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* DEPARTAMENTO */}
        {/* ================================================== */}

        {aba === 'departamentos' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Nome
            </label>

            <input
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Nome do departamento"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
            />
          </div>
        )}

        {/* ================================================== */}
        {/* TERMINAL */}
        {/* ================================================== */}

        {aba === 'terminais' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Terminal
              </label>

              <input
                value={terminalFormulario}
                onChange={(e) =>
                  setTerminalFormulario(
                    e.target.value,
                  )
                }
                placeholder="Ex.: pc 10"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Departamento
              </label>

              <select
                value={departamentoFormulario}
                onChange={(e) =>
                  setDepartamentoFormulario(
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
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
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* BOTÕES */}
        {/* ================================================== */}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={fecharModal}
            disabled={salvando}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={salvarCadastro}
            disabled={salvando}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 2px 8px #00b4cc59' }}
          >
            {salvando
              ? 'Salvando...'
              : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}