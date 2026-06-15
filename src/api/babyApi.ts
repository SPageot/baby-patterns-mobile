import { extractUserId } from '@/api/userApi'
import { apiFetch } from '@/api/client'
import type { Baby, BabySignup } from '@/schemas/user'

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isGuidLike(value: string): boolean {
  return GUID_RE.test(value.trim())
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return false
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function unwrapBabyPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const envelope = raw as Record<string, unknown>
  const nested = envelope.result ?? envelope.Result

  if (typeof nested === 'string') {
    const text = nested.trim()
    if (!text) return envelope
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

/** Prefer baby GUID from `result` string/object; ignore .NET task numeric `id`. */
function pickBabyId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') {
    const s = raw.trim()
    return isGuidLike(s) ? s : ''
  }
  if (typeof raw !== 'object') return ''

  const o = raw as Record<string, unknown>
  const result = o.result ?? o.Result

  if (typeof result === 'string') {
    const s = result.trim()
    if (isGuidLike(s)) return s
    try {
      const parsed = JSON.parse(s) as unknown
      const nested = pickBabyId(parsed)
      if (nested) return nested
    } catch {
      /* not JSON */
    }
  }

  if (result && typeof result === 'object' && !Array.isArray(result)) {
    const nested = pickBabyId(result)
    if (nested) return nested
  }

  const payload = unwrapBabyPayload(raw)
  if (payload) {
    for (const key of ['babyId', 'BabyId', 'id', 'Id']) {
      const v = pickStr(payload, key)
      if (v && isGuidLike(v)) return v
    }
  }

  for (const key of ['babyId', 'BabyId', 'id', 'Id']) {
    const v = pickStr(o, key)
    if (v && isGuidLike(v)) return v
  }

  const fallback = extractUserId(raw)
  return fallback && isGuidLike(fallback) ? fallback : ''
}

function pickBabyField(
  payload: Record<string, unknown>,
  envelope: Record<string, unknown> | null,
  ...keys: string[]
): string {
  const fromPayload = pickStr(payload, ...keys)
  if (fromPayload) return fromPayload
  if (envelope) return pickStr(envelope, ...keys)
  return ''
}

export function normalizeBaby(raw: unknown): Baby | null {
  if (!raw || typeof raw !== 'object') return null
  const envelope = raw as Record<string, unknown>
  const payload = unwrapBabyPayload(raw)
  if (!payload) return null

  const id =
    pickBabyId(raw) ||
    (() => {
      for (const key of ['babyId', 'BabyId', 'id', 'Id']) {
        const v = pickStr(payload, key)
        if (v && !isNumericId(v)) return v
      }
      for (const key of ['babyId', 'BabyId', 'id', 'Id']) {
        const v = pickStr(envelope, key)
        if (v && !isNumericId(v)) return v
      }
      return ''
    })()
  const fullName = pickBabyField(payload, envelope, 'fullName', 'FullName')
  const userId = pickBabyField(payload, envelope, 'userId', 'UserId')
  if (!id && !fullName) return null

  return {
    id,
    userId,
    fullName: fullName || '',
    age: pickNum(payload, 'age', 'Age') ?? pickNum(envelope, 'age', 'Age'),
    birthdate: pickBabyField(payload, envelope, 'birthdate', 'Birthdate', 'birthDate', 'BirthDate'),
    locationBorn: pickBabyField(payload, envelope, 'locationBorn', 'LocationBorn'),
    currentLocation: pickBabyField(payload, envelope, 'currentLocation', 'CurrentLocation'),
    weight: pickNum(payload, 'weight', 'Weight') ?? pickNum(envelope, 'weight', 'Weight'),
    height: pickNum(payload, 'height', 'Height') ?? pickNum(envelope, 'height', 'Height'),
    isShared: pickBool(payload, 'isShared', 'IsShared') || pickBool(envelope, 'isShared', 'IsShared'),
    sharedFromUsername:
      pickBabyField(payload, envelope, 'sharedFromUsername', 'SharedFromUsername') || undefined,
    sharedFromFullName:
      pickBabyField(payload, envelope, 'sharedFromFullName', 'SharedFromFullName') || undefined,
  }
}

