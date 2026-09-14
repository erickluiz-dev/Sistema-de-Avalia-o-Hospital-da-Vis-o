export type Aba =
  | 'usuarios'
  | 'funcionarios'
  | 'departamentos'
  | 'terminais'

export type UsuarioGerenciamento = {
  id: number
  nome: string
  login: string
  administrador: boolean
}

export type Funcionario = {
  id: number
  nome: string
  terminal_id: number | null
  terminal: string
  departamento_id: number | null
  departamento: string
  ativo: boolean
}

export type Departamento = {
  id: number
  nome: string
}

export type Terminal = {
  id: number
  terminal: string
  departamento_id: number
  departamento: string
}