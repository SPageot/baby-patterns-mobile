import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'

import {
  createPediatricianVisit,
  deletePediatricianVisit,
  loadPediatricianVisitsForBabies,
  updatePediatricianVisit,
} from '@/api/pediatricianApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { isoToDatetimeLocalValue, nowLocalInputValue } from '@/lib/trackUtils'
import { filterPediatricianHistoryForUser } from '@/lib/healthAccess'
import { isProUser } from '@/lib/subscription'

export function usePediatricianVisitsPage() {
  const confirm = useConfirmAction()
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [visitRows, setVisitRows] = useState<(PediatricianVisitDto & { babyName: string })[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [formBabyId, setFormBabyId] = useState('')
  const [visitedAt, setVisitedAt] = useState(nowLocalInputValue)
  const [hospital, setHospital] = useState('')
  const [pediatricianName, setPediatricianName] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [immunizations, setImmunizations] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const babyIdsKey = useMemo(
    () =>
      babies
        .map((b) => b.id?.trim())
        .filter(Boolean)
        .sort()
        .join(','),
    [babies],
  )

  const filterBabyId = selectedBabyId?.trim() || ''
  const isPro = isProUser(user)

  const visibleVisits = useMemo(() => {
    const scoped = !filterBabyId
      ? visitRows
      : visitRows.filter((r) => r.babyId === filterBabyId)
    return filterPediatricianHistoryForUser(scoped, user)
  }, [visitRows, filterBabyId, user])

  const syncAll = useCallback(async () => {
    if (!isApiConfigured() || !babies.length) {
      setVisitRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const refs = babies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const rows = await loadPediatricianVisitsForBabies(refs)
      setVisitRows(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pediatrician visits')
    } finally {
      setLoading(false)
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
          setVisitRows([])
          setLoading(false)
        }
        return
      }
      void syncAll()
    }, [user?.id, babyIdsKey, babiesLoading, babies, syncAll]),
  )

  const resolveFormBabyId = () =>
    formBabyId.trim() || filterBabyId || babies[0]?.id?.trim() || ''

  const resetForm = () => {
    setEditingId('')
    setVisitedAt(nowLocalInputValue())
    setHospital('')
    setPediatricianName('')
    setRecommendations('')
    setImmunizations([])
    setNotes('')
  }

  const openForm = () => {
    resetForm()
    setFormBabyId(resolveFormBabyId())
    setFormOpen(true)
  }

  const openEdit = (row: PediatricianVisitDto) => {
    setEditingId(row.id)
    setFormBabyId(row.babyId)
    setVisitedAt(isoToDatetimeLocalValue(row.visitedAt))
    setHospital(row.hospital ?? '')
    setPediatricianName(row.pediatricianName)
    setRecommendations(row.recommendations ?? '')
    setImmunizations([...row.immunizations])
    setNotes(row.notes ?? '')
    setFormOpen(true)
  }

  const onSave = async () => {
    const babyId = resolveFormBabyId()
    const name = pediatricianName.trim()
    if (!babyId) {
      setError('Select a baby first.')
      return
    }
    if (!name) {
      setError('Pediatrician name is required.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: editingId || undefined,
        babyId,
        visitedAt,
        hospital: hospital.trim() || undefined,
        pediatricianName: name,
        recommendations: recommendations.trim() || undefined,
        immunizations,
        notes: notes.trim() || undefined,
      }
      if (editingId) {
        await updatePediatricianVisit(payload)
      } else {
        await createPediatricianVisit(payload)
      }
      setFormOpen(false)
      resetForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save pediatrician visit')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = (id: string) => {
    confirm({
      title: 'Delete pediatrician visit?',
      message: 'This visit log will be removed permanently.',
      onConfirm: async () => {
        setError(null)
        try {
          await deletePediatricianVisit(id)
          await syncAll()
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to delete pediatrician visit')
        }
      },
    })
  }

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    loading,
    error,
    saving,
    isPro,
    visitCount: visibleVisits.length,
    visibleVisits,
    formOpen,
    setFormOpen,
    editingId,
    formBabyId,
    setFormBabyId,
    visitedAt,
    setVisitedAt,
    hospital,
    setHospital,
    pediatricianName,
    setPediatricianName,
    recommendations,
    setRecommendations,
    immunizations,
    setImmunizations,
    notes,
    setNotes,
    openForm,
    openEdit,
    onSave,
    onDelete,
  }
}
