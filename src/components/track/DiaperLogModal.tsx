import { View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import { TourTarget } from '@/components/onboarding/TourTarget'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { MultiBabyLogReview } from '@/components/track/MultiBabyLogReview'
import { MultiBabySelectField } from '@/components/track/MultiBabySelectField'
import {
  DiaperBabyPicker,
  DiaperLogFormFields,
  diaperCreateToFormState,
  diaperDraftSummary,
  diaperFormStateToCreate,
  type DiaperFormState,
} from '@/components/track/DiaperLogFormFields'
import type { Baby } from '@/schemas/user'
import type { DiaperLogCreate } from '@/types/babyLog'
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
  reviewDrafts?: MultiBabyDraft<DiaperLogCreate>[]
  onUpdateReviewDraft?: (babyId: string, fields: DiaperLogCreate) => void
  formState: DiaperFormState
  setFormState: (patch: Partial<DiaperFormState>) => void
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

export function DiaperLogModal({
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
  const theme = getTrackThemeFromPalette('diaper', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingLogId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={
        showReviewStep
          ? 'Review diaper logs'
          : isEdit
            ? 'Edit diaper change'
            : 'Log diaper change'
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
          renderSummary={(draft) => diaperDraftSummary(draft.fields)}
          renderFields={(draft) => (
            <DiaperLogFormFields
              state={diaperCreateToFormState(draft.fields)}
              setState={(patch) =>
                onUpdateReviewDraft(
                  draft.babyId,
                  diaperFormStateToCreate({ ...diaperCreateToFormState(draft.fields), ...patch }),
                )
              }
              accent={theme.accent}
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
            <DiaperBabyPicker
              babies={babies}
              formBabyId={formBabyId}
              setFormBabyId={setFormBabyId}
              accentBorder={theme.accentBorder}
              accentSoft={theme.accentSoft}
            />
          ) : null}

          <DiaperLogFormFields
            state={formState}
            setState={setFormState}
            accent={theme.accent}
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
