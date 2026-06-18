import { type ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { NavIconName } from '@/lib/navLinks'
import { Spacing } from '@/constants/theme'

export type ReportsTabId = 'overview' | 'sleep' | 'diapers' | 'feeding' | 'growth' | 'health'

const TABS: { id: ReportsTabId; label: string; icon: NavIconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'sleep', label: 'Sleep & naps', icon: 'moon' },
  { id: 'diapers', label: 'Diapers', icon: 'diaper' },
  { id: 'feeding', label: 'Feeding', icon: 'bottle' },
  { id: 'growth', label: 'Growth & milestones', icon: 'growth' },
  { id: 'health', label: 'Health', icon: 'health' },
]

const createStyles = (t: AppPalette) => ({
  scroll: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingRight: Spacing.two,
  },
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
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
    fontWeight: '700' as const,
  },
})

type Props = {
  active: ReportsTabId
  onChange: (tab: ReportsTabId) => void
}

export function ReportsTabs({ active, onChange }: Props) {
  const palette = useHomeTheme()
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
            <NavIcon name={tab.icon} size={15} color={isActive ? palette.accentDeep : palette.textMuted} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

export function ReportsTabPanel({
  tab,
  active,
  children,
}: {
  tab: ReportsTabId
  active: ReportsTabId
  children: ReactNode
}) {
  if (tab !== active) return null
  return <View>{children}</View>
}
