import { Pressable, Text, View } from 'react-native'

import { Button, Input, Label } from '@/components/ui/primitives'
import { BrandNameInput } from '@/components/track/BrandNameInput'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import type { DiaperLogCreate } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

export type DiaperFormState = {
  diaperPee: boolean
  diaperPoop: boolean
  diaperAnythingElse: boolean
  diaperAnythingElseDesc: string
  diaperTime: string
  diaperBrand: string
  diaperSize: string
  diaperCream: string
  diaperTeething: boolean
  diaperSick: boolean
}

export function diaperFormStateToCreate(state: DiaperFormState): DiaperLogCreate {
  return {
    isTherePee: state.diaperPee,
    isTherePoop: state.diaperPoop,
    isThereAnythingElse: state.diaperAnythingElse,
    anythingElseDescription: state.diaperAnythingElseDesc.trim() || null,
    time: state.diaperTime.trim(),
    diaperBrand: state.diaperBrand.trim(),
    diaperSize: state.diaperSize.trim(),
    diaperCreamUsed: state.diaperCream.trim(),
    isTeething: state.diaperTeething,
    isSick: state.diaperSick,
  }
}

export function diaperCreateToFormState(fields: DiaperLogCreate): DiaperFormState {
  return {
    diaperPee: fields.isTherePee,
    diaperPoop: fields.isTherePoop,
    diaperAnythingElse: fields.isThereAnythingElse,
    diaperAnythingElseDesc: fields.anythingElseDescription || '',
    diaperTime: fields.time,
    diaperBrand: fields.diaperBrand,
    diaperSize: fields.diaperSize,
    diaperCream: fields.diaperCreamUsed,
    diaperTeething: Boolean(fields.isTeething),
    diaperSick: Boolean(fields.isSick),
  }
}

export function diaperDraftSummary(fields: DiaperLogCreate): string {
  const parts: string[] = []
  if (fields.isTherePee) parts.push('Wet')
  if (fields.isTherePoop) parts.push('BM')
  if (fields.isThereAnythingElse) parts.push('Other')
  if (fields.time) {
    const parsed = new Date(fields.time)
    parts.push(
      Number.isNaN(parsed.getTime())
        ? fields.time
        : parsed.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    )
  }
  if (fields.diaperBrand) parts.push(fields.diaperBrand)
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
})

type Props = {
  state: DiaperFormState
  setState: (patch: Partial<DiaperFormState>) => void
  accent: string
  stroke: string
  disabled?: boolean
}

export function DiaperLogFormFields({ state, setState, accent, stroke, disabled }: Props) {
  const styles = useThemedStyles(createStyles)
  const set = (patch: Partial<DiaperFormState>) => setState(patch)

  return (
    <>
      <Label>Contents</Label>
      <LogToggleRow label="Wet" value={state.diaperPee} onChange={(v) => set({ diaperPee: v })} accent={accent} stroke={stroke} />
      <LogToggleRow label="Bowel movement" value={state.diaperPoop} onChange={(v) => set({ diaperPoop: v })} accent={accent} stroke={stroke} />
      <LogToggleRow label="Anything else" value={state.diaperAnythingElse} onChange={(v) => set({ diaperAnythingElse: v })} accent={accent} stroke={stroke} />

      {state.diaperAnythingElse ? (
        <>
          <Label>Anything else (description)</Label>
          <Input
            value={state.diaperAnythingElseDesc}
            onChangeText={(v) => set({ diaperAnythingElseDesc: v })}
            placeholder="Rash, discharge, etc."
            editable={!disabled}
          />
        </>
      ) : null}

      <DateTimeField label="Time" value={state.diaperTime} onChange={(v) => set({ diaperTime: v })} />

      <Label>Diaper brand</Label>
      <BrandNameInput
        value={state.diaperBrand}
        onChange={(diaperBrand) => set({ diaperBrand })}
        disabled={disabled}
      />

      <Label>Diaper size</Label>
      <Input value={state.diaperSize} onChangeText={(v) => set({ diaperSize: v })} placeholder="e.g. 2, NB, S" editable={!disabled} />

      <Label>Diaper cream used</Label>
      <Input value={state.diaperCream} onChangeText={(v) => set({ diaperCream: v })} placeholder='e.g. zinc oxide, or "none"' editable={!disabled} />

      <LogToggleRow label="Teething" value={state.diaperTeething} onChange={(v) => set({ diaperTeething: v })} accent={accent} stroke={stroke} />
      <LogToggleRow label="Sick" value={state.diaperSick} onChange={(v) => set({ diaperSick: v })} accent={accent} stroke={stroke} />
    </>
  )
}

export function DiaperBabyPicker({
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
