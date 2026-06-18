import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { getBabyId, isApiConfigured } from '@/api/config'
import {
  createSleepLog,
  deleteSleepLog,
  loadSleepLogsForBabies,
  sleepFieldsToUtc,
  sleepWriteFromForm,
  updateSleepLog,
} from '@/api/sleepApi'
import { useApp } from '@/context/AppContext'
import type { Baby } from '@/schemas/user'
import {
  datetimeUtcInputToIso,
  formatMinutesHuman,
  isoToDatetimeUtcValue,
  isoToUtcDateValue,
  minutesBetweenUtcDateTimeInputs,
  nowUtcDateValue,
  nowUtcInputValue,
  todayCount,
} from '@/lib/trackUtils'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import type { LogRecord } from '@/types/babyLog'

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

  const todaySleep = useMemo(() => todayCount(sleepLogs, 'sleep'), [sleepLogs])
  const busyLogId = deletingLogId

  const sleepDurationPreview = useMemo(() => {
    const m = minutesBetweenUtcDateTimeInputs(sleepStart, sleepEnd)
    return m == null ? '—' : formatMinutesHuman(m)
  }, [sleepStart, sleepEnd])

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

    const babyId = formBabyId.trim() || selectedBabyId || getBabyId()
    if (!babyId) {
      setError('Select a baby before logging sleep.')
      return
    }

    if (!sleepMood.trim()) {
      setError('Enter a sleep mood.')
      return
    }

    if (!sleepEnvironment.trim()) {
      setError('Enter a sleep environment.')
      return
    }

    const startIso = datetimeUtcInputToIso(sleepStart)
    const endIso = datetimeUtcInputToIso(sleepEnd)
    const durationMin = minutesBetweenUtcDateTimeInputs(sleepStart, sleepEnd)
    if (durationMin == null) {
      setError('Enter valid start and end times.')
      return
    }

    const fields = sleepFieldsToUtc({
      sleepDate: sleepDate.trim(),
      sleepDuration: String(durationMin),
      sleepMood: sleepMood.trim(),
      sleepStartTime: startIso,
      sleepEndTime: endIso,
      sleepEnvironment: sleepEnvironment.trim(),
      isTeething: sleepTeething,
      isSick: sleepSick,
      isNap: sleepNap,
    })

    const editId = editingLogId.trim()

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
    sleepDate,
    setSleepDate,
    sleepStart,
    setSleepStart,
    sleepEnd,
    setSleepEnd,
    sleepMood,
    setSleepMood,
    sleepEnvironment,
    setSleepEnvironment,
    sleepTeething,
    setSleepTeething,
    sleepSick,
    setSleepSick,
    sleepNap,
    setSleepNap,
    sleepDurationPreview,
    editingLogId,
  }
}
