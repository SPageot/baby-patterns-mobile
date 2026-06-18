import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { useFocusEffect } from 'expo-router'

import {
  createGrowthMeasurement,
  deleteGrowthMeasurement,
  deleteGrowthMedia,
  loadGrowthForBabies,
  updateGrowthMeasurement,
  uploadGrowthMedia,
} from '@/api/growthApi'
import {
  createMilestone,
  deleteMilestone,
  deleteMilestoneMedia,
  loadMilestonesForBabies,
  updateMilestone,
  uploadMilestoneMedia,
} from '@/api/milestoneApi'
import { getBabyId, isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import type { GrowthMeasurementDto, MilestoneCategory, MilestoneDto, TrackingMediaType } from '@/types/growth'
import type { TrackingMediaUploadPayload } from '@/lib/trackingMediaUpload'
import { isoToDatetimeLocalValue, nowLocalInputValue } from '@/lib/trackUtils'

export function useGrowthPage() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()

  const [babiesLoading, setBabiesLoading] = useState(false)
  const [measurements, setMeasurements] = useState<(GrowthMeasurementDto & { babyName: string })[]>([])
  const [milestones, setMilestones] = useState<(MilestoneDto & { babyName: string })[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [growthFormOpen, setGrowthFormOpen] = useState(false)
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false)
  const [editingGrowthId, setEditingGrowthId] = useState('')
  const [editingMilestoneId, setEditingMilestoneId] = useState('')
  const [formBabyId, setFormBabyId] = useState('')

  const [recordedAt, setRecordedAt] = useState(nowLocalInputValue)
  const [weightLbs, setWeightLbs] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [headInches, setHeadInches] = useState('')
  const [growthNotes, setGrowthNotes] = useState('')
  const [growthMedia, setGrowthMedia] = useState<TrackingMediaUploadPayload | null>(null)
  const [growthExistingMediaUrl, setGrowthExistingMediaUrl] = useState<string | null>(null)
  const [growthExistingMediaType, setGrowthExistingMediaType] = useState<TrackingMediaType | null>(null)
  const [growthRemoveMedia, setGrowthRemoveMedia] = useState(false)

  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneCategory, setMilestoneCategory] = useState<MilestoneCategory>('motor')
  const [achievedAt, setAchievedAt] = useState(nowLocalInputValue)
  const [milestoneNotes, setMilestoneNotes] = useState('')
  const [milestoneMedia, setMilestoneMedia] = useState<TrackingMediaUploadPayload | null>(null)
  const [milestoneExistingMediaUrl, setMilestoneExistingMediaUrl] = useState<string | null>(null)
  const [milestoneExistingMediaType, setMilestoneExistingMediaType] = useState<TrackingMediaType | null>(
    null,
  )
  const [milestoneRemoveMedia, setMilestoneRemoveMedia] = useState(false)

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

  const visibleMeasurements = useMemo(() => {
    if (!filterBabyId) return measurements
    return measurements.filter((m) => m.babyId === filterBabyId)
  }, [measurements, filterBabyId])

  const visibleMilestones = useMemo(() => {
    if (!filterBabyId) return milestones
    return milestones.filter((m) => m.babyId === filterBabyId)
  }, [milestones, filterBabyId])

  const syncAll = useCallback(async () => {
    if (!isApiConfigured() || !babies.length) {
      setMeasurements([])
      setMilestones([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const refs = babies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const [growthRows, milestoneRows] = await Promise.all([
        loadGrowthForBabies(refs),
        loadMilestonesForBabies(refs),
      ])
      setMeasurements(growthRows)
      setMilestones(milestoneRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load growth data')
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
          setMeasurements([])
          setMilestones([])
          setLoading(false)
        }
        return
      }
      void syncAll()
    }, [user?.id, babyIdsKey, babiesLoading, babies, syncAll]),
  )

  const resetGrowthForm = () => {
    setEditingGrowthId('')
    setRecordedAt(nowLocalInputValue())
    setWeightLbs('')
    setHeightInches('')
    setHeadInches('')
    setGrowthNotes('')
    setGrowthMedia(null)
    setGrowthExistingMediaUrl(null)
    setGrowthExistingMediaType(null)
    setGrowthRemoveMedia(false)
  }

  const resetMilestoneForm = () => {
    setEditingMilestoneId('')
    setMilestoneTitle('')
    setMilestoneCategory('motor')
    setAchievedAt(nowLocalInputValue())
    setMilestoneNotes('')
    setMilestoneMedia(null)
    setMilestoneExistingMediaUrl(null)
    setMilestoneExistingMediaType(null)
    setMilestoneRemoveMedia(false)
  }

  const defaultBabyId = () =>
    selectedBabyId || babies.find((b) => b.id?.trim())?.id?.trim() || getBabyId() || ''

  const openGrowthForm = () => {
    resetGrowthForm()
    setFormBabyId(defaultBabyId())
    setGrowthFormOpen(true)
  }

  const openEditGrowth = (row: GrowthMeasurementDto) => {
    setEditingGrowthId(row.id)
    setFormBabyId(row.babyId)
    setRecordedAt(isoToDatetimeLocalValue(row.recordedAt))
    setWeightLbs(row.weightLbs != null && row.weightLbs !== '' ? String(row.weightLbs) : '')
    setHeightInches(row.heightInches != null && row.heightInches !== '' ? String(row.heightInches) : '')
    setHeadInches(
      row.headCircumferenceInches != null && row.headCircumferenceInches !== ''
        ? String(row.headCircumferenceInches)
        : '',
    )
    setGrowthNotes(row.notes?.trim() ?? '')
    setGrowthExistingMediaUrl(row.mediaUrl?.trim() || null)
    setGrowthExistingMediaType(row.mediaType ?? null)
    setGrowthMedia(null)
    setGrowthRemoveMedia(false)
    setGrowthFormOpen(true)
  }

  const closeGrowthForm = () => {
    setGrowthFormOpen(false)
    resetGrowthForm()
  }

  const openMilestoneForm = (preset?: { title: string; category: MilestoneCategory }) => {
    resetMilestoneForm()
    setFormBabyId(defaultBabyId())
    if (preset) {
      setMilestoneTitle(preset.title)
      setMilestoneCategory(preset.category)
    }
    setMilestoneFormOpen(true)
  }

  const openEditMilestone = (row: MilestoneDto) => {
    setEditingMilestoneId(row.id)
    setFormBabyId(row.babyId)
    setMilestoneTitle(row.title)
    setMilestoneCategory(row.category)
    setAchievedAt(isoToDatetimeLocalValue(row.achievedAt))
    setMilestoneNotes(row.notes?.trim() ?? '')
    setMilestoneExistingMediaUrl(row.mediaUrl?.trim() || null)
    setMilestoneExistingMediaType(row.mediaType ?? null)
    setMilestoneMedia(null)
    setMilestoneRemoveMedia(false)
    setMilestoneFormOpen(true)
  }

  const closeMilestoneForm = () => {
    setMilestoneFormOpen(false)
    resetMilestoneForm()
  }

  const onSaveGrowth = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to save growth measurements.')
      return
    }
    const babyId = formBabyId.trim() || defaultBabyId()
    if (!babyId) {
      setError('Select a baby first.')
      return
    }
    if (!weightLbs.trim() && !heightInches.trim() && !headInches.trim()) {
      setError('Enter at least weight, height, or head circumference.')
      return
    }

    const payload = {
      babyId,
      id: editingGrowthId.trim() || undefined,
      recordedAt,
      weightLbs: weightLbs.trim() || undefined,
      heightInches: heightInches.trim() || undefined,
      headCircumferenceInches: headInches.trim() || undefined,
      notes: growthNotes.trim() || undefined,
    }

    setSaving(true)
    setError(null)
    try {
      let saved: GrowthMeasurementDto
      if (editingGrowthId.trim()) {
        saved = await updateGrowthMeasurement(payload)
      } else {
        saved = await createGrowthMeasurement(payload)
      }
      if (growthRemoveMedia && !growthMedia) {
        await deleteGrowthMedia(saved.id)
      } else if (growthMedia) {
        await uploadGrowthMedia(saved.id, growthMedia)
      }
      const baby = babies.find((b) => b.id === babyId)
      if (baby) selectBaby(baby)
      closeGrowthForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save measurement')
    } finally {
      setSaving(false)
    }
  }

  const deleteGrowth = async (id: string) => {
    setError(null)
    try {
      await deleteGrowthMeasurement(id)
      if (editingGrowthId === id) closeGrowthForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete measurement')
    }
  }

  const onDeleteGrowth = (id: string) => {
    if (!id.trim()) return
    Alert.alert('Delete measurement?', 'Delete this growth measurement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteGrowth(id) },
    ])
  }

  const onSaveMilestone = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL to save milestones.')
      return
    }
    const babyId = formBabyId.trim() || defaultBabyId()
    if (!babyId) {
      setError('Select a baby first.')
      return
    }
    if (!milestoneTitle.trim()) {
      setError('Enter a milestone title.')
      return
    }

    const payload = {
      babyId,
      id: editingMilestoneId.trim() || undefined,
      title: milestoneTitle.trim(),
      category: milestoneCategory,
      achievedAt,
      notes: milestoneNotes.trim() || undefined,
    }

    setSaving(true)
    setError(null)
    try {
      let saved: MilestoneDto
      if (editingMilestoneId.trim()) {
        saved = await updateMilestone(payload)
      } else {
        saved = await createMilestone(payload)
      }
      if (milestoneRemoveMedia && !milestoneMedia) {
        await deleteMilestoneMedia(saved.id)
      } else if (milestoneMedia) {
        await uploadMilestoneMedia(saved.id, milestoneMedia)
      }
      const baby = babies.find((b) => b.id === babyId)
      if (baby) selectBaby(baby)
      closeMilestoneForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save milestone')
    } finally {
      setSaving(false)
    }
  }

  const deleteMilestoneRow = async (id: string) => {
    setError(null)
    try {
      await deleteMilestone(id)
      if (editingMilestoneId === id) closeMilestoneForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete milestone')
    }
  }

  const onDeleteMilestone = (id: string) => {
    if (!id.trim()) return
    Alert.alert('Delete milestone?', 'Delete this milestone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteMilestoneRow(id) },
    ])
  }

  return {
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    loading,
    error,
    saving,
    measurements: visibleMeasurements,
    milestones: visibleMilestones,
    measurementCount: visibleMeasurements.length,
    milestoneCount: visibleMilestones.length,
    growthFormOpen,
    milestoneFormOpen,
    openGrowthForm,
    closeGrowthForm,
    openEditGrowth,
    onSaveGrowth,
    onDeleteGrowth,
    openMilestoneForm,
    closeMilestoneForm,
    openEditMilestone,
    onSaveMilestone,
    onDeleteMilestone,
    formBabyId,
    setFormBabyId,
    recordedAt,
    setRecordedAt,
    weightLbs,
    setWeightLbs,
    heightInches,
    setHeightInches,
    headInches,
    setHeadInches,
    growthNotes,
    setGrowthNotes,
    growthMedia,
    setGrowthMedia,
    growthExistingMediaUrl,
    growthExistingMediaType,
    growthRemoveMedia,
    setGrowthRemoveMedia,
    milestoneTitle,
    setMilestoneTitle,
    milestoneCategory,
    setMilestoneCategory,
    achievedAt,
    setAchievedAt,
    milestoneNotes,
    setMilestoneNotes,
    milestoneMedia,
    setMilestoneMedia,
    milestoneExistingMediaUrl,
    milestoneExistingMediaType,
    milestoneRemoveMedia,
    setMilestoneRemoveMedia,
    editingGrowthId,
    editingMilestoneId,
  }
}
