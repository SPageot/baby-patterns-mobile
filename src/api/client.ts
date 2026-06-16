import { refreshAccessToken } from '@/api/authTokens'
import { getApiBaseUrl } from '@/api/config'
import { getAccessToken } from '@/lib/authSession'

export class RequestTimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message)
    this.name = 'RequestTimeoutError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired. Please log in again.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export type ApiFetchOptions = {
  timeoutMs?: number
  skipAuth?: boolean
  skipRefresh?: boolean
}

type InternalFetchOptions = ApiFetchOptions & {
  retryOnUnauthorized?: boolean
}

type SessionExpiredHandler = () => void

let onSessionExpired: SessionExpiredHandler | null = null

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler
}

function notifySessionExpired(): void {
  onSessionExpired?.()
}

async function readResponseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

async function executeFetch<T>(
  path: string,
  init: RequestInit | undefined,
  options: InternalFetchOptions,
): Promise<T> {
  const base = getApiBaseUrl()
  if (!base) throw new Error('EXPO_PUBLIC_API_URL is not set')

  const timeoutMs = options.timeoutMs
  const controller = timeoutMs != null && timeoutMs > 0 ? new AbortController() : null
  const timeoutId =
    controller != null ? setTimeout(() => controller.abort(), timeoutMs) : undefined

  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init?.body != null && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (!options.skipAuth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
      ...init,
      signal: controller?.signal ?? init?.signal,
      headers,
    })

    if (
      res.status === 401 &&
      options.retryOnUnauthorized !== false &&
      !options.skipAuth &&
      !options.skipRefresh
    ) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return executeFetch(path, init, { ...options, retryOnUnauthorized: false })
      }
      notifySessionExpired()
      throw new UnauthorizedError()
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed (${res.status})`)
    }

    return readResponseBody<T>(res)
  } catch (e) {
    if (controller?.signal.aborted) throw new RequestTimeoutError()
    throw e
  } finally {
    if (timeoutId != null) clearTimeout(timeoutId)
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T> {
  return executeFetch<T>(path, init, options ?? {})
}
