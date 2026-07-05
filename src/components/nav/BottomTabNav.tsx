import { Pressable, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NavIcon } from '@/components/icons/NavIcon'
import { TabSubNavRow } from '@/components/nav/TabSubNavRow'
import { useApp } from '@/context/AppContext'
import { useTabNav } from '@/context/TabNavContext'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import {
  TAB_DOCK_PADDING,
  TAB_PILL_HEIGHT,
  getSubLinksForTab,
  isSubLinkActive,
  normalizeAppPath,
  tabNeedsLogin,
  type TabConfig,
  type TabId,
} from '@/lib/tabNavConfig'

const createStyles = (t: AppPalette) => ({
  dock: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    paddingHorizontal: 20,
    pointerEvents: 'box-none' as const,
  },
  stack: {
    width: '100%' as const,
    maxWidth: 420,
    alignItems: 'center' as const,
    pointerEvents: 'box-none' as const,
  },
  pill: {
    width: '100%' as const,
    minHeight: TAB_PILL_HEIGHT,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: t.card,
    borderRadius: HomeRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#2f2a38',
    shadowOpacity: t.mode === 'light' ? 0.12 : 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 4,
    borderRadius: HomeRadius.pill,
  },
  tabActive: {
    backgroundColor: t.mode === 'light' ? 'rgba(47, 42, 56, 0.06)' : 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.75,
  },
})

function onTabPress(
  tab: TabConfig,
  pathname: string,
  router: ReturnType<typeof useRouter>,
  user: { id?: string } | null,
  setFocusedTabId: (id: TabId | null) => void,
) {
  if (tab.href) {
    if (tabNeedsLogin(tab, user)) {
      router.push('/login')
      return
    }
    setFocusedTabId(null)
    router.push(tab.href as '/')
    return
  }

  setFocusedTabId(tab.id)

  const subLinks = getSubLinksForTab(tab.id, user)
  if (!subLinks.length) return

  const onChild = subLinks.some((link) => isSubLinkActive(pathname, link.href))
  if (!onChild && user?.id) {
    router.push(subLinks[0].href as '/')
  }
}

export function BottomTabNav() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = normalizeAppPath(usePathname())
  const { user } = useApp()
  const { visibleTabs, selectedTabId, setFocusedTabId } = useTabNav()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  const subLinks = selectedTabId ? getSubLinksForTab(selectedTabId, user) : []

  return (
    <View
      style={[styles.dock, { paddingBottom: insets.bottom + TAB_DOCK_PADDING }]}
      pointerEvents="box-none"
    >
      <View style={styles.stack} pointerEvents="box-none">
        {selectedTabId && subLinks.length ? <TabSubNavRow links={subLinks} /> : null}
        <View style={styles.pill}>
          {visibleTabs.map((tab) => {
            const active = selectedTabId === tab.id
            const iconColor = active ? colors.text : colors.textMuted
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                onPress={() => onTabPress(tab, pathname, router, user, setFocusedTabId)}
                style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
              >
                <NavIcon name={tab.icon} size={18} color={iconColor} />
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}
