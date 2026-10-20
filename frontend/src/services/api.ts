const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não configurada')
}

type CSRFResponse = {
  csrf_token: string
}

const ROTAS_PUBLICAS_SEM_CSRF = new Set([
  '/login',
  '/recuperacao-senha',
  '/redefinir-senha',
])

async function obterTokenCSRF(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/csrf`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Não foi possível obter o token CSRF (${response.status})`)
  }

  const data = (await response.json()) as CSRFResponse

  if (!data.csrf_token) {
    throw new Error('O backend não retornou o token CSRF')
  }

  return data.csrf_token
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  if (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    !ROTAS_PUBLICAS_SEM_CSRF.has(normalizedEndpoint)
  ) {
    const csrfToken = await obterTokenCSRF()
    headers.set('X-CSRF-Token', csrfToken)
  }

  return fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })
}
