import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  APP_TABS,
  computeTabNavBottomInset,
  getVisibleTabs,
  normalizeAppPath,
  tabForPathname,
  type TabId,
} from '@/lib/tabNavConfig'

type TabNavContextValue = {
  bottomInset: number
  activeTabId: TabId | null
  visibleTabs: ReturnType<typeof getVisibleTabs>
}

const TabNavContext = createContext<TabNavContextValue | null>(null)

export function TabNavProvider({ children }: { children: ReactNode }) {
  const pathname = normalizeAppPath(usePathname())
  const insets = useSafeAreaInsets()

  const activeTabId = tabForPathname(pathname)
  const visibleTabs = getVisibleTabs()
  const bottomInset = useMemo(() => computeTabNavBottomInset(insets.bottom), [insets.bottom])

  const value = useMemo(
    () => ({
      bottomInset,
      activeTabId,
      visibleTabs,
    }),
    [bottomInset, activeTabId, visibleTabs],
  )

  return <TabNavContext.Provider value={value}>{children}</TabNavContext.Provider>
}

export function useTabNav() {
  const ctx = useContext(TabNavContext)
  if (!ctx) {
    throw new Error('useTabNav must be used within TabNavProvider')
  }
  return ctx
}

export { APP_TABS }
