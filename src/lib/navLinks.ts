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
  | 'info'
  | 'check'
  | 'apple'
  | 'edit'

export type NavGroupId = 'daily' | 'health' | 'insights' | 'community' | 'plan'

export type NavLink = {
  label: string
  href: `/${string}` | '/'
  requiresBaby: boolean
  icon: NavIconName
  group: NavGroupId
}

export type NavSection = {
  id: NavGroupId
  label: string
  links: NavLink[]
}

const NAV_GROUP_ORDER: NavGroupId[] = ['daily', 'health', 'insights', 'community', 'plan']

const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  daily: 'Daily care',
  health: 'Health & growth',
  insights: 'Insights',
  community: 'Community',
  plan: 'Plan',
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/', requiresBaby: false, icon: 'heart', group: 'community' },
  { label: 'Why track', href: '/why', requiresBaby: false, icon: 'heart', group: 'community' },
  { label: 'Diapers', href: '/diapers', requiresBaby: true, icon: 'diaper', group: 'daily' },
  { label: 'Feeding', href: '/feeding', requiresBaby: true, icon: 'bottle', group: 'daily' },
  { label: 'Sleep', href: '/sleep', requiresBaby: true, icon: 'moon', group: 'daily' },
  { label: 'Potty', href: '/potty', requiresBaby: true, icon: 'potty', group: 'daily' },
  { label: 'Behavior', href: '/behavior', requiresBaby: true, icon: 'tag', group: 'daily' },
  { label: 'Growth & milestones', href: '/growth', requiresBaby: true, icon: 'growth', group: 'health' },
  { label: 'Health events', href: '/health', requiresBaby: true, icon: 'health', group: 'health' },
  { label: 'Pediatrician', href: '/pediatrician', requiresBaby: true, icon: 'hospital', group: 'health' },
  { label: 'Reports', href: '/reports', requiresBaby: true, icon: 'chart', group: 'insights' },
  { label: 'Weekly summary', href: '/weekly-summary', requiresBaby: true, icon: 'calendar', group: 'insights' },
  { label: 'Daily memories', href: '/daily-memories', requiresBaby: true, icon: 'memories', group: 'insights' },
  { label: 'Parents Corner', href: '/parents-corner', requiresBaby: false, icon: 'users', group: 'community' },
  { label: 'Parent Solutions Board', href: '/solution-board', requiresBaby: false, icon: 'check', group: 'community' },
  { label: 'Reviews', href: '/reviews', requiresBaby: false, icon: 'star', group: 'community' },
  { label: 'Consultants', href: '/consultants', requiresBaby: false, icon: 'info', group: 'community' },
  { label: 'Pricing', href: '/pricing', requiresBaby: false, icon: 'apple', group: 'plan' },
  { label: 'Profile', href: '/profile', requiresBaby: false, icon: 'heart', group: 'community' },
  { label: 'Settings', href: '/settings', requiresBaby: false, icon: 'tag', group: 'plan' },
]

/** Routes shown in the bottom tab bar — excluded from the hamburger menu. */
export const BOTTOM_TAB_HREFS = new Set<string>([
  '/profile',
  '/parents-corner',
  '/solution-board',
  '/reports',
  '/settings',
])

const GUEST_HREFS = new Set<string>([
  '/',
  '/pricing',
  '/parents-corner',
  '/solution-board',
  '/reviews',
  '/consultants',
  '/feedback',
  '/why',
])

function isNavLinkVisible(
  link: NavLink,
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null,
): boolean {
  if (!user) {
    return GUEST_HREFS.has(link.href)
  }
  if (link.href === '/') return false
  if (link.href === '/pricing' && !shouldShowPricingInNav(user)) return false
  return true
}

function groupLinks(links: NavLink[]): NavSection[] {
  return NAV_GROUP_ORDER.map((id) => ({
    id,
    label: NAV_GROUP_LABELS[id],
    links: links.filter((link) => link.group === id),
  })).filter((section) => section.links.length > 0)
}

export function getVisibleNavLinks(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavLink[] {
  return getVisibleNavSections(options).flatMap((section) => section.links)
}

export function getVisibleNavSections(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavSection[] {
  const { user } = options
  return groupLinks(NAV_LINKS.filter((link) => isNavLinkVisible(link, user)))
}

export function getHamburgerMenuLinks(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavLink[] {
  return getHamburgerMenuSections(options).flatMap((section) => section.links)
}

export function getHamburgerMenuSections(options: {
  user: { id?: string; isPro?: boolean; isSiteDeveloper?: boolean; hasProAccess?: boolean } | null
}): NavSection[] {
  const links = getVisibleNavLinks(options).filter((link) => !BOTTOM_TAB_HREFS.has(link.href))
  return groupLinks(links)
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
