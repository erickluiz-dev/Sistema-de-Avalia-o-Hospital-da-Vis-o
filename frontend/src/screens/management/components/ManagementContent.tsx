import FuncionariosTab from '../tabs/FuncionariosTab'
import TerminaisTab from '../tabs/TerminaisTab'
import DepartamentosTab from '../tabs/DepartamentosTab'
import UsuariosTab from '../tabs/UsuariosTab'

import type {
  Aba,
  UsuarioGerenciamento,
  Funcionario,
  Departamento,
  Terminal,
} from '../types'

type ManagementContentProps = {
  aba: Aba

  usuarios: UsuarioGerenciamento[]
  funcionarios: Funcionario[]
  departamentos: Departamento[]
  terminais: Terminal[]

  departamentosPendentes: Record<number, number | ''>
  setDepartamentosPendentes: React.Dispatch<
    React.SetStateAction<Record<number, number | ''>>
  >

  terminaisPendentes: Record<number, number | ''>
  setTerminaisPendentes: React.Dispatch<
    React.SetStateAction<Record<number, number | ''>>
  >

  aplicandoFuncionario: number | null

  aplicarTerminal: (funcionario: Funcionario) => Promise<void>

  getTerminaisDoDepartamento: (
    departamentoId: number | '',
  ) => Terminal[]

  onNovoFuncionario: () => void
  onNovoTerminal: () => void
  onNovoDepartamento: () => void
  onNovoUsuario: () => void
}

export default function ManagementContent({
  aba,
  usuarios,
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
  onNovoTerminal,
  onNovoDepartamento,
  onNovoUsuario,
}: ManagementContentProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      {aba === 'funcionarios' && (
        <FuncionariosTab
          funcionarios={funcionarios}
          departamentos={departamentos}
          terminais={terminais}
          departamentosPendentes={departamentosPendentes}
          setDepartamentosPendentes={setDepartamentosPendentes}
          terminaisPendentes={terminaisPendentes}
          setTerminaisPendentes={setTerminaisPendentes}
          aplicandoFuncionario={aplicandoFuncionario}
          aplicarTerminal={aplicarTerminal}
          getTerminaisDoDepartamento={getTerminaisDoDepartamento}
          onNovoFuncionario={onNovoFuncionario}
        />
      )}

      {aba === 'terminais' && (
        <TerminaisTab
          terminais={terminais}
          onNovoTerminal={onNovoTerminal}
        />
      )}

      {aba === 'departamentos' && (
        <DepartamentosTab
          departamentos={departamentos}
          onNovoDepartamento={onNovoDepartamento}
        />
      )}

      {aba === 'usuarios' && (
        <UsuariosTab
          usuarios={usuarios}
          onNovoUsuario={onNovoUsuario}
        />
      )}

    </div>
  )
}