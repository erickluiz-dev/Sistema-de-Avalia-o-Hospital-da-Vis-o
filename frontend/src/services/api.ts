const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não configurada')
}

type CSRFResponse = { csrf_token: string }

const ROTAS_PUBLICAS_SEM_CSRF = new Set([
  '/login',
  '/recuperacao-senha',
  '/redefinir-senha',
])

let csrfTokenCache: string | null = null
let csrfTokenPromise: Promise<string> | null = null

async function obterTokenCSRF(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache
  if (csrfTokenPromise) return csrfTokenPromise

  csrfTokenPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/csrf`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Não foi possível obter o token CSRF (${response.status})`)
    }

    const data = (await response.json()) as CSRFResponse
    if (!data.csrf_token) throw new Error('O backend não retornou o token CSRF')

    csrfTokenCache = data.csrf_token
    return data.csrf_token
  })()

  try {
    return await csrfTokenPromise
  } finally {
    csrfTokenPromise = null
  }
}

function invalidarTokenCSRF() {
  csrfTokenCache = null
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const usaCSRF =
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    !ROTAS_PUBLICAS_SEM_CSRF.has(normalizedEndpoint)

  if (usaCSRF) {
    headers.set('X-CSRF-Token', await obterTokenCSRF())
  }

  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  // Não repete automaticamente a operação: um POST pode ter efeitos colaterais.
  // Invalida o cache para a próxima ação buscar o token sincronizado com o cookie.
  if (usaCSRF && response.status === 403) invalidarTokenCSRF()

  return response
}
