import { Pressable, ScrollView, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { TourTarget } from '@/components/onboarding/TourTarget'

export type SettingsTabId =
  | 'email'
  | 'password'
  | 'security'
  | 'subscription'
  | 'notifications'
  | 'weekly-summary'
  | 'appearance'
  | 'account'

const SETTINGS_TAB_IDS: SettingsTabId[] = [
  'email',
  'password',
  'security',
  'subscription',
  'notifications',
  'weekly-summary',
  'appearance',
  'account',
]

export function isSettingsTabId(value: string): value is SettingsTabId {
  return SETTINGS_TAB_IDS.includes(value as SettingsTabId)
}

const TABS: { id: SettingsTabId; labelKey: string }[] = [
  { id: 'email', labelKey: 'settings.tabs.email' },
  { id: 'password', labelKey: 'settings.tabs.password' },
  { id: 'security', labelKey: 'settings.tabs.security' },
  { id: 'subscription', labelKey: 'settings.tabs.subscription' },
  { id: 'notifications', labelKey: 'settings.tabs.notifications' },
  { id: 'weekly-summary', labelKey: 'settings.tabs.weeklySummary' },
  { id: 'appearance', labelKey: 'settings.tabs.appearance' },
  { id: 'account', labelKey: 'settings.tabs.account' },
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
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      accessibilityLabel={t('settings.tabsAria')}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id
        return (
          <TourTarget key={tab.id} id={`settings-tab-${tab.id}`}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(tab.id)}
              style={[styles.btn, isActive && styles.btnActive]}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>{t(tab.labelKey)}</Text>
            </Pressable>
          </TourTarget>
        )
      })}
    </ScrollView>
  )
}
