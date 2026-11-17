
import { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'

import SidebarLayout from './management/components/Sidebar'
import PermissoesTab from './management/tabs/PermissoesTab'

import type {
  ModoAtendimento,
  Screen,
  Usuario,
} from '../types'

type PermissionsScreenProps = {
  usuario: Usuario | null
  onLogout: () => void
  onNavigate: (screen: Screen) => void
  onStartSurvey: (modo: ModoAtendimento) => void
}

export default function PermissionsScreen({
  usuario,
  onLogout,
  onNavigate,
  onStartSurvey,
}: PermissionsScreenProps) {
  // Apenas administradores podem acessar o módulo.
  useEffect(() => {
    if (!usuario?.administrador) {
      onNavigate('home')
    }
  }, [usuario, onNavigate])

  if (!usuario?.administrador) {
    return null
  }

  return (
    <SidebarLayout
      usuario={usuario}
      subtitle="Permissões"
      activeScreen="permissions"
      onNavigate={onNavigate}
      onStartSurvey={onStartSurvey}
      onLogout={onLogout}
    >
      <div className="min-h-full bg-gray-50">
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6">

          {/* Cabeçalho */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#028799]">
                <ShieldCheck size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Permissões
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Gerencie funções e acessos dos usuários do sistema.
                </p>
              </div>
            </div>
          </header>

          {/* Conteúdo */}
          <section className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <PermissoesTab />
          </section>

        </main>
      </div>
    </SidebarLayout>
  )
}
