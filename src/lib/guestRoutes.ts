import { normalizeAppPath } from '@/lib/tabNavConfig'

const GUEST_ALLOWED_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/confirm-email',
  '/pricing',
  '/parents-corner',
  '/solution-board',
  '/recommendation-shop',
  '/consultants',
  '/feedback',
  '/why',
  '/terms',
  '/privacy',
])

export function isGuestAllowedPath(pathname: string): boolean {
  return GUEST_ALLOWED_PATHS.has(normalizeAppPath(pathname))
}

export const GUEST_ENTRY_PATH = '/login' as const
