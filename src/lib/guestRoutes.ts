import { normalizeAppPath } from '@/lib/tabNavConfig'

const GUEST_ALLOWED_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/parents-corner',
  '/solution-board',
  '/reviews',
  '/consultants',
  '/why',
  '/terms',
  '/privacy',
])

export function isGuestAllowedPath(pathname: string): boolean {
  return GUEST_ALLOWED_PATHS.has(normalizeAppPath(pathname))
}

export const GUEST_ENTRY_PATH = '/login' as const
