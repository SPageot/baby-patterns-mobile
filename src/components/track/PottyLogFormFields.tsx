import { Pressable, Text, View } from 'react-native'

import { Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import type { PottyLogCreate } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import {
  DEFAULT_POTTY_RESULT,
  POTTY_LOCATION_LABELS,
  POTTY_RESULT_LABELS,
  POTTY_RESULT_OPTIONS,
} from '@/lib/pottyLogUtils'

export type PottyFormState = {
  pottyResult: string
  pottyTime: string
  pottyLocation: string
  pottyNotes: string
  pottyTeething: boolean
  pottySick: boolean
}

export function pottyFormStateToCreate(state: PottyFormState): PottyLogCreate {
  return {
    result: state.pottyResult,
    loggedAt: state.pottyTime.trim(),
    location: state.pottyLocation,
    notes: state.pottyNotes.trim() || null,
    isTeething: state.pottyTeething,
    isSick: state.pottySick,
  }
}

export function pottyCreateToFormState(fields: PottyLogCreate): PottyFormState {
  const result = fields.result?.trim()
  return {
    pottyResult: result && result !== 'success' ? result : DEFAULT_POTTY_RESULT,
    pottyTime: fields.loggedAt,
    pottyLocation: fields.location || 'potty-chair',
    pottyNotes: fields.notes || '',
    pottyTeething: Boolean(fields.isTeething),
    pottySick: Boolean(fields.isSick),
  }
}

export function pottyDraftSummary(fields: PottyLogCreate): string {
  const parts: string[] = []
  parts.push(POTTY_RESULT_LABELS[fields.result] ?? fields.result)
  if (fields.location) {
    parts.push(POTTY_LOCATION_LABELS[fields.location] ?? fields.location)
  }
  if (fields.loggedAt) {
    const parsed = new Date(fields.loggedAt)
    parts.push(
      Number.isNaN(parsed.getTime())
        ? fields.loggedAt
        : parsed.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    )
  }
  return parts.join(' · ') || 'Tap to add details'
}

const createStyles = (t: AppPalette) => ({
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
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
})

type Props = {
  state: PottyFormState
  setState: (patch: Partial<PottyFormState>) => void
  accent: string
  accentBorder: string
  accentSoft: string
  stroke: string
  disabled?: boolean
}

export function PottyLogFormFields({
  state,
  setState,
  accent,
  accentBorder,
  accentSoft,
  stroke,
  disabled,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const set = (patch: Partial<PottyFormState>) => setState(patch)

  return (
    <>
      <Label>What happened?</Label>
      <View style={styles.chipRow}>
        {POTTY_RESULT_OPTIONS.map(([value, label]) => {
          const active = state.pottyResult === value
          return (
            <Pressable
              key={value}
              disabled={disabled}
              onPress={() => set({ pottyResult: value })}
              style={[styles.chip, active && { borderColor: accentBorder, backgroundColor: accentSoft }]}
            >
              <Text style={[styles.chipText, active && { color: accent }]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>

      <DateTimeField label="Time" value={state.pottyTime} onChange={(v) => set({ pottyTime: v })} />

      <Label>Where?</Label>
      <View style={styles.chipRow}>
        {Object.entries(POTTY_LOCATION_LABELS).map(([value, label]) => {
          const active = state.pottyLocation === value
          return (
            <Pressable
              key={value}
              disabled={disabled}
              onPress={() => set({ pottyLocation: value })}
              style={[styles.chip, active && { borderColor: accentBorder, backgroundColor: accentSoft }]}
            >
              <Text style={[styles.chipText, active && { color: accent }]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>

      <Label>Notes (optional)</Label>
      <Input
        value={state.pottyNotes}
        onChangeText={(v) => set({ pottyNotes: v })}
        placeholder="How did it go? Any cues or reminders?"
        editable={!disabled}
      />

      <LogToggleRow
        label="Teething"
        value={state.pottyTeething}
        onChange={(v) => set({ pottyTeething: v })}
        accent={accent}
        stroke={stroke}
      />
      <LogToggleRow
        label="Sick"
        value={state.pottySick}
        onChange={(v) => set({ pottySick: v })}
        accent={accent}
        stroke={stroke}
      />
    </>
  )
}

export function PottyBabyPicker({
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
