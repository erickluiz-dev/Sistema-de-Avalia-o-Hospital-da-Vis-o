import Logo from './Logo'
import type { Usuario } from '../types'

interface NavBarProps {
  onLogout: () => void
  subtitle: string
  usuario: Usuario | null
}

function NavBar({
  onLogout,
  subtitle,
  usuario,
}: NavBarProps) {
  const iniciais = usuario?.nome
    ? usuario.nome
        .split(' ')
        .filter(Boolean)
        .map(nome => nome[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'US'

  return (
    <header
      className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between"
      style={{
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-4">
        <Logo size="sm" />

        <span className="text-gray-400 text-sm">|</span>

        <span className="text-gray-600 text-sm font-medium">
          {subtitle}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-[#00B5CC] text-xs font-semibold">
              {iniciais}
            </span>
          </div>

          <span className="text-gray-700 text-sm font-medium hidden sm:block">
            {usuario?.nome ?? 'Usuário'}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
              fill="currentColor"
            />
          </svg>

          Sair
        </button>
      </div>
    </header>
  )
}

export default NavBar