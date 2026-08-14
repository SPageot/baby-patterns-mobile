import { extractMfaChallenge, persistAuthTokens, resolveAuthenticatedUserId } from '@/api/authApi'
import { apiFetch, RequestTimeoutError, UnauthorizedError } from '@/api/client'
import { getApiBaseUrl, getMediaBaseUrl } from '@/api/config'
import { bumpAvatarCache, readAvatarCacheBust, wasAvatarRecentlyUpdated } from '@/lib/avatarCache'
import type { AvatarUploadPayload } from '@/lib/avatarUpload'
import type { LoginCredentials, User, UserSignup, UserUpdate } from '@/schemas/user'
import { INVALID_LOGIN_CREDENTIALS_MESSAGE } from '@/schemas/user'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isGuidLike(value: string): boolean {
  return GUID_RE.test(value.trim())
}

/**
 * Read created entity id from API envelopes (.NET often returns task id on `id`
 * and the real GUID on `result`).
 */
function pickScalarField(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function pickEntityIdFromObject(o: Record<string, unknown>): string {
  const result = pickScalarField(o, 'result', 'Result')
  const userId = pickScalarField(o, 'userId', 'UserId')
  const id = pickScalarField(o, 'id', 'Id')

  const guidCandidates = [result, userId, id].filter(Boolean)
  const guid = guidCandidates.find((c) => isGuidLike(c))
  if (guid) return guid

  if (result) return result
  if (userId) return userId
  if (id && !/^\d+$/.test(id)) return id

  return ''
}

/** Read user id from common API response shapes (flat, nested, or raw guid string). */
export function extractUserId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw !== 'object') return ''

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const id = extractUserId(item)
      if (id) return id
    }
    return ''
  }

  const o = raw as Record<string, unknown>
  const direct = pickEntityIdFromObject(o)
  if (direct) return direct

  for (const key of ['user', 'User', 'data', 'Data', 'result', 'Result', 'value', 'Value']) {
    const nested = o[key]
    const id = extractUserId(nested)
    if (id) return id
  }
  return ''
}

/** Prefer user fields on `result` when the API wraps the entity (.NET task envelope). */
function unwrapUserPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const envelope = raw as Record<string, unknown>
  const nested = envelope.result ?? envelope.Result

  if (typeof nested === 'string') {
    const text = nested.trim()
    if (!text || isGuidLike(text)) return envelope
    try {
      const parsed = JSON.parse(text) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return envelope
    }
  }

  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>
  }

  return envelope
}

function pickUserField(
  payload: Record<string, unknown>,
  envelope: Record<string, unknown> | null,
  ...keys: string[]
): string {
  const fromPayload = pickStr(payload, ...keys)
  if (fromPayload) return fromPayload
  if (envelope) return pickStr(envelope, ...keys)
  return ''
}

type NormalizeUserOptions = {
  /** Used when the API returns only an id on `result` (e.g. login). */
  fallbackUsername?: string
}

function pickOptionalBool(raw: unknown): boolean | undefined {
  if (raw === true || raw === 'true') return true
  if (raw === false || raw === 'false') return false
  return undefined
}

