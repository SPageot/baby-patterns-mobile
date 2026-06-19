import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'bp:avatarBust:'
const bustByUser = new Map<string, string>()

function storageKey(userId: string): string {
  return `${PREFIX}${userId.trim()}`
}

export function bumpAvatarCache(userId: string): void {
  const bust = String(Date.now())
  bustByUser.set(userId.trim(), bust)
  void AsyncStorage.setItem(storageKey(userId), bust)
}

export function readAvatarCacheBust(userId: string): string {
  const id = userId.trim()
  const cached = bustByUser.get(id)
  if (cached) return cached
  const created = String(Date.now())
  bustByUser.set(id, created)
  return created
}

export function wasAvatarRecentlyUpdated(userId: string, maxAgeMs = 120_000): boolean {
  const cached = bustByUser.get(userId.trim())
  if (!cached) return false
  const age = Date.now() - Number(cached)
  return Number.isFinite(age) && age >= 0 && age < maxAgeMs
}

export async function hydrateAvatarCache(userId: string): Promise<void> {
  const id = userId.trim()
  if (!id) return
  try {
    const stored = await AsyncStorage.getItem(storageKey(id))
    if (stored) bustByUser.set(id, stored)
  } catch {
    /* ignore */
  }
}
