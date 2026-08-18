import { useState, useEffect, useRef } from 'react'
import { Angry, Frown, Meh, Smile, Laugh } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import { toPng } from 'html-to-image'

type Screen = 'login' | 'home' | 'survey' | 'dashboard'

type RatingKey = 'pessimo' | 'ruim' | 'razoavel' | 'bom' | 'excelente'

type Avaliacao = {
  Id: number
  Avaliacao: string
  Data: string
}

type Usuario = {
  id: number
  nome: string
  login: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL

const RATINGS: { key: RatingKey; label: string; color: string; bg: string; border: string; shadow: string; Icon: React.ElementType }[] = [
  { key: 'pessimo',   label: 'Péssimo',   color: '#C0392B', bg: '#FEF2F2', border: '#FECACA', shadow: 'rgba(192,57,43,0.25)',   Icon: Angry  },
  { key: 'ruim',      label: 'Ruim',      color: '#E05A2B', bg: '#FFF7ED', border: '#FED7AA', shadow: 'rgba(224,90,43,0.25)',   Icon: Frown  },
  { key: 'razoavel',  label: 'Razoável',  color: '#E8862A', bg: '#FEFCE8', border: '#FDE68A', shadow: 'rgba(232,134,42,0.25)',  Icon: Meh    },
  { key: 'bom',       label: 'Bom',       color: '#7DC36B', bg: '#F0FDF4', border: '#BBF7D0', shadow: 'rgba(125,195,107,0.25)', Icon: Smile  },
  { key: 'excelente', label: 'Excelente', color: '#2EAA4A', bg: '#F0FDF4', border: '#86EFAC', shadow: 'rgba(46,170,74,0.25)',   Icon: Laugh  },
]

function FaceSVG({ type, size = 120 }: { type: RatingKey; size?: number }) {
  const s = size
  const configs: Record<RatingKey, { fill: string; brows: string; mouth: string; eyes: string }> = {
    pessimo: {
      fill: '#C0392B',
      brows: 'M36 42 Q44 36 52 42 M68 42 Q76 36 84 42',
      mouth: 'M38 72 Q60 58 82 72',
      eyes: 'M44 55 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0-10 0 M72 55 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0-10 0',
    },
    ruim: {
      fill: '#E05A2B',
      brows: 'M38 43 Q46 38 54 43 M66 43 Q74 38 82 43',
      mouth: 'M40 72 Q60 62 80 72',
      eyes: 'M46 56 m-4.5 0 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0-9 0 M74 56 m-4.5 0 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0-9 0',
    },
    razoavel: {
      fill: '#E8862A',
      brows: '',
      mouth: 'M38 70 L82 70',
      eyes: 'M44 56 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0-10 0 M76 56 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0-10 0',
    },
    bom: {
      fill: '#7DC36B',
      brows: '',
      mouth: 'M38 66 Q60 78 82 66',
      eyes: 'M44 54 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0-10 0 M76 54 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0-10 0',
    },
    excelente: {
      fill: '#2EAA4A',
      brows: '',
      mouth: 'M34 63 Q60 84 86 63',
      eyes: 'M40 52 Q49 44 58 52 M62 52 Q71 44 80 52',
    },
  }
  const c = configs[type]
  const scale = s / 120
  return (
    <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="58" fill={c.fill} />
      <circle cx="60" cy="60" r="58" fill="url(#shine)" opacity="0.12" />
      <defs>
        <radialGradient id="shine" cx="35%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Eyes */}
      {type === 'excelente' ? (
        <>
          <path d={c.eyes} stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <path d={c.eyes} fill="white" />
      )}
      {/* Brows */}
      {c.brows && (
        <path d={c.brows} stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {/* Mouth */}
      {type === 'excelente' ? (
        <path d={c.mouth} stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : type === 'razoavel' ? (
        <line x1="38" y1="70" x2="82" y2="70" stroke="white" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d={c.mouth} stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}

const pieData = [
  { name: 'Excelente', value: 38, color: '#00B5CC' },
  { name: 'Bom',      value: 27, color: '#0eb374' },
  { name: 'Razoável',   value: 18, color: '#EAB308' },
  { name: 'Ruim',       value: 11, color: '#F97316' },
  { name: 'Péssimo',  value: 6,  color: '#EF4444' },
]

const obterDataDeHoje = () => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function ratingColor(r: string) {
  if (r === 'Excelente') return '#00B5CC'
  if (r === 'Bom')       return '#00A88F'
  if (r === 'Razoável')  return '#EAB308'
  if (r === 'Ruim')      return '#F97316'
  return '#EF4444'
}

function ratingLabel(r: string) {
  const rating = r
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (rating === "excelente") return "Excelente"
  if (rating === "bom") return "Bom"
  if (rating === "razoavel") return "Razoável"
  if (rating === "ruim") return "Ruim"
  if (rating === "pessimo") return "Péssimo"

  return r
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 28, md: 36, lg: 44 }[size]
  const txt = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size]
  return (
     <div className="flex items-center gap-2.5">
      <div
        style={{ width: s, height: s, background: 'linear-gradient(135deg,#04c7e0,#028496)', borderRadius: 10 }}
        className="flex items-center justify-center shrink-0"
      >
        <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white" />
        </svg>
      </div>
      <span className={`font-display font-700 tracking-tight text-gray-900 ${txt}`} style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
        Hospital da Visão
      </span>
    </div>
  )
}

function NavBar({
  onLogout,
  subtitle,
  usuario,
}: {
  onLogout: () => void
  subtitle: string
  usuario: Usuario | null
}) {

  const iniciais = usuario?.nome
  ? usuario.nome
      .split(' ')
      .filter(Boolean)
      .map(nome => nome[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  : 'US'

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-4">
        <Logo size="sm" />
        <span className="text-gray-400 text-sm">|</span>
        <span className="text-gray-600 text-sm font-medium">{subtitle}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-[#00B5CC] text-xs font-semibold">{iniciais}</span>
          </div>
          <span className="text-gray-700 text-sm font-medium hidden sm:block">{usuario?.nome ?? 'Usuário'}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
          </svg>
          Sair
        </button>
      </div>
    </header>
  )
}

function StatCard({ label, value, sub, color = "#00B5CC", icon }: { label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}


// ─── Screen 1: Login ──────────────────────────────────────────────────────────

function LoginScreen({
  onLogin,
}: {
  onLogin: (usuario: Usuario) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = async () => {
    setLoginError("")

    if (!email.trim() || !password) {
      setLoginError("Preencha o email e a senha.")
      return
    }

    setLoginLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: email.trim(),
          senha: password,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Email ou senha inválidos.")
        }

        throw new Error("Não foi possível realizar o login.")
      }

      const usuario = await response.json()

      console.log("Usuário autenticado:", usuario)

      onLogin(usuario)

    } catch (error) {
      console.error("Erro no login:", error)

      setLoginError(
        error instanceof Error
          ? error.message
          : "Erro ao realizar login."
      )
    } finally {
      setLoginLoading(false)
    }
  }

  //Data automaticamente para o dia atual
  

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #00cca0 0%, #00B5CC 45%, #009ccc 100%)' }}
      >
        {/* Geometric decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute top-1/3 -left-16 w-64 h-64 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-16 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'white' }} />
          {/* Grid dots */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />
        </div>

        <div className="relative z-10">
          <Logo size="lg" />
          <div className="mt-2" style={{ color: 'rgba(255, 255, 255, 0.94)', fontSize: 13, letterSpacing: '0.08em', fontWeight: 500 }}>
            SISTEMA DE AVALIAÇÃO DA SATISFAÇÃO DO PACIENTE
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-16">
          {/* Illustration */}
          <div className="w-64 h-64 relative">
            <div className="absolute inset-0 rounded-3xl opacity-20" style={{ background: 'white' }} />
            <div className="absolute inset-4 rounded-2xl opacity-10" style={{ background: 'white' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
                {/* abstract customer service illustration */}
                <rect x="20" y="90" width="120" height="50" rx="10" fill="rgba(255,255,255,0.2)" />
                <rect x="35" y="100" width="90" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
                <rect x="35" y="113" width="60" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
                <rect x="35" y="126" width="75" height="6" rx="3" fill="rgba(255,255,255,0.25)" />
                <circle cx="80" cy="48" r="28" fill="rgba(255,255,255,0.25)" />
                <circle cx="80" cy="44" r="14" fill="rgba(255,255,255,0.4)" />
                <path d="M68 66 Q80 78 92 66" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none" />

              </svg>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-white text-2xl font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Meça o que importa
            </h2>
            <p className="text-blue-100 text-sm mt-2 max-w-xs leading-relaxed opacity-90">
              Feedback em tempo real para aprimorar cada interação com o pacientente.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="h-1 rounded-full" style={{ width: i === 0 ? 24 : 8, background: i === 0 ? 'white' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl p-8 sm:p-10" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
            {/* Logo placeholder */}
            <div className="flex justify-center mb-12">
                  <img src="/logo.png" alt="logo-HV" width="150" height="100" />
            </div>

            <h1 className="text-center text-gray-600 text-xl font-bold mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Safisfação do Paciente
            </h1>
            <p className="text-center text-gray-400 text-sm mb-8">Acesse sua conta</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': '#00B5CC' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">SENHA</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': '#00B5CC' } as React.CSSProperties}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-gray-600">Lembre-se</span>
                </label>
                <button className="text-sm text-[#00B5CC] hover:text-blue-700 font-medium transition-colors cursor-pointer">
                  Esqueci a senha?
                </button>
              </div>

              {loginError && (
                  <div className="text-sm text-red-600 text-center">
                    {loginError}
                  </div>
                )}
              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 cursor-pointer mt-1"
                style={{ background: "#00B5CC", boxShadow: '0 4px 16px #00b4cc59' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Hospital da Visão © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 2: Home Dashboard ─────────────────────────────────────────────────

function HomeScreen({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout: () => void }) {
  const cards = [
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity=".6"/>
          <rect x="10" y="7"  width="4" height="14" rx="1" fill="currentColor" opacity=".8"/>
          <rect x="17" y="3"  width="4" height="18" rx="1" fill="currentColor"/>
        </svg>
      ),
      title: 'Painel Administrativo',
      desc: 'Visualize estatísticas, relatórios e indicadores de satisfação.',
      btn: 'Acessar Painel',
      color: "#00B5CC",
      screen: 'dashboard' as Screen,
      gradient: "#00B5CC",
      shadow: '#00b4cc59',
      accent: '#EFF6FF',
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#029fb4" strokeWidth="1.5" fill="nome" opacity=".4"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <circle cx="9"  cy="10" r="1.2" fill="#00B5CC"/>
          <circle cx="15" cy="10" r="1.2" fill="#00B5CC"/>
        </svg>
      ),
      title: 'Página de Avaliação',
      desc: 'Abra a pesquisa de satisfação do cliente.',
      btn: 'Começar Avaliação',
      color: "#00B5CC",
      screen: 'survey' as Screen,
      gradient: "#00B5CC",
      shadow: '#00b4cc59',
      accent: '#E0F2FE',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar onLogout={onLogout} subtitle="Menu Inicial" />
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Bem-vindo, Administrador
          </h1>
          <p className="text-gray-500 mt-2 text-sm">O que você gostaria de fazer hoje?</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
          {cards.map(c => (
            <div
              key={c.title}
              className="flex-1 bg-white rounded-3xl p-8 flex flex-col gap-5 cursor-pointer group transition-all duration-200"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}
              onClick={() => onNav(c.screen)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 16px 40px ${c.shadow}`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.accent, color: c.color }}>
                {c.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.title}</h2>
                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{c.desc}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onNav(c.screen) }}
                className="mt-auto w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
                style={{ background: c.gradient, boxShadow: `0 4px 16px ${c.shadow}` }}
              >
                {c.btn}
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-[gray-400]">
          <div className="w-2 h-2 rounded-full bg-[#00B5CC] animate-pulse" />
          Sistema operacional · 1.000.000.002, 2026
        </div>
      </main>
    </div>
  )
}

// ─── Screen 3: Survey ─────────────────────────────────────────────────────────

function SurveyScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<RatingKey | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(2)

  const enviarAvaliacao = async (nota: RatingKey) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${nota}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar avaliação");
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleSubmit = async () => {

      if (!selected) return;

      const sucesso = await enviarAvaliacao(selected);

      if (!sucesso) {
          alert("Não foi possível registrar a avaliação.");
          return;
      }

      setSubmitted(true);
      setCountdown(2);

      const interval = setInterval(() => {

          setCountdown(prev => {

              if (prev <= 1) {

                  clearInterval(interval);

                  setSelected(null);
                  setSubmitted(false);

                  return 2;
              }

              return prev - 1;

          });

      }, 1000);

  }

  if (submitted) {
    const sel = RATINGS.find(r => r.key === selected)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-6" style={{ background: '#f8fafc' }}>
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#04c7e0,#028496)', boxShadow: '0 8px 32px #00B5CC)' }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Obrigado!
            </h2>
            <p className="text-gray-500 mt-2 text-lg">
              Sua avaliação foi registrada com sucesso.
            </p>
            {sel && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "#00B5CC" }}>
                {sel.label.replace('\n', ' ')}
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            Redirecionando em <span className="font-bold text-gray-600">{countdown}s</span>…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Minimal top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <img
          src="/logo.png"
          alt="Hospital da Visão"
          width="270"
          height="110"
          style={{
            objectFit: "contain",
            objectPosition: "left center"
          }}
        />
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Voltar
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">
        {/* Title */}
        <div className="text-center">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 max-w-xl mx-auto leading-tight"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Como você avalia o nosso Atendimento?
          </h1>
        </div>

        {/* Rating cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl">
          {RATINGS.map(r => {
            const isSelected = selected === r.key
            return (
              <div
                key={r.key}
                onClick={() => setSelected(r.key)}
                className="flex-1 flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected ? r.bg : 'white',
                  border: `2px solid ${isSelected ? r.color : '#f3f4f6'}`,
                  boxShadow: isSelected
                    ? `0 8px 32px ${r.shadow}`
                    : '0 2px 12px rgba(0,0,0,0.05)',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = r.color + '60'
                    e.currentTarget.style.boxShadow = `0 6px 20px ${r.shadow}`
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#f3f4f6'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <r.Icon size={64} color={r.color} strokeWidth={1.5} />
                <div className="text-center">
                  {r.label.split('\n').map((line, i) => (
                    <div
                      key={i}
                      className="text-sm sm:text-base font-bold leading-snug"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: isSelected ? r.color : '#374151' }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: r.color }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit button */}
        <div className="h-14 flex items-center">
          {selected && (
            <button
              onClick={handleSubmit}
              className="px-12 py-4 rounded-2xl text-white font-semibold text-base transition-all duration-200 cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#04c7e0,#0697aa)', boxShadow: '0 6px 20px #00b4cc59' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Enviar Avaliação
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Screen 4: Admin Dashboard ────────────────────────────────────────────────

function DashboardScreen({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [data, setData] = useState(obterDataDeHoje())
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const relatorioRef = useRef<HTMLDivElement>(null)
  const [exportando, setExportando] = useState(false)
  

  const recentEvals = avaliacoes
    .slice(0, 10)
    .map((avaliacao) => ({
      date: new Date(avaliacao.Data).toLocaleString("pt-BR"),
      rating: ratingLabel(avaliacao.Avaliacao),
      terminal: "Hospital da Visão",
    }))

  const carregarAvaliacoes = async () => {
    try {
      setCarregando(true)

      const response = await fetch(`${API_BASE_URL}/avaliacoes`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar avaliações")
      }

      const dados: Avaliacao[] = await response.json()

      setAvaliacoes(dados)

    } catch (error) {
      console.error("Erro ao carregar avaliações:", error)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarAvaliacoes()
  }, [])

  const exportarRelatorio = async () => {
    if (!relatorioRef.current) {
      return
    }

    const elemento = relatorioRef.current

    try {
      setExportando(true)

      // Cria uma cópia do relatório
      const clone = elemento.cloneNode(true) as HTMLDivElement

      // Remove os elementos que não devem aparecer na imagem
      clone.querySelectorAll('.nao-exportar').forEach((el) => {
        el.remove()
      })

      // Define uma largura fixa para o relatório exportado
      const largura = elemento.getBoundingClientRect().width

      clone.setAttribute('data-export-clone', 'true')
      clone.style.width = `${largura}px`
      clone.style.maxWidth = 'none'
      clone.style.margin = '0'
      clone.style.padding = '24px'
      clone.style.boxSizing = 'border-box'
      clone.style.background = '#f8fafc'
      clone.style.position = 'fixed'
      clone.style.left = '0'
      clone.style.top = '0'
      clone.style.zIndex = '-9999'
      clone.style.display = 'flex'
      clone.style.flexDirection = 'column'
      clone.style.gap = '24px'

      // Adiciona temporariamente ao documento
      document.body.appendChild(clone)

      // Aguarda a renderização
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Gera a imagem
      const imagem = await toPng(clone, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      })

      // Remove a cópia temporária
      document.body.removeChild(clone)

      // Faz o download
      const link = document.createElement('a')
      link.download = 'relatorio-avaliacoes.png'
      link.href = imagem
      link.click()

    } catch (error) {
      console.error('Erro ao exportar relatório:', error)

      const cloneExistente = document.querySelector(
        'main[data-export-clone="true"]'
      )

      if (cloneExistente) {
        cloneExistente.remove()
      }

      alert('Não foi possível exportar o relatório.')

    } finally {
      setExportando(false)
    }
  }

  const totalAvaliacoes = avaliacoes.length

  const quantidadeExcelente = avaliacoes.filter(
    a => ratingLabel(a.Avaliacao) === 'Excelente'
  ).length

  const quantidadeBom = avaliacoes.filter(
    a => ratingLabel(a.Avaliacao) === 'Bom'
  ).length

  const quantidadeRazoavel = avaliacoes.filter(
    a => ratingLabel(a.Avaliacao) === 'Razoável'
  ).length

  const quantidadeRuim = avaliacoes.filter(
    a => ratingLabel(a.Avaliacao) === 'Ruim'
  ).length

  const quantidadePessimo = avaliacoes.filter(
    a => ratingLabel(a.Avaliacao) === 'Péssimo'
  ).length

  const quantidadeRuimPessimo =
    quantidadeRuim + quantidadePessimo

  const pontuacaoTotal =
    quantidadePessimo * 1 +
    quantidadeRuim * 2 +
    quantidadeRazoavel * 3 +
    quantidadeBom * 4 +
    quantidadeExcelente * 5

  const pontuacaoMedia =
    totalAvaliacoes > 0
      ? pontuacaoTotal / totalAvaliacoes
      : 0

  const pontuacaoMediaFormatada =
    pontuacaoMedia.toFixed(2)

  const satisfacaoGeral =
    totalAvaliacoes > 0
      ? Math.round(
          ((quantidadeExcelente + quantidadeBom) /
            totalAvaliacoes) *
            100
        )
      : 0  

  const hoje = new Date()

  const avaliacoesHoje = avaliacoes.filter(avaliacao => {
    const dataAvaliacao = new Date(avaliacao.Data)

    return (
      dataAvaliacao.getFullYear() === hoje.getFullYear() &&
      dataAvaliacao.getMonth() === hoje.getMonth() &&
      dataAvaliacao.getDate() === hoje.getDate()
    )
  }).length

  // Avaliações de ontem
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)

  const avaliacoesOntem = avaliacoes.filter(avaliacao => {
    const dataAvaliacao = new Date(avaliacao.Data)

    return (
      dataAvaliacao.getFullYear() === ontem.getFullYear() &&
      dataAvaliacao.getMonth() === ontem.getMonth() &&
      dataAvaliacao.getDate() === ontem.getDate()
    )
  }).length


  // Percentual de satisfação de uma lista de avaliações
  const calcularSatisfacao = (lista: Avaliacao[]) => {
    if (lista.length === 0) return 0

    const positivas = lista.filter(avaliacao => {
      const rating = ratingLabel(avaliacao.Avaliacao)

      return rating === 'Excelente' || rating === 'Bom'
    }).length

    return Math.round((positivas / lista.length) * 100)
  }

  const inicioSemanaAtual = new Date()
  inicioSemanaAtual.setHours(0, 0, 0, 0)
  inicioSemanaAtual.setDate(
    inicioSemanaAtual.getDate() - 6
  )

  const inicioSemanaAnterior = new Date(inicioSemanaAtual)
  inicioSemanaAnterior.setDate(
    inicioSemanaAnterior.getDate() - 7
  )

  const fimSemanaAnterior = new Date(inicioSemanaAtual)
  fimSemanaAnterior.setDate(
    fimSemanaAnterior.getDate() - 1
  )
  fimSemanaAnterior.setHours(23, 59, 59, 999)


  const avaliacoesSemanaAtual = avaliacoes.filter(avaliacao => {
    const dataAvaliacao = new Date(avaliacao.Data)

    return dataAvaliacao >= inicioSemanaAtual
  })


  const avaliacoesSemanaAnterior = avaliacoes.filter(avaliacao => {
    const dataAvaliacao = new Date(avaliacao.Data)

    return (
      dataAvaliacao >= inicioSemanaAnterior &&
      dataAvaliacao <= fimSemanaAnterior
    )
  })

  const satisfacaoSemanaAtual =
    calcularSatisfacao(avaliacoesSemanaAtual)

  const satisfacaoSemanaAnterior =
    calcularSatisfacao(avaliacoesSemanaAnterior)

  const variacaoSatisfacao =
    satisfacaoSemanaAtual - satisfacaoSemanaAnterior

  const calcularPontuacaoMedia = (lista: Avaliacao[]) => {
    if (lista.length === 0) return 0

    let soma = 0

    lista.forEach(avaliacao => {
      const rating = ratingLabel(avaliacao.Avaliacao)

      if (rating === 'Péssimo') soma += 1
      if (rating === 'Ruim') soma += 2
      if (rating === 'Razoável') soma += 3
      if (rating === 'Bom') soma += 4
      if (rating === 'Excelente') soma += 5
    })

    return soma / lista.length
  }

  const pontuacaoSemanaAtual =
    calcularPontuacaoMedia(avaliacoesSemanaAtual)

  const pontuacaoSemanaAnterior =
    calcularPontuacaoMedia(avaliacoesSemanaAnterior)

  const variacaoPontuacao =
    pontuacaoSemanaAtual - pontuacaoSemanaAnterior

  const variacaoAvaliacoesHoje =
   avaliacoesHoje - avaliacoesOntem

  const crescimentoSemanal =
  avaliacoesSemanaAnterior.length > 0
    ? Math.round(
        (
          (avaliacoesSemanaAtual.length -
            avaliacoesSemanaAnterior.length) /
          avaliacoesSemanaAnterior.length
        ) * 100
      )
    : 0

  const porcentagem = (quantidade: number) => {
    if (totalAvaliacoes === 0) return 0

    return Math.round(
      (quantidade / totalAvaliacoes) * 100
    )
  } 

  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date()
    data.setHours(0, 0, 0, 0)
    data.setDate(data.getDate() - (6 - i))

    return data
  })

  const dadosUltimos7Dias = ultimos7Dias.map(data => {

   const quantidade = avaliacoes.filter(avaliacao => {
      const dataAvaliacao = new Date(avaliacao.Data)

      return (
        dataAvaliacao.getFullYear() === data.getFullYear() &&
        dataAvaliacao.getMonth() === data.getMonth() &&
        dataAvaliacao.getDate() === data.getDate()
      )
    }).length

    const dia = data
      .toLocaleDateString('pt-BR', {
        weekday: 'long'
      })
      .replace('-feira', '')

    return {
      dia: dia.charAt(0).toUpperCase() + dia.slice(1),
      quantidade,
    }
  })

  const barData = dadosUltimos7Dias.map(item => ({
    day: item.dia,
    avaliações: item.quantidade,
  }))

  const ultimas8Semanas = Array.from({ length: 8 }, (_, i) => {
    const fim = new Date()
    fim.setHours(23, 59, 59, 999)

    fim.setDate(fim.getDate() - (7 - i) * 7)

    const inicio = new Date(fim)
    inicio.setDate(inicio.getDate() - 6)
    inicio.setHours(0, 0, 0, 0)

    return {
      inicio,
      fim,
    }
  })

  const lineData = ultimas8Semanas.map((semana, index) => {
    const avaliacoesDaSemana = avaliacoes.filter(avaliacao => {
      const dataAvaliacao = new Date(avaliacao.Data)

      return (
        dataAvaliacao >= semana.inicio &&
        dataAvaliacao <= semana.fim
      )
    })

    let soma = 0

    avaliacoesDaSemana.forEach(avaliacao => {
      const rating = ratingLabel(avaliacao.Avaliacao)

      if (rating === 'Péssimo') soma += 1
      if (rating === 'Ruim') soma += 2
      if (rating === 'Razoável') soma += 3
      if (rating === 'Bom') soma += 4
      if (rating === 'Excelente') soma += 5
    })

    const media =
      avaliacoesDaSemana.length > 0
        ? soma / avaliacoesDaSemana.length
        : 0

    return {
      week: `Semana ${index + 1}`,
      pontuação: Number(media.toFixed(2)),
    }
  })

  const contagemAvaliacoes = {
    Excelente: avaliacoes.filter(
      a => ratingLabel(a.Avaliacao) === 'Excelente'
    ).length,

    Bom: avaliacoes.filter(
      a => ratingLabel(a.Avaliacao) === 'Bom'
    ).length,

    Razoável: avaliacoes.filter(
      a => ratingLabel(a.Avaliacao) === 'Razoável'
    ).length,

    Ruim: avaliacoes.filter(
      a => ratingLabel(a.Avaliacao) === 'Ruim'
    ).length,

    Péssimo: avaliacoes.filter(
      a => ratingLabel(a.Avaliacao) === 'Péssimo'
    ).length,
  }

  const pieDataReal = [
    {
      name: 'Excelente',
      value: contagemAvaliacoes.Excelente,
      color: '#00B5CC',
    },
    {
      name: 'Bom',
      value: contagemAvaliacoes.Bom,
      color: '#0eb374',
    },
    {
      name: 'Razoável',
      value: contagemAvaliacoes.Razoável,
      color: '#EAB308',
    },
    {
      name: 'Ruim',
      value: contagemAvaliacoes.Ruim,
      color: '#F97316',
    },
    {
      name: 'Péssimo',
      value: contagemAvaliacoes.Péssimo,
      color: '#EF4444',
    },
  ]

  const statCards = [
    { label: 'Total de Avaliações', value: totalAvaliacoes.toLocaleString('pt-BR'), sub: `${avaliacoesHoje} hoje`, color: '#00B5CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
    },
    { label: 'Excelente', value: quantidadeExcelente.toString(), sub: `${porcentagem(quantidadeExcelente)}% do total`, color: '#00B5CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
    },
    { label: 'Bom', value: quantidadeBom.toString(), sub: `${porcentagem(quantidadeBom)}% do total`, color: '#0eb374',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    },
    { label: 'Razoável', value: quantidadeRazoavel.toString(), sub: `${porcentagem(quantidadeRazoavel)}% do total`, color: '#EAB308',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
    },
    { label: 'Ruim + Péssimo', value: quantidadeRuimPessimo.toString(), sub: `${porcentagem(quantidadeRuimPessimo)}% do total`, color: '#EF4444',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
    },
  ]

  const kpiCards = [
    {
      label: 'Satisfação Geral',
      value: `${pontuacaoMediaFormatada} / 5.0`,
      trend: `${variacaoPontuacao >= 0 ? '↑' : '↓'} ${Math.abs(variacaoPontuacao).toFixed(1)} pts vs semana anterior`,
      pos: variacaoPontuacao > 0 ? true : variacaoPontuacao < 0 ? false : null,
    },

    {
      label: 'Pontuação Média',
      value: `${satisfacaoGeral}%`,
      trend: `${variacaoSatisfacao >= 0 ? '↑' : '↓'} ${Math.abs(variacaoSatisfacao)}% vs última semana`,
      pos: variacaoSatisfacao > 0 ? true : variacaoSatisfacao < 0 ? false : null,
    },

    {
      label: 'Avaliações de Hoje',
      value: avaliacoesHoje.toString(),
      trend: `${variacaoAvaliacoesHoje >= 0 ? '↑' : '↓'} ${Math.abs(variacaoAvaliacoesHoje)} vs ontem`,
      pos: variacaoAvaliacoesHoje > 0 ? true : variacaoAvaliacoesHoje < 0 ? false : null,
    },

    {
      label: 'Crescimento Semanal',
      value: `${crescimentoSemanal >= 0 ? '+' : ''}${crescimentoSemanal}%`,
      trend: `${avaliacoesSemanaAtual.length} avaliações nos últimos 7 dias`,
      pos: crescimentoSemanal > 0 ? true : crescimentoSemanal < 0 ? false : null,
    },

  ]

  const filtered = recentEvals.filter(e =>
    e.rating.toLowerCase().includes(search.toLowerCase()) ||
    e.terminal.toLowerCase().includes(search.toLowerCase())
  )

  const LoadingOverlay = () => {
    if (!carregando && !exportando) return null

    const mensagem = exportando
      ? 'Exportando relatório...'
      : 'Carregando avaliações...'

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
        <div className="flex min-w-[220px] flex-col items-center justify-center rounded-2xl bg-white px-8 py-7 shadow-xl">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#00B5CC]" />

          <p className="mt-4 text-sm font-medium text-gray-700">
            {mensagem}
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <LoadingOverlay />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavBar onLogout={onLogout} subtitle="Menu Administrativo" />
        <main
          ref={relatorioRef}
          className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6"
        >
          {/* Page title + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1 mb-1 transition-colors nao-exportar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                Voltar ao menu principal
              </button>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Análise Geral</h1>
              <p className="text-gray-500 text-sm">Hospital da Visão</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors nao-exportar"
                onClick={carregarAvaliacoes}
                disabled={carregando || exportando}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Recarregar
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all nao-exportar disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg,#04c7e0,#0697aa)',
                  boxShadow: '0 2px 8px #00b4cc59'
                }}
                onClick={exportarRelatorio}
                disabled={carregando || exportando}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 20h14v-2H5v2zm7-18l-7 7h4v4h6v-4h4l-7-7z"/></svg>
                Exportar Relatório
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map(k => (
              <div key={k.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                <div className="text-xs font-medium text-gray-500">{k.label}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{k.value}</div>
                <div
                  className={`text-xs mt-1 ${
                    k.pos === true
                      ? 'text-[#0eb374]'
                      : k.pos === false
                        ? 'text-red-400'
                        : 'text-[#00B5CC]'
                  }`}
                >
                  {k.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map(s => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} icon={s.icon} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Avaliação por Dia</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Últimos 7 dias</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#00B5CC]" />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="avaliações" fill="#00B5CC" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">Distribuição de Satisfação</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sempre</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieDataReal} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieDataReal.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {pieDataReal.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{porcentagem(d.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Histórico de Pontuação de Satisfação</h3>
                <p className="text-xs text-gray-400 mt-0.5">tendência de 8 semanas</p>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0eb374] bg-green-50">↑ Tendência de Crescimento</div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[3, 5]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Line type="monotone" dataKey="pontuação" stroke="#00B5CC" strokeWidth={2.5} dot={{ fill: '#00B5CC', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent evaluations table */}
          <div className="bg-white rounded-2xl" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Avaliações Recentes</h3>
                <p className="text-xs text-gray-400 mt-0.5">Últimos Envios</p>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar …"
                  className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    <th className="px-15 py-3 text-left">Data</th>
                    <th className="px-15 py-3 text-left">Avaliação</th>
                    <th className="px-0 py-3 text-left">Departamento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{row.date}</td>
                      <td className="px-15 py-3.5 whitespace-nowrap">
                        <span className="font-semibold" style={{ color: ratingColor(row.rating) }}>{row.rating}</span>
                      </td>
                      <td className="px-1 py-3.5 text-gray-600">{row.terminal}</td>
                      <td className="px-0 py-3.5">

                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">No results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [usuario, setUsuario] = useState<Usuario | null>(null)  
  const [verificandoSessao, setVerificandoSessao] = useState(true)

  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          method: 'GET',
          credentials: 'include',
        })

        if (response.status === 401) {
          setUsuario(null)
          setScreen('login')
          return
        }

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`)
        }

        const usuarioAtual: Usuario = await response.json()

        setUsuario(usuarioAtual)
        setScreen('home')

      } catch (error) {
        console.error('Erro ao verificar sessão:', error)

        setUsuario(null)
        setScreen('login')

      } finally {
        setVerificandoSessao(false)
      }
    }

    verificarSessao()
  }, [])

  if (verificandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00B5CC] rounded-full animate-spin" />

          <span className="text-sm text-gray-500">
            Verificando sessão...
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      {screen === 'login'     && <LoginScreen
        onLogin={(usuarioAutenticado) => {
          setUsuario(usuarioAutenticado)
          setScreen('home')
        }}
      />}
      {screen === 'home' && (
        <HomeScreen
          usuario={usuario}
          onNav={setScreen}
          onLogout={() => setScreen('login')}
        />
      )}
      {screen === 'survey'    && <SurveyScreen onBack={() => setScreen('home')} />}
      {screen === 'dashboard' && <DashboardScreen onBack={() => setScreen('home')} onLogout={() => setScreen('login')} />}
    </>
  )
}
  