import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useApp } from '@/context/AppContext'
import {
  APP_TABS,
  computeTabNavBottomInset,
  getVisibleTabs,
  normalizeAppPath,
  tabForPathname,
  tabHasSubNav,
  type TabId,
} from '@/lib/tabNavConfig'

type TabNavContextValue = {
  bottomInset: number
  activeTabId: TabId | null
  focusedTabId: TabId | null
  setFocusedTabId: (id: TabId | null) => void
  selectedTabId: TabId | null
  visibleTabs: ReturnType<typeof getVisibleTabs>
}

const TabNavContext = createContext<TabNavContextValue | null>(null)

export function TabNavProvider({ children }: { children: ReactNode }) {
  const pathname = normalizeAppPath(usePathname())
  const insets = useSafeAreaInsets()
  const { user } = useApp()
  const [focusedTabId, setFocusedTabId] = useState<TabId | null>(null)

  const activeTabId = tabForPathname(pathname)
  const visibleTabs = getVisibleTabs()
  const selectedTabId = activeTabId ?? focusedTabId
  const showSubNav = selectedTabId != null && tabHasSubNav(selectedTabId, user)

  useEffect(() => {
    if (activeTabId) setFocusedTabId(null)
  }, [activeTabId])

  const bottomInset = useMemo(
    () => computeTabNavBottomInset(insets.bottom, showSubNav),
    [insets.bottom, showSubNav],
  )

  const value = useMemo(
    () => ({
      bottomInset,
      activeTabId,
      focusedTabId,
      setFocusedTabId,
      selectedTabId,
      visibleTabs,
    }),
    [bottomInset, activeTabId, focusedTabId, selectedTabId, visibleTabs],
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
