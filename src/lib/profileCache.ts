const USER_TTL_MS = 5 * 60 * 1000

let userCache: { userId: string; fetchedAt: number } | null = null

function isFresh(fetchedAt: number, ttlMs: number): boolean {
  return Date.now() - fetchedAt < ttlMs
}

export function shouldRefreshProfileUser(userId: string): boolean {
  if (!userCache || userCache.userId !== userId) return true
  return !isFresh(userCache.fetchedAt, USER_TTL_MS)
}

export function markProfileUserFresh(userId: string): void {
  userCache = { userId, fetchedAt: Date.now() }
}

export function invalidateProfileUserCache(): void {
  userCache = null
}

export function invalidateAllProfileCache(): void {
  invalidateProfileUserCache()
}
