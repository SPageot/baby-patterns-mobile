import { setAppLocale, getAppLocale } from '@/i18n'
import type { AppLocale } from '@/i18n/localePreference'

export function normalizePreferredLocale(raw?: string | null): AppLocale | null {
  const value = (raw ?? '').trim().toLowerCase()
  if (!value) return null
  if (value.startsWith('en')) return 'en'
  return null
}

export async function applyAccountLocale(preferredLocale?: string | null): Promise<void> {
  const next = normalizePreferredLocale(preferredLocale) ?? 'en'
  if (next === getAppLocale()) return
  await setAppLocale(next)
}
