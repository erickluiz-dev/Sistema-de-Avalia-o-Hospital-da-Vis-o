type DashboardLoadingOverlayProps = {
  carregando: boolean
  exportando: boolean
}

export default function DashboardLoadingOverlay({
  carregando,
  exportando,
}: DashboardLoadingOverlayProps) {
  if (!carregando && !exportando) return null

  const mensagem = exportando
    ? 'Exportando relatório...'
    : 'Carregando avaliações...'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="flex min-w-[220px] flex-col items-center justify-center rounded-2xl bg-white px-8 py-7 shadow-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />
        <p className="mt-4 text-sm font-medium text-gray-700">{mensagem}</p>
      </div>
    </div>
  )
}
