import { Pressable, Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Props = {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  label?: string
}

const createStyles = (t: AppPalette) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  star: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  starMuted: {
    color: t.textMuted,
    opacity: 0.35,
  },
})

export function StarRating({ value, onChange, size = 'md', label }: Props) {
  const styles = useThemedStyles(createStyles)
  const fontSize = size === 'sm' ? 14 : 22
  const rounded = Math.max(0, Math.min(5, Math.round(value)))

  return (
    <View style={styles.row} accessibilityLabel={label ?? `${value} stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded
        const star = (
          <Text style={[styles.star, !filled ? styles.starMuted : null, { fontSize }]}>★</Text>
        )
        if (!onChange) {
          return <View key={n}>{star}</View>
        }
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${n} stars`}
          >
            {star}
          </Pressable>
        )
      })}
    </View>
  )
}
