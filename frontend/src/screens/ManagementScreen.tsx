import { useState } from 'react'

import { useManagementData } from './management/hooks/useManagementData'

import FuncionariosTab from './management/tabs/FuncionariosTab'
import TerminaisTab from './management/tabs/TerminaisTab'
import DepartamentosTab from './management/tabs/DepartamentosTab'
import UsuariosTab from './management/tabs/UsuariosTab'
import CadastroModal from './management/components/CadastroModal'

import NavBar from '../components/NavBar'

import { apiFetch } from '../services/api'

import type { Usuario, Terminal } from '../types'


type ManagementScreenProps = {
  onBack: () => void
  onLogout: () => void
  usuario: Usuario | null
}


export default function ManagementScreen({
  onBack,
  onLogout,
  usuario,
}: ManagementScreenProps) {

  const {
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
  } = useManagementData()

  const [aba, setAba] = useState<
    'usuarios' | 'funcionarios' | 'departamentos' | 'terminais'
  >('funcionarios')


  const [mostrarModal, setMostrarModal] = useState(false)

  const [nome, setNome] = useState('')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [administrador, setAdministrador] = useState(false)

  const [departamentoFormulario, setDepartamentoFormulario] =
    useState('')

  const [terminalFormulario, setTerminalFormulario] =
    useState('')

  const [salvando, setSalvando] = useState(false)


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
          if (!nome.trim() || !login.trim() || !senha) {
            alert('Preencha nome, login e senha.')
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
            alert('Informe o nome do funcionário.')
            return
          }

          if (!departamentoFormulario) {
            alert('Selecione um departamento.')
            return
          }

          if (!terminalFormulario) {
            alert('Selecione um terminal.')
            return
          }

          endpoint = '/admin/funcionarios'

          body = {
            nome: nome.trim(),
            terminal_id: Number(terminalFormulario),
          }

          break


        case 'departamentos':
          if (!nome.trim()) {
            alert('Informe o nome do departamento.')
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
            alert('Informe o terminal e o departamento.')
            return
          }

          endpoint = '/admin/terminais'

          body = {
            terminal: terminalFormulario.trim(),
            departamento_id: Number(departamentoFormulario),
          }

          break
      }


      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })


      if (!response.ok) {
        const mensagem = await response.text()

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <NavBar
        onLogout={onLogout}
        subtitle="Gerenciamento"
        usuario={usuario}
      />


      <main className="flex-1 max-w-7xl w-full mx-auto p-6">

        {/* CABEÇALHO */}

        <div className="mb-6">

          <button
            type="button"
            onClick={onBack}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1 mb-1 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l8 8-8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>

            Voltar ao menu principal
          </button>


          <h1
            className="text-2xl font-bold text-gray-900"
            style={{
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Gerenciamento
          </h1>


          <p className="text-sm text-gray-500">
            Administração do sistema
          </p>

        </div>


        {/* ABAS */}

        <div className="flex flex-wrap gap-2 mb-6">

          <button
            onClick={() => setAba('funcionarios')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              aba === 'funcionarios'
                ? 'bg-[#00B5CC] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Funcionários
          </button>


          <button
            onClick={() => setAba('terminais')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              aba === 'terminais'
                ? 'bg-[#00B5CC] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Terminais
          </button>


          <button
            onClick={() => setAba('departamentos')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              aba === 'departamentos'
                ? 'bg-[#00B5CC] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Departamentos
          </button>


          <button
            onClick={() => setAba('usuarios')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              aba === 'usuarios'
                ? 'bg-[#00B5CC] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Usuários
          </button>

        </div>


        {/* CONTEÚDO */}

        {carregando ? (

          <div className="bg-white rounded-2xl p-10 flex items-center justify-center">

            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />

          </div>

        ) : (

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* FUNCIONÁRIOS */}

            {aba === 'funcionarios' && (
              <FuncionariosTab
                funcionarios={funcionarios}
                departamentos={departamentos}
                terminais={terminais}
                departamentosPendentes={departamentosPendentes}
                setDepartamentosPendentes={
                  setDepartamentosPendentes
                }
                terminaisPendentes={terminaisPendentes}
                setTerminaisPendentes={
                  setTerminaisPendentes
                }
                aplicandoFuncionario={
                  aplicandoFuncionario
                }
                aplicarTerminal={aplicarTerminal}
                getTerminaisDoDepartamento={
                  getTerminaisDoDepartamento
                }
                onNovoFuncionario={abrirModal}
              />
            )}


            {/* ================================================= */}
            {/* TERMINAIS */}
            {/* ================================================= */}

            {aba === 'terminais' && (
                <TerminaisTab
                    terminais={terminais}
                    onNovoTerminal={abrirModal}
                />

            )}

            {/* ================================================= */}
            {/* DEPARTAMENTOS */}
            {/* ================================================= */}

            {aba === 'departamentos' && (
            <DepartamentosTab
                departamentos={departamentos}
                onNovoDepartamento={abrirModal}
            />
            )}

            {/* ================================================= */}
            {/* USUÁRIOS */}
            {/* ================================================= */}

            {aba === 'usuarios' && (
                <UsuariosTab
                    usuarios={usuarios}
                    onNovoUsuario={abrirModal}
                />
            )}

          </div>
        )}

      </main>


      {/* ===================================================== */}
      {/* MODAL DE CADASTRO */}
      {/* ===================================================== */}

      <CadastroModal
        aba={aba}
        mostrarModal={mostrarModal}
        salvando={salvando}
        nome={nome}
        setNome={setNome}
        login={login}
        setLogin={setLogin}
        senha={senha}
        setSenha={setSenha}
        administrador={administrador}
        setAdministrador={setAdministrador}
        departamentoFormulario={departamentoFormulario}
        setDepartamentoFormulario={
            setDepartamentoFormulario
        }
        terminalFormulario={terminalFormulario}
        setTerminalFormulario={setTerminalFormulario}
        departamentos={departamentos}
        terminaisDoDepartamentoFormulario={
            terminaisDoDepartamentoFormulario
        }
        fecharModal={fecharModal}
        salvarCadastro={salvarCadastro}
        />

    </div>  
  )
}