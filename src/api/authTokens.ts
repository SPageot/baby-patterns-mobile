import { getApiBaseUrl } from '@/api/config'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getSessionUserId,
  setAuthSession,
  type AuthSession,
} from '@/lib/authSession'

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isGuidLike(value: string): boolean {
  return GUID_RE.test(value.trim())
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function unwrapAuthPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  let current: unknown = data
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) break
    const o = current as Record<string, unknown>
    const nested = o.result ?? o.Result ?? o.data ?? o.Data
    if (nested == null) return o
    if (typeof nested === 'string') {
      const text = nested.trim()
      if (isGuidLike(text)) return o
      try {
        const parsed = JSON.parse(text) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          current = parsed
          continue
        }
      } catch {
        return o
      }
      return o
    }
    current = nested
  }
  return current && typeof current === 'object' && !Array.isArray(current)
    ? (current as Record<string, unknown>)
    : {}
}

export function extractMfaChallenge(data: unknown): { challengeToken: string } | null {
  const payload = unwrapAuthPayload(data)
  const mfaRequired = payload.mfaRequired === true || payload.MfaRequired === true
  if (!mfaRequired) return null
  const challengeToken = pickStr(payload, 'mfaChallengeToken', 'MfaChallengeToken')
  if (!challengeToken) return null
  return { challengeToken }
}

export function extractAuthTokens(data: unknown): AuthSession | null {
  const payload = unwrapAuthPayload(data)
  const accessToken = pickStr(
    payload,
    'token',
    'Token',
    'accessToken',
    'AccessToken',
    'access_token',
    'jwt',
    'Jwt',
  )
  const refreshToken = pickStr(payload, 'refreshToken', 'RefreshToken', 'refresh_token')
  if (!accessToken || !refreshToken) return null
  const userId =
    pickStr(payload, 'userId', 'UserId') ||
    (() => {
      const id = pickStr(payload, 'id', 'Id')
      return id && isGuidLike(id) ? id : ''
    })() ||
    extractUserIdFromAccessToken(accessToken) ||
    undefined
  return { accessToken, refreshToken, ...(userId ? { userId } : {}) }
}

export function extractUserIdFromAccessToken(token: string): string {
  const parts = token.trim().split('.')
  if (parts.length < 2) return ''
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    const payload = JSON.parse(json) as Record<string, unknown>
    for (const key of ['sub', 'userId', 'UserId', 'nameid']) {
      const v = payload[key]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
  } catch {
    return ''
  }
  return ''
}

export async function persistAuthTokens(data: unknown): Promise<AuthSession | null> {
  const tokens = extractAuthTokens(data)
  if (!tokens) return null
  await setAuthSession(tokens)
  return tokens
}

function getAuthRefreshPath(): string {
  const path = (process.env.EXPO_PUBLIC_AUTH_REFRESH_PATH ?? 'api/auth/refresh').trim()
  return path.replace(/^\//, '')
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()?.trim()
  if (!refreshToken) {
    await clearAuthSession()
    return false
  }
  const base = getApiBaseUrl()
  if (!base) {
    await clearAuthSession()
    return false
  }
  try {
    const res = await fetch(`${base}/${getAuthRefreshPath()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      await clearAuthSession()
      return false
    }
    const text = await res.text()
    if (!text) {
      await clearAuthSession()
      return false
    }
    const data = JSON.parse(text) as unknown
    const tokens = extractAuthTokens(data)
    if (!tokens?.accessToken) {
      await clearAuthSession()
      return false
    }
    await setAuthSession({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || refreshToken,
      userId: tokens.userId || getSessionUserId() || undefined,
    })
    return true
  } catch {
    await clearAuthSession()
    return false
  }
}

export async function bootstrapAuthSession(): Promise<boolean> {
  if (getAccessToken()) return true
  if (!getRefreshToken()) return false
  return refreshAccessToken()
}

export function resolveAuthenticatedUserId(): string {
  return getSessionUserId()?.trim() || extractUserIdFromAccessToken(getAccessToken() ?? '')
}
