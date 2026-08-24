function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 28, md: 36, lg: 44 }[size]
  const txt = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size]

  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{
          width: s,
          height: s,
          background: 'linear-gradient(135deg,#04c7e0,#028496)',
          borderRadius: 10,
        }}
        className="flex items-center justify-center shrink-0"
      >
        <svg
          width={s * 0.6}
          height={s * 0.6}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            fill="white"
          />
        </svg>
      </div>

      <span
        className={`font-display font-700 tracking-tight text-gray-900 ${txt}`}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
        }}
      >
        Hospital da Visão
      </span>
    </div>
  )
}

export default Logo