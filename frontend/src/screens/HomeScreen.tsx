import type { Screen, Usuario } from '../types'

import NavBar from '../components/NavBar'

interface HomeScreenProps {
  onNav: (screen: Screen) => void
  onLogout: () => void
  usuario: Usuario | null
  onStartSurvey: () => void
}

export default function HomeScreen({
  onNav,
  onLogout,
  usuario,
  onStartSurvey,
}: HomeScreenProps) {
  const cards = [
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#029fb4"
            strokeWidth="1.5"
            fill="none"
            opacity=".4"
          />
          <path
            d="M8 14s1.5 2 4 2 4-2 4-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="9" cy="10" r="1.2" fill="#00B5CC" />
          <circle cx="15" cy="10" r="1.2" fill="#00B5CC" />
        </svg>
      ),
      title: 'Página de Avaliação',
      desc: 'Abra a pesquisa de satisfação do cliente.',
      btn: 'Começar Avaliação',
      color: '#00B5CC',
      screen: 'department' as Screen,
      gradient: '#00B5CC',
      shadow: '#00b4cc59',
      accent: '#E0F2FE',
    },

     ...(usuario?.administrador
    ? [
          {
          icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity=".6" />
              <rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor" opacity=".8" />
              <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
            </svg>
          ),
          title: 'Painel Administrativo',
          desc: 'Visualize estatísticas, relatórios e indicadores de satisfação.',
          btn: 'Acessar Painel',
          color: '#00B5CC',
          screen: 'dashboard' as Screen,
          gradient: '#00B5CC',
          shadow: '#00b4cc59',
          accent: '#EFF6FF',
        },
        {
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="9"
                cy="8"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />

              <path
                d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              <path
                d="M16 11c2.761 0 5 2.239 5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              <path
                d="M16 5.5a2.5 2.5 0 1 1 0 5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          ),
          title: 'Gerenciamento',
          desc: 'Gerencie usuários, funcionários, departamentos e terminais.',
          btn: 'Acessar Gerenciamento',
          color: '#00B5CC',
          screen: 'management' as Screen,
          gradient: '#00B5CC',
          shadow: '#00b4cc59',
          accent: '#E0F2FE',
        },
      ]
    : []),
]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar
        onLogout={onLogout}
        subtitle="Menu Inicial"
        usuario={usuario}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 w-full">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Bem-vindo, {usuario?.nome ?? 'Usuário'}
          </h1>

          <p className="text-gray-500 mt-2 text-sm">
            O que você gostaria de fazer hoje?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 w-full">
          {cards.map((card) => (
            <div
              key={card.title}
              className="w-full sm:w-[360px] bg-white rounded-3xl p-8 flex flex-col gap-5 cursor-pointer group transition-all duration-200"
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                border: '1px solid #f3f4f6',
              }}
              onClick={() => {
                if (card.screen === 'department') {
                  onStartSurvey()
                  return
                }

                onNav(card.screen)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow =
                  `0 16px 40px ${card.shadow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow =
                  '0 4px 24px rgba(0,0,0,0.07)'
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: card.accent,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>

              <div>
                <h2
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {card.title}
                </h2>

                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()

                  if (card.screen === 'department') {
                    onStartSurvey()
                    return
                  }

                  onNav(card.screen)
                }}
                                className="mt-auto w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
                style={{
                  background: card.gradient,
                  boxShadow: `0 4px 16px ${card.shadow}`,
                }}
              >
                {card.btn}
              </button>
            </div>
          ))}
        </div>

        

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-[#00B5CC] animate-pulse" />

          Sistema operacional · Avaliações Hospital da Visão, 2026
        </div>
      </main>
    </div>
  )
}