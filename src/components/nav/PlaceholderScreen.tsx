import { ScrollView, Text } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { Fonts, Spacing } from '@/constants/theme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Props = {
  title: string
  description?: string
}

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    color: t.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
    maxWidth: 520,
  },
})

export function PlaceholderScreen({ title, description }: Props) {
  const serif = Fonts.serif ?? 'serif'
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { fontFamily: serif }]}>{title}</Text>
      <Text style={styles.body}>
        {description ?? 'This section will match the Baby Patterns website soon.'}
      </Text>
    </ScrollView>
  )
}
