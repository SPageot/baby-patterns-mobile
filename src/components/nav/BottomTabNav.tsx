import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NavIcon } from '@/components/icons/NavIcon'
import { useApp } from '@/context/AppContext'
import { useTabNav } from '@/context/TabNavContext'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import {
  TAB_DOCK_PADDING,
  tabNeedsLogin,
  type TabConfig,
  type TabId,
} from '@/lib/tabNavConfig'

const TAB_LABEL_KEYS: Record<TabId, string> = {
  profile: 'nav.tabs.profile',
  'parents-corner': 'nav.tabs.parents',
  'solution-board': 'nav.tabs.solutions',
  reports: 'nav.tabs.reports',
  settings: 'nav.tabs.settings',
}

const createStyles = (t: AppPalette) => ({
  dock: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    paddingHorizontal: 12,
    pointerEvents: 'box-none' as const,
  },
  pill: {
    width: '100%' as const,
    maxWidth: 420,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: t.card,
    borderRadius: HomeRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 4,
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
    paddingHorizontal: 2,
    borderRadius: HomeRadius.pill,
    gap: 2,
  },
  tabActive: {
    backgroundColor: t.mode === 'light' ? 'rgba(47, 42, 56, 0.06)' : 'rgba(255, 255, 255, 0.08)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  labelActive: {
    color: t.text,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.75,
  },
})

function onTabPress(
  tab: TabConfig,
  router: ReturnType<typeof useRouter>,
  user: { id?: string } | null,
) {
  if (tabNeedsLogin(tab, user)) {
    router.push('/login')
    return
  }
  router.push(tab.href as '/')
}

export function BottomTabNav() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useApp()
  const { visibleTabs, activeTabId } = useTabNav()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  return (
    <View
      style={[styles.dock, { paddingBottom: insets.bottom + TAB_DOCK_PADDING }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {visibleTabs.map((tab) => {
          const active = activeTabId === tab.id
          const iconColor = active ? colors.text : colors.textMuted
          const label = t(TAB_LABEL_KEYS[tab.id], { defaultValue: tab.shortLabel })
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={() => onTabPress(tab, router, user)}
              style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
            >
              <NavIcon name={tab.icon} size={16} color={iconColor} />
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
