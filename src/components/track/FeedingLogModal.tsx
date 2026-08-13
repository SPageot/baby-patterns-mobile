import { View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import { TourTarget } from '@/components/onboarding/TourTarget'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { MultiBabyLogReview } from '@/components/track/MultiBabyLogReview'
import { MultiBabySelectField } from '@/components/track/MultiBabySelectField'
import {
  FeedingBabyPicker,
  FeedingLogFormFields,
  feedingCreateToFormState,
  feedingDraftSummary,
  feedingFormStateToCreate,
  type FeedingFormState,
} from '@/components/track/FeedingLogFormFields'
import type { Baby } from '@/schemas/user'
import type { FeedingLogCreate } from '@/types/babyLog'
import type { MultiBabyDraft } from '@/lib/multiBabyLogFlow'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  onClose: () => void
  onSave: () => void
  onBackToEntry?: () => void
  saving?: boolean
  babies: Baby[]
  formBabyId: string
  setFormBabyId: (id: string) => void
  formBabyIds: string[]
  onToggleFormBabyId: (id: string) => void
  showReviewStep?: boolean
  isMultiCreate?: boolean
  reviewDrafts?: MultiBabyDraft<FeedingLogCreate>[]
  onUpdateReviewDraft?: (babyId: string, fields: FeedingLogCreate) => void
  formState: FeedingFormState
  setFormState: (patch: Partial<FeedingFormState>) => void
  editingLogId?: string
}

const createStyles = (_t: AppPalette) => ({
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
  onBackToEntry,
  saving,
  babies,
  formBabyId,
  setFormBabyId,
  formBabyIds,
  onToggleFormBabyId,
  showReviewStep,
  isMultiCreate,
  reviewDrafts = [],
  onUpdateReviewDraft,
  formState,
  setFormState,
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
      title={
        showReviewStep ? 'Review feeding logs' : isEdit ? 'Edit feeding' : 'Log a feed'
      }
      accentColor={theme.accent}
      accentBorder={theme.accentBorder}
      accentSoft={theme.accentSoft}
    >
      {showReviewStep && onUpdateReviewDraft && onBackToEntry ? (
        <MultiBabyLogReview
          drafts={reviewDrafts}
          saving={saving}
          onBack={onBackToEntry}
          onSaveAll={onSave}
          renderSummary={(draft) => feedingDraftSummary(draft.fields)}
          renderFields={(draft) => (
            <FeedingLogFormFields
              state={feedingCreateToFormState(draft.fields)}
              setState={(patch) =>
                onUpdateReviewDraft(
                  draft.babyId,
                  feedingFormStateToCreate({ ...feedingCreateToFormState(draft.fields), ...patch }),
                )
              }
              accent={theme.accent}
              accentBorder={theme.accentBorder}
              accentSoft={theme.accentSoft}
              stroke={palette.stroke}
              disabled={saving}
            />
          )}
        />
      ) : (
        <>
          {!isEdit ? (
            <MultiBabySelectField
              babies={babies}
              selectedIds={formBabyIds}
              onToggle={onToggleFormBabyId}
              disabled={saving}
            />
          ) : babies.length > 0 ? (
            <FeedingBabyPicker
              babies={babies}
              formBabyId={formBabyId}
              setFormBabyId={setFormBabyId}
              accentBorder={theme.accentBorder}
              accentSoft={theme.accentSoft}
            />
          ) : null}

          <FeedingLogFormFields
            state={formState}
            setState={setFormState}
            accent={theme.accent}
            accentBorder={theme.accentBorder}
            accentSoft={theme.accentSoft}
            stroke={palette.stroke}
            disabled={saving}
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={styles.actionBtn} />
            <TourTarget id="log-form-save" style={styles.actionBtn}>
              <Button
                title={
                  saving
                    ? 'Saving…'
                    : isEdit
                      ? 'Save changes'
                      : isMultiCreate
                        ? 'Review & save'
                        : 'Save log'
                }
                loading={saving}
                onPress={onSave}
              />
            </TourTarget>
          </View>
        </>
      )}
    </TrackLogModalShell>
  )
}
