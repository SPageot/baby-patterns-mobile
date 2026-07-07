import { useCallback, useMemo, useRef, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'

import {
  createDailyMemory,
  deleteDailyMemory,
  deleteDailyMemoryMedia,
  loadDailyMemoriesForBabies,
  updateDailyMemory,
  uploadDailyMemoryMedia,
} from '@/api/dailyMemoryApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import {
  dailyMemoryToFormState,
  emptyDailyMemoryFormState,
  formStateToDailyMemoryWrite,
  normalizeDailyMemoryWrite,
  validateDailyMemory,
  type DailyMemory,
  type DailyMemoryFormState,
} from '@/schemas/dailyMemory'
import type { ValidationIssue } from '@/schemas/user'
import type { TrackingMediaType } from '@/types/growth'
import type { TrackingMediaUploadPayload } from '@/lib/trackingMediaUpload'
import { nowLocalDateValue, ymdFromDate } from '@/lib/trackUtils'

export function useDailyMemories() {
  const confirm = useConfirmAction()
  const router = useRouter()
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [memoryRows, setMemoryRows] = useState<(DailyMemory & { babyName: string })[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [selectedYmd, setSelectedYmd] = useState(() => ymdFromDate(new Date()))
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [formState, setFormState] = useState<DailyMemoryFormState>(() => emptyDailyMemoryFormState())
  const [fieldErrors, setFieldErrors] = useState<ValidationIssue[]>([])

  const [mediaPick, setMediaPick] = useState<TrackingMediaUploadPayload | null>(null)
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null)
  const [existingMediaType, setExistingMediaType] = useState<TrackingMediaType | null>(null)
  const [removeMedia, setRemoveMedia] = useState(false)

  const syncGen = useRef(0)

  const filterBabyId = selectedBabyId?.trim() || ''

  const babyIdsKey = useMemo(
    () =>
      babies
        .map((b) => b.id?.trim())
        .filter(Boolean)
        .sort()
        .join(','),
    [babies],
  )

  const visibleMemories = useMemo(() => {
    if (!filterBabyId) return memoryRows
    return memoryRows.filter((row) => row.babyId === filterBabyId)
  }, [memoryRows, filterBabyId])

  const memoriesByDate = useMemo(() => {
    const map = new Map<string, (DailyMemory & { babyName: string })[]>()
    for (const memory of visibleMemories) {
      const key = memory.memoryDate
      const list = map.get(key) ?? []
      list.push(memory)
      map.set(key, list)
    }
    return map
  }, [visibleMemories])

  const selectedDayMemories = useMemo(
    () => memoriesByDate.get(selectedYmd) ?? [],
    [memoriesByDate, selectedYmd],
  )

  const resetMedia = useCallback(() => {
    setMediaPick(null)
    setExistingMediaUrl(null)
    setExistingMediaType(null)
    setRemoveMedia(false)
  }, [])

  const syncAll = useCallback(async () => {
    if (!isApiConfigured() || !babies.length) {
      setMemoryRows([])
      setLoading(false)
      return
    }

    const gen = ++syncGen.current
    setLoading(true)
    setError(null)
    try {
      const refs = babies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const rows = await loadDailyMemoriesForBabies(refs)
      if (gen === syncGen.current) setMemoryRows(rows)
    } catch (e) {
      if (gen === syncGen.current) {
        setError(e instanceof Error ? e.message : 'Failed to load daily memories')
      }
    } finally {
      if (gen === syncGen.current) setLoading(false)
    }
  }, [babies])

  useFocusEffect(
    useCallback(() => {
      const userId = user?.id?.trim() ?? ''
      if (!isApiConfigured() || !userId) {
        setLoading(false)
        return
      }

      setBabiesLoading(true)
      void loadBabiesForCurrentUser()
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Failed to load babies')
        })
        .finally(() => setBabiesLoading(false))
    }, [user?.id, loadBabiesForCurrentUser]),
  )

  useFocusEffect(
    useCallback(() => {
      if (!isApiConfigured() || !user?.id) return
      if (!babies.length) {
        if (!babiesLoading) {
          setMemoryRows([])
          setLoading(false)
        }
        return
      }
      void syncAll()
    }, [user?.id, babyIdsKey, babiesLoading, babies, syncAll]),
  )

  const openCreate = useCallback(
    (ymd = selectedYmd) => {
      const babyId = filterBabyId || babies[0]?.id?.trim() || ''
      setEditingId('')
      setFormState({ ...emptyDailyMemoryFormState(ymd || nowLocalDateValue()), babyId })
      setFieldErrors([])
      resetMedia()
      setFormOpen(true)
    },
    [selectedYmd, filterBabyId, babies, resetMedia],
  )

  const selectDay = useCallback(
    (ymd: string) => {
      setSelectedYmd(ymd)
      const dayMemories = memoriesByDate.get(ymd) ?? []
      if (dayMemories.length > 0) {
        router.push(`/daily-memories/${ymd}` as '/')
      } else {
        openCreate(ymd)
      }
    },
    [memoriesByDate, openCreate, router],
  )

  const openEdit = useCallback((memory: DailyMemory) => {
    setEditingId(memory.id)
    setFormState(dailyMemoryToFormState(memory))
    setFieldErrors([])
    setExistingMediaUrl(memory.mediaUrl?.trim() || null)
    setExistingMediaType(memory.mediaType ?? null)
    setMediaPick(null)
    setRemoveMedia(false)
    setFormOpen(true)
  }, [])

  const patchFormState = useCallback((patch: Partial<DailyMemoryFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }))
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingId('')
    setFieldErrors([])
    resetMedia()
  }, [resetMedia])

  const saveForm = useCallback(async () => {
    const payload = normalizeDailyMemoryWrite(formStateToDailyMemoryWrite(formState, editingId || undefined))
    const issues = validateDailyMemory(payload)
    if (issues.length) {
      setFieldErrors(issues)
      return
    }

    setSaving(true)
    setError(null)
    try {
      let saved: DailyMemory
      if (editingId) {
        saved = await updateDailyMemory(payload)
      } else {
        saved = await createDailyMemory(payload)
      }
      if (removeMedia && !mediaPick) {
        await deleteDailyMemoryMedia(saved.id)
      } else if (mediaPick) {
        await uploadDailyMemoryMedia(saved.id, mediaPick)
      }
      closeForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save memory')
    } finally {
      setSaving(false)
    }
  }, [formState, editingId, closeForm, syncAll, removeMedia, mediaPick])

  const removeMemory = useCallback(
    (id: string) => {
      confirm({
        title: 'Delete this memory?',
        message: 'This cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          setSaving(true)
          setError(null)
          try {
            await deleteDailyMemory(id)
            await syncAll()
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete memory')
          } finally {
            setSaving(false)
          }
        },
      })
    },
    [confirm, syncAll],
  )

  return {
    hasBaby: babies.length > 0,
    babiesLoading,
    loading,
    error,
    saving,
    babies,
    filterBabyId,
    selectBaby,
    visibleMemories,
    memoriesByDate,
    selectedYmd,
    setSelectedYmd,
    selectDay,
    selectedDayMemories,
    formOpen,
    formState,
    patchFormState,
    fieldErrors,
    editingId,
    mediaPick,
    existingMediaUrl,
    existingMediaType,
    removeMedia,
    setMediaPick,
    setRemoveMedia,
    openCreate,
    openEdit,
    closeForm,
    saveForm,
    removeMemory,
  }
}
