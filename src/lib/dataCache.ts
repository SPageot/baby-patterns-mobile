/** In-memory TTL cache for shared API payloads (babies, logs, brands, family, unread). */

type CacheEntry = {
  data: unknown
  fetchedAt: number
  ttlMs: number
}

const store = new Map<string, CacheEntry>()

export const BABIES_TTL_MS = 45_000
export const UNREAD_COUNT_TTL_MS = 30_000
export const BRANDS_TTL_MS = 30 * 60 * 1000
export const FAMILY_TTL_MS = 60_000
export const LOGS_TTL_MS = 60_000

function isFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < entry.ttlMs
}

export function babyIdsKey(babyIds: string[]): string {
  return babyIds
    .map((id) => id.trim())
    .filter(Boolean)
    .sort()
    .join(',')
}

export function getCachedData<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry || !isFresh(entry)) return null
  return entry.data as T
}

/** Returns data even when stale (for cache-first UI). */
export function peekCachedData<T>(key: string): { data: T; fresh: boolean } | null {
  const entry = store.get(key)
  if (!entry) return null
  return { data: entry.data as T, fresh: isFresh(entry) }
}

export function setCachedData<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, fetchedAt: Date.now(), ttlMs })
}

export function invalidateCachedData(key: string): void {
  store.delete(key)
}

export function invalidateCachedDataByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

export function invalidateAllDataCache(): void {
  store.clear()
}

const BABIES_META_KEY = 'babies:meta'

export function shouldRefreshBabies(): boolean {
  return getCachedData<{ ok: true }>(BABIES_META_KEY) == null
}

export function markBabiesFresh(): void {
  setCachedData(BABIES_META_KEY, { ok: true }, BABIES_TTL_MS)
}

export function invalidateBabiesCache(): void {
  invalidateCachedData(BABIES_META_KEY)
}

export type LogCacheKind =
  | 'diapers'
  | 'sleep'
  | 'feeding'
  | 'potty'
  | 'behavior'
  | 'growth'
  | 'health'
  | 'pediatrician'
  | 'memories'
  | 'reports'
  | 'weekly'

export function logsCacheKey(kind: LogCacheKind, babyIds: string[]): string {
  return `logs:${kind}:${babyIdsKey(babyIds)}`
}

export function brandsCacheKey(): string {
  return 'brands'
}

export function familyCacheKey(): string {
  return 'family'
}

export function unreadCountCacheKey(): string {
  return 'notifications:unread'
}

const LOGS_INVALIDATE_PREFIXES = [
  'api/diapers',
  'api/sleep',
  'api/feeding',
  'api/potty',
  'api/behavior',
  'api/growth',
  'api/milestone',
  'api/sickness',
  'api/injury',
  'api/pediatrician',
  'api/dailymemory',
  'api/DailyMemory',
]

const BABY_INVALIDATE_PREFIXES = ['api/baby', 'api/familymembers', 'api/family-members', 'api/FamilyMembers']

function pathMatches(path: string, prefixes: string[]): boolean {
  const normalized = path.replace(/^\//, '').split('?')[0] ?? ''
  return prefixes.some(
    (prefix) =>
      normalized === prefix ||
      normalized.toLowerCase() === prefix.toLowerCase() ||
      normalized.startsWith(`${prefix}/`) ||
      normalized.toLowerCase().startsWith(`${prefix.toLowerCase()}/`),
  )
}

export function invalidateDataCacheForMutation(path: string, method: string): void {
  const verb = method.toUpperCase()
  if (verb === 'GET' || verb === 'HEAD' || verb === 'OPTIONS') return

  if (pathMatches(path, LOGS_INVALIDATE_PREFIXES)) {
    invalidateCachedDataByPrefix('logs:')
  }
  if (pathMatches(path, BABY_INVALIDATE_PREFIXES)) {
    invalidateBabiesCache()
    invalidateCachedData(familyCacheKey())
    invalidateCachedDataByPrefix('logs:')
  }
  if (pathMatches(path, ['api/brand', 'api/brands', 'api/reviews'])) {
    invalidateCachedData(brandsCacheKey())
  }
  if (pathMatches(path, ['api/notifications', 'api/notification'])) {
    invalidateCachedData(unreadCountCacheKey())
  }
}

/** Cache-first load: apply peek immediately, skip network when fresh, else revalidate. */
export async function cacheFirstLoad<T>(options: {
  key: string
  ttlMs: number
  apply: (data: T) => void
  fetcher: () => Promise<T>
  showLoading?: boolean
  setLoading?: (loading: boolean) => void
  isCancelled?: () => boolean
}): Promise<void> {
  const peek = peekCachedData<T>(options.key)
  if (peek) {
    options.apply(peek.data)
    options.setLoading?.(false)
    if (peek.fresh) return
  } else if (options.showLoading) {
    options.setLoading?.(true)
  }

  try {
    const data = await options.fetcher()
    if (options.isCancelled?.()) return
    setCachedData(options.key, data, options.ttlMs)
    options.apply(data)
  } finally {
    if (!options.isCancelled?.()) {
      options.setLoading?.(false)
    }
  }
}
