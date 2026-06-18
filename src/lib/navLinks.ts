export type NavIconName =
  | 'heart'
  | 'users'
  | 'star'
  | 'diaper'
  | 'bottle'
  | 'moon'
  | 'chart'
  | 'growth'
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
  { label: 'Parents Corner', href: '/parents-corner', requiresBaby: false, icon: 'users' },
  { label: 'Reviews', href: '/reviews', requiresBaby: false, icon: 'star' },
  { label: 'Pricing', href: '/pricing', requiresBaby: false, icon: 'tag' },
  { label: 'Diapers', href: '/diapers', requiresBaby: true, icon: 'diaper' },
  { label: 'Feeding', href: '/feeding', requiresBaby: true, icon: 'bottle' },
  { label: 'Sleep', href: '/sleep', requiresBaby: true, icon: 'moon' },
  { label: 'Growth', href: '/growth', requiresBaby: true, icon: 'growth' },
  { label: 'Reports', href: '/reports', requiresBaby: true, icon: 'chart' },
  { label: 'Weekly summary', href: '/weekly-summary', requiresBaby: true, icon: 'calendar' },
]

export function getVisibleNavLinks(options: {
  hasBaby: boolean
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavLink[] {
  const { hasBaby, user } = options
  const hasProAccess = Boolean(
    user?.hasProAccess ?? user?.isPro ?? user?.isSiteDeveloper,
  )
  return NAV_LINKS.filter((link) => {
    if (link.href === '/' && user) return false
    if (link.href === '/pricing' && hasProAccess) return false
    if (!link.requiresBaby) return true
    if (hasBaby) return true
    return Boolean(user && link.href === '/diapers')
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