function normalizeUser(raw: unknown, options?: NormalizeUserOptions): User | null {
  const envelope = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  const payload = unwrapUserPayload(raw)
  if (!payload) return null

  const id = extractUserId(payload) || extractUserId(raw) || resolveAuthenticatedUserId()
  const username =
    pickUserField(payload, envelope, 'username', 'Username') ||
    options?.fallbackUsername?.trim() ||
    ''
  if (!id || !username) return null

  const avatarRaw = pickUserField(payload, envelope, 'avatarUrl', 'AvatarUrl')
  const weeklyEmailRaw =
    payload.weeklySummaryEmailEnabled ??
    payload.WeeklySummaryEmailEnabled ??
    envelope?.weeklySummaryEmailEnabled ??
    envelope?.WeeklySummaryEmailEnabled

  const isProRaw = payload.isPro ?? payload.IsPro ?? envelope?.isPro ?? envelope?.IsPro
  const isSiteDeveloperRaw =
    payload.isSiteDeveloper ??
    payload.IsSiteDeveloper ??
    envelope?.isSiteDeveloper ??
    envelope?.IsSiteDeveloper
  const hasProAccessRaw =
    payload.hasProAccess ?? payload.HasProAccess ?? envelope?.hasProAccess ?? envelope?.HasProAccess

  const isPro = pickOptionalBool(isProRaw)
  const isSiteDeveloper = pickOptionalBool(isSiteDeveloperRaw)
  const hasProAccessExplicit = pickOptionalBool(hasProAccessRaw)
  const hasProAccess =
    hasProAccessExplicit ??
    (isPro === true || isSiteDeveloper === true ? true : undefined)

  return {
    id,
    username,
    password: '',
    email: pickUserField(payload, envelope, 'email', 'Email'),
    phone: pickUserField(payload, envelope, 'phone', 'Phone'),
    birthdate: pickUserField(payload, envelope, 'birthdate', 'Birthdate', 'birthDate', 'BirthDate'),
    fullName: pickUserField(payload, envelope, 'fullName', 'FullName'),
    location: pickUserField(payload, envelope, 'location', 'Location'),
    avatarUrl: avatarRaw ? avatarRaw.trim() : undefined,
    pendingEmail:
      pickUserField(payload, envelope, 'pendingEmail', 'PendingEmail') || undefined,
    weeklySummaryEmailEnabled: weeklyEmailRaw === true || weeklyEmailRaw === 'true',
    preferredLocale:
      pickUserField(payload, envelope, 'preferredLocale', 'PreferredLocale') || undefined,
    isPro,
    isSiteDeveloper,
    hasProAccess,
    subscriptionStatus:
      pickUserField(payload, envelope, 'subscriptionStatus', 'SubscriptionStatus') || undefined,
    proBillingInterval:
      pickUserField(payload, envelope, 'proBillingInterval', 'ProBillingInterval') || null,
    proCurrentPeriodEnd:
      pickUserField(payload, envelope, 'proCurrentPeriodEnd', 'ProCurrentPeriodEnd') || null,
    legalPolicyVersion:
      pickUserField(payload, envelope, 'legalPolicyVersion', 'LegalPolicyVersion') || null,
  }
}

function avatarPathFromStoredUrl(url: string): string {
  const trimmed = url.trim().split('?')[0]?.split('#')[0] ?? ''
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).pathname
    } catch {
      return trimmed
    }
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function avatarUrlBases(storedUrl?: string, userId?: string): string[] {
  const api = getApiBaseUrl()
  const media = getMediaBaseUrl()
  if (!api && !media) return []
  if (!media || media === api) return api ? [api] : []

  const bases = [api, media]
  const ordered: string[] = []

  const stored = storedUrl?.trim()
  if (stored && /^https?:\/\//i.test(stored)) {
    try {
      ordered.push(new URL(stored).origin)
    } catch {
      /* ignore */
    }
  }

  if (userId && wasAvatarRecentlyUpdated(userId)) {
    const apiIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(api)
    if (apiIsLocal && !ordered.includes(api)) {
      ordered.push(api)
    }
  }

  const mediaExplicit = Boolean(process.env.EXPO_PUBLIC_MEDIA_URL?.trim())
  if (mediaExplicit) {
    for (const base of [media, api]) {
      if (base && !ordered.includes(base)) ordered.push(base)
    }
    return ordered
  }

  const apiIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(api)
  for (const base of apiIsLocal ? bases : [media, api]) {
    if (base && !ordered.includes(base)) ordered.push(base)
  }
  return ordered
}

export function resolveAvatarUrl(url: string): string {
  const trimmed = url.trim().split('?')[0]?.split('#')[0] ?? ''
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const path = avatarPathFromStoredUrl(trimmed)
  const base = path.startsWith('/uploads/') ? getMediaBaseUrl() || getApiBaseUrl() : getApiBaseUrl()
  if (!base) return trimmed
  return `${base}${path}`
}

/** Candidate avatar URLs (media host, then API host) for dev/shared-DB setups. */
export function avatarDisplayUrlCandidates(userId: string, avatarUrl?: string): string[] {
  const raw = avatarUrl?.trim()
  if (!raw || !userId.trim()) return []

  const bust = readAvatarCacheBust(userId)
  const suffix = `?v=${bust}`
  const path = avatarPathFromStoredUrl(raw)

  if (path.startsWith('/uploads/avatars/')) {
    return avatarUrlBases(raw, userId).map((base) => `${base}${path}${suffix}`)
  }

  const resolved = resolveAvatarUrl(raw)
  return resolved ? [`${resolved}${suffix}`] : []
}

