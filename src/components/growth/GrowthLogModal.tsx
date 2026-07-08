import { Pressable, Text, View } from 'react-native'

import { Button, Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { HealthDisclaimer } from '@/components/health/HealthDisclaimer'
import { TrackingMediaField } from '@/components/growth/TrackingMediaField'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import type { Baby } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import type { TrackingMediaType } from '@/types/growth'
import type { TrackingMediaUploadPayload } from '@/lib/trackingMediaUpload'
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
  recordedAt: string
  setRecordedAt: (v: string) => void
  weightLbs: string
  setWeightLbs: (v: string) => void
  heightInches: string
  setHeightInches: (v: string) => void
  headInches: string
  setHeadInches: (v: string) => void
  growthNotes: string
  setGrowthNotes: (v: string) => void
  growthMedia: TrackingMediaUploadPayload | null
  setGrowthMedia: (v: TrackingMediaUploadPayload | null) => void
  growthExistingMediaUrl?: string | null
  growthExistingMediaType?: TrackingMediaType | null
  growthRemoveMedia: boolean
  setGrowthRemoveMedia: (v: boolean) => void
  editingGrowthId?: string
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
  pairRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  pairField: {
    flex: 1,
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

export function GrowthLogModal({
  open,
  onClose,
  onSave,
  saving,
  babies,
  formBabyId,
  setFormBabyId,
  recordedAt,
  setRecordedAt,
  weightLbs,
  setWeightLbs,
  heightInches,
  setHeightInches,
  headInches,
  setHeadInches,
  growthNotes,
  setGrowthNotes,
  growthMedia,
  setGrowthMedia,
  growthExistingMediaUrl,
  growthExistingMediaType,
  growthRemoveMedia,
  setGrowthRemoveMedia,
  editingGrowthId,
}: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('feeding', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingGrowthId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit measurement' : 'Add measurement'}
      accentColor={theme.accent}
      accentBorder={theme.accentBorder}
      accentSoft={theme.accentSoft}
    >
      {babies.length > 1 ? (
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

      <DateTimeField label="Measured at" value={recordedAt} onChange={setRecordedAt} />

      <View style={styles.pairRow}>
        <View style={styles.pairField}>
          <Label>Weight (lb)</Label>
          <Input
            value={weightLbs}
            onChangeText={setWeightLbs}
            keyboardType="decimal-pad"
            placeholder="e.g. 12.5"
          />
        </View>
        <View style={styles.pairField}>
          <Label>Height (in)</Label>
          <Input
            value={heightInches}
            onChangeText={setHeightInches}
            keyboardType="decimal-pad"
            placeholder="e.g. 24.5"
          />
        </View>
      </View>

      <Label>Head circumference (in)</Label>
      <Input
        value={headInches}
        onChangeText={setHeadInches}
        keyboardType="decimal-pad"
        placeholder="e.g. 16.2"
      />

      <Label>Notes (optional)</Label>
      <Input
        value={growthNotes}
        onChangeText={setGrowthNotes}
        placeholder="Pediatrician visit, home scale, etc."
      />

      <TrackingMediaField
        picked={growthMedia}
        existingUrl={growthExistingMediaUrl}
        existingType={growthExistingMediaType}
        removeExisting={growthRemoveMedia}
        onPick={setGrowthMedia}
        onRemoveExisting={() => setGrowthRemoveMedia(true)}
        accentColor={theme.accent}
        accentBorder={theme.accentBorder}
        accentSoft={theme.accentSoft}
      />

      <HealthDisclaimer compact />

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={styles.actionBtn} />
        <Button
          title={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save measurement'}
          loading={saving}
          onPress={onSave}
          style={styles.actionBtn}
        />
      </View>
    </TrackLogModalShell>
  )
}
