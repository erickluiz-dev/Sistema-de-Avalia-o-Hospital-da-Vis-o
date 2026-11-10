import CadastroModal from './management/components/CadastroModal'
import ManagementTabs from './management/components/ManagementTabs'
import ManagementHeader from './management/components/ManagementHeader'
import ManagementContent from './management/components/ManagementContent'

import { useManagementScreen } from './management/hooks/useManagementScreen'

import { useEffect } from 'react'

import NavBar from '../components/NavBar'

import type { Usuario } from '../types'

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
    aba,
    setAba,
    carregando,
    contentProps,
    modalProps,
  } = useManagementScreen()

  useEffect(() => {
    const html = document.documentElement
    const valorAnterior = html.style.scrollbarGutter

    html.style.scrollbarGutter = 'stable'

    return () => {
      html.style.scrollbarGutter = valorAnterior
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <NavBar
        onLogout={onLogout}
        subtitle="Gerenciamento"
        usuario={usuario}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:p-6">
        <ManagementHeader onBack={onBack} />

        <section className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <ManagementTabs
            aba={aba}
            setAba={setAba}
          />

          {carregando ? (
            <div className="flex min-h-48 items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />
            </div>
          ) : (
            <ManagementContent
              {...contentProps}
            />
          )}
        </section>
      </main>

      <CadastroModal
        {...modalProps}
      />

    </div>
  )
}