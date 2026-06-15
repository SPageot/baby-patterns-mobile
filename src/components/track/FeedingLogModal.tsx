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
import { feedingTypeLabel } from '@/lib/feedingLogUtils'
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
  feedingTypes: readonly string[]
  feedingType: string
  setFeedingType: (v: string) => void
  feedingWhen: string
  setFeedingWhen: (v: string) => void
  feedingOz: string
  setFeedingOz: (v: string) => void
  feedingMin: string
  setFeedingMin: (v: string) => void
  feedingNotes: string
  setFeedingNotes: (v: string) => void
  feedingTeething: boolean
  setFeedingTeething: (v: boolean) => void
  feedingSick: boolean
  setFeedingSick: (v: boolean) => void
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
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: Spacing.three,
  },
  actionBtn: {
    flex: 1,
  },
})

export function FeedingLogModal({
  open,
  onClose,
  onSave,
  saving,
  babies,
  formBabyId,
  setFormBabyId,
  feedingTypes,
  feedingType,
  setFeedingType,
  feedingWhen,
  setFeedingWhen,
  feedingOz,
  setFeedingOz,
  feedingMin,
  setFeedingMin,
  feedingNotes,
  setFeedingNotes,
  feedingTeething,
  setFeedingTeething,
  feedingSick,
  setFeedingSick,
  editingLogId,
}: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('feeding', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingLogId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit feeding' : 'Log a feed'}
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

            <Label>Type</Label>
            <View style={styles.typeRow}>
              {feedingTypes.map((type) => {
                const active = feedingType === type
                return (
                  <Pressable
                    key={type}
                    onPress={() => setFeedingType(type)}
                    style={[
                      styles.typeChip,
                      active && { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        active && { color: theme.accent, fontWeight: '800' as const },
                      ]}
                    >
                      {feedingTypeLabel(type)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <DateTimeField label="When" value={feedingWhen} onChange={setFeedingWhen} />

            <Label>Amount (oz)</Label>
            <Input
              value={feedingOz}
              onChangeText={setFeedingOz}
              keyboardType="decimal-pad"
              placeholder="Optional"
            />

            <Label>Duration (min)</Label>
            <Input
              value={feedingMin}
              onChangeText={setFeedingMin}
              keyboardType="number-pad"
              placeholder="Optional"
            />

            <Label>Notes</Label>
            <Input value={feedingNotes} onChangeText={setFeedingNotes} placeholder="Optional" />

            <LogToggleRow label="Teething" value={feedingTeething} onChange={setFeedingTeething} accent={theme.accent} stroke={palette.stroke} />
            <LogToggleRow label="Sick" value={feedingSick} onChange={setFeedingSick} accent={theme.accent} stroke={palette.stroke} />

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
