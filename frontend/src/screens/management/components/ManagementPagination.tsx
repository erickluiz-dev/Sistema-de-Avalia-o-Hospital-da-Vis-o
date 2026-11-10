type ManagementPaginationProps = {
  pagina: number
  totalPaginas: number
  totalItens: number
  nomeItens: string
  onChange: (pagina: number) => void
}

export default function ManagementPagination({
  pagina,
  totalPaginas,
  totalItens,
  nomeItens,
  onChange,
}: ManagementPaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        {totalItens === 0
          ? `Nenhum ${nomeItens} encontrado`
          : `Página ${pagina} de ${totalPaginas} · ${totalItens} ${nomeItens}`}
      </span>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => onChange(pagina - 1)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <button
          type="button"
          disabled={pagina >= totalPaginas || totalItens === 0}
          onClick={() => onChange(pagina + 1)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
