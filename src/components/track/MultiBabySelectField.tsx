import { Pressable, Text, View } from 'react-native'

import type { Baby } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { bodyText } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  babies: Baby[]
  selectedIds: string[]
  onToggle: (babyId: string) => void
  disabled?: boolean
}

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginBottom: Spacing.two,
  },
  hint: {
    ...bodyText,
    fontSize: 13,
    lineHeight: 19,
    color: t.textMuted,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  chipOn: {
    borderColor: t.accentLavender,
    backgroundColor: t.accentSoft,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  chipTextOn: {
    color: t.accentDeep,
  },
  check: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
})

export function MultiBabySelectField({ babies, selectedIds, onToggle, disabled }: Props) {
  const styles = useThemedStyles(createStyles)

  if (babies.length <= 1) return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Select one or more babies. The same details apply to each; you can adjust per baby before saving.
      </Text>
      <View style={styles.row}>
        {babies.map((baby) => {
          const id = baby.id?.trim() || ''
          if (!id) return null
          const checked = selectedIds.includes(id)
          return (
            <Pressable
              key={id}
              disabled={disabled}
              onPress={() => onToggle(id)}
              style={[styles.chip, checked && styles.chipOn]}
            >
              <Text style={[styles.check, !checked && { opacity: 0.35 }]}>{checked ? '✓' : '○'}</Text>
              <Text style={[styles.chipText, checked && styles.chipTextOn]}>
                {baby.fullName?.trim() || 'Baby'}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
