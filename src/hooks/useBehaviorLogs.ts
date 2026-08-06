import { useCallback, useMemo, useState } from 'react'

import {
  behaviorWriteFromForm,
  createBehaviorLog,
  dedupeBehaviorLogs,
  deleteBehaviorLog,
  loadBehaviorLogsForBabies,
  updateBehaviorLog,
} from '@/api/behaviorApi'
import { getBabyId, isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import type { Baby } from '@/schemas/user'
import { behaviorLogFromDetails, type BehaviorLogCreate, type LogRecord } from '@/types/babyLog'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { todayCount } from '@/lib/trackUtils'
import { useMultiBabyLogFlow } from '@/hooks/useMultiBabyLogFlow'
import {
  behaviorFormStateToCreate,
  type BehaviorFormState,
} from '@/components/track/BehaviorLogFormFields'
import {
  DEFAULT_BEHAVIOR_TAG,
  customTagsFromSelection,
  parseBehaviorTags,
  todayLocalYmd,
} from '@/lib/behaviorLogUtils'
import type { MultiBabyDraft } from '@/lib/multiBabyLogFlow'

export function useBehaviorLogs() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()
  const confirm = useConfirmAction()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [behaviorLogs, setBehaviorLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState('')

  const [behaviorTags, setBehaviorTags] = useState<string[]>([DEFAULT_BEHAVIOR_TAG])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [occurredOn, setOccurredOn] = useState(todayLocalYmd)
  const [occurredTime, setOccurredTime] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [resolution, setResolution] = useState('')
  const [formBabyId, setFormBabyId] = useState('')
  const [editingLogId, setEditingLogId] = useState('')

  const isEdit = Boolean(editingLogId.trim())
  const multi = useMultiBabyLogFlow(isEdit)

  const formState: BehaviorFormState = useMemo(
    () => ({
      behaviorTags,
      customTags,
      occurredOn,
      occurredTime,
      location,
      notes,
      resolution,
    }),
    [behaviorTags, customTags, occurredOn, occurredTime, location, notes, resolution],
  )

  const setFormState = useCallback((patch: Partial<BehaviorFormState>) => {
    if (patch.behaviorTags !== undefined) setBehaviorTags(patch.behaviorTags)
    if (patch.customTags !== undefined) setCustomTags(patch.customTags)
    if (patch.occurredOn !== undefined) setOccurredOn(patch.occurredOn)
    if (patch.occurredTime !== undefined) setOccurredTime(patch.occurredTime)
    if (patch.location !== undefined) setLocation(patch.location)
    if (patch.notes !== undefined) setNotes(patch.notes)
    if (patch.resolution !== undefined) setResolution(patch.resolution)
  }, [])

  const todayBehavior = useMemo(() => todayCount(behaviorLogs, 'behavior'), [behaviorLogs])
  const busyLogId = deletingLogId

  const babyIdsKey = useMemo(
    () =>
      babies
        .map((b) => b.id?.trim())
        .filter(Boolean)
        .sort()
        .join(','),
    [babies],
  )

  const syncLogs = useCallback(async (babyList: Baby[]) => {
    if (!isApiConfigured() || !babyList.length) {
      setBehaviorLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await loadBehaviorLogsForBabies(
        babyList.map((b) => ({ id: b.id, fullName: b.fullName })),
      )
      setBehaviorLogs(dedupeBehaviorLogs(rows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load behavior logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useDeferredEffect(() => {
    const userId = user?.id?.trim() ?? ''
    if (!isApiConfigured() || !userId) {
      setBabiesLoading(false)
      return
    }

    setBabiesLoading(true)
    void loadBabiesForCurrentUser()
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load your babies')
      })
      .finally(() => setBabiesLoading(false))
  }, [user?.id, loadBabiesForCurrentUser])

  useDeferredEffect(() => {
    if (!isApiConfigured() || !user?.id) {
      setBehaviorLogs([])
      setLoading(false)
      return
    }
    if (!babies.length) {
      setBehaviorLogs([])
      if (!babiesLoading) setLoading(false)
      return
    }
    void syncLogs(babies)
  }, [user?.id, babyIdsKey, babiesLoading, babies, syncLogs])

  const resetForm = () => {
    setEditingLogId('')
    setBehaviorTags([DEFAULT_BEHAVIOR_TAG])
    setCustomTags([])
    setOccurredOn(todayLocalYmd())
    setOccurredTime('')
    setLocation('')
    setNotes('')
    setResolution('')
    multi.resetMultiBabyFlow('')
  }

  const buildBehaviorFields = useCallback((): BehaviorLogCreate | null => {
    const fields = behaviorFormStateToCreate(formState)
    if (!fields.occurredOn.trim() || !fields.behaviorTag.trim() || !fields.location.trim()) {
      return null
    }
    return fields
  }, [formState])

  const openForm = () => {
    resetForm()
    const defaultId =
      selectedBabyId || babies.find((b) => b.id?.trim())?.id?.trim() || getBabyId() || ''
    setFormBabyId(defaultId)
    multi.resetMultiBabyFlow(defaultId)
    if (!selectedBabyId && defaultId) {
      const baby = babies.find((b) => b.id === defaultId)
      if (baby) selectBaby(baby)
    }
    setFormOpen(true)
  }

  const openEditBehavior = (log: LogRecord) => {
    const fields = behaviorLogFromDetails(log.details, log.atIso)
    const tags = parseBehaviorTags(fields.behaviorTag)
    const babyId =
      log.details.babyId?.trim() ||
      babies.find((b) => b.fullName?.trim() === log.details.babyName?.trim())?.id?.trim() ||
      ''

    setEditingLogId(log.id)
    setFormBabyId(babyId || selectedBabyId || getBabyId() || '')
    const selected = tags.length ? tags : [DEFAULT_BEHAVIOR_TAG]
    setBehaviorTags(selected)
    setCustomTags(customTagsFromSelection(selected))
    setOccurredOn(fields.occurredOn || todayLocalYmd())
    setOccurredTime(fields.occurredTime ?? '')
    setLocation(fields.location)
    setNotes(fields.notes ?? '')
    setResolution(fields.resolution ?? '')
    multi.resetMultiBabyFlow(babyId || selectedBabyId || getBabyId() || '')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const onDeleteBehavior = (log: LogRecord) => {
    const logId = log.id?.trim()
    if (!logId || !isApiConfigured()) return

    const babyName = log.details.babyName?.trim() || 'this log'
    confirm({
      title: 'Delete behavior log?',
      message: `Remove the behavior log for ${babyName}? This cannot be undone.`,
      onConfirm: async () => {
        setDeletingLogId(logId)
        setError(null)
        try {
          if (!logId.startsWith('local-')) {
            await deleteBehaviorLog(logId)
          }
          setBehaviorLogs((prev) => prev.filter((l) => l.id !== logId))
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to delete behavior log')
        } finally {
          setDeletingLogId('')
        }
      },
    })
  }

  const onSaveBehavior = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to sync behavior logs with the API.')
      return
    }

    const fields = buildBehaviorFields()
    if (!fields) {
      setError('Select at least one behavior, and enter a date and location.')
      return
    }

    const editId = editingLogId.trim()

    if (multi.showReviewStep) {
      const drafts = multi.reviewDrafts as MultiBabyDraft<BehaviorLogCreate>[]
      if (!drafts.length) {
        setError('No babies selected.')
        return
      }

      setSaving(true)
      setError(null)
      try {
        for (const draft of drafts) {
          await createBehaviorLog(behaviorWriteFromForm(draft.babyId, draft.fields))
        }
        const firstBaby = babies.find((b) => b.id === drafts[0]?.babyId)
        if (firstBaby) selectBaby(firstBaby)
        closeForm()
        await syncLogs(babies)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save behavior logs')
      } finally {
        setSaving(false)
      }
      return
    }

    if (multi.isMultiCreate) {
      multi.startReview(multi.formBabyIds, babies, fields)
      return
    }

    const babyId = multi.formBabyIds[0] || formBabyId.trim() || selectedBabyId || getBabyId()
    if (!babyId) {
      setError('Select a baby before logging behavior.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const baby = babies.find((b) => b.id === babyId)
      if (editId) {
        await updateBehaviorLog(behaviorWriteFromForm(babyId, fields, editId))
      } else {
        await createBehaviorLog(behaviorWriteFromForm(babyId, fields))
      }
      if (baby) selectBaby(baby)
      closeForm()
      await syncLogs(babies)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save behavior log')
    } finally {
      setSaving(false)
    }
  }

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    behaviorLogs,
    loading,
    error,
    saving,
    formOpen,
    todayBehavior,
    busyLogId,
    openForm,
    closeForm,
    openEditBehavior,
    onDeleteBehavior,
    onSaveBehavior,
    formBabyId,
    setFormBabyId,
    formBabyIds: multi.formBabyIds,
    toggleFormBabyId: multi.toggleFormBabyId,
    showReviewStep: multi.showReviewStep,
    isMultiCreate: multi.isMultiCreate,
    reviewDrafts: multi.reviewDrafts as MultiBabyDraft<BehaviorLogCreate>[],
    updateReviewDraft: multi.updateReviewDraftFields,
    backToEntry: multi.backToEntry,
    formState,
    setFormState,
    editingLogId,
  }
}
