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
  onExcluir: (tipo: 'funcionarios' | 'terminais' | 'departamentos' | 'usuarios', id: number, nome: string) => void
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
  onExcluir,
}: ManagementContentProps) {
  return (
    <div className="box-border flex h-auto min-h-[420px] min-w-0 flex-col p-4 sm:min-h-[452px] sm:p-6">

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
          onExcluir={(id, nome) => onExcluir('funcionarios', id, nome)}
        />
      )}

      {aba === 'terminais' && (
        <TerminaisTab
          terminais={terminais}
          onNovoTerminal={onNovoTerminal}
          onExcluir={(id, nome) => onExcluir('terminais', id, nome)}
        />
      )}

      {aba === 'departamentos' && (
        <DepartamentosTab
          departamentos={departamentos}
          onNovoDepartamento={onNovoDepartamento}
          onExcluir={(id, nome) => onExcluir('departamentos', id, nome)}
        />
      )}

      {aba === 'usuarios' && (
        <UsuariosTab
          usuarios={usuarios}
          onNovoUsuario={onNovoUsuario}
          onExcluir={(id, nome) => onExcluir('usuarios', id, nome)}
        />
      )}

    </div>
  )
}
