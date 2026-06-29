import type { ReactNode } from 'react'
import { ActivityIndicator, Text, View, type ViewStyle } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

import { Screen } from './primitives'

type Size = 'sm' | 'md' | 'lg'

type SpinnerProps = {
  size?: Size
  label?: string
  hidden?: boolean
}

export function LoadingSpinner({ size = 'md', label = 'Loading', hidden = false }: SpinnerProps) {
  const t = useHomeTheme()
  const scaleStyles = useThemedStyles(() => ({
    sm: { transform: [{ scale: 0.75 }] as ViewStyle['transform'] },
    md: {},
    lg: { transform: [{ scale: 1.35 }] as ViewStyle['transform'] },
  }))
  const indicatorSize = size === 'sm' ? 'small' : 'large'

  return (
    <View
      style={scaleStyles[size]}
      accessibilityRole={hidden ? undefined : 'progressbar'}
      accessibilityLabel={hidden ? undefined : label}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'yes'}
    >
      <ActivityIndicator size={indicatorSize} color={t.accentDeep} />
    </View>
  )
}

const createStateStyles = (t: AppPalette) => ({
  root: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  inline: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-start' as const,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  compact: {
    paddingVertical: 12,
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  inlineLabel: {
    textAlign: 'left' as const,
  },
})

type LoadingStateProps = {
  label?: string
  size?: Size
  inline?: boolean
  compact?: boolean
  style?: ViewStyle
}

export function LoadingState({
  label,
  size = 'md',
  inline = false,
  compact = false,
  style,
}: LoadingStateProps) {
  const styles = useThemedStyles(createStateStyles)

  return (
    <View
      style={[styles.root, inline && styles.inline, compact && styles.compact, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      accessibilityLiveRegion="polite"
    >
      <LoadingSpinner size={size} hidden={Boolean(label)} />
      {label ? <Text style={[styles.label, inline && styles.inlineLabel]}>{label}</Text> : null}
    </View>
  )
}

export function LoadingLabel({ children, size = 'sm' }: { children: ReactNode; size?: Size }) {
  const styles = useThemedStyles((t: AppPalette) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    text: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: t.text,
    },
  }))

  return (
    <View style={styles.row}>
      <LoadingSpinner size={size} hidden />
      <Text style={styles.text}>{children}</Text>
    </View>
  )
}

export function PageLoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <Screen style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four }}>
      <LoadingState label={label} size="lg" />
    </Screen>
  )
}
