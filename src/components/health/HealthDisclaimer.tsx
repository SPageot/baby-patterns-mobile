import { useState } from 'react'
import { Pressable, Text, View, type ViewStyle } from 'react-native'

import {
  HEALTH_DISCLAIMER_COMPACT,
  HEALTH_DISCLAIMER_TEXT,
  HEALTH_DISCLAIMER_TITLE,
} from '@/lib/healthDisclaimer'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  banner: {
    borderWidth: 1,
    borderColor: 'rgba(196, 92, 122, 0.22)',
    borderRadius: HomeRadius.lg,
    backgroundColor: 'rgba(196, 92, 122, 0.08)',
    padding: Spacing.two,
    marginBottom: Spacing.two,
    gap: 6,
  },
  compact: {
    padding: 10,
    marginBottom: Spacing.two,
    gap: 4,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#9a3d58',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  titleCompact: {
    fontSize: 11,
  },
  chevron: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700' as const,
    color: '#9a3d58',
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: t.textMuted,
  },
  bodyCompact: {
    fontSize: 12,
    lineHeight: 17,
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
    <View style={[styles.banner, compact && styles.compact, style]}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={HEALTH_DISCLAIMER_TITLE}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={styles.header}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{HEALTH_DISCLAIMER_TITLE}</Text>
          <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {open ? '▾' : '▸'}
          </Text>
        </View>
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
