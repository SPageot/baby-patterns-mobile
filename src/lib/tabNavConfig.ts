import type { NavIconName } from '@/lib/navLinks'

export type TabId = 'profile' | 'parents-corner' | 'solution-board' | 'reports' | 'settings'

export type TabConfig = {
  id: TabId
  label: string
  shortLabel: string
  icon: NavIconName
  href: `/${string}`
  paths: string[]
  requiresAuth?: boolean
}

/** Floating pill tab bar */
export const TAB_PILL_HEIGHT = 52
export const TAB_DOCK_PADDING = 12

export const APP_TABS: TabConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: 'heart',
    href: '/profile',
    paths: ['/profile', '/add-baby'],
  },
  {
    id: 'parents-corner',
    label: 'Parents Corner',
    shortLabel: 'Parents',
    icon: 'users',
    href: '/parents-corner',
    paths: ['/parents-corner'],
  },
  {
    id: 'solution-board',
    label: 'Solution Board',
    shortLabel: 'Solutions',
    icon: 'star',
    href: '/solution-board',
    paths: ['/solution-board'],
  },
  {
    id: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    icon: 'chart',
    href: '/reports',
    paths: ['/reports', '/weekly-summary'],
    requiresAuth: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: 'tag',
    href: '/settings',
    paths: ['/settings', '/pricing'],
  },
]

export function normalizeAppPath(path: string): string {
  const base = path.split('?')[0] || '/'
  return base
}

export function pathMatchesTab(pathname: string, tab: TabConfig): boolean {
  const path = normalizeAppPath(pathname)
  return tab.paths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function tabForPathname(pathname: string): TabId | null {
  const path = normalizeAppPath(pathname)
  if (path === '/' || path === '') return null
  const match = APP_TABS.find((tab) => pathMatchesTab(path, tab))
  return match?.id ?? null
}

export function getVisibleTabs(): TabConfig[] {
  return APP_TABS
}

export function tabNeedsLogin(tab: TabConfig, user: { id?: string } | null): boolean {
  return Boolean(tab.requiresAuth && !user?.id)
}

export function computeTabNavBottomInset(insetBottom: number): number {
  return insetBottom + TAB_DOCK_PADDING + TAB_PILL_HEIGHT
}

/** @deprecated use TAB_PILL_HEIGHT */
export const TAB_BAR_HEIGHT = TAB_PILL_HEIGHT
