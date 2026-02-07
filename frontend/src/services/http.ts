/**
 * Small fetch helper with timeout + auth header.
 * Prevents the UI from hanging forever when backend is down.
 */

import { API_BASE_URL } from './api'

export async function fetchJson<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 6000, ...init } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const token = localStorage.getItem('token')
  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      // try parse FastAPI style error
      let detail: string | undefined
      try {
        const body = await res.json()
        detail = body?.detail
      } catch {
        // ignore
      }
      throw new Error(detail || `Request failed (${res.status})`)
    }

    return (await res.json()) as T
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Backend request timed out. Is the backend running?')
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

