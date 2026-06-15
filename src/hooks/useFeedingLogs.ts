import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { toUtcIsoTime } from '@/api/diaperApi'
import {
  createFeedingLog,
  deleteFeedingLog,
  dedupeFeedingLogs,
  feedingWriteFromForm,
  loadFeedingLogsForBabies,
  updateFeedingLog,
} from '@/api/feedingApi'
import { getBabyId, isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import type { Baby } from '@/schemas/user'
import { feedingLogFromDetails, type FeedingLogCreate, type LogRecord } from '@/types/babyLog'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { isoToDatetimeLocalValue, nowLocalInputValue, todayCount } from '@/lib/trackUtils'

const FEEDING_TYPES = ['breast', 'bottle', 'solids', 'snack'] as const

export function useFeedingLogs() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [feedingLogs, setFeedingLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState('')

  const [feedingType, setFeedingType] = useState<string>('breast')
  const [feedingWhen, setFeedingWhen] = useState(nowLocalInputValue)
  const [feedingOz, setFeedingOz] = useState('')
  const [feedingMin, setFeedingMin] = useState('')
  const [feedingNotes, setFeedingNotes] = useState('')
  const [feedingTeething, setFeedingTeething] = useState(false)
  const [feedingSick, setFeedingSick] = useState(false)
  const [formBabyId, setFormBabyId] = useState('')
  const [editingLogId, setEditingLogId] = useState('')

  const todayFeeds = useMemo(() => todayCount(feedingLogs, 'feeding'), [feedingLogs])
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
      setFeedingLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await loadFeedingLogsForBabies(
        babyList.map((b) => ({ id: b.id, fullName: b.fullName })),
      )
      setFeedingLogs(dedupeFeedingLogs(rows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feeding logs')
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
      setFeedingLogs([])
      setLoading(false)
      return
    }
    if (!babies.length) {
      setFeedingLogs([])
      if (!babiesLoading) setLoading(false)
      return
    }
    void syncLogs(babies)
  }, [user?.id, babyIdsKey, babiesLoading, babies, syncLogs])

  const resetForm = () => {
    setEditingLogId('')
    setFeedingType('breast')
    setFeedingOz('')
    setFeedingMin('')
    setFeedingNotes('')
    setFeedingTeething(false)
    setFeedingSick(false)
    setFeedingWhen(nowLocalInputValue())
  }

  const openForm = () => {
    resetForm()
    const defaultId = selectedBabyId || babies.find((b) => b.id?.trim())?.id?.trim() || getBabyId() || ''
    setFormBabyId(defaultId)
    if (!selectedBabyId && defaultId) {
      const baby = babies.find((b) => b.id === defaultId)
      if (baby) selectBaby(baby)
    }
    setFormOpen(true)
  }

  const openEditFeeding = (log: LogRecord) => {
    const fields = feedingLogFromDetails(log.details, log.atIso)
    const babyId =
      log.details.babyId?.trim() ||
      babies.find((b) => b.fullName?.trim() === log.details.babyName?.trim())?.id?.trim() ||
      ''

    setEditingLogId(log.id)
    setFormBabyId(babyId || selectedBabyId || getBabyId() || '')
    setFeedingType(fields.feedingType)
    setFeedingWhen(isoToDatetimeLocalValue(fields.feedingAt))
    setFeedingOz(fields.amountOz ?? '')
    setFeedingMin(fields.durationMin ?? '')
    setFeedingNotes(fields.notes ?? '')
    setFeedingTeething(Boolean(fields.isTeething))
    setFeedingSick(Boolean(fields.isSick))
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const onDeleteFeeding = (log: LogRecord) => {
    const logId = log.id?.trim()
    if (!logId || !isApiConfigured()) return

    Alert.alert('Delete feeding log?', 'Remove this feeding from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingLogId(logId)
            setError(null)
            try {
              await deleteFeedingLog(logId)
              if (editingLogId === logId) closeForm()
              await syncLogs(babies)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to delete feeding log')
            } finally {
              setDeletingLogId('')
            }
          })()
        },
      },
    ])
  }

  const onSaveFeeding = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to sync feedings with the API.')
      return
    }

    const babyId = formBabyId.trim() || selectedBabyId || getBabyId()
    if (!babyId) {
      setError('Select a baby before logging feedings.')
      return
    }

    const started = new Date(feedingWhen)
    if (Number.isNaN(started.getTime())) {
      setError('Enter a valid date and time.')
      return
    }

    const fields: FeedingLogCreate = {
      feedingType,
      feedingAt: toUtcIsoTime(started.toISOString()),
      amountOz: feedingOz.trim() || undefined,
      durationMin: feedingMin.trim() || undefined,
      notes: feedingNotes.trim() || undefined,
      isTeething: feedingTeething,
      isSick: feedingSick,
    }

    const editId = editingLogId.trim()

    setSaving(true)
    setError(null)
    try {
      const payload = feedingWriteFromForm(babyId, fields, editId || undefined)
      if (editId) {
        await updateFeedingLog(payload)
      } else {
        await createFeedingLog(payload)
      }

      const baby = babies.find((b) => b.id === babyId)
      if (baby) selectBaby(baby)
      closeForm()
      await syncLogs(babies)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save feeding log')
    } finally {
      setSaving(false)
    }
  }

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    feedingLogs,
    loading,
    error,
    saving,
    formOpen,
    todayFeeds,
    busyLogId,
    feedingTypes: FEEDING_TYPES,
    openForm,
    closeForm,
    openEditFeeding,
    onDeleteFeeding,
    onSaveFeeding,
    formBabyId,
    setFormBabyId,
    feedingType,
    setFeedingType,
    feedingWhen,
    setFeedingWhen,
    feedingOz,
    setFeedingOz,
    feedingMin,
    setFeedingMin,
    feedingNotes,
    setFeedingNotes,
    feedingTeething,
    setFeedingTeething,
    feedingSick,
    setFeedingSick,
    editingLogId,
  }
}
