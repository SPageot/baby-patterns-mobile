import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { getBabyId, isApiConfigured } from '@/api/config'
import {
  createSleepLog,
  deleteSleepLog,
  loadSleepLogsForBabies,
  sleepWriteFromForm,
  updateSleepLog,
} from '@/api/sleepApi'
import { useApp } from '@/context/AppContext'
import type { Baby } from '@/schemas/user'
import {
  isoToDatetimeUtcValue,
  isoToUtcDateValue,
  nowUtcDateValue,
  nowUtcInputValue,
  todayCount,
} from '@/lib/trackUtils'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import type { LogRecord, SleepLogCreate } from '@/types/babyLog'
import { useMultiBabyLogFlow } from '@/hooks/useMultiBabyLogFlow'
import {
  sleepFormStateToCreate,
  type SleepFormState,
} from '@/components/track/SleepLogFormFields'
import type { MultiBabyDraft } from '@/lib/multiBabyLogFlow'

export function useSleepLogs() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [sleepLogs, setSleepLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState('')

  const [formBabyId, setFormBabyId] = useState('')
  const [editingLogId, setEditingLogId] = useState('')
  const [sleepDate, setSleepDate] = useState(nowUtcDateValue)
  const [sleepStart, setSleepStart] = useState(nowUtcInputValue)
  const [sleepEnd, setSleepEnd] = useState(nowUtcInputValue)
  const [sleepMood, setSleepMood] = useState('')
  const [sleepEnvironment, setSleepEnvironment] = useState('')
  const [sleepTeething, setSleepTeething] = useState(false)
  const [sleepSick, setSleepSick] = useState(false)
  const [sleepNap, setSleepNap] = useState(false)

  const isEdit = Boolean(editingLogId.trim())
  const multi = useMultiBabyLogFlow(isEdit)

  const formState: SleepFormState = useMemo(
    () => ({
      sleepDate,
      sleepStart,
      sleepEnd,
      sleepMood,
      sleepEnvironment,
      sleepTeething,
      sleepSick,
      sleepNap,
    }),
    [sleepDate, sleepStart, sleepEnd, sleepMood, sleepEnvironment, sleepTeething, sleepSick, sleepNap],
  )

  const setFormState = useCallback((patch: Partial<SleepFormState>) => {
    if (patch.sleepDate !== undefined) setSleepDate(patch.sleepDate)
    if (patch.sleepStart !== undefined) setSleepStart(patch.sleepStart)
    if (patch.sleepEnd !== undefined) setSleepEnd(patch.sleepEnd)
    if (patch.sleepMood !== undefined) setSleepMood(patch.sleepMood)
    if (patch.sleepEnvironment !== undefined) setSleepEnvironment(patch.sleepEnvironment)
    if (patch.sleepTeething !== undefined) setSleepTeething(patch.sleepTeething)
    if (patch.sleepSick !== undefined) setSleepSick(patch.sleepSick)
    if (patch.sleepNap !== undefined) setSleepNap(patch.sleepNap)
  }, [])

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

  const syncLogs = useCallback(async (babyList: Baby[]) => {
    if (!isApiConfigured() || !babyList.length) {
      setSleepLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await loadSleepLogsForBabies(
        babyList.map((b) => ({ id: b.id, fullName: b.fullName })),
      )
      setSleepLogs(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sleep logs')
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
      setSleepLogs([])
      setLoading(false)
      return
    }
    if (!babies.length) {
      setSleepLogs([])
      if (!babiesLoading) setLoading(false)
      return
    }
    void syncLogs(babies)
  }, [user?.id, babyIdsKey, babiesLoading, babies, syncLogs])

  const resetForm = () => {
    setEditingLogId('')
    setSleepMood('')
    setSleepEnvironment('')
    setSleepTeething(false)
    setSleepSick(false)
    setSleepNap(false)
    setSleepDate(nowUtcDateValue())
    setSleepStart(nowUtcInputValue())
    setSleepEnd(nowUtcInputValue())
    multi.resetMultiBabyFlow('')
  }

  const buildSleepFields = useCallback((): SleepLogCreate | null => {
    if (!formState.sleepMood.trim()) return null
    if (!formState.sleepEnvironment.trim()) return null
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

    const startIso = d.sleepStartTime || d.start || log.atIso
    const endIso = d.sleepEndTime || d.end || log.atIso

    setEditingLogId(log.id)
    setFormBabyId(babyId || selectedBabyId || getBabyId() || '')
    setSleepDate(d.sleepDate?.trim() || isoToUtcDateValue(startIso) || nowUtcDateValue())
    setSleepStart(isoToDatetimeUtcValue(startIso))
    setSleepEnd(isoToDatetimeUtcValue(endIso))
    setSleepMood(d.sleepMood?.trim() ?? '')
    setSleepEnvironment(d.sleepEnvironment?.trim() ?? '')
    setSleepTeething(d.isTeething === 'true')
    setSleepSick(d.isSick === 'true')
    setSleepNap(d.isNap === 'true')
    multi.resetMultiBabyFlow(babyId || selectedBabyId || getBabyId() || '')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const onDeleteSleep = (log: LogRecord) => {
    const logId = log.id?.trim()
    if (!logId || !isApiConfigured()) return

    Alert.alert('Delete sleep log?', 'Remove this sleep session from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
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
          })()
        },
      },
    ])
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
      if (!formState.sleepMood.trim()) {
        setError('Enter a sleep mood.')
        return
      }
      if (!formState.sleepEnvironment.trim()) {
        setError('Enter a sleep environment.')
        return
      }
      setError('Enter valid start and end times.')
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
    backToEntry: multi.backToEntry,
    formState,
    setFormState,
    editingLogId,
  }
}
