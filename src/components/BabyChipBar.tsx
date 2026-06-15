import { ScrollView, Pressable, Text } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { useApp } from '@/context/AppContext'

const createStyles = (t: AppPalette) => ({
  label: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
    fontWeight: '600' as const,
    marginBottom: Spacing.one,
  },
  row: {
    marginBottom: Spacing.three,
    flexGrow: 0,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    backgroundColor: t.card2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  chipActive: {
    borderColor: t.accentLavender,
    backgroundColor: t.accentSoft,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  chipTextActive: {
    color: t.accentDeep,
  },
  empty: {
    color: t.textMuted,
    fontSize: 14,
    marginBottom: Spacing.three,
  },
})

export function BabyChipBar() {
  const { babies, selectedBabyId, selectBaby } = useApp()
  const styles = useThemedStyles(createStyles)

  if (!babies.length) {
    return (
      <Text style={styles.empty}>
        No babies yet. Sign in and add a baby to start logging.
      </Text>
    )
  }

  return (
    <>
      <Text style={styles.label}>Your babies</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {babies.map((baby) => {
          const active = baby.id === selectedBabyId
          return (
            <Pressable
              key={baby.id}
              onPress={() => selectBaby(baby)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {baby.fullName?.trim() || 'Baby'}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </>
  )
}
