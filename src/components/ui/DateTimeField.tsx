import { useMemo, useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'

import { Label } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import {
  formatDateValue,
  formatDatetimeLocalValue,
  formatPickerLabel,
  parseDatetimeLocalValue,
  wallClockFromPicker,
  wallClockToPicker,
} from '@/lib/dateUtils'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  mode?: 'date' | 'datetime' | 'time'
  zone?: 'local' | 'utc'
  placeholder?: string
  hideLabel?: boolean
  minimumDate?: Date
  maximumDate?: Date
}

const createStyles = (t: AppPalette) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 6,
    marginBottom: Spacing.two,
  },
  field: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: t.stroke,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center' as const,
  },
  value: {
    fontSize: 15,
    color: t.text,
    fontWeight: '500' as const,
  },
  placeholder: {
    fontSize: 15,
    color: t.textMuted,
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.stroke,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
  },
  icon: {
    fontSize: 22,
    lineHeight: 24,
  },
  pickerWrap: {
    marginBottom: Spacing.two,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
  zone = 'local',
  placeholder = mode === 'date' ? 'Select date' : mode === 'time' ? 'Select time' : 'Select date and time',
  hideLabel = false,
  minimumDate,
  maximumDate,
}: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [showPicker, setShowPicker] = useState(false)
  const pickerDate = useMemo(() => {
    if (value.trim()) {
      return zone === 'utc' ? wallClockToPicker(value, mode) : parseDatetimeLocalValue(value, zone)
    }
    if (maximumDate && mode === 'date') return maximumDate
    if (minimumDate && mode === 'date') return minimumDate
    return new Date()
  }, [value, zone, mode, maximumDate, minimumDate])
  const display = formatPickerLabel(value, mode, zone)

  const commit = (date: Date) => {
    if (zone === 'utc') {
      onChange(wallClockFromPicker(date, mode))
      return
    }
    if (mode === 'time') {
      onChange(wallClockFromPicker(date, mode))
      return
    }
    onChange(mode === 'date' ? formatDateValue(date, zone) : formatDatetimeLocalValue(date, zone))
  }

  const openPicker = () => setShowPicker(true)

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (event.type === 'dismissed' || !selected) return
    commit(selected)
  }

  return (
    <View>
      {hideLabel ? null : <Label>{label}</Label>}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${display || placeholder}`}
          onPress={openPicker}
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        >
          {display ? (
            <Text style={styles.value}>{display}</Text>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${mode === 'time' ? 'time' : 'calendar'} for ${label}`}
          onPress={openPicker}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Text style={styles.icon}>{mode === 'time' ? '🕐' : '📅'}</Text>
        </Pressable>
      </View>

      {showPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode={mode === 'time' ? 'time' : mode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onPickerChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant={palette.mode === 'dark' ? 'dark' : 'light'}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => [styles.iconBtn, { alignSelf: 'flex-end' }, pressed && styles.pressed]}
            >
              <Text style={[styles.value, { color: palette.accentDeep }]}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
