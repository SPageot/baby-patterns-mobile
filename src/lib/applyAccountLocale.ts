import { getAppLocale, setAppLocale } from '@/i18n'
import type { AppLocale } from '@/i18n/localePreference'

export function normalizePreferredLocale(raw?: string | null): AppLocale | null {
  if (!raw?.trim()) return null
  const value = raw.trim().toLowerCase()
  if (value.startsWith('es')) return 'es'
  if (value.startsWith('en')) return 'en'
  return null
}

export async function applyAccountLocale(preferredLocale?: string | null): Promise<void> {
  const next = normalizePreferredLocale(preferredLocale)
  if (!next || next === getAppLocale()) return
  await setAppLocale(next)
}
