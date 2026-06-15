export type NavIconName = 'heart' | 'users' | 'star' | 'diaper' | 'bottle' | 'moon'

export type NavLink = {
  label: string
  href: `/${string}` | '/'
  requiresBaby: boolean
  icon: NavIconName
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/', requiresBaby: false, icon: 'heart' },
  { label: 'Diapers', href: '/diapers', requiresBaby: true, icon: 'diaper' },
  { label: 'Feeding', href: '/feeding', requiresBaby: true, icon: 'bottle' },
  { label: 'Sleep', href: '/sleep', requiresBaby: true, icon: 'moon' },
  { label: 'Parents Corner', href: '/parents-corner', requiresBaby: false, icon: 'users' },
  { label: 'Reviews', href: '/reviews', requiresBaby: false, icon: 'star' },
]

export type AccountLink = {
  label: string
  href: `/${string}`
}

export const ACCOUNT_LINKS: AccountLink[] = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Add a baby', href: '/add-baby' },
]
