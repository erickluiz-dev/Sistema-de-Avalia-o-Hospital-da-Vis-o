import { useManagementTabs } from './useManagementTabs'
import { useManagementData } from './useManagementData'
import { useCadastroManagement } from './useCadastroManagement'

export function useManagementScreen() {
  /*
   * ============================================================
   * ABAS
   * ============================================================
   */

  const {
    aba,
    setAba,
  } = useManagementTabs()

  /*
   * ============================================================
   * DADOS DO GERENCIAMENTO
   * ============================================================
   */

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

  /*
   * ============================================================
   * CADASTRO
   * ============================================================
   */

  const {
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
  } = useCadastroManagement({
    aba,
    departamentos,
    getTerminaisDoDepartamento,
    carregarDados,
  })

  /*
   * ============================================================
   * PROPS DO CONTEÚDO
   * ============================================================
   *
   * Centralizamos aqui tudo que o ManagementContent precisa.
   */

  const contentProps = {
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

    onNovoFuncionario: abrirModal,
    onNovoTerminal: abrirModal,
    onNovoDepartamento: abrirModal,
    onNovoUsuario: abrirModal,
  }

  /*
   * ============================================================
   * PROPS DO MODAL
   * ============================================================
   */

  const modalProps = {
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
  }

  /*
   * ============================================================
   * RETORNO
   * ============================================================
   */

  return {
    aba,
    setAba,

    carregando,

    contentProps,
    modalProps,
  }
}