const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

export function isSafeHttpUrl(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (url.username || url.password) return false

    const host = url.hostname.replace(/\.$/, '').toLowerCase()
    if (!host) return false
    if (BLOCKED_HOSTS.has(host)) return false
    if (host.endsWith('.local') || host.endsWith('.internal')) return false

    return true
  } catch {
    return false
  }
}

export function normalizeSafeUrl(raw: string): string | null {
  return isSafeHttpUrl(raw) ? new URL(raw.trim()).toString() : null
}
