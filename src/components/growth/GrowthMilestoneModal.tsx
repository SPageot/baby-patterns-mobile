import { Pressable, Text, View } from 'react-native'

import { Button, Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { TrackingMediaField } from '@/components/growth/TrackingMediaField'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import type { Baby } from '@/schemas/user'
import { MILESTONE_CATEGORY_LABELS, type MilestoneCategory, type TrackingMediaType } from '@/types/growth'
import type { TrackingMediaUploadPayload } from '@/lib/trackingMediaUpload'
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
  milestoneTitle: string
  setMilestoneTitle: (v: string) => void
  milestoneCategory: MilestoneCategory
  setMilestoneCategory: (v: MilestoneCategory) => void
  achievedAt: string
  setAchievedAt: (v: string) => void
  milestoneNotes: string
  setMilestoneNotes: (v: string) => void
  milestoneMedia: TrackingMediaUploadPayload | null
  setMilestoneMedia: (v: TrackingMediaUploadPayload | null) => void
  milestoneExistingMediaUrl?: string | null
  milestoneExistingMediaType?: TrackingMediaType | null
  milestoneRemoveMedia: boolean
  setMilestoneRemoveMedia: (v: boolean) => void
  editingMilestoneId?: string
}

const CATEGORY_OPTIONS = Object.keys(MILESTONE_CATEGORY_LABELS) as MilestoneCategory[]

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
  categoryRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  categoryChipText: {
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

export function GrowthMilestoneModal({
  open,
  onClose,
  onSave,
  saving,
  babies,
  formBabyId,
  setFormBabyId,
  milestoneTitle,
  setMilestoneTitle,
  milestoneCategory,
  setMilestoneCategory,
  achievedAt,
  setAchievedAt,
  milestoneNotes,
  setMilestoneNotes,
  milestoneMedia,
  setMilestoneMedia,
  milestoneExistingMediaUrl,
  milestoneExistingMediaType,
  milestoneRemoveMedia,
  setMilestoneRemoveMedia,
  editingMilestoneId,
}: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('sleep', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingMilestoneId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit milestone' : 'Add milestone'}
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

      <Label>Milestone</Label>
      <Input
        value={milestoneTitle}
        onChangeText={setMilestoneTitle}
        placeholder="e.g. First smile"
      />

      <Label>Category</Label>
      <View style={styles.categoryRow}>
        {CATEGORY_OPTIONS.map((key) => {
          const active = milestoneCategory === key
          return (
            <Pressable
              key={key}
              onPress={() => setMilestoneCategory(key)}
              style={[
                styles.categoryChip,
                active && { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && { color: theme.accent, fontWeight: '800' as const },
                ]}
              >
                {MILESTONE_CATEGORY_LABELS[key]}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <DateTimeField label="Achieved on" value={achievedAt} onChange={setAchievedAt} />

      <Label>Notes (optional)</Label>
      <Input value={milestoneNotes} onChangeText={setMilestoneNotes} placeholder="Optional" />

      <TrackingMediaField
        picked={milestoneMedia}
        existingUrl={milestoneExistingMediaUrl}
        existingType={milestoneExistingMediaType}
        removeExisting={milestoneRemoveMedia}
        onPick={setMilestoneMedia}
        onRemoveExisting={() => setMilestoneRemoveMedia(true)}
        accentColor={theme.accent}
        accentBorder={theme.accentBorder}
        accentSoft={theme.accentSoft}
      />

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={styles.actionBtn} />
        <Button
          title={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save milestone'}
          loading={saving}
          onPress={onSave}
          style={styles.actionBtn}
        />
      </View>
    </TrackLogModalShell>
  )
}
