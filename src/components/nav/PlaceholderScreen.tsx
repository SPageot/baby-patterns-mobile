import { ScrollView, Text } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { Spacing } from '@/constants/theme'
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
    ...heading(32, { lineHeight: 38 }),
    color: t.text,
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
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>
        {description ?? 'This section will match the Baby Pattern website soon.'}
      </Text>
    </ScrollView>
  )
}
