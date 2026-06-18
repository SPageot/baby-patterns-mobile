import {
  Pressable,
  Text,
  View,
} from 'react-native'

import { Button, Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import type { Baby } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
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
  sleepDate: string
  setSleepDate: (v: string) => void
  sleepStart: string
  setSleepStart: (v: string) => void
  sleepEnd: string
  setSleepEnd: (v: string) => void
  sleepMood: string
  setSleepMood: (v: string) => void
  sleepEnvironment: string
  setSleepEnvironment: (v: string) => void
  sleepTeething: boolean
  setSleepTeething: (v: boolean) => void
  sleepSick: boolean
  setSleepSick: (v: boolean) => void
  sleepNap: boolean
  setSleepNap: (v: boolean) => void
  sleepDurationPreview: string
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
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: Spacing.three,
  },
  actionBtn: {
    flex: 1,
  },
})

export function SleepLogModal({
  open,
  onClose,
  onSave,
  saving,
  babies,
  formBabyId,
  setFormBabyId,
  sleepDate,
  setSleepDate,
  sleepStart,
  setSleepStart,
  sleepEnd,
  setSleepEnd,
  sleepMood,
  setSleepMood,
  sleepEnvironment,
  setSleepEnvironment,
  sleepTeething,
  setSleepTeething,
  sleepSick,
  setSleepSick,
  sleepNap,
  setSleepNap,
  sleepDurationPreview,
  editingLogId,
}: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('sleep', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingLogId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit sleep' : 'Log sleep'}
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

            <DateTimeField label="Sleep date (UTC)" value={sleepDate} onChange={setSleepDate} mode="date" zone="utc" />

            <DateTimeField label="Sleep start (UTC)" value={sleepStart} onChange={setSleepStart} zone="utc" />

            <DateTimeField label="Sleep end (UTC)" value={sleepEnd} onChange={setSleepEnd} zone="utc" />

            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>Duration</Text>
              <Text style={[styles.durationValue, { color: theme.accent }]}>{sleepDurationPreview}</Text>
            </View>

            <Label>Sleep mood</Label>
            <Input
              value={sleepMood}
              onChangeText={setSleepMood}
              placeholder="e.g. calm, fussy, restless"
            />

            <Label>Sleep environment</Label>
            <Input
              value={sleepEnvironment}
              onChangeText={setSleepEnvironment}
              placeholder="e.g. crib, stroller, parents' room"
            />

            <LogToggleRow label="This was a nap" value={sleepNap} onChange={setSleepNap} accent={theme.accent} stroke={palette.stroke} />
            <LogToggleRow label="Teething" value={sleepTeething} onChange={setSleepTeething} accent={theme.accent} stroke={palette.stroke} />
            <LogToggleRow label="Sick" value={sleepSick} onChange={setSleepSick} accent={theme.accent} stroke={palette.stroke} />

            <Text style={styles.hint}>
              Enter date and times in UTC. Duration is calculated from start and end.
            </Text>

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
