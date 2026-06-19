import { View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { MultiBabyLogReview } from '@/components/track/MultiBabyLogReview'
import { MultiBabySelectField } from '@/components/track/MultiBabySelectField'
import {
  PottyBabyPicker,
  PottyLogFormFields,
  pottyCreateToFormState,
  pottyDraftSummary,
  pottyFormStateToCreate,
  type PottyFormState,
} from '@/components/track/PottyLogFormFields'
import type { Baby } from '@/schemas/user'
import type { PottyLogCreate } from '@/types/babyLog'
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
  reviewDrafts?: MultiBabyDraft<PottyLogCreate>[]
  onUpdateReviewDraft?: (babyId: string, fields: PottyLogCreate) => void
  formState: PottyFormState
  setFormState: (patch: Partial<PottyFormState>) => void
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

export function PottyLogModal({
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
  const theme = getTrackThemeFromPalette('potty', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(editingLogId?.trim())

  return (
    <TrackLogModalShell
      open={open}
      onClose={onClose}
      title={
        showReviewStep
          ? 'Review potty logs'
          : isEdit
            ? 'Edit potty visit'
            : 'Log potty visit'
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
          renderSummary={(draft) => pottyDraftSummary(draft.fields)}
          renderFields={(draft) => (
            <PottyLogFormFields
              state={pottyCreateToFormState(draft.fields)}
              setState={(patch) =>
                onUpdateReviewDraft(
                  draft.babyId,
                  pottyFormStateToCreate({ ...pottyCreateToFormState(draft.fields), ...patch }),
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
            <PottyBabyPicker
              babies={babies}
              formBabyId={formBabyId}
              setFormBabyId={setFormBabyId}
              accentBorder={theme.accentBorder}
              accentSoft={theme.accentSoft}
            />
          ) : null}

          <PottyLogFormFields
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
              style={styles.actionBtn}
            />
          </View>
        </>
      )}
    </TrackLogModalShell>
  )
}
