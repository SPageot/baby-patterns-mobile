import { Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

const createStyles = (t: AppPalette) => ({
  mark: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.accentLavender,
  },
  emoji: {
    lineHeight: 18,
  },
})

export function BrandMark({ size = 32 }: { size?: number }) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: palette.accentSoft,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.44 }]}>👶</Text>
    </View>
  )
}
