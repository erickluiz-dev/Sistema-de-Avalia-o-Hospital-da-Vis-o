
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não configurada')
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  const method = (options.method || 'GET').toUpperCase()

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='))
      ?.split('=')[1]

    if (csrfToken) {
      headers.set('X-CSRF-Token', decodeURIComponent(csrfToken))
    }
  }

  const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`

  return fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })
}
