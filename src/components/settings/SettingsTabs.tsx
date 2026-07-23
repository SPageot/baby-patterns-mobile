import { Pressable, ScrollView, Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

export type SettingsTabId =
  | 'email'
  | 'password'
  | 'security'
  | 'subscription'
  | 'notifications'
  | 'weekly-summary'
  | 'account'

const SETTINGS_TAB_IDS: SettingsTabId[] = [
  'email',
  'password',
  'security',
  'subscription',
  'notifications',
  'weekly-summary',
  'account',
]

export function isSettingsTabId(value: string): value is SettingsTabId {
  return SETTINGS_TAB_IDS.includes(value as SettingsTabId)
}

const TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'password', label: 'Password' },
  { id: 'security', label: 'Security' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'weekly-summary', label: 'Weekly summary' },
  { id: 'account', label: 'Account' },
]

const createStyles = (t: AppPalette) => ({
  scroll: {
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingRight: Spacing.two,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  btnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  labelActive: {
    color: t.accentDeep,
  },
})

type Props = {
  active: SettingsTabId
  onChange: (tab: SettingsTabId) => void
}

export function SettingsTabs({ active, onChange }: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            style={[styles.btn, isActive && styles.btnActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
