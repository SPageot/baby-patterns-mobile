import { Pressable, Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Props = {
  value: number
  max?: number
  size?: 'sm' | 'md'
  onChange?: (value: number) => void
}

const createStyles = (t: AppPalette) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  starBtn: {
    paddingHorizontal: 1,
  },
  star: {
    lineHeight: 20,
  },
  filled: {
    color: '#e8a317',
  },
  empty: {
    color: t.stroke,
  },
})

export function StarRating({ value, max = 5, size = 'md', onChange }: Props) {
  const interactive = typeof onChange === 'function'
  const fontSize = size === 'sm' ? 14 : 18
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= Math.round(value)
        return (
          <Pressable
            key={starValue}
            disabled={!interactive}
            onPress={interactive ? () => onChange(starValue) : undefined}
            style={styles.starBtn}
            accessibilityLabel={`${starValue} stars`}
          >
            <Text style={[styles.star, { fontSize }, filled ? styles.filled : styles.empty]}>
              ★
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
