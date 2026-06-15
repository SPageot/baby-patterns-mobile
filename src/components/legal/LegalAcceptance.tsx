import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  error?: string | null
}

const createStyles = (t: AppPalette) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: t.stroke,
    backgroundColor: t.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },
  boxChecked: {
    borderColor: t.accent,
    backgroundColor: t.accentSoft,
  },
  check: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: t.accentDeep,
    lineHeight: 16,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  link: {
    color: t.accentDeep,
    fontWeight: '600' as const,
  },
  error: {
    fontSize: 13,
    color: t.error,
    marginBottom: Spacing.two,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function LegalAcceptance({ value, onChange, disabled, error }: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
          disabled={disabled}
          onPress={() => onChange(!value)}
          style={({ pressed }) => [pressed && !disabled && styles.pressed]}
        >
          <View style={[styles.box, value && styles.boxChecked]}>
            {value ? <Text style={styles.check}>✓</Text> : null}
          </View>
        </Pressable>
        <Text style={styles.label}>
          I agree to the{' '}
          <Link href="/terms" style={styles.link}>
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link href="/privacy" style={styles.link}>
            Privacy Policy
          </Link>
          .
        </Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}