/** Primary avatar URL with cache-busting (avoids stale images after re-upload). */
export function avatarDisplayUrl(userId: string, avatarUrl?: string): string | undefined {
  return avatarDisplayUrlCandidates(userId, avatarUrl)[0]
}

function toUserSignupBody(data: UserSignup): Record<string, unknown> {
  return {
    username: data.username,
    email: data.email,
    password: data.password,
    phone: data.phone,
    birthdate: data.birthdate,
    fullName: data.fullName,
    location: data.location,
  }
}

function toUserUpdateBody(data: UserUpdate): Record<string, unknown> {
  const body: Record<string, unknown> = { id: data.id }
  if (data.username != null) body.username = data.username
  if (data.password) body.password = data.password
  if (data.email != null) body.email = data.email
  if (data.phone != null) body.phone = data.phone
  if (data.birthdate != null) body.birthdate = data.birthdate
  if (data.fullName != null) body.fullName = data.fullName
  if (data.location != null) body.location = data.location
  if (data.avatarUrl != null) body.avatarUrl = data.avatarUrl
  if (data.weeklySummaryEmailEnabled != null) {
    body.weeklySummaryEmailEnabled = data.weeklySummaryEmailEnabled
  }
  if (data.preferredLocale != null) {
    body.preferredLocale = data.preferredLocale
  }
  return body
}

let createUserInFlight: Promise<User> | null = null

/** POST `api/auth/signup` */
export async function createUser(
  payload: UserSignup,
  options?: { timeoutMs?: number },
): Promise<User> {
  if (createUserInFlight) return createUserInFlight

  createUserInFlight = (async () => {
    const data = await apiFetch<unknown>(
      'api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(toUserSignupBody(payload)),
      },
      { timeoutMs: options?.timeoutMs, skipAuth: true },
    )

    const tokens = await persistAuthTokens(data)
    if (!tokens?.accessToken || !tokens.refreshToken) {
      throw new Error('Create user: server did not return auth tokens')
    }

    const id =
      extractUserId(data) ||
      tokens.userId ||
      resolveAuthenticatedUserId()
    if (!id) throw new Error('Create user: server did not return a user id')
    return fetchCurrentUser(payload.username)
  })().finally(() => {
    createUserInFlight = null
  })

  return createUserInFlight
}

/** GET `api/user?id={userId}` or `api/user/{userId}` */
export async function getUser(userId: string): Promise<User> {
  const id = userId.trim()
  if (!id) throw new Error('User id is required')
  const data = await apiFetch<unknown>(`api/user/${encodeURIComponent(id)}`)
  const user = normalizeUser(data)
  if (!user) throw new Error('Get user: invalid response from server')
  return user
}

/** Load the current user using persisted auth tokens. */
export async function fetchCurrentUser(fallbackUsername?: string): Promise<User> {
  const userId = resolveAuthenticatedUserId()
  if (!userId) throw new Error('Not authenticated')
  const user = await getUser(userId)
  if (user.username?.trim() || !fallbackUsername) return user
  return { ...user, username: fallbackUsername.trim() }
}

/** PUT `api/user?id={userId}` */
export async function updateUser(payload: UserUpdate): Promise<User> {
  const userId = payload.id?.trim()
  if (!userId) throw new Error('User id is required to update')
  const q = new URLSearchParams({ id: userId })
  const data = await apiFetch<unknown>(`api/user?${q}`, {
    method: 'PUT',
    body: JSON.stringify(toUserUpdateBody(payload)),
  })
  const user = normalizeUser(data)
  if (!user) throw new Error('Update user: invalid response from server')
  return user
}

/** POST `api/user/avatar?id={userId}` */
export async function uploadUserAvatar(userId: string, file: AvatarUploadPayload): Promise<User> {
  const id = userId.trim()
  if (!id) throw new Error('User id is required to upload avatar')

  const form = new FormData()
  form.append('avatar', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob)

  const q = new URLSearchParams({ id })
  const data = await apiFetch<unknown>(`api/user/avatar?${q}`, {
    method: 'POST',
    body: form,
  })
  const user = normalizeUser(data)
  if (!user) throw new Error('Upload avatar: invalid response from server')
  if (user.avatarUrl) {
    bumpAvatarCache(user.id)
  }
  return user
}

