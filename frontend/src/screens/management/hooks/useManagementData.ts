import { useCallback, useEffect, useState } from 'react'

import { apiFetch } from '../../../services/api'

import type {
  UsuarioGerenciamento,
  Funcionario,
  Departamento,
  Terminal,
} from '../types'

export function useManagementData() {
  const [usuarios, setUsuarios] = useState<UsuarioGerenciamento[]>([])

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

  const [departamentos, setDepartamentos] =
    useState<Departamento[]>([])

  const [terminais, setTerminais] =
    useState<Terminal[]>([])

  const [carregando, setCarregando] = useState(true)

  const [departamentosPendentes, setDepartamentosPendentes] =
    useState<Record<number, number | ''>>({})

  const [terminaisPendentes, setTerminaisPendentes] =
    useState<Record<number, number | ''>>({})

  const [aplicandoFuncionario, setAplicandoFuncionario] =
    useState<number | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)

      const [
        usuariosResponse,
        funcionariosResponse,
        departamentosResponse,
        terminaisResponse,
      ] = await Promise.all([
        apiFetch('/admin/usuarios'),
        apiFetch('/admin/funcionarios'),
        apiFetch('/admin/departamentos'),
        apiFetch('/admin/terminais'),
      ])

      if (!usuariosResponse.ok) {
        throw new Error('Erro ao carregar usuários')
      }

      if (!funcionariosResponse.ok) {
        throw new Error('Erro ao carregar funcionários')
      }

      if (!departamentosResponse.ok) {
        throw new Error('Erro ao carregar departamentos')
      }

      if (!terminaisResponse.ok) {
        throw new Error('Erro ao carregar terminais')
      }

      const [
        usuariosData,
        funcionariosData,
        departamentosData,
        terminaisData,
      ] = await Promise.all([
        usuariosResponse.json(),
        funcionariosResponse.json(),
        departamentosResponse.json(),
        terminaisResponse.json(),
      ])

      setUsuarios(usuariosData)
      setFuncionarios(funcionariosData)

      const departamentosIniciais: Record<number, number | ''> = {}
      const terminaisIniciais: Record<number, number | ''> = {}

      funcionariosData.forEach(
        (funcionario: Funcionario) => {
          departamentosIniciais[funcionario.id] =
            funcionario.departamento_id ?? ''

          terminaisIniciais[funcionario.id] =
            funcionario.terminal_id ?? ''
        },
      )

      setDepartamentosPendentes(departamentosIniciais)
      setTerminaisPendentes(terminaisIniciais)

      setDepartamentos(departamentosData)
      setTerminais(terminaisData)
    } catch (error) {
      console.error(
        'Erro ao carregar dados administrativos:',
        error,
      )
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const getTerminaisDoDepartamento = (
    departamentoId: number | '',
  ): Terminal[] => {
    if (departamentoId === '') {
      return []
    }

    return terminais.filter(
      (terminal) =>
        terminal.departamento_id === Number(departamentoId),
    )
  }

  const aplicarTerminal = async (
    funcionario: Funcionario,
  ) => {
    const terminalSelecionado =
      terminaisPendentes[funcionario.id]

    if (
      terminalSelecionado === undefined ||
      terminalSelecionado === ''
    ) {
      alert(
        'Selecione um terminal antes de aplicar.',
      )

      return
    }

    try {
      setAplicandoFuncionario(funcionario.id)

      const response = await apiFetch(
        `/admin/funcionarios/${funcionario.id}/terminal`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            terminal_id: Number(terminalSelecionado),
          }),
        },
      )

      const mensagem = await response.text()

      if (!response.ok) {
        alert(
          mensagem ||
            'Não foi possível aplicar o terminal.',
        )

        return
      }

      await carregarDados()

      alert(
        'Terminal atualizado com sucesso.',
      )
    } catch (error) {
      console.error(
        'Erro ao aplicar terminal:',
        error,
      )

      alert(
        'Não foi possível atualizar o terminal.',
      )
    } finally {
      setAplicandoFuncionario(null)
    }
  }

  return {
    usuarios,
    funcionarios,
    departamentos,
    terminais,

    carregando,

    departamentosPendentes,
    setDepartamentosPendentes,

    terminaisPendentes,
    setTerminaisPendentes,

    aplicandoFuncionario,

    carregarDados,
    aplicarTerminal,
    getTerminaisDoDepartamento,
  }
}