import CadastroModal from './management/components/CadastroModal'
import ManagementTabs from './management/components/ManagementTabs'
import ManagementHeader from './management/components/ManagementHeader'
import ManagementContent from './management/components/ManagementContent'

import { useManagementScreen } from './management/hooks/useManagementScreen'

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <NavBar
        onLogout={onLogout}
        subtitle="Gerenciamento"
        usuario={usuario}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">

        <ManagementHeader onBack={onBack} />

        <ManagementTabs
          aba={aba}
          setAba={setAba}
        />

        {carregando ? (
          <div className="bg-white rounded-2xl p-10 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />
          </div>
        ) : (
          <ManagementContent
            {...contentProps}
          />
        )}

      </main>

      <CadastroModal
        {...modalProps}
      />

    </div>
  )
}