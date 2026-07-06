import { ACCOUNT_LINKS, type NavIconName } from '@/lib/navLinks'
import { shouldShowPricingInNav } from '@/lib/subscription'

export type TabId =
  | 'reports'
  | 'profile'
  | 'tracking'
  | 'health'
  | 'parents-corner'
  | 'daily-memories'

export type TabSubLink = {
  label: string
  href: `/${string}`
  icon: NavIconName
  requiresAuth?: boolean
}

export type TabConfig = {
  id: TabId
  label: string
  shortLabel: string
  icon: NavIconName
  href?: `/${string}`
  paths: string[]
  requiresAuth?: boolean
}

/** Floating pill tab bar */
export const TAB_PILL_HEIGHT = 44
export const TAB_DOCK_PADDING = 12
export const TAB_SUB_NAV_HEIGHT = 40
export const TAB_SUB_NAV_GAP = 10

export const APP_TABS: TabConfig[] = [
  {
    id: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    icon: 'chart',
    paths: ['/reports', '/weekly-summary'],
    requiresAuth: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: 'heart',
    paths: ['/profile', '/settings', '/add-baby', '/pricing', '/reviews', '/why'],
  },
  {
    id: 'tracking',
    label: 'Tracking',
    shortLabel: 'Track',
    icon: 'moon',
    paths: ['/sleep', '/feeding', '/diapers', '/potty'],
    requiresAuth: true,
  },
  {
    id: 'health',
    label: 'Health',
    shortLabel: 'Health',
    icon: 'health',
    paths: ['/health', '/pediatrician', '/growth'],
    requiresAuth: true,
  },
  {
    id: 'parents-corner',
    label: 'Parents Corner',
    shortLabel: 'Parents',
    icon: 'users',
    href: '/parents-corner',
    paths: ['/parents-corner', '/solution-board'],
  },
  {
    id: 'daily-memories',
    label: 'Daily Memories',
    shortLabel: 'Memories',
    icon: 'calendar',
    href: '/daily-memories',
    paths: ['/daily-memories'],
    requiresAuth: true,
  },
]

const REPORTS_SUB_LINKS: TabSubLink[] = [
  { label: 'Reports', href: '/reports', icon: 'chart', requiresAuth: true },
  { label: 'Weekly summary', href: '/weekly-summary', icon: 'calendar', requiresAuth: true },
]

const TRACKING_SUB_LINKS: TabSubLink[] = [
  { label: 'Sleep', href: '/sleep', icon: 'moon', requiresAuth: true },
  { label: 'Feeding', href: '/feeding', icon: 'bottle', requiresAuth: true },
  { label: 'Diapers', href: '/diapers', icon: 'diaper', requiresAuth: true },
  { label: 'Potty', href: '/potty', icon: 'potty', requiresAuth: true },
]

const HEALTH_SUB_LINKS: TabSubLink[] = [
  { label: 'Health', href: '/health', icon: 'health', requiresAuth: true },
  { label: 'Pediatrician', href: '/pediatrician', icon: 'hospital', requiresAuth: true },
  { label: 'Growth', href: '/growth', icon: 'growth', requiresAuth: true },
]

const PARENTS_SUB_LINKS: TabSubLink[] = [
  { label: 'Parents Corner', href: '/parents-corner', icon: 'users' },
  { label: 'Solution Board', href: '/solution-board', icon: 'star' },
]

const GUEST_PROFILE_SUB_LINKS: TabSubLink[] = [
  { label: 'Log in', href: '/login', icon: 'heart' },
  { label: 'Sign up', href: '/signup', icon: 'star' },
]

export function normalizeAppPath(path: string): string {
  const base = path.split('?')[0] || '/'
  return base
}

export function pathMatchesTab(pathname: string, tab: TabConfig): boolean {
  const path = normalizeAppPath(pathname)
  if (path === '/' && tab.id === 'profile') return false
  return tab.paths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function tabForPathname(pathname: string): TabId | null {
  const path = normalizeAppPath(pathname)
  if (path === '/' || path === '') return null
  const match = APP_TABS.find((tab) => pathMatchesTab(path, tab))
  return match?.id ?? null
}

export function isSubLinkActive(pathname: string, href: string): boolean {
  const path = normalizeAppPath(pathname)
  if (href === '/') return path === '/' || path === ''
  return path === href || path.startsWith(`${href}/`)
}

/** Always show all six tabs */
export function getVisibleTabs(): TabConfig[] {
  return APP_TABS
}

export function getSubLinksForTab(
  tabId: TabId,
  user: {
    id?: string
    isPro?: boolean
    isSiteDeveloper?: boolean
    hasProAccess?: boolean
  } | null,
): TabSubLink[] {
  if (!user) {
    if (tabId === 'profile') return GUEST_PROFILE_SUB_LINKS
    if (tabId === 'reports') return REPORTS_SUB_LINKS
    if (tabId === 'tracking') return TRACKING_SUB_LINKS
    if (tabId === 'health') return HEALTH_SUB_LINKS
    if (tabId === 'parents-corner') return PARENTS_SUB_LINKS
    return []
  }

  switch (tabId) {
    case 'reports':
      return REPORTS_SUB_LINKS
    case 'profile': {
      const links: TabSubLink[] = ACCOUNT_LINKS.map((link) => ({
        label: link.label,
        href: link.href,
        icon: link.href === '/profile' ? 'heart' : link.href === '/settings' ? 'tag' : 'growth',
      }))
      if (shouldShowPricingInNav(user)) {
        links.push({ label: 'Pricing', href: '/pricing', icon: 'tag' })
      }
      links.push({ label: 'Reviews', href: '/reviews', icon: 'star' })
      links.push({ label: 'Why track', href: '/why', icon: 'heart' })
      return links
    }
    case 'tracking':
      return TRACKING_SUB_LINKS
    case 'health':
      return HEALTH_SUB_LINKS
    case 'parents-corner':
      return PARENTS_SUB_LINKS
    default:
      return []
  }
}

export function tabHasSubNav(tabId: TabId, user: { id?: string } | null): boolean {
  return getSubLinksForTab(tabId, user).length > 0
}

export function tabNeedsLogin(tab: TabConfig, user: { id?: string } | null): boolean {
  return Boolean(tab.requiresAuth && !user?.id)
}

export function subLinkNeedsLogin(link: TabSubLink, user: { id?: string } | null): boolean {
  return Boolean(link.requiresAuth && !user?.id)
}

export function computeTabNavBottomInset(
  insetBottom: number,
  showSubNav: boolean,
): number {
  return (
    insetBottom +
    TAB_DOCK_PADDING +
    TAB_PILL_HEIGHT +
    (showSubNav ? TAB_SUB_NAV_GAP + TAB_SUB_NAV_HEIGHT : 0)
  )
}

/** @deprecated use TAB_PILL_HEIGHT */
export const TAB_BAR_HEIGHT = TAB_PILL_HEIGHT
