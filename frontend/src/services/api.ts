const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não configurada')
}

let csrfToken: string | null = null
let csrfRequest: Promise<string> | null = null

async function obterTokenCSRF(): Promise<string> {
  if (csrfToken) return csrfToken

  if (!csrfRequest) {
    csrfRequest = fetch(`${API_BASE_URL}/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Não foi possível obter token CSRF (HTTP ${response.status})`)
        }
        const data: { csrf_token?: string } = await response.json()
        if (!data.csrf_token) throw new Error('Resposta CSRF sem token')
        csrfToken = data.csrf_token
        return data.csrf_token
      })
      .finally(() => { csrfRequest = null })
  }

  return csrfRequest
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers)
  const method = (options.method || 'GET').toUpperCase()
  const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && normalizedEndpoint !== '/login') {
    headers.set('X-CSRF-Token', await obterTokenCSRF())
  }

  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  // Logout invalida o cookie no servidor; descarte também a cópia em memória.
  if (normalizedEndpoint === '/logout' && response.ok) {
    csrfToken = null
  }

  return response
}
