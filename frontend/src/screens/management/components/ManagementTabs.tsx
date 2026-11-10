import type { Aba } from '../types'

type ManagementTabsProps = {
  aba: Aba
  setAba: (aba: Aba) => void
}

const abas: { id: Aba; label: string }[] = [
  { id: 'funcionarios', label: 'Funcionários' },
  { id: 'terminais', label: 'Terminais' },
  { id: 'departamentos', label: 'Departamentos' },
  { id: 'usuarios', label: 'Usuários' },
]

export default function ManagementTabs({
  aba,
  setAba,
}: ManagementTabsProps) {
  return (
    <nav
      aria-label="Seções de gerenciamento"
      className="w-full overflow-x-auto overflow-y-hidden border-b border-gray-200 overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max items-stretch gap-1 px-3 sm:px-5">
        {abas.map((item) => {
          const selecionada = aba === item.id

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selecionada}
              onClick={() => setAba(item.id)}
              className={`relative -mb-px min-h-12 whitespace-nowrap border-b-[3px] px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00B5CC] sm:px-5 ${
                selecionada
                  ? 'border-[#028799] text-[#028799]'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
