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
  | 'memories'
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
  { label: 'Solution Board', href: '/solution-board', requiresBaby: false, icon: 'star' },
  { label: 'Reviews', href: '/reviews', requiresBaby: false, icon: 'star' },
  { label: 'Pricing', href: '/pricing', requiresBaby: false, icon: 'tag' },
  { label: 'Diapers', href: '/diapers', requiresBaby: true, icon: 'diaper' },
  { label: 'Feeding', href: '/feeding', requiresBaby: true, icon: 'bottle' },
  { label: 'Sleep', href: '/sleep', requiresBaby: true, icon: 'moon' },
  { label: 'Potty', href: '/potty', requiresBaby: true, icon: 'potty' },
  { label: 'Growth & milestones', href: '/growth', requiresBaby: true, icon: 'growth' },
  { label: 'Health events', href: '/health', requiresBaby: true, icon: 'health' },
  { label: 'Pediatrician', href: '/pediatrician', requiresBaby: true, icon: 'hospital' },
  { label: 'Reports', href: '/reports', requiresBaby: true, icon: 'chart' },
  { label: 'Weekly summary', href: '/weekly-summary', requiresBaby: true, icon: 'calendar' },
  { label: 'Daily memories', href: '/daily-memories', requiresBaby: true, icon: 'memories' },
  { label: 'Profile', href: '/profile', requiresBaby: false, icon: 'heart' },
  { label: 'Settings', href: '/settings', requiresBaby: false, icon: 'tag' },
]

/** Routes shown in the bottom tab bar — excluded from the hamburger menu. */
export const BOTTOM_TAB_HREFS = new Set<string>([
  '/profile',
  '/parents-corner',
  '/solution-board',
  '/reports',
  '/settings',
])

export function getVisibleNavLinks(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavLink[] {
  const { user } = options

  if (!user) {
    return NAV_LINKS.filter(
      (link) =>
        link.href === '/' ||
        link.href === '/pricing' ||
        link.href === '/parents-corner' ||
        link.href === '/solution-board' ||
        link.href === '/reviews' ||
        link.href === '/why',
    )
  }

  return NAV_LINKS.filter((link) => {
    if (link.href === '/') return false
    if (link.href === '/pricing' && !shouldShowPricingInNav(user)) return false
    return true
  })
}

export function getHamburgerMenuLinks(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavLink[] {
  return getVisibleNavLinks(options).filter((link) => !BOTTOM_TAB_HREFS.has(link.href))
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
