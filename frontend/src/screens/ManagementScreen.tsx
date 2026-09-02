    import { useEffect, useState } from 'react'

    import NavBar from '../components/NavBar'

    import { apiFetch } from '../services/api'

    import type { Usuario } from '../types'

    type UsuarioGerenciamento = {
    id: number
    nome: string
    login: string
    administrador: boolean
    }

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
    const [aba, setAba] = useState<
        'usuarios' | 'funcionarios' | 'departamentos' | 'terminais'
    >('funcionarios')

    const [usuarios, setUsuarios] = useState<
        UsuarioGerenciamento[]
    >([])

    const [funcionarios, setFuncionarios] = useState<
        Funcionario[]
    >([])

    const [departamentos, setDepartamentos] = useState<
        Departamento[]
    >([])

    const [terminais, setTerminais] = useState<
        Terminal[]
    >([])

    const [carregando, setCarregando] = useState(true)

    const [departamentosPendentes, setDepartamentosPendentes] =
        useState<Record<number, number | ''>>({})

    const [terminaisPendentes, setTerminaisPendentes] =
        useState<Record<number, number | ''>>({})

    const [aplicandoFuncionario, setAplicandoFuncionario] =
       useState<number | null>(null)

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
            terminal_id: Number(
                terminalSelecionado,
            ),
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
                alert(
                    'Informe o terminal e o departamento.',
                )
                return
                }

                endpoint = '/admin/terminais'

                body = {
                terminal: terminalFormulario.trim(),
                departamento_id:
                    Number(departamentoFormulario),
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

    const carregarDados = async () => {
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
            throw new Error(
            'Erro ao carregar funcionários',
            )
        }

        if (!departamentosResponse.ok) {
            throw new Error(
            'Erro ao carregar departamentos',
            )
        }

        if (!terminaisResponse.ok) {
            throw new Error(
            'Erro ao carregar terminais',
            )
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

           funcionariosData.forEach((funcionario: Funcionario) => {
            departamentosIniciais[funcionario.id] =
                funcionario.departamento_id ?? ''

            terminaisIniciais[funcionario.id] =
                funcionario.terminal_id ?? ''
            })

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
    }

    useEffect(() => {
        carregarDados()
    }, [])

    const getTerminaisDoDepartamento = (
    departamentoId: number | '',
    ) => {
    if (departamentoId === '') {
        return []
    }

    return terminais.filter(
        (terminal) =>
        terminal.departamento_id === Number(departamentoId),
    )
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
                subtitle="Gerênciamento"
                usuario={usuario}
            />

        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
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
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 8-1.41L7.83 13H20v-2z" />
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

            {carregando ? (
            <div className="bg-white rounded-2xl p-10 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />
            </div>
            ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {aba === 'funcionarios' && (
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
                            onClick={abrirModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                            style={{
                            background: '#00B5CC',
                            }}
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
                                            valor === '' ? '' : Number(valor)

                                        setDepartamentosPendentes(
                                            (anterior) => ({
                                            ...anterior,
                                            [funcionario.id]: departamentoId,
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
                                    terminaisPendentes[funcionario.id] ?? ''
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

                                    {terminaisDisponiveis.map((terminal) => (
                                    <option
                                        key={terminal.id}
                                        value={terminal.id}
                                    >
                                        {terminal.terminal}
                                    </option>
                                    ))}
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
                                        onClick={() => aplicarTerminal(funcionario)}
                                        disabled={
                                        aplicandoFuncionario === funcionario.id ||
                                        terminaisPendentes[funcionario.id] === ''
                                        }
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                        background: '#00B5CC',
                                        }}
                                    >
                                        {aplicandoFuncionario === funcionario.id
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
                    )}

                {aba === 'terminais' && (
                <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                            Terminais
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                            {terminais.length} terminal(is)
                            cadastrado(s).
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{
                            background: '#00B5CC',
                            }}
                        >
                            <span className="text-lg leading-none">+</span>
                            Terminal
                        </button>
                        </div>

                    <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                            <th className="px-4 py-3 text-left">
                            Terminal
                            </th>
                            <th className="px-4 py-3 text-left">
                            Departamento
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {terminais.map(
                            (terminal) => (
                            <tr
                                key={terminal.id}
                                className="border-t border-gray-50"
                            >
                                <td className="px-4 py-4 text-gray-700">
                                {terminal.terminal}
                                </td>

                                <td className="px-4 py-4 text-gray-600">
                                {terminal.departamento}
                                </td>
                            </tr>
                            ),
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}

                {aba === 'departamentos' && (
                <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                            Departamentos
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                            Gerencie os departamentos do sistema.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{
                            background: '#00B5CC',
                            }}
                        >
                            <span className="text-lg leading-none">+</span>
                            Departamento
                        </button>
                        </div>

                    <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                            <th className="px-4 py-3 text-left">
                            ID
                            </th>
                            <th className="px-4 py-3 text-left">
                            Nome
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {departamentos.map(
                            (departamento) => (
                            <tr
                                key={departamento.id}
                                className="border-t border-gray-50"
                            >
                                <td className="px-4 py-4 text-gray-500">
                                {departamento.id}
                                </td>

                                <td className="px-4 py-4 text-gray-700">
                                {departamento.nome}
                                </td>
                            </tr>
                            ),
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}

                {aba === 'usuarios' && (
                <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                            Usuários
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                            Gerencie os usuários que possuem acesso ao sistema.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{
                            background: '#00B5CC',
                            }}
                        >
                            <span className="text-lg leading-none">+</span>
                            Usuário
                        </button>
                        </div>

                    <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                            <th className="px-4 py-3 text-left">NOME</th>
                            <th className="px-4 py-3 text-left">LOGIN</th>
                            <th className="px-4 py-3 text-center">ADMINISTRADOR</th>
                        </tr>
                        </thead>

                        <tbody>
                        {usuarios.map(
                            (usuarioItem) => (
                            <tr
                                key={usuarioItem.id}
                                className="border-t border-gray-50"
                            >
                                <td className="px-4 py-4 text-gray-700">
                                {usuarioItem.nome}
                                </td>

                                <td className="px-4 py-4 text-gray-600">
                                {usuarioItem.login}
                                </td>

                                <td className="px-4 py-4 text-center">
                                    {usuarioItem.administrador ? (
                                    <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                        Sim
                                    </span>
                                    ) : (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                        Não
                                    </span>
                                    )}
                                </td>
                            </tr>
                            ),
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}
            </div>
            )}
        </main>

        {mostrarModal && (
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
                    {aba === 'terminais' && 'Novo Terminal'}
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

            {/* USUÁRIO */}
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
                    onChange={(e) => setAdministrador(e.target.checked)}
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

            {/* FUNCIONÁRIO */}
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

                        // Um terminal do departamento anterior
                        // não pode permanecer selecionado.
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

            {/* DEPARTAMENTO */}
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

            {/* TERMINAL */}
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
                style={{
                    background: '#00B5CC',
                }}
                >
                {salvando
                    ? 'Salvando...'
                    : 'Salvar'}
                </button>
            </div>
            </div>
        </div>
        )}

        </div>
    )
    }   