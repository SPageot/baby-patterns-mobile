import {
  Pressable,
  Text,
  View,
} from 'react-native'

import { Button, Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import type { Baby } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  onClose: () => void
  onSave: () => void
  saving?: boolean
  babies: Baby[]
  formBabyId: string
  setFormBabyId: (id: string) => void
  diaperPee: boolean
  setDiaperPee: (v: boolean) => void
  diaperPoop: boolean
  setDiaperPoop: (v: boolean) => void
  diaperAnythingElse: boolean
  setDiaperAnythingElse: (v: boolean) => void
  diaperAnythingElseDesc: string
  setDiaperAnythingElseDesc: (v: string) => void
  diaperTime: string
  setDiaperTime: (v: string) => void
  diaperBrand: string
  setDiaperBrand: (v: string) => void
  diaperSize: string
  setDiaperSize: (v: string) => void
  diaperCream: string
  setDiaperCream: (v: string) => void
  diaperTeething: boolean
  setDiaperTeething: (v: boolean) => void
  diaperSick: boolean
  setDiaperSick: (v: boolean) => void
  editingLogId?: string
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
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: Spacing.three,
  },
  actionBtn: {
    flex: 1,
  },
})

export function DiaperLogModal({
  open,
  onClose,
  onSave,
  saving,
  babies,
  formBabyId,
  setFormBabyId,
  diaperPee,
  setDiaperPee,
  diaperPoop,
  setDiaperPoop,
  diaperAnythingElse,
  setDiaperAnythingElse,
  diaperAnythingElseDesc,
  setDiaperAnythingElseDesc,
  diaperTime,
  setDiaperTime,
  diaperBrand,
  setDiaperBrand,
  diaperSize,
  setDiaperSize,
  diaperCream,
  setDiaperCream,
  diaperTeething,
  setDiaperTeething,
  diaperSick,
  setDiaperSick,
  editingLogId,
}: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('diaper', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingLogId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit diaper change' : 'Log diaper change'}
      accentColor={theme.accent}
      accentBorder={theme.accentBorder}
      accentSoft={theme.accentSoft}
    >
      {babies.length > 0 ? (
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
                          active && { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft },
                        ]}
                      >
                        <Text style={[styles.babyChipText, active && { color: theme.accent }]}>
                          {baby.fullName?.trim() || 'Baby'}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </>
            ) : null}

            <Label>Contents</Label>
            <LogToggleRow label="Wet" value={diaperPee} onChange={setDiaperPee} accent={theme.accent} stroke={palette.stroke} />
            <LogToggleRow label="Bowel movement" value={diaperPoop} onChange={setDiaperPoop} accent={theme.accent} stroke={palette.stroke} />
            <LogToggleRow label="Anything else" value={diaperAnythingElse} onChange={setDiaperAnythingElse} accent={theme.accent} stroke={palette.stroke} />

            {diaperAnythingElse ? (
              <>
                <Label>Anything else (description)</Label>
                <Input
                  value={diaperAnythingElseDesc}
                  onChangeText={setDiaperAnythingElseDesc}
                  placeholder="Rash, discharge, etc."
                />
              </>
            ) : null}

            <DateTimeField label="Time" value={diaperTime} onChange={setDiaperTime} />

            <Label>Diaper brand</Label>
            <Input value={diaperBrand} onChangeText={setDiaperBrand} placeholder="e.g. brand name" />

            <Label>Diaper size</Label>
            <Input value={diaperSize} onChangeText={setDiaperSize} placeholder="e.g. 2, NB, S" />

            <Label>Diaper cream used</Label>
            <Input value={diaperCream} onChangeText={setDiaperCream} placeholder='e.g. zinc oxide, or "none"' />

            <LogToggleRow label="Teething" value={diaperTeething} onChange={setDiaperTeething} accent={theme.accent} stroke={palette.stroke} />
            <LogToggleRow label="Sick" value={diaperSick} onChange={setDiaperSick} accent={theme.accent} stroke={palette.stroke} />

            <View style={styles.actions}>
              <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={styles.actionBtn} />
              <Button
                title={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save log'}
                loading={saving}
                onPress={onSave}
                style={styles.actionBtn}
              />
            </View>
    </TrackLogModalShell>
  )
}
