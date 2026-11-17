
import { useState, type ReactNode } from 'react'

import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Menu,
  Monitor,
  Tablet,
  SlidersHorizontal,
  UserCog,
  GraduationCap,
  LogOut,
} from 'lucide-react'

import NavBar from '../../../components/NavBar'
import type { ModoAtendimento, Screen, Usuario } from '../../../types'

type SidebarLayoutProps = {
  children: ReactNode
  usuario: Usuario | null
  subtitle: string
  activeScreen: Screen
  onNavigate: (screen: Screen) => void
  onStartSurvey: (modo: ModoAtendimento) => void
  onLogout: () => void
}

type SidebarItemProps = {
  label: string
  icon: ReactNode
  active?: boolean
  expanded: boolean
  onClick: () => void
  rightIcon?: ReactNode
}

const LOGO_SIDEBAR = '/icon.ico'

/* =========================================================
   ITEM PADRÃO DA SIDEBAR

   Todos os itens possuem exatamente o mesmo:
   - Tamanho
   - Alinhamento
   - Espaçamento
   - Cor
   - Animação
   - Comportamento de hover
========================================================= */

function SidebarItem({
  label,
  icon,
  active = false,
  expanded,
  onClick,
  rightIcon,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={!expanded ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`
        group relative flex h-11 min-h-11 w-full shrink-0
        items-center gap-3 rounded-xl
        px-3 py-2.5 text-sm font-medium
        transition-colors duration-200
        ${expanded ? 'justify-start' : 'justify-center'}
        ${
          active
            ? 'bg-white/15 text-white'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      {/* Ícone */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      {/* Texto */}
      <span
        className={`
          min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left
          transition-opacity duration-200
          ${
            expanded
              ? 'opacity-100'
              : 'hidden opacity-0'
          }
        `}
      >
        {label}
      </span>

      {/* Ícone auxiliar do Atendimento */}
      {expanded && rightIcon && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {rightIcon}
        </span>
      )}

      {/* Tooltip quando recolhida */}
      {!expanded && (
        <span
          className="
            pointer-events-none absolute left-full top-1/2 z-[60]
            ml-3 -translate-y-1/2 whitespace-nowrap
            rounded-lg bg-gray-900 px-3 py-2
            text-xs font-medium text-white
            opacity-0 shadow-lg transition-opacity duration-150
            group-hover:opacity-100
          "
        >
          {label}
        </span>
      )}
    </button>
  )
}

/* =========================================================
   LAYOUT PRINCIPAL
========================================================= */

export default function SidebarLayout({
  children,
  usuario,
  subtitle,
  activeScreen,
  onNavigate,
  onStartSurvey,
  onLogout,
}: SidebarLayoutProps) {
  const [hovered, setHovered] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [atendimentoOpen, setAtendimentoOpen] = useState(false)

  const expanded = hovered || manualOpen
  const isAdmin = usuario?.administrador ?? false

  const atendimentoAtivo = [
    'connection',
    'employee-validation',
    'patient-review',
    'survey',
  ].includes(activeScreen)

  const handleMouseLeave = () => {
    setHovered(false)

    if (!manualOpen) {
      setAtendimentoOpen(false)
    }
  }

  return (
    <div className="relative flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-gray-50">

      {/* =====================================================
          NAVBAR ORIGINAL
          Permanece com largura total.
          A sidebar fica sobreposta à extremidade esquerda.
      ====================================================== */}

      <header className="relative z-10 w-full shrink-0">
        <NavBar
          onLogout={onLogout}
          subtitle={subtitle}
          usuario={usuario}
        />
      </header>

      {/* =====================================================
          CONTEÚDO PRINCIPAL
          Não sofre deslocamento pela sidebar.
      ====================================================== */}

      <main className="relative z-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>

      {/* =====================================================
          SIDEBAR FIXA E SOBREPOSTA
      ====================================================== */}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-dvh flex-col
          border-r border-white/20
          bg-[#028799]
          shadow-[3px_0_18px_rgba(0,0,0,0.12)]
          transition-[width] duration-300 ease-in-out
          ${
            expanded
              ? 'w-[208px]'
              : 'w-[63px]'
          }
        `}
      >

        {/* =================================================
            IDENTIDADE VISUAL
            Alinhada à altura da NavBar.
        ================================================== */}

        <div
          className={`
            flex h-[66px] min-h-[66px] shrink-0
            items-center
            border-b border-white/40
            transition-all duration-300
            ${
              expanded
                ? 'gap-2.5 px-4'
                : 'justify-center px-2'
            }
          `}
        >
          <div className="flex h-9 w-7 shrink-0 items-center justify-center">
            <img
              src={LOGO_SIDEBAR}
              alt="Hospital da Visão"
              className="h-9 w-9 object-contain"
            />
          </div>

          {expanded && (
            <span
              className="
                whitespace-nowrap
                font-display text-lg font-bold
                tracking-tight text-gray-700
              "
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
              }}
            >
              Hospital da Visão
            </span>
          )}
        </div>

        {/* =================================================
            CONTROLE DE EXPANSÃO
        ================================================== */}

        <div
          className={`
            flex h-[56px] min-h-[56px] shrink-0
            items-center
            border-b border-white/40
            ${
              expanded
                ? 'justify-start px-4'
                : 'justify-center'
            }
          `}
        >
          <button
            type="button"
            onClick={() => setManualOpen((current) => !current)}
            aria-label={expanded ? 'Desafixar menu' : 'Fixar menu'}
            aria-expanded={expanded}
            className={`
              flex h-9 items-center justify-center gap-2
              rounded-lg px-2
              text-white/70
              transition-colors duration-200
              hover:bg-white/10 hover:text-white
              ${expanded ? 'w-auto' : 'w-9'}
            `}
          >
            <Menu size={20} className="shrink-0" />

            {expanded && (
              <span className="whitespace-nowrap text-sm font-medium">
                Fixar Menu
              </span>
            )}
          </button>
        </div>

        {/* =================================================
            NAVEGAÇÃO
        ================================================== */}

        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">

          {/* MENU PRINCIPAL */}
          <section className="mb-2">
            <div className="space-y-2">

              {/* DASHBOARD */}
              <SidebarItem
                label="Dashboard"
                icon={<LayoutDashboard size={20} />}
                expanded={expanded}
                active={activeScreen === 'home'}
                onClick={() => onNavigate('home')}
              />

              {/* ATENDIMENTO */}
              <SidebarItem
                label="Atendimento"
                icon={<Monitor size={20} />}
                expanded={expanded}
                active={atendimentoAtivo}
                onClick={() => {
                  if (!expanded) {
                    setManualOpen(true)
                    setAtendimentoOpen(true)
                    return
                  }

                  setAtendimentoOpen((current) => !current)
                }}
                rightIcon={
                  atendimentoOpen
                    ? <ChevronUp size={16} />
                    : <ChevronDown size={16} />
                }
              />

              {/* SUBMENU DE ATENDIMENTO */}
              {expanded && atendimentoOpen && (
                <div className="ml-5 mt-2 space-y-1 border-l border-white/30 pl-3">

                  <button
                    type="button"
                    onClick={() => onStartSurvey('funcionario')}
                    className="
                      flex w-full items-center gap-2
                      rounded-lg px-3 py-2.5
                      text-left text-xs font-medium
                      text-white/65 transition-colors duration-200
                      hover:bg-white/10 hover:text-white
                    "
                  >
                    <Monitor size={16} />
                    <span>Computador do Atendente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartSurvey('paciente')}
                    className="
                      flex w-full items-center gap-2
                      rounded-lg px-3 py-2.5
                      text-left text-xs font-medium
                      text-white/65 transition-colors duration-200
                      hover:bg-white/10 hover:text-white
                    "
                  >
                    <Tablet size={16} />
                    <span>Tablet do Paciente</span>
                  </button>

                </div>
              )}
            </div>
          </section>

          {/* =================================================
              ÁREA ADMINISTRATIVA
          ================================================== */}

          {isAdmin && (
            <section>
              <div className="space-y-2">

                {/* PAINEL ADMINISTRATIVO */}
                <SidebarItem
                  label="Painel Administrativo"
                  icon={<BarChart3 size={20} />}
                  expanded={expanded}
                  active={activeScreen === 'dashboard'}
                  onClick={() => onNavigate('dashboard')}
                />

                {/* GERENCIAMENTO */}
                <SidebarItem
                  label="Gerenciamento"
                  icon={<SlidersHorizontal size={20} />}
                  expanded={expanded}
                  active={activeScreen === 'management'}
                  onClick={() => onNavigate('management')}
                />

                {/* PERMISSÕES */}
                <SidebarItem
                  label="Permissões"
                  icon={<UserCog size={20} />}
                  expanded={expanded}
                  active={activeScreen === 'permissions'}
                  onClick={() => {
                    setAtendimentoOpen(false)
                    onNavigate('permissions')
                  }}
                />

                {/* ACADEMY */}
                <SidebarItem
                  label="Academy"
                  icon={<GraduationCap size={20} />}
                  expanded={expanded}
                  onClick={() => {}}
                />

              </div>
            </section>
          )}
        </nav>

        {/* =================================================
            RODAPÉ / SAIR
        ================================================== */}

        <div className="shrink-0 border-t border-white/40 p-3">
          <button
            type="button"
            onClick={onLogout}
            title={!expanded ? 'Sair' : undefined}
            className={`
              group relative flex h-11 min-h-11 w-full shrink-0
              items-center gap-3 rounded-xl
              px-3 py-2.5 text-sm font-medium
              text-white/65 transition-colors duration-200
              hover:bg-white/10 hover:text-white
              ${
                expanded
                  ? 'justify-start'
                  : 'justify-center'
              }
            `}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <LogOut size={19} />
            </span>

            {expanded && (
              <span className="whitespace-nowrap">
                Sair
              </span>
            )}

            {!expanded && (
              <span
                className="
                  pointer-events-none absolute left-full top-1/2 z-[60]
                  ml-3 -translate-y-1/2 whitespace-nowrap
                  rounded-lg bg-gray-900 px-3 py-2
                  text-xs font-medium text-white
                  opacity-0 shadow-lg transition-opacity duration-150
                  group-hover:opacity-100
                "
              >
                Sair
              </span>
            )}
          </button>
        </div>

      </aside>
    </div>
  )
}
