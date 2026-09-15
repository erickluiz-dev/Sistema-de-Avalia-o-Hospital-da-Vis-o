import { useState } from 'react'

import { apiFetch } from '../../../services/api'

import type {
  Departamento,
  Terminal,
} from '../../../types'

import type { Aba } from '../types'

type UseCadastroManagementProps = {
  aba: Aba
  departamentos: Departamento[]
  getTerminaisDoDepartamento: (
    departamentoId: number,
  ) => Terminal[]
  carregarDados: () => Promise<void>
}

export function useCadastroManagement({
  aba,
  departamentos,
  getTerminaisDoDepartamento,
  carregarDados,
}: UseCadastroManagementProps) {

  const [mostrarModal, setMostrarModal] =
    useState(false)

  const [nome, setNome] =
    useState('')

  const [login, setLogin] =
    useState('')

  const [senha, setSenha] =
    useState('')

  const [administrador, setAdministrador] =
    useState(false)

  const [departamentoFormulario, setDepartamentoFormulario] =
    useState('')

  const [terminalFormulario, setTerminalFormulario] =
    useState('')

  const [salvando, setSalvando] =
    useState(false)

  const abrirModal = () => {
    setNome('')
    setLogin('')
    setSenha('')
    setAdministrador(false)
    setDepartamentoFormulario('')
    setTerminalFormulario('')
    setMostrarModal(true)
  }

  const fecharModal = () => {
    if (salvando) {
      return
    }

    setMostrarModal(false)
  }

  const salvarCadastro = async () => {
    try {
      setSalvando(true)

      let endpoint = ''
      let body: Record<string, unknown> = {}

      switch (aba) {
        case 'usuarios':

          if (
            !nome.trim() ||
            !login.trim() ||
            !senha
          ) {
            alert(
              'Preencha nome, login e senha.',
            )

            return
          }

          endpoint = '/admin/usuarios'

          body = {
            nome: nome.trim(),
            login: login.trim(),
            senha,
            administrador,
          }

          break

        case 'funcionarios':

          if (!nome.trim()) {
            alert(
              'Informe o nome do funcionário.',
            )

            return
          }

          if (!departamentoFormulario) {
            alert(
              'Selecione um departamento.',
            )

            return
          }

          if (!terminalFormulario) {
            alert(
              'Selecione um terminal.',
            )

            return
          }

          endpoint = '/admin/funcionarios'

          body = {
            nome: nome.trim(),
            terminal_id:
              Number(terminalFormulario),
          }

          break

        case 'departamentos':

          if (!nome.trim()) {
            alert(
              'Informe o nome do departamento.',
            )

            return
          }

          endpoint = '/admin/departamentos'

          body = {
            nome: nome.trim(),
          }

          break

        case 'terminais':

          if (
            !terminalFormulario.trim() ||
            !departamentoFormulario
          ) {
            alert(
              'Informe o terminal e o departamento.',
            )

            return
          }

          endpoint = '/admin/terminais'

          body = {
            terminal:
              terminalFormulario.trim(),

            departamento_id:
              Number(departamentoFormulario),
          }

          break
      }

      const response = await apiFetch(
        endpoint,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(body),
        },
      )

      if (!response.ok) {
        const mensagem =
          await response.text()

        console.error(
          'Erro ao cadastrar:',
          mensagem,
        )

        alert(
          mensagem ||
            'Não foi possível realizar o cadastro.',
        )

        return
      }

      setMostrarModal(false)

      setNome('')
      setLogin('')
      setSenha('')
      setAdministrador(false)
      setDepartamentoFormulario('')
      setTerminalFormulario('')

      await carregarDados()

    } catch (error) {

      console.error(
        'Erro ao realizar cadastro:',
        error,
      )

      alert(
        'Não foi possível realizar o cadastro.',
      )

    } finally {

      setSalvando(false)

    }
  }

  const terminaisDoDepartamentoFormulario: Terminal[] =
    departamentoFormulario === ''
      ? []
      : getTerminaisDoDepartamento(
          Number(departamentoFormulario),
        )

  return {
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

    terminaisDoDepartamentoFormulario,

    abrirModal,
    fecharModal,
    salvarCadastro,
  }
}