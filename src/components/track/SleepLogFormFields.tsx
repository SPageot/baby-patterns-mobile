import { Pressable, Text, View } from 'react-native'
import { useMemo } from 'react'

import { Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import { sleepFieldsToUtc } from '@/api/sleepApi'
import type { SleepLogCreate } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import {
  datetimeUtcInputToIso,
  formatMinutesHuman,
  isoToDatetimeUtcValue,
  minutesBetweenUtcDateTimeInputs,
} from '@/lib/trackUtils'
import { Spacing } from '@/constants/theme'

export type SleepFormState = {
  sleepDate: string
  sleepStart: string
  sleepEnd: string
  sleepMood: string
  sleepEnvironment: string
  sleepTeething: boolean
  sleepSick: boolean
  sleepNap: boolean
}

export function sleepFormStateToCreate(state: SleepFormState): SleepLogCreate | null {
  const startIso = datetimeUtcInputToIso(state.sleepStart)
  const endIso = datetimeUtcInputToIso(state.sleepEnd)
  const durationMin = minutesBetweenUtcDateTimeInputs(state.sleepStart, state.sleepEnd)
  if (durationMin == null) return null

  return sleepFieldsToUtc({
    sleepDate: state.sleepDate.trim(),
    sleepDuration: String(durationMin),
    sleepMood: state.sleepMood.trim(),
    sleepStartTime: startIso,
    sleepEndTime: endIso,
    sleepEnvironment: state.sleepEnvironment.trim(),
    isTeething: state.sleepTeething,
    isSick: state.sleepSick,
    isNap: state.sleepNap,
  })
}

export function sleepCreateToFormState(fields: SleepLogCreate): SleepFormState {
  return {
    sleepDate: fields.sleepDate,
    sleepStart: isoToDatetimeUtcValue(fields.sleepStartTime),
    sleepEnd: isoToDatetimeUtcValue(fields.sleepEndTime),
    sleepMood: fields.sleepMood,
    sleepEnvironment: fields.sleepEnvironment,
    sleepTeething: Boolean(fields.isTeething),
    sleepSick: Boolean(fields.isSick),
    sleepNap: Boolean(fields.isNap),
  }
}

export function sleepDraftSummary(fields: SleepLogCreate): string {
  const parts: string[] = []
  if (fields.isNap) parts.push('Nap')
  if (fields.sleepMood) parts.push(fields.sleepMood)
  const start = new Date(fields.sleepStartTime)
  if (!Number.isNaN(start.getTime())) {
    parts.push(start.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }))
  }
  if (fields.sleepDuration) {
    const min = Number(fields.sleepDuration)
    if (Number.isFinite(min)) parts.push(formatMinutesHuman(min))
  }
  return parts.join(' · ') || 'Tap to edit'
}

const createStyles = (t: AppPalette) => ({
  babyRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  babyChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  babyChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  durationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.two,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
})

type Props = {
  state: SleepFormState
  setState: (patch: Partial<SleepFormState>) => void
  accent: string
  stroke: string
  disabled?: boolean
}

export function SleepLogFormFields({ state, setState, accent, stroke, disabled }: Props) {
  const styles = useThemedStyles(createStyles)
  const set = (patch: Partial<SleepFormState>) => setState(patch)

  const durationPreview = useMemo(() => {
    const m = minutesBetweenUtcDateTimeInputs(state.sleepStart, state.sleepEnd)
    return m == null ? '—' : formatMinutesHuman(m)
  }, [state.sleepStart, state.sleepEnd])

  return (
    <>
      <LogToggleRow
        label="This was a nap"
        value={state.sleepNap}
        onChange={(v) => set({ sleepNap: v })}
        accent={accent}
        stroke={stroke}
      />

      <DateTimeField
        label="Sleep date (UTC)"
        value={state.sleepDate}
        onChange={(v) => set({ sleepDate: v })}
        mode="date"
        zone="utc"
      />

      <DateTimeField
        label="Sleep start (UTC)"
        value={state.sleepStart}
        onChange={(v) => set({ sleepStart: v })}
        zone="utc"
      />

      <DateTimeField
        label="Sleep end (UTC)"
        value={state.sleepEnd}
        onChange={(v) => set({ sleepEnd: v })}
        zone="utc"
      />

      <View style={styles.durationRow}>
        <Text style={styles.durationLabel}>Duration</Text>
        <Text style={[styles.durationValue, { color: accent }]}>{durationPreview}</Text>
      </View>

      <Label>Sleep mood</Label>
      <Input
        value={state.sleepMood}
        onChangeText={(v) => set({ sleepMood: v })}
        placeholder="e.g. calm, fussy, restless"
        editable={!disabled}
      />

      <Label>Sleep environment</Label>
      <Input
        value={state.sleepEnvironment}
        onChangeText={(v) => set({ sleepEnvironment: v })}
        placeholder="e.g. crib, stroller, parents' room"
        editable={!disabled}
      />

      <LogToggleRow
        label="Teething"
        value={state.sleepTeething}
        onChange={(v) => set({ sleepTeething: v })}
        accent={accent}
        stroke={stroke}
      />
      <LogToggleRow
        label="Sick"
        value={state.sleepSick}
        onChange={(v) => set({ sleepSick: v })}
        accent={accent}
        stroke={stroke}
      />

      <Text style={styles.hint}>
        Enter date and times in UTC. Duration is calculated from start and end.
      </Text>
    </>
  )
}

export function SleepBabyPicker({
  babies,
  formBabyId,
  setFormBabyId,
  accentBorder,
  accentSoft,
}: {
  babies: { id: string; fullName?: string | null }[]
  formBabyId: string
  setFormBabyId: (id: string) => void
  accentBorder: string
  accentSoft: string
}) {
  const styles = useThemedStyles(createStyles)

  return (
    <>
      <Label>Baby</Label>
      <View style={styles.babyRow}>
        {babies.map((baby) => {
          const active = baby.id === formBabyId
          return (
            <Pressable
              key={baby.id}
              onPress={() => setFormBabyId(baby.id)}
              style={[
                styles.babyChip,
                active && { borderColor: accentBorder, backgroundColor: accentSoft },
              ]}
            >
              <Text style={styles.babyChipText}>{baby.fullName?.trim() || 'Baby'}</Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )
}
