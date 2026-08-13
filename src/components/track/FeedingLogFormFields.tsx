import { Pressable, Text, View } from 'react-native'

import { Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import { TourTarget } from '@/components/onboarding/TourTarget'
import { toUtcIsoTime } from '@/api/diaperApi'
import { feedingTypeLabel } from '@/lib/feedingLogUtils'
import type { FeedingLogCreate } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { isoToDatetimeLocalValue } from '@/lib/trackUtils'
import { Spacing } from '@/constants/theme'

export const FEEDING_TYPES = ['breast', 'bottle', 'solids', 'snack'] as const

export type FeedingFormState = {
  feedingType: string
  feedingWhen: string
  feedingOz: string
  feedingMin: string
  feedingNotes: string
  feedingTeething: boolean
  feedingSick: boolean
}

export function feedingFormStateToCreate(state: FeedingFormState): FeedingLogCreate {
  const started = new Date(state.feedingWhen)
  return {
    feedingType: state.feedingType,
    feedingAt: Number.isNaN(started.getTime()) ? state.feedingWhen : toUtcIsoTime(started.toISOString()),
    amountOz: state.feedingOz.trim() || undefined,
    durationMin: state.feedingMin.trim() || undefined,
    notes: state.feedingNotes.trim() || undefined,
    isTeething: state.feedingTeething,
    isSick: state.feedingSick,
  }
}

export function feedingCreateToFormState(fields: FeedingLogCreate): FeedingFormState {
  return {
    feedingType: fields.feedingType,
    feedingWhen: isoToDatetimeLocalValue(fields.feedingAt),
    feedingOz: fields.amountOz ?? '',
    feedingMin: fields.durationMin ?? '',
    feedingNotes: fields.notes ?? '',
    feedingTeething: Boolean(fields.isTeething),
    feedingSick: Boolean(fields.isSick),
  }
}

export function feedingDraftSummary(fields: FeedingLogCreate): string {
  const parts = [feedingTypeLabel(fields.feedingType)]
  const when = new Date(fields.feedingAt)
  if (!Number.isNaN(when.getTime())) {
    parts.push(when.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }))
  }
  if (fields.amountOz) parts.push(`${fields.amountOz} oz`)
  if (fields.durationMin) parts.push(`${fields.durationMin} min`)
  return parts.join(' · ')
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
  typeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
})

type Props = {
  state: FeedingFormState
  setState: (patch: Partial<FeedingFormState>) => void
  accent: string
  accentBorder: string
  accentSoft: string
  stroke: string
  disabled?: boolean
}

export function FeedingLogFormFields({
  state,
  setState,
  accent,
  accentBorder,
  accentSoft,
  stroke,
  disabled,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const set = (patch: Partial<FeedingFormState>) => setState(patch)

  return (
    <>
      <TourTarget id="feeding-type">
        <Label>Type</Label>
        <View style={styles.typeRow}>
          {FEEDING_TYPES.map((type) => {
            const active = state.feedingType === type
            return (
              <Pressable
                key={type}
                disabled={disabled}
                onPress={() => set({ feedingType: type })}
                style={[
                  styles.typeChip,
                  active && { borderColor: accentBorder, backgroundColor: accentSoft },
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    active && { color: accent, fontWeight: '800' as const },
                  ]}
                >
                  {feedingTypeLabel(type)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </TourTarget>

      <DateTimeField
        label="When"
        value={state.feedingWhen}
        onChange={(v) => set({ feedingWhen: v })}
      />

      <Label>Amount (oz)</Label>
      <Input
        value={state.feedingOz}
        onChangeText={(v) => set({ feedingOz: v })}
        keyboardType="decimal-pad"
        placeholder="Optional"
        editable={!disabled}
      />

      <Label>Duration (min)</Label>
      <Input
        value={state.feedingMin}
        onChangeText={(v) => set({ feedingMin: v })}
        keyboardType="number-pad"
        placeholder="Optional"
        editable={!disabled}
      />

      <Label>Notes</Label>
      <Input
        value={state.feedingNotes}
        onChangeText={(v) => set({ feedingNotes: v })}
        placeholder="Optional"
        editable={!disabled}
      />

      <LogToggleRow
        label="Teething"
        value={state.feedingTeething}
        onChange={(v) => set({ feedingTeething: v })}
        accent={accent}
        stroke={stroke}
      />
      <LogToggleRow
        label="Sick"
        value={state.feedingSick}
        onChange={(v) => set({ feedingSick: v })}
        accent={accent}
        stroke={stroke}
      />
    </>
  )
}

export function FeedingBabyPicker({
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
