type ManagementHeaderProps = {
  onBack: () => void
}

export default function ManagementHeader({
  onBack,
}: ManagementHeaderProps) {
  return (
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
  )
}