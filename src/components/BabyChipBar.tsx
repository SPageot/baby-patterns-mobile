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
  chipShared: {
    borderStyle: 'dashed' as const,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  chipTextActive: {
    color: t.accentDeep,
  },
  chipSharedLabel: {
    fontSize: 11,
    color: t.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
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
          const name = baby.fullName?.trim() || 'Baby'
          const sharedLabel = baby.isShared
            ? baby.sharedFromFullName?.trim() || baby.sharedFromUsername?.trim()
            : ''
          return (
            <Pressable
              key={baby.id}
              onPress={() => selectBaby(baby)}
              accessibilityRole="button"
              accessibilityLabel={
                sharedLabel ? `${name}, shared by ${sharedLabel}` : `Select ${name}`
              }
              style={[
                styles.chip,
                active && styles.chipActive,
                baby.isShared && styles.chipShared,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
              {sharedLabel ? (
                <Text style={styles.chipSharedLabel}>via {sharedLabel}</Text>
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>
    </>
  )
}
