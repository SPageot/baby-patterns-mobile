import { useState } from 'react'
import { Pressable, Text, View, type ViewStyle } from 'react-native'

import {
  HEALTH_DISCLAIMER_COMPACT,
  HEALTH_DISCLAIMER_TEXT,
  HEALTH_DISCLAIMER_TITLE,
} from '@/lib/healthDisclaimer'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    alignItems: 'flex-end' as const,
  },
  wrapCompact: {
    marginTop: 6,
    marginBottom: Spacing.one,
    alignItems: 'flex-start' as const,
  },
  trigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: t.textMuted,
  },
  titleCompact: {
    fontSize: 11,
  },
  chevron: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  body: {
    marginTop: 6,
    maxWidth: 320,
    fontSize: 12,
    lineHeight: 17,
    color: t.textMuted,
    textAlign: 'right' as const,
  },
  bodyCompact: {
    maxWidth: '100%' as const,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'left' as const,
  },
})

type Props = {
  compact?: boolean
  style?: ViewStyle
}

export function HealthDisclaimer({ compact = false, style }: Props) {
  const styles = useThemedStyles(createStyles)
  const [open, setOpen] = useState(false)
  const body = compact ? HEALTH_DISCLAIMER_COMPACT : HEALTH_DISCLAIMER_TEXT

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={HEALTH_DISCLAIMER_TITLE}
        style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={[styles.title, compact && styles.titleCompact]}>{HEALTH_DISCLAIMER_TITLE}</Text>
        <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {open ? '▾' : '›'}
        </Text>
      </Pressable>
      {open ? (
        <Text
          style={[styles.body, compact && styles.bodyCompact]}
          accessibilityRole="text"
          accessibilityLabel={body}
        >
          {body}
        </Text>
      ) : null}
    </View>
  )
}
