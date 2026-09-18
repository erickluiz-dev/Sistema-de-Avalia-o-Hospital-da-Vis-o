import { useEffect, useState, type ReactNode } from 'react'

import Logo from '../Logo'

type LoginSlide = {
  title: string
  subtitle: string
  illustration: ReactNode
}

const LOGIN_SLIDES: LoginSlide[] = [
  {
    title: 'Meça o que importa',
    subtitle:
      'Feedback em tempo real para aprimorar cada interação com o paciente.',
    illustration: (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <rect x="20" y="90" width="120" height="50" rx="10" fill="rgba(255,255,255,0.2)" />
        <rect x="35" y="100" width="90" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
        <rect x="35" y="113" width="60" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
        <rect x="35" y="126" width="75" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="80" cy="48" r="28" fill="rgba(255,255,255,0.25)" />
        <circle cx="80" cy="44" r="14" fill="rgba(255,255,255,0.4)" />
        <path d="M68 66 Q80 78 92 66" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    title: 'Veja o desempenho dos funcionários',
    subtitle:
      'Visualize estatísticas, relatórios e indicadores de satisfação.',
    illustration: (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <rect x="18" y="120" width="20" height="28" rx="4" fill="rgba(255,255,255,0.25)" />
        <rect x="46" y="95" width="20" height="53" rx="4" fill="rgba(255,255,255,0.35)" />
        <rect x="74" y="70" width="20" height="78" rx="4" fill="rgba(255,255,255,0.5)" />
        <rect x="102" y="85" width="20" height="63" rx="4" fill="rgba(255,255,255,0.4)" />
        <rect x="130" y="55" width="20" height="93" rx="4" fill="rgba(255,255,255,0.6)" />
        <polyline points="28,118 56,93 84,68 112,83 140,53" stroke="rgba(255,220,50,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {[28, 56, 84, 112, 140].map((x, i) => {
          const y = [118, 93, 68, 83, 53][i]
          return <circle key={x} cx={x} cy={y} r="4" fill="rgba(255,220,50,0.9)" />
        })}
        <line x1="14" y1="150" x2="154" y2="150" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        {[14, 42, 70, 98, 126].map((x) => (
          <rect key={x} x={x} y="148" width="3" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
        ))}
      </svg>
    ),
  },
  {
    title: 'Administração do sistema',
    subtitle:
      'Gerencie usuários, funcionários, departamentos e terminais.',
    illustration: (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <rect x="55" y="18" width="50" height="34" rx="7" fill="rgba(255,255,255,0.35)" />
        <circle cx="80" cy="27" r="7" fill="rgba(255,255,255,0.5)" />
        <rect x="65" y="37" width="30" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="70" y="44" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
        <line x1="80" y1="52" x2="80" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="30" y1="72" x2="130" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="30" y1="72" x2="30" y2="88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="80" y1="72" x2="80" y2="88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="130" y1="72" x2="130" y2="88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        {[10, 60, 110].map((x) => (
          <g key={x}>
            <rect x={x} y="88" width="40" height="28" rx="6" fill="rgba(255,255,255,0.22)" />
            <circle cx={x + 20} cy="97" r="5" fill="rgba(255,255,255,0.45)" />
            <rect x={x + 8} y="107" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.3)" />
          </g>
        ))}
        {[18, 68, 118].map((x) => (
          <g key={x}>
            <rect x={x} y="128" width="24" height="16" rx="3" fill="rgba(255,255,255,0.18)" />
            <rect x={x + 3} y="131" width="18" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
            <rect x={x + 3} y="137" width="12" height="2" rx="1" fill="rgba(255,255,255,0.25)" />
          </g>
        ))}
      </svg>
    ),
  },
]

export default function LoginPresentation() {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)

  const changeSlide = (nextSlide: number) => {
    if (nextSlide === slide) return

    setFading(true)

    window.setTimeout(() => {
      setSlide(nextSlide)
      setFading(false)
    }, 350)
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFading(true)

      window.setTimeout(() => {
        setSlide((currentSlide) => (currentSlide + 1) % LOGIN_SLIDES.length)
        setFading(false)
      }, 350)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [])

  const current = LOGIN_SLIDES[slide]

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 lg:w-1/2 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(145deg, #00cca0 0%, #00B5CC 45%, #009ccc 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <div
          className="absolute top-1/3 -left-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <div
          className="absolute -bottom-16 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10">
        <Logo size="lg" />

        <div
          className="mt-2"
          style={{
            color: 'rgba(255, 255, 255, 0.94)',
            fontSize: 13,
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          SISTEMA DE AVALIAÇÃO DA SATISFAÇÃO DO PACIENTE
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-16">
        <div
          className="flex flex-col items-center"
          style={{
            transition: 'opacity 0.35s ease',
            opacity: fading ? 0 : 1,
          }}
        >
          <div className="w-64 h-64 relative">
            <div
              className="absolute inset-0 rounded-3xl opacity-20"
              style={{ background: 'white' }}
            />
            <div
              className="absolute inset-4 rounded-2xl opacity-10"
              style={{ background: 'white' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {current.illustration}
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2
              className="text-white text-2xl font-bold max-w-xs"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {current.title}
            </h2>
            <p className="text-blue-100 text-sm mt-2 max-w-xs leading-relaxed opacity-90">
              {current.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex gap-2" role="tablist" aria-label="Destaques do sistema">
        {LOGIN_SLIDES.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={index === slide}
            aria-label={`Mostrar destaque: ${item.title}`}
            onClick={() => changeSlide(index)}
            className="h-1 rounded-full cursor-pointer transition-all duration-300 border-0 p-0"
            style={{
              width: index === slide ? 24 : 8,
              background:
                index === slide ? 'white' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
