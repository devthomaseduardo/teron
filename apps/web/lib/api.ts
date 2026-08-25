/**
 * Cliente HTTP para a API TERON.
 * Em dev: NEXT_PUBLIC_API_URL=http://localhost:4000
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_URL}${p}`
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
}
