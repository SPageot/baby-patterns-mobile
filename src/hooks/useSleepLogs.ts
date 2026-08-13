import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getBabyId, isApiConfigured } from '@/api/config'
import {
  createSleepLog,
  deleteSleepLog,
  loadSleepLogsForBabies,
  sleepWriteFromForm,
  updateSleepLog,
} from '@/api/sleepApi'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import type { Baby } from '@/schemas/user'
import {
  nowUtcDateValue,
  nowUtcTimeValue,
  todayCount,
} from '@/lib/trackUtils'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import {
  cacheFirstLoad,
  LOGS_TTL_MS,
  logsCacheKey,
  peekCachedData,
} from '@/lib/dataCache'
import type { LogRecord, SleepLogCreate } from '@/types/babyLog'
import { useMultiBabyLogFlow } from '@/hooks/useMultiBabyLogFlow'
import { sleepLogFromDetails } from '@/types/babyLog'
import {
  defaultSleepFormState,
  sleepCreateToFormState,
  sleepDetailsToFormState,
  sleepFormStateToCreate,
  type SleepFormState,
} from '@/components/track/SleepLogFormFields'
import type { MultiBabyDraft } from '@/lib/multiBabyLogFlow'

export function useSleepLogs() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()
  const confirm = useConfirmAction()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [sleepLogs, setSleepLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)

  const [formBabyId, setFormBabyId] = useState('')
  const [editingLogId, setEditingLogId] = useState('')
  const [formState, setFormStateInternal] = useState<SleepFormState>(() => ({
    ...defaultSleepFormState(),
    sleepDate: nowUtcDateValue(),
    sleepStart: nowUtcTimeValue(),
    sleepEnd: nowUtcTimeValue(),
  }))

  const isEdit = Boolean(editingLogId.trim())
  const multi = useMultiBabyLogFlow(isEdit)

  const setFormState = useCallback((patch: Partial<SleepFormState>) => {
    setFormStateInternal((prev) => ({ ...prev, ...patch }))
  }, [])

  const seedSleepTimesToNow = useCallback(() => {
    setFormStateInternal((prev) => ({
      ...prev,
      sleepDate: nowUtcDateValue(),
      sleepStart: nowUtcTimeValue(),
      sleepEnd: nowUtcTimeValue(),
    }))
  }, [])

  const prevFormOpen = useRef(false)
  useEffect(() => {
    const justOpened = formOpen && !prevFormOpen.current
    prevFormOpen.current = formOpen
    if (justOpened && !editingLogId.trim()) {
      seedSleepTimesToNow()
    }
  }, [formOpen, editingLogId, seedSleepTimesToNow])

  const todaySleep = useMemo(() => todayCount(sleepLogs, 'sleep'), [sleepLogs])
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

  const syncLogs = useCallback(async (babyList: Baby[], options?: { showLoading?: boolean }) => {
    if (!isApiConfigured() || !babyList.length) {
      setSleepLogs([])
      setLoading(false)
      return
    }

    const showLoading = options?.showLoading ?? true
    const key = logsCacheKey(
      'sleep',
      babyList.map((b) => b.id),
    )
    setError(null)

    try {
      await cacheFirstLoad({
        key,
        ttlMs: LOGS_TTL_MS,
        showLoading,
        setLoading,
        apply: setSleepLogs,
        fetcher: () =>
          loadSleepLogsForBabies(babyList.map((b) => ({ id: b.id, fullName: b.fullName }))),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sleep logs')
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
      setSleepLogs([])
      setLoading(false)
      return
    }
    if (!babies.length) {
      setSleepLogs([])
      if (!babiesLoading) setLoading(false)
      return
    }

    const key = logsCacheKey(
      'sleep',
      babies.map((b) => b.id),
    )
    const cached = peekCachedData<LogRecord[]>(key)
    if (cached) setSleepLogs(cached.data)

    void syncLogs(babies, { showLoading: !cached })
  }, [user?.id, babyIdsKey, babiesLoading, babies, syncLogs])

  const resetForm = () => {
    setEditingLogId('')
    setFormStateInternal({
      ...defaultSleepFormState(),
      sleepDate: nowUtcDateValue(),
      sleepStart: nowUtcTimeValue(),
      sleepEnd: nowUtcTimeValue(),
    })
    multi.resetMultiBabyFlow('')
  }

  const buildSleepFields = useCallback((): SleepLogCreate | null => {
    return sleepFormStateToCreate(formState)
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

  const openEditSleep = (log: LogRecord) => {
    const d = log.details
    const babyId =
      d.babyId?.trim() ||
      babies.find((b) => b.fullName?.trim() === d.babyName?.trim())?.id?.trim() ||
      ''

    setEditingLogId(log.id)
    setFormBabyId(babyId || selectedBabyId || getBabyId() || '')
    setFormStateInternal(sleepDetailsToFormState(d, log.atIso))
    multi.resetMultiBabyFlow(babyId || selectedBabyId || getBabyId() || '')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const backToEntry = useCallback(() => {
    multi.backToEntry()
    if (!editingLogId.trim()) seedSleepTimesToNow()
  }, [multi, editingLogId, seedSleepTimesToNow])

  const onDeleteSleep = (log: LogRecord) => {
    const logId = log.id?.trim()
    if (!logId || !isApiConfigured()) return

    confirm({
      title: 'Delete sleep log?',
      message: 'Remove this sleep session from your history? This cannot be undone.',
      onConfirm: async () => {
        setDeletingLogId(logId)
        setError(null)
        try {
          await deleteSleepLog(logId)
          if (editingLogId === logId) closeForm()
          await syncLogs(babies)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to delete sleep log')
        } finally {
          setDeletingLogId('')
        }
      },
    })
  }

  const onSaveSleep = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to sync sleep with the API.')
      return
    }

    const editId = editingLogId.trim()

    if (multi.showReviewStep) {
      const drafts = multi.reviewDrafts as MultiBabyDraft<SleepLogCreate>[]
      if (!drafts.length) {
        setError('No babies selected.')
        return
      }

      setSaving(true)
      setError(null)
      try {
        for (const draft of drafts) {
          await createSleepLog(sleepWriteFromForm(draft.babyId, draft.fields))
        }
        const firstBaby = babies.find((b) => b.id === drafts[0]?.babyId)
        if (firstBaby) selectBaby(firstBaby)
        closeForm()
        await syncLogs(babies)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save sleep logs')
      } finally {
        setSaving(false)
      }
      return
    }

    const fields = buildSleepFields()
    if (!fields) {
      setError('Enter a valid sleep start time.')
      return
    }

    if (multi.isMultiCreate) {
      multi.startReview(multi.formBabyIds, babies, fields)
      return
    }

    const babyId = multi.formBabyIds[0] || formBabyId.trim() || selectedBabyId || getBabyId()
    if (!babyId) {
      setError('Select a baby before logging sleep.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = sleepWriteFromForm(babyId, fields, editId || undefined)
      if (editId) {
        await updateSleepLog(payload)
      } else {
        await createSleepLog(payload)
      }

      const baby = babies.find((b) => b.id === babyId)
      if (baby) selectBaby(baby)
      closeForm()
      await syncLogs(babies)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save sleep log')
    } finally {
      setSaving(false)
    }
  }

  const downloadSleepPdf = useCallback(async () => {
    if (!sleepLogs.length) {
      setError('Log at least one sleep session before exporting a PDF.')
      return
    }
    setExportingPdf(true)
    setError(null)
    try {
      const caregiverName = user?.fullName?.trim() || user?.username?.trim() || 'Caregiver'
      const { downloadSleepReportPdf } = await import('@/lib/sleepReportPdf')
      await downloadSleepReportPdf({
        logs: sleepLogs,
        babies,
        selectedBabyId: selectedBabyId ?? '',
        caregiverName,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create sleep PDF')
    } finally {
      setExportingPdf(false)
    }
  }, [sleepLogs, babies, selectedBabyId, user])

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    sleepLogs,
    loading,
    error,
    saving,
    formOpen,
    todaySleep,
    busyLogId,
    openForm,
    closeForm,
    openEditSleep,
    onDeleteSleep,
    onSaveSleep,
    formBabyId,
    setFormBabyId,
    formBabyIds: multi.formBabyIds,
    toggleFormBabyId: multi.toggleFormBabyId,
    showReviewStep: multi.showReviewStep,
    isMultiCreate: multi.isMultiCreate,
    reviewDrafts: multi.reviewDrafts as MultiBabyDraft<SleepLogCreate>[],
    updateReviewDraft: multi.updateReviewDraftFields,
    backToEntry,
    formState,
    setFormState,
    editingLogId,
    exportingPdf,
    downloadSleepPdf,
  }
}
