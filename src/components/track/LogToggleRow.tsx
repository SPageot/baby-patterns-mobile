import { Switch, Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

const createStyles = (t: AppPalette) => ({
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
  },
})

type Props = {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  accent: string
  stroke: string
  disabled?: boolean
}

export function LogToggleRow({ label, value, onChange, accent, stroke, disabled }: Props) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, disabled && { opacity: 0.5 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: stroke, true: accent }}
      />
    </View>
  )
}
