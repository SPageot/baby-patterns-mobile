import { useCallback, useMemo, useState } from 'react'

import {
  createPottyLog,
  dedupePottyLogs,
  deletePottyLog,
  loadPottyLogsForBabies,
  pottyWriteFromForm,
  updatePottyLog,
} from '@/api/pottyApi'
import { getBabyId, isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import type { Baby } from '@/schemas/user'
import { pottyLogFromDetails, type PottyLogCreate, type LogRecord } from '@/types/babyLog'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { isoToDatetimeLocalValue, nowLocalInputValue, todayCount } from '@/lib/trackUtils'
import { useMultiBabyLogFlow } from '@/hooks/useMultiBabyLogFlow'
import {
  pottyCreateToFormState,
  pottyFormStateToCreate,
  type PottyFormState,
} from '@/components/track/PottyLogFormFields'
import { DEFAULT_POTTY_RESULT } from '@/lib/pottyLogUtils'
import type { MultiBabyDraft } from '@/lib/multiBabyLogFlow'

export function usePottyLogs() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()
  const confirm = useConfirmAction()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [pottyLogs, setPottyLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState('')

  const [pottyResult, setPottyResult] = useState(DEFAULT_POTTY_RESULT)
  const [pottyTime, setPottyTime] = useState(nowLocalInputValue)
  const [pottyLocation, setPottyLocation] = useState('potty-chair')
  const [pottyNotes, setPottyNotes] = useState('')
  const [pottyTeething, setPottyTeething] = useState(false)
  const [pottySick, setPottySick] = useState(false)
  const [formBabyId, setFormBabyId] = useState('')
  const [editingLogId, setEditingLogId] = useState('')

  const isEdit = Boolean(editingLogId.trim())
  const multi = useMultiBabyLogFlow(isEdit)

  const formState: PottyFormState = useMemo(
    () => ({
      pottyResult,
      pottyTime,
      pottyLocation,
      pottyNotes,
      pottyTeething,
      pottySick,
    }),
    [pottyResult, pottyTime, pottyLocation, pottyNotes, pottyTeething, pottySick],
  )

  const setFormState = useCallback((patch: Partial<PottyFormState>) => {
    if (patch.pottyResult !== undefined) setPottyResult(patch.pottyResult)
    if (patch.pottyTime !== undefined) setPottyTime(patch.pottyTime)
    if (patch.pottyLocation !== undefined) setPottyLocation(patch.pottyLocation)
    if (patch.pottyNotes !== undefined) setPottyNotes(patch.pottyNotes)
    if (patch.pottyTeething !== undefined) setPottyTeething(patch.pottyTeething)
    if (patch.pottySick !== undefined) setPottySick(patch.pottySick)
  }, [])

  const todayPotty = useMemo(() => todayCount(pottyLogs, 'potty'), [pottyLogs])
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
      setPottyLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await loadPottyLogsForBabies(
        babyList.map((b) => ({ id: b.id, fullName: b.fullName })),
      )
      setPottyLogs(dedupePottyLogs(rows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load potty logs')
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
      setPottyLogs([])
      setLoading(false)
      return
    }
    if (!babies.length) {
      setPottyLogs([])
      if (!babiesLoading) setLoading(false)
      return
    }
    void syncLogs(babies)
  }, [user?.id, babyIdsKey, babiesLoading, babies, syncLogs])

  const resetForm = () => {
    setEditingLogId('')
    setPottyResult(DEFAULT_POTTY_RESULT)
    setPottyLocation('potty-chair')
    setPottyNotes('')
    setPottyTeething(false)
    setPottySick(false)
    setPottyTime(nowLocalInputValue())
    multi.resetMultiBabyFlow('')
  }

  const buildPottyFields = useCallback((): PottyLogCreate | null => {
    const started = new Date(formState.pottyTime)
    if (Number.isNaN(started.getTime())) return null
    return pottyFormStateToCreate(formState)
  }, [formState])

  const openForm = () => {
    resetForm()
    const defaultId = selectedBabyId || babies.find((b) => b.id?.trim())?.id?.trim() || getBabyId() || ''
    setFormBabyId(defaultId)
    multi.resetMultiBabyFlow(defaultId)
    if (!selectedBabyId && defaultId) {
      const baby = babies.find((b) => b.id === defaultId)
      if (baby) selectBaby(baby)
    }
    setFormOpen(true)
  }

  const openEditPotty = (log: LogRecord) => {
    const fields = pottyLogFromDetails(log.details, log.atIso)
    const formFields = pottyCreateToFormState(fields)
    const babyId =
      log.details.babyId?.trim() ||
      babies.find((b) => b.fullName?.trim() === log.details.babyName?.trim())?.id?.trim() ||
      ''

    setEditingLogId(log.id)
    setFormBabyId(babyId || selectedBabyId || getBabyId() || '')
    setPottyResult(formFields.pottyResult)
    setPottyLocation(formFields.pottyLocation)
    setPottyNotes(formFields.pottyNotes)
    setPottyTeething(formFields.pottyTeething)
    setPottySick(formFields.pottySick)
    setPottyTime(isoToDatetimeLocalValue(log.atIso))
    multi.resetMultiBabyFlow(babyId || selectedBabyId || getBabyId() || '')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const onDeletePotty = (log: LogRecord) => {
    const logId = log.id?.trim()
    if (!logId || !isApiConfigured()) return

    const babyName = log.details.babyName?.trim() || 'this log'
    confirm({
      title: 'Delete potty log?',
      message: `Remove the potty visit for ${babyName}? This cannot be undone.`,
      onConfirm: async () => {
        setDeletingLogId(logId)
        setError(null)
        try {
          if (!logId.startsWith('local-')) {
            await deletePottyLog(logId)
          }
          setPottyLogs((prev) => prev.filter((l) => l.id !== logId))
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to delete potty log')
        } finally {
          setDeletingLogId('')
        }
      },
    })
  }

  const onSavePotty = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to sync potty logs with the API.')
      return
    }

    const fields = buildPottyFields()
    if (!fields) {
      setError('Enter a valid time for this potty visit.')
      return
    }

    const editId = editingLogId.trim()

    if (multi.showReviewStep) {
      const drafts = multi.reviewDrafts as MultiBabyDraft<PottyLogCreate>[]
      if (!drafts.length) {
        setError('No babies selected.')
        return
      }

      setSaving(true)
      setError(null)
      try {
        for (const draft of drafts) {
          await createPottyLog(pottyWriteFromForm(draft.babyId, draft.fields))
        }
        const firstBaby = babies.find((b) => b.id === drafts[0]?.babyId)
        if (firstBaby) selectBaby(firstBaby)
        closeForm()
        await syncLogs(babies)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save potty logs')
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
      setError('Select a baby before logging potty visits.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const baby = babies.find((b) => b.id === babyId)
      if (editId) {
        await updatePottyLog(pottyWriteFromForm(babyId, fields, editId))
      } else {
        await createPottyLog(pottyWriteFromForm(babyId, fields))
      }
      if (baby) selectBaby(baby)
      closeForm()
      await syncLogs(babies)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save potty log')
    } finally {
      setSaving(false)
    }
  }

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    pottyLogs,
    loading,
    error,
    saving,
    formOpen,
    todayPotty,
    busyLogId,
    openForm,
    closeForm,
    openEditPotty,
    onDeletePotty,
    onSavePotty,
    formBabyId,
    setFormBabyId,
    formBabyIds: multi.formBabyIds,
    toggleFormBabyId: multi.toggleFormBabyId,
    showReviewStep: multi.showReviewStep,
    isMultiCreate: multi.isMultiCreate,
    reviewDrafts: multi.reviewDrafts as MultiBabyDraft<PottyLogCreate>[],
    updateReviewDraft: multi.updateReviewDraftFields,
    backToEntry: multi.backToEntry,
    formState,
    setFormState,
    editingLogId,
  }
}
