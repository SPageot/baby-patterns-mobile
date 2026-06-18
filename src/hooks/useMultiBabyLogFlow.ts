import { useCallback, useState } from 'react'

import {
  createMultiBabyDrafts,
  toggleBabyIdInList,
  updateMultiBabyDraft,
  type MultiBabyDraft,
  type MultiBabyFormStep,
} from '@/lib/multiBabyLogFlow'
import type { Baby } from '@/schemas/user'

export function useMultiBabyLogFlow(isEdit: boolean) {
  const [formBabyIds, setFormBabyIds] = useState<string[]>([])
  const [formStep, setFormStep] = useState<MultiBabyFormStep>('entry')
  const [reviewDrafts, setReviewDrafts] = useState<MultiBabyDraft<unknown>[]>([])

  const resetMultiBabyFlow = useCallback((defaultBabyId: string) => {
    setFormBabyIds(defaultBabyId ? [defaultBabyId] : [])
    setFormStep('entry')
    setReviewDrafts([])
  }, [])

  const toggleFormBabyId = useCallback(
    (babyId: string) => {
      if (isEdit) return
      setFormBabyIds((prev) => toggleBabyIdInList(prev, babyId))
    },
    [isEdit],
  )

  const startReview = useCallback(
    <T,>(babyIds: string[], babies: Baby[], template: T) => {
      setReviewDrafts(createMultiBabyDrafts(babyIds, babies, template))
      setFormStep('review')
    },
    [],
  )

  const updateReviewDraftFields = useCallback(<T,>(babyId: string, fields: T) => {
    setReviewDrafts((prev) => updateMultiBabyDraft(prev as MultiBabyDraft<T>[], babyId, fields))
  }, [])

  const backToEntry = useCallback(() => {
    setFormStep('entry')
  }, [])

  const isMultiCreate = !isEdit && formBabyIds.length > 1
  const showReviewStep = formStep === 'review' && reviewDrafts.length > 0

  return {
    formBabyIds,
    toggleFormBabyId,
    reviewDrafts,
    resetMultiBabyFlow,
    startReview,
    updateReviewDraftFields,
    backToEntry,
    isMultiCreate,
    showReviewStep,
  }
}
