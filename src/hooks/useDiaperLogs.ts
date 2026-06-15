import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import {
  createDiaperLog,
  deleteDiaperLog,
  loadDiaperLogsForBabies,
  dedupeDiaperLogs,
  updateDiaperLog,
} from '@/api/diaperApi'
import { getBabyId, isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import type { Baby } from '@/schemas/user'
import { diaperLogFromDetails, type DiaperLogCreate, type LogRecord } from '@/types/babyLog'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { isoToDatetimeLocalValue, nowLocalInputValue, todayCount } from '@/lib/trackUtils'

export function useDiaperLogs() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [diaperLogs, setDiaperLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState('')

  const [diaperPee, setDiaperPee] = useState(false)
  const [diaperPoop, setDiaperPoop] = useState(false)
  const [diaperAnythingElse, setDiaperAnythingElse] = useState(false)
  const [diaperAnythingElseDesc, setDiaperAnythingElseDesc] = useState('')
  const [diaperTime, setDiaperTime] = useState(nowLocalInputValue)
  const [diaperBrand, setDiaperBrand] = useState('')
  const [diaperSize, setDiaperSize] = useState('')
  const [diaperCream, setDiaperCream] = useState('')
  const [diaperTeething, setDiaperTeething] = useState(false)
  const [diaperSick, setDiaperSick] = useState(false)
  const [formBabyId, setFormBabyId] = useState('')
  const [editingLogId, setEditingLogId] = useState('')

  const todayDiapers = useMemo(() => todayCount(diaperLogs, 'diaper'), [diaperLogs])
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
      setDiaperLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await loadDiaperLogsForBabies(
        babyList.map((b) => ({ id: b.id, fullName: b.fullName })),
      )
      setDiaperLogs(dedupeDiaperLogs(rows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load diaper logs')
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
      setDiaperLogs([])
      setLoading(false)
      return
    }
    if (!babies.length) {
      setDiaperLogs([])
      if (!babiesLoading) setLoading(false)
      return
    }
    void syncLogs(babies)
  }, [user?.id, babyIdsKey, babiesLoading, babies, syncLogs])

  const resetForm = () => {
    setEditingLogId('')
    setDiaperPee(false)
    setDiaperPoop(false)
    setDiaperAnythingElse(false)
    setDiaperAnythingElseDesc('')
    setDiaperTime(nowLocalInputValue())
    setDiaperBrand('')
    setDiaperSize('')
    setDiaperCream('')
    setDiaperTeething(false)
    setDiaperSick(false)
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

  const openEditDiaper = (log: LogRecord) => {
    const fields = diaperLogFromDetails(log.details, log.atIso)
    const babyId =
      log.details.babyId?.trim() ||
      babies.find((b) => b.fullName?.trim() === log.details.babyName?.trim())?.id?.trim() ||
      ''

    setEditingLogId(log.id)
    setFormBabyId(babyId || selectedBabyId || getBabyId() || '')
    setDiaperPee(fields.isTherePee)
    setDiaperPoop(fields.isTherePoop)
    setDiaperAnythingElse(fields.isThereAnythingElse)
    setDiaperAnythingElseDesc(fields.anythingElseDescription || '')
    setDiaperBrand(fields.diaperBrand)
    setDiaperSize(fields.diaperSize)
    setDiaperCream(fields.diaperCreamUsed)
    setDiaperTeething(Boolean(fields.isTeething))
    setDiaperSick(Boolean(fields.isSick))
    setDiaperTime(isoToDatetimeLocalValue(log.atIso))
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const onDeleteDiaper = (log: LogRecord) => {
    const logId = log.id?.trim()
    if (!logId || !isApiConfigured()) return

    const babyName = log.details.babyName?.trim() || 'this log'
    Alert.alert('Delete diaper change?', `Remove the change for ${babyName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingLogId(logId)
            setError(null)
            try {
              if (!logId.startsWith('local-')) {
                await deleteDiaperLog(logId)
              }
              setDiaperLogs((prev) => prev.filter((l) => l.id !== logId))
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to delete diaper log')
            } finally {
              setDeletingLogId('')
            }
          })()
        },
      },
    ])
  }

  const onSaveDiaper = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to sync diapers with the API.')
      return
    }

    const babyId = formBabyId.trim() || selectedBabyId || getBabyId()
    if (!babyId) {
      setError('Select a baby before logging diapers.')
      return
    }

    const fields: DiaperLogCreate = {
      isTherePee: diaperPee,
      isTherePoop: diaperPoop,
      isThereAnythingElse: diaperAnythingElse,
      anythingElseDescription: diaperAnythingElseDesc.trim() || null,
      time: diaperTime.trim(),
      diaperBrand: diaperBrand.trim(),
      diaperSize: diaperSize.trim(),
      diaperCreamUsed: diaperCream.trim(),
      isTeething: diaperTeething,
      isSick: diaperSick,
    }

    setSaving(true)
    setError(null)
    try {
      const baby = babies.find((b) => b.id === babyId)
      const editId = editingLogId.trim()

      if (editId) {
        await updateDiaperLog(editId, babyId, fields)
      } else {
        await createDiaperLog(babyId, fields)
      }

      if (baby) selectBaby(baby)
      closeForm()
      await syncLogs(babies)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save diaper log')
    } finally {
      setSaving(false)
    }
  }

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    diaperLogs,
    loading,
    error,
    saving,
    formOpen,
    todayDiapers,
    busyLogId,
    openForm,
    closeForm,
    openEditDiaper,
    onDeleteDiaper,
    onSaveDiaper,
    formBabyId,
    setFormBabyId,
    diaperPee,
    setDiaperPee,
    diaperPoop,
    setDiaperPoop,
    diaperAnythingElse,
    setDiaperAnythingElse,
    diaperAnythingElseDesc,
    setDiaperAnythingElseDesc,
    diaperTime,
    setDiaperTime,
    diaperBrand,
    setDiaperBrand,
    diaperSize,
    setDiaperSize,
    diaperCream,
    setDiaperCream,
    diaperTeething,
    setDiaperTeething,
    diaperSick,
    setDiaperSick,
    editingLogId,
  }
}
