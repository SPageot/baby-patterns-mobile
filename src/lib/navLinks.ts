import { shouldShowPricingInNav } from './subscription'

export type NavIconName =
  | 'heart'
  | 'users'
  | 'star'
  | 'diaper'
  | 'bottle'
  | 'moon'
  | 'potty'
  | 'chart'
  | 'growth'
  | 'health'
  | 'hospital'
  | 'calendar'
  | 'tag'

export type NavLink = {
  label: string
  href: `/${string}` | '/'
  requiresBaby: boolean
  icon: NavIconName
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/', requiresBaby: false, icon: 'heart' },
  { label: 'Why track', href: '/why', requiresBaby: false, icon: 'heart' },
  { label: 'Parents Corner', href: '/parents-corner', requiresBaby: false, icon: 'users' },
  { label: 'Reviews', href: '/reviews', requiresBaby: false, icon: 'star' },
  { label: 'Pricing', href: '/pricing', requiresBaby: false, icon: 'tag' },
  { label: 'Diapers', href: '/diapers', requiresBaby: true, icon: 'diaper' },
  { label: 'Feeding', href: '/feeding', requiresBaby: true, icon: 'bottle' },
  { label: 'Sleep', href: '/sleep', requiresBaby: true, icon: 'moon' },
  { label: 'Potty', href: '/potty', requiresBaby: true, icon: 'potty' },
  { label: 'Growth', href: '/growth', requiresBaby: true, icon: 'growth' },
  { label: 'Health', href: '/health', requiresBaby: true, icon: 'health' },
  { label: 'Pediatrician', href: '/pediatrician', requiresBaby: true, icon: 'hospital' },
  { label: 'Reports', href: '/reports', requiresBaby: true, icon: 'chart' },
  { label: 'Weekly summary', href: '/weekly-summary', requiresBaby: true, icon: 'calendar' },
  { label: 'Daily memories', href: '/daily-memories', requiresBaby: true, icon: 'heart' },
]

export function getVisibleNavLinks(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavLink[] {
  const { user } = options

  if (!user) {
    return NAV_LINKS.filter((link) => link.href === '/' || link.href === '/pricing')
  }

  return NAV_LINKS.filter((link) => {
    if (link.href === '/') return false
    if (link.href === '/pricing' && !shouldShowPricingInNav(user)) return false
    return true
  })
}

export type AccountLink = {
  label: string
  href: `/${string}`
}

export const ACCOUNT_LINKS: AccountLink[] = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Add a baby', href: '/add-baby' },
]
