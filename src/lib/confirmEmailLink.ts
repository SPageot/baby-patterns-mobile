import * as Linking from 'expo-linking'
import { router } from 'expo-router'

/** Extract confirm-email token from app or website confirmation URLs. */
export function confirmEmailTokenFromUrl(url: string): string | null {
  try {
    const trimmed = url.trim()
    if (!trimmed) return null

    const parsed = Linking.parse(trimmed)
    const path = (parsed.path ?? '').replace(/^\//, '').toLowerCase()
    const isConfirmPath =
      path === 'confirm-email' ||
      path.endsWith('/confirm-email') ||
      trimmed.toLowerCase().includes('/confirm-email')

    if (!isConfirmPath) return null

    const raw = parsed.queryParams?.token
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0].trim()

    // Fallback for full https URLs expo-linking may not parse fully
    try {
      const web = new URL(trimmed)
      const token = web.searchParams.get('token')?.trim()
      if (token) return token
    } catch {
      /* not a standard URL */
    }
  } catch {
    /* ignore malformed URLs */
  }
  return null
}

export function openConfirmEmailFromUrl(url: string): boolean {
  const token = confirmEmailTokenFromUrl(url)
  if (!token) return false
  router.push(`/confirm-email?token=${encodeURIComponent(token)}` as never)
  return true
}
