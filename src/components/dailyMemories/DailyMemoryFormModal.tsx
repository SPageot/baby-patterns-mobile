import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { TrackingMediaField } from '@/components/growth/TrackingMediaField'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { Button, ErrorText, Input, Label } from '@/components/ui/primitives'
import { DAILY_MEMORY_THEME, dailyMemoryPrimaryButtonStyle } from '@/constants/dailyMemoryTheme'
import type { AppPalette } from '@/constants/homeTheme'
import {
  fieldError,
  type DailyMemoryFormState,
} from '@/schemas/dailyMemory'
import type { Baby } from '@/schemas/user'
import type { ValidationIssue } from '@/schemas/user'
import type { TrackingMediaType } from '@/types/growth'
import type { TrackingMediaUploadPayload } from '@/lib/trackingMediaUpload'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  onClose: () => void
  onSave: () => void
  saving?: boolean
  isEdit?: boolean
  babies: Baby[]
  formState: DailyMemoryFormState
  patchFormState: (patch: Partial<DailyMemoryFormState>) => void
  fieldErrors: ValidationIssue[]
  mediaPick: TrackingMediaUploadPayload | null
  existingMediaUrl: string | null
  existingMediaType: TrackingMediaType | null
  removeMedia: boolean
  onPickMedia: (payload: TrackingMediaUploadPayload | null) => void
  onRemoveExistingMedia: () => void
}

const createStyles = (_t: AppPalette) => ({
  babyRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  babyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DAILY_MEMORY_THEME.accentBorder,
    backgroundColor: DAILY_MEMORY_THEME.accentSoft,
  },
  babyChipActive: {
    borderColor: DAILY_MEMORY_THEME.accent,
    backgroundColor: DAILY_MEMORY_THEME.accentSoft,
  },
  babyChipText: { fontSize: 13, fontWeight: '600' as const, color: DAILY_MEMORY_THEME.label },
  textarea: { minHeight: 120, textAlignVertical: 'top' as const },
  actions: { flexDirection: 'row' as const, gap: 10, marginTop: Spacing.three },
  actionBtn: { flex: 1 },
})

export function DailyMemoryFormModal({
  open,
  onClose,
  onSave,
  saving,
  isEdit,
  babies,
  formState,
  patchFormState,
  fieldErrors,
  mediaPick,
  existingMediaUrl,
  existingMediaType,
  removeMedia,
  onPickMedia,
  onRemoveExistingMedia,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()
  const showBabyPicker = babies.length > 1

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit memory' : t('memories.add')}
      accentColor={DAILY_MEMORY_THEME.accentStrong}
      accentBorder={DAILY_MEMORY_THEME.accentBorder}
      accentSoft={DAILY_MEMORY_THEME.accentSoft}
    >
      {showBabyPicker ? (
        <>
          <Label>Baby</Label>
          <View style={styles.babyRow}>
            {babies.map((baby) => {
              const active = baby.id === formState.babyId
              return (
                <Button
                  key={baby.id}
                  title={baby.fullName?.trim() || 'Baby'}
                  variant={active ? 'primary' : 'secondary'}
                  onPress={() => patchFormState({ babyId: baby.id })}
                  style={active ? dailyMemoryPrimaryButtonStyle : undefined}
                />
              )
            })}
          </View>
          {fieldError(fieldErrors, 'babyId') ? (
            <ErrorText>{fieldError(fieldErrors, 'babyId')}</ErrorText>
          ) : null}
        </>
      ) : null}

      <DateTimeField
        label="Date"
        mode="date"
        zone="local"
        value={formState.memoryDate}
        onChange={(memoryDate) => patchFormState({ memoryDate })}
      />
      {fieldError(fieldErrors, 'memoryDate') ? (
        <ErrorText>{fieldError(fieldErrors, 'memoryDate')}</ErrorText>
      ) : null}

      <Label>Title, optional</Label>
      <Input
        value={formState.title}
        onChangeText={(title) => patchFormState({ title })}
        placeholder='e.g. "First steps"'
        maxLength={120}
      />
      {fieldError(fieldErrors, 'title') ? (
        <ErrorText>{fieldError(fieldErrors, 'title')}</ErrorText>
      ) : null}

      <Label>What happened?</Label>
      <Input
        value={formState.content}
        onChangeText={(content) => patchFormState({ content })}
        placeholder="Describe the memorable moment"
        multiline
        style={styles.textarea}
        maxLength={2000}
      />
      {fieldError(fieldErrors, 'content') ? (
        <ErrorText>{fieldError(fieldErrors, 'content')}</ErrorText>
      ) : null}

      <TrackingMediaField
        label="Photo (optional)"
        imagesOnly
        picked={mediaPick}
        existingUrl={existingMediaUrl}
        existingType={existingMediaType}
        removeExisting={removeMedia}
        onPick={onPickMedia}
        onRemoveExisting={onRemoveExistingMedia}
        accentColor={DAILY_MEMORY_THEME.accentStrong}
        accentBorder={DAILY_MEMORY_THEME.accentBorder}
        accentSoft={DAILY_MEMORY_THEME.accentSoft}
      />

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={styles.actionBtn} />
        <Button
          title={saving ? t('track.fields.saving') : t('memories.save')}
          loading={saving}
          onPress={onSave}
          style={[dailyMemoryPrimaryButtonStyle, styles.actionBtn]}
        />
      </View>
    </TrackLogModalShell>
  )
}