/** DELETE `api/user/avatar?id={userId}` */
export async function deleteUserAvatar(userId: string): Promise<User> {
  const id = userId.trim()
  if (!id) throw new Error('User id is required to delete avatar')

  const q = new URLSearchParams({ id })
  const data = await apiFetch<unknown>(`api/user/avatar?${q}`, { method: 'DELETE' })
  const user = normalizeUser(data)
  if (!user) throw new Error('Delete avatar: invalid response from server')
  bumpAvatarCache(user.id)
  return { ...user, avatarUrl: undefined }
}

/** DELETE `api/user?id={userId}` */
export async function deleteUser(userId: string): Promise<void> {
  const q = new URLSearchParams({ id: userId })
  await apiFetch<void>(`api/user?${q}`, { method: 'DELETE' })
}

export type UserSearchResult = {
  id: string
  username: string
  fullName: string
}

/** GET `api/user/search?q=` */
export async function searchUsers(query: string, limit = 8): Promise<UserSearchResult[]> {
  const q = new URLSearchParams({ q: query.trim(), limit: String(limit) })
  const data = await apiFetch<unknown>(`api/user/search?${q}`)
  if (!Array.isArray(data)) return []

  return data
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const id = pickStr(o, 'id', 'Id')
      const username = pickStr(o, 'username', 'Username')
      if (!id || !username) return null
      return {
        id,
        username,
        fullName: pickStr(o, 'fullName', 'FullName'),
      } satisfies UserSearchResult
    })
    .filter((u): u is UserSearchResult => u != null)
}

/** POST `api/auth/login` — stores tokens and loads the user profile, or throws MfaRequiredError. */
export class MfaRequiredError extends Error {
  readonly challengeToken: string

  constructor(challengeToken: string) {
    super('Two-factor authentication required.')
    this.name = 'MfaRequiredError'
    this.challengeToken = challengeToken
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<User> {
  try {
    const data = await apiFetch<unknown>(
      'api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password,
        }),
      },
      { skipAuth: true, skipRefresh: true },
    )

    const mfa = extractMfaChallenge(data)
    if (mfa) {
      throw new MfaRequiredError(mfa.challengeToken)
    }

    const tokens = await persistAuthTokens(data)
    if (!tokens) {
      throw new UnauthorizedError(INVALID_LOGIN_CREDENTIALS_MESSAGE)
    }

    return fetchCurrentUser(credentials.username)
  } catch (e) {
    if (e instanceof MfaRequiredError || e instanceof RequestTimeoutError) throw e
    throw new UnauthorizedError(resolveLoginErrorMessage(e))
  }
}

/** POST `api/auth/google` — stores tokens and loads the user profile, or throws MfaRequiredError. */
export async function loginWithGoogle(idToken: string): Promise<User> {
  try {
    const data = await apiFetch<unknown>(
      'api/auth/google',
      {
        method: 'POST',
        body: JSON.stringify({ idToken: idToken.trim() }),
      },
      { skipAuth: true, skipRefresh: true },
    )

    const mfa = extractMfaChallenge(data)
    if (mfa) {
      throw new MfaRequiredError(mfa.challengeToken)
    }

    const tokens = await persistAuthTokens(data)
    if (!tokens) {
      throw new UnauthorizedError('Google sign-in failed. Please try again.')
    }

    return fetchCurrentUser()
  } catch (e) {
    if (e instanceof MfaRequiredError || e instanceof RequestTimeoutError) throw e
    throw new UnauthorizedError(resolveLoginErrorMessage(e) || 'Google sign-in failed. Please try again.')
  }
}

function resolveLoginErrorMessage(error: unknown): string {
  if (error instanceof UnauthorizedError && error.message.trim()) {
    return error.message
  }

  if (error instanceof Error) {
    const raw = error.message.trim()
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as { message?: string }
        if (parsed.message?.trim()) return parsed.message.trim()
      } catch {
        /* ignore malformed JSON */
      }
    }
  }

  return INVALID_LOGIN_CREDENTIALS_MESSAGE
}
