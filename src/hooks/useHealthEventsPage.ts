import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  createInjuryEvent,
  deleteInjuryEvent,
  loadInjuryForBabies,
  updateInjuryEvent,
} from '@/api/injuryApi'
import {
  createSicknessEvent,
  deleteSicknessEvent,
  loadSicknessForBabies,
  updateSicknessEvent,
} from '@/api/sicknessApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import type {
  HealthTabId,
  InjuryEventDto,
  SicknessEventDto,
} from '@/types/health'
import { SICKNESS_TYPE_OPTIONS } from '@/types/health'
import { isoToDatetimeLocalValue, nowLocalInputValue } from '@/lib/trackUtils'
import { filterInjuryHistoryForUser, filterSicknessHistoryForUser } from '@/lib/healthAccess'
import { isProUser } from '@/lib/subscription'

export function useHealthEventsPage() {
  const { babies, selectedBabyId, selectBaby, user, loadBabiesForCurrentUser } = useApp()
  const confirm = useConfirmAction()

  const [activeTab, setActiveTab] = useState<HealthTabId>('sickness')
  const [babiesLoading, setBabiesLoading] = useState(false)
  const [sicknessRows, setSicknessRows] = useState<(SicknessEventDto & { babyName: string })[]>([])
  const [injuryRows, setInjuryRows] = useState<(InjuryEventDto & { babyName: string })[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [sicknessFormOpen, setSicknessFormOpen] = useState(false)
  const [injuryFormOpen, setInjuryFormOpen] = useState(false)
  const [editingSicknessId, setEditingSicknessId] = useState('')
  const [editingInjuryId, setEditingInjuryId] = useState('')
  const [formBabyId, setFormBabyId] = useState('')

  const [sicknessType, setSicknessType] = useState<string>(SICKNESS_TYPE_OPTIONS[0])
  const [sicknessCustomType, setSicknessCustomType] = useState('')
  const [startedAt, setStartedAt] = useState(nowLocalInputValue)
  const [endedAt, setEndedAt] = useState('')
  const [temperatureF, setTemperatureF] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [usedDoctor, setUsedDoctor] = useState(false)
  const [doctorRecommendations, setDoctorRecommendations] = useState('')
  const [usedNatural, setUsedNatural] = useState(false)
  const [naturalRemedies, setNaturalRemedies] = useState('')
  const [usedMedication, setUsedMedication] = useState(false)
  const [medicationUsed, setMedicationUsed] = useState('')
  const [medicationAmount, setMedicationAmount] = useState('')
  const [sicknessNotes, setSicknessNotes] = useState('')

  const [injuryDescription, setInjuryDescription] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [hasSwelling, setHasSwelling] = useState(false)
  const [occurredAt, setOccurredAt] = useState(nowLocalInputValue)
  const [injuryEndedAt, setInjuryEndedAt] = useState('')
  const [injuryUsedDoctor, setInjuryUsedDoctor] = useState(false)
  const [injuryDoctorRecommendations, setInjuryDoctorRecommendations] = useState('')
  const [injuryUsedNatural, setInjuryUsedNatural] = useState(false)
  const [injuryNaturalRemedies, setInjuryNaturalRemedies] = useState('')
  const [injuryNotes, setInjuryNotes] = useState('')

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

  const visibleSickness = useMemo(() => {
    const scoped = !filterBabyId
      ? sicknessRows
      : sicknessRows.filter((r) => r.babyId === filterBabyId)
    return filterSicknessHistoryForUser(scoped, user)
  }, [sicknessRows, filterBabyId, user])

  const visibleInjuries = useMemo(() => {
    const scoped = !filterBabyId
      ? injuryRows
      : injuryRows.filter((r) => r.babyId === filterBabyId)
    return filterInjuryHistoryForUser(scoped, user)
  }, [injuryRows, filterBabyId, user])

  const syncAll = useCallback(async () => {
    if (!isApiConfigured() || !babies.length) {
      setSicknessRows([])
      setInjuryRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const refs = babies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const [sickness, injuries] = await Promise.all([
        loadSicknessForBabies(refs),
        loadInjuryForBabies(refs),
      ])
      setSicknessRows(sickness)
      setInjuryRows(injuries)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load health events')
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
          setSicknessRows([])
          setInjuryRows([])
          setLoading(false)
        }
        return
      }
      void syncAll()
    }, [user?.id, babyIdsKey, babiesLoading, babies, syncAll]),
  )

  const resolveFormBabyId = () =>
    formBabyId.trim() || filterBabyId || babies[0]?.id?.trim() || ''

  const resetSicknessForm = () => {
    setEditingSicknessId('')
    setSicknessType(SICKNESS_TYPE_OPTIONS[0])
    setSicknessCustomType('')
    setStartedAt(nowLocalInputValue())
    setEndedAt('')
    setTemperatureF('')
    setSymptoms([])
    setUsedDoctor(false)
    setDoctorRecommendations('')
    setUsedNatural(false)
    setNaturalRemedies('')
    setUsedMedication(false)
    setMedicationUsed('')
    setMedicationAmount('')
    setSicknessNotes('')
  }

  const resetInjuryForm = () => {
    setEditingInjuryId('')
    setInjuryDescription('')
    setBodyPart('')
    setHasSwelling(false)
    setOccurredAt(nowLocalInputValue())
    setInjuryEndedAt('')
    setInjuryUsedDoctor(false)
    setInjuryDoctorRecommendations('')
    setInjuryUsedNatural(false)
    setInjuryNaturalRemedies('')
    setInjuryNotes('')
  }

  const openSicknessForm = () => {
    resetSicknessForm()
    setFormBabyId(resolveFormBabyId())
    setSicknessFormOpen(true)
  }

  const openEditSickness = (row: SicknessEventDto) => {
    setEditingSicknessId(row.id)
    setFormBabyId(row.babyId)
    const isPreset = (SICKNESS_TYPE_OPTIONS as readonly string[]).includes(row.sicknessType)
    setSicknessType(isPreset ? row.sicknessType : 'Other')
    setSicknessCustomType(isPreset ? '' : row.sicknessType)
    setStartedAt(isoToDatetimeLocalValue(row.startedAt))
    setEndedAt(row.endedAt ? isoToDatetimeLocalValue(row.endedAt) : '')
    setTemperatureF(row.temperatureF ?? '')
    setSymptoms([...row.symptoms])
    setUsedDoctor(row.usedDoctorRecommendations)
    setDoctorRecommendations(row.doctorRecommendations ?? '')
    setUsedNatural(row.usedNaturalRemedies)
    setNaturalRemedies(row.naturalRemedies ?? '')
    setUsedMedication(row.usedMedication)
    setMedicationUsed(row.medicationUsed ?? '')
    setMedicationAmount(row.medicationAmount ?? '')
    setSicknessNotes(row.notes ?? '')
    setSicknessFormOpen(true)
  }

  const openInjuryForm = () => {
    resetInjuryForm()
    setFormBabyId(resolveFormBabyId())
    setInjuryFormOpen(true)
  }

  const openEditInjury = (row: InjuryEventDto) => {
    setEditingInjuryId(row.id)
    setFormBabyId(row.babyId)
    setInjuryDescription(row.description)
    setBodyPart(row.bodyPart ?? '')
    setHasSwelling(row.hasSwelling)
    setOccurredAt(isoToDatetimeLocalValue(row.occurredAt))
    setInjuryEndedAt(row.endedAt ? isoToDatetimeLocalValue(row.endedAt) : '')
    setInjuryUsedDoctor(row.usedDoctorRecommendations)
    setInjuryDoctorRecommendations(row.doctorRecommendations ?? '')
    setInjuryUsedNatural(row.usedNaturalRemedies)
    setInjuryNaturalRemedies(row.naturalRemedies ?? '')
    setInjuryNotes(row.notes ?? '')
    setInjuryFormOpen(true)
  }

  const resolvedSicknessType = () => {
    if (sicknessType === 'Other') return sicknessCustomType.trim()
    return sicknessType.trim()
  }

  const onSaveSickness = async () => {
    const babyId = resolveFormBabyId()
    const type = resolvedSicknessType()
    if (!babyId) {
      setError('Select a baby first.')
      return
    }
    if (!type) {
      setError('Enter a sickness type.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: editingSicknessId || undefined,
        babyId,
        sicknessType: type,
        startedAt,
        endedAt: endedAt || undefined,
        temperatureF: temperatureF || undefined,
        symptoms,
        usedDoctorRecommendations: usedDoctor,
        doctorRecommendations: usedDoctor ? doctorRecommendations : undefined,
        usedNaturalRemedies: usedNatural,
        naturalRemedies: usedNatural ? naturalRemedies : undefined,
        usedMedication,
        medicationUsed: usedMedication ? medicationUsed : undefined,
        medicationAmount: usedMedication ? medicationAmount : undefined,
        notes: sicknessNotes || undefined,
      }
      if (editingSicknessId) await updateSicknessEvent(payload)
      else await createSicknessEvent(payload)
      setSicknessFormOpen(false)
      resetSicknessForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save sickness event')
    } finally {
      setSaving(false)
    }
  }

  const onSaveInjury = async () => {
    const babyId = resolveFormBabyId()
    const description = injuryDescription.trim()
    if (!babyId) {
      setError('Select a baby first.')
      return
    }
    if (!description) {
      setError('Describe the injury.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        id: editingInjuryId || undefined,
        babyId,
        description,
        bodyPart: bodyPart || undefined,
        hasSwelling,
        occurredAt,
        endedAt: injuryEndedAt || undefined,
        usedDoctorRecommendations: injuryUsedDoctor,
        doctorRecommendations: injuryUsedDoctor ? injuryDoctorRecommendations : undefined,
        usedNaturalRemedies: injuryUsedNatural,
        naturalRemedies: injuryUsedNatural ? injuryNaturalRemedies : undefined,
        notes: injuryNotes || undefined,
      }
      if (editingInjuryId) await updateInjuryEvent(payload)
      else await createInjuryEvent(payload)
      setInjuryFormOpen(false)
      resetInjuryForm()
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save injury')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteSickness = (id: string) => {
    if (!id.trim()) return
    confirm({
      title: 'Delete sickness log?',
      message: 'Delete this sickness event? This cannot be undone.',
      onConfirm: () => onDeleteSicknessConfirmed(id),
    })
  }

  const onDeleteSicknessConfirmed = async (id: string) => {
    setError(null)
    try {
      await deleteSicknessEvent(id)
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete sickness event')
    }
  }

  const onDeleteInjury = (id: string) => {
    if (!id.trim()) return
    confirm({
      title: 'Delete injury?',
      message: 'Delete this injury log? This cannot be undone.',
      onConfirm: () => onDeleteInjuryConfirmed(id),
    })
  }

  const onDeleteInjuryConfirmed = async (id: string) => {
    setError(null)
    try {
      await deleteInjuryEvent(id)
      await syncAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete injury')
    }
  }

  return {
    activeTab,
    setActiveTab,
    babies,
    selectedBabyId,
    selectBaby,
    babiesLoading,
    loading,
    error,
    saving,
    sicknessCount: visibleSickness.length,
    injuryCount: visibleInjuries.length,
    visibleSickness,
    visibleInjuries,
    sicknessFormOpen,
    setSicknessFormOpen,
    injuryFormOpen,
    setInjuryFormOpen,
    editingSicknessId,
    editingInjuryId,
    openSicknessForm,
    openEditSickness,
    openInjuryForm,
    openEditInjury,
    onSaveSickness,
    onSaveInjury,
    onDeleteSickness,
    onDeleteInjury,
    sicknessType,
    setSicknessType,
    sicknessCustomType,
    setSicknessCustomType,
    startedAt,
    setStartedAt,
    endedAt,
    setEndedAt,
    temperatureF,
    setTemperatureF,
    symptoms,
    setSymptoms,
    usedDoctor,
    setUsedDoctor,
    doctorRecommendations,
    setDoctorRecommendations,
    usedNatural,
    setUsedNatural,
    naturalRemedies,
    setNaturalRemedies,
    usedMedication,
    setUsedMedication,
    medicationUsed,
    setMedicationUsed,
    medicationAmount,
    setMedicationAmount,
    sicknessNotes,
    setSicknessNotes,
    injuryDescription,
    setInjuryDescription,
    bodyPart,
    setBodyPart,
    hasSwelling,
    setHasSwelling,
    occurredAt,
    setOccurredAt,
    injuryEndedAt,
    setInjuryEndedAt,
    injuryUsedDoctor,
    setInjuryUsedDoctor,
    injuryDoctorRecommendations,
    setInjuryDoctorRecommendations,
    injuryUsedNatural,
    setInjuryUsedNatural,
    injuryNaturalRemedies,
    setInjuryNaturalRemedies,
    injuryNotes,
    setInjuryNotes,
    formBabyId,
    setFormBabyId,
    isPro,
  }
}