/** Merge API create response with submitted signup fields (keeps name when API only returns id). */
export function babyFromSignupResponse(signup: BabySignup, data: unknown): Baby {
  const parsed = normalizeBaby(data)
  const id = pickBabyId(data) || parsed?.id?.trim() || ''
  return {
    id,
    userId: signup.userId,
    fullName: parsed?.fullName?.trim() || signup.fullName,
    age: parsed?.age ?? signup.age,
    birthdate: parsed?.birthdate || signup.birthdate,
    locationBorn: parsed?.locationBorn || signup.locationBorn,
    currentLocation: parsed?.currentLocation || signup.currentLocation,
    weight: parsed?.weight ?? signup.weight,
    height: parsed?.height ?? signup.height,
  }
}

function toBabySignupBody(baby: BabySignup): Record<string, unknown> {
  return {
    userId: baby.userId,
    fullName: baby.fullName,
    age: baby.age,
    birthdate: baby.birthdate,
    locationBorn: baby.locationBorn,
    currentLocation: baby.currentLocation,
    weight: baby.weight,
    height: baby.height,
  }
}

/** POST `api/auth/baby/signup` */
export async function createBaby(baby: BabySignup, options?: { timeoutMs?: number }): Promise<Baby> {
  const data = await apiFetch<unknown>(
    'api/auth/baby/signup',
    {
      method: 'POST',
      body: JSON.stringify(toBabySignupBody(baby)),
    },
    { timeoutMs: options?.timeoutMs },
  )
  return babyFromSignupResponse(baby, data)
}

/** PUT `api/baby?id={babyId}` */
export async function updateBaby(baby: Baby): Promise<Baby> {
  const id = baby.id?.trim()
  const userId = baby.userId?.trim()
  if (!id) throw new Error('Baby id is required to update')
  if (!userId) throw new Error('User id is required to update baby')

  const q = new URLSearchParams({ id })
  const data = await apiFetch<unknown>(`api/baby?${q}`, {
    method: 'PUT',
    body: JSON.stringify(toBabySignupBody({ ...baby, userId })),
  })
  const updated = normalizeBaby(data)
  if (!updated?.id) throw new Error('Update baby: invalid response from server')
  return updated
}

function normalizeBabyList(data: unknown): Baby[] {
  if (data == null) return []

  if (Array.isArray(data)) {
    const out: Baby[] = []
    for (const item of data) {
      const row = normalizeBaby(item)
      if (row?.id) out.push(row)
    }
    return out
  }

  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const result = o.result ?? o.Result

    if (Array.isArray(result)) return normalizeBabyList(result)

    const list =
      o.data ??
      o.items ??
      o.results ??
      o.value ??
      o.babies ??
      o.Babies
    if (Array.isArray(list)) return normalizeBabyList(list)

    if (result && typeof result === 'object') return normalizeBabyList(result)

    const single = normalizeBaby(data)
    return single?.id ? [single] : []
  }

  return []
}

/** GET `api/baby?id=` or `api/baby?userId=` — all babies for the parent user. */
export async function fetchBabiesForUser(userId: string): Promise<Baby[]> {
  const id = userId.trim()
  if (!id) throw new Error('User id is required to load babies')
  const q = isGuidLike(id) ? new URLSearchParams({ userId: id }) : new URLSearchParams({ id })
  const data = await apiFetch<unknown>(`api/baby?${q}`)
  return normalizeBabyList(data)
}

/** GET `api/baby/accessible` — own babies plus babies shared by family/friends. */
export async function fetchAccessibleBabies(): Promise<Baby[]> {
  const data = await apiFetch<unknown>('api/baby/accessible')
  return normalizeBabyList(data)
}

/** First baby for a user from session or API. */
export async function resolveBabyForUser(userId: string): Promise<Baby | null> {
  const id = userId.trim()
  if (!id) return null
  const babies = await fetchBabiesForUser(id)
  return babies.find((b) => b.id?.trim()) ?? null
}
