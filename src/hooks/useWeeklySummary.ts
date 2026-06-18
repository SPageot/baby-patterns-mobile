import { useCallback, useEffect, useMemo, useState } from 'react'
import * as Clipboard from 'expo-clipboard'

import { loadDiaperLogsForBabies } from '@/api/diaperApi'
import { loadFeedingLogsForBabies } from '@/api/feedingApi'
import { loadGrowthForBabies } from '@/api/growthApi'
import { loadInjuryForBabies } from '@/api/injuryApi'
import { loadMilestonesForBabies } from '@/api/milestoneApi'
import { loadSicknessForBabies } from '@/api/sicknessApi'
import { loadSleepLogsForBabies } from '@/api/sleepApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import {
  buildWeeklyHighlights,
  buildWeeklyNarrative,
  buildWeeklyNarrativeOutline,
  buildWeeklyReport,
  formatWeeklySummaryPlainText,
  getWeekBounds,
  type WeekSelection,
} from '@/lib/weeklySummary'

export function useWeeklySummary() {
  const { babies, authReady } = useApp()
  const ownBabies = useMemo(() => babies.filter((baby) => !baby.isShared), [babies])

  const [logs, setLogs] = useState<LogRecord[]>([])
  const [measurements, setMeasurements] = useState<GrowthMeasurementDto[]>([])
  const [milestones, setMilestones] = useState<MilestoneDto[]>([])
  const [sicknessRows, setSicknessRows] = useState<SicknessEventDto[]>([])
  const [injuryRows, setInjuryRows] = useState<InjuryEventDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weekSelection, setWeekSelection] = useState<WeekSelection>('last')
  const [selectedBabyId, setSelectedBabyId] = useState('')

  useEffect(() => {
    if (!selectedBabyId && ownBabies[0]?.id) {
      setSelectedBabyId(ownBabies[0].id)
    }
  }, [ownBabies, selectedBabyId])

  const loadData = useCallback(async () => {
    if (!isApiConfigured() || ownBabies.length === 0) {
      setLogs([])
      setMeasurements([])
      setMilestones([])
      setSicknessRows([])
      setInjuryRows([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const babyRefs = ownBabies.map((baby) => ({ id: baby.id, fullName: baby.fullName }))
      const [diapers, sleep, feeding, growthRows, milestoneRows, sickness, injuries] = await Promise.all([
        loadDiaperLogsForBabies(babyRefs),
        loadSleepLogsForBabies(babyRefs),
        loadFeedingLogsForBabies(babyRefs),
        loadGrowthForBabies(babyRefs),
        loadMilestonesForBabies(babyRefs),
        loadSicknessForBabies(babyRefs),
        loadInjuryForBabies(babyRefs),
      ])
      setLogs([...diapers, ...sleep, ...feeding])
      setMeasurements(growthRows)
      setMilestones(milestoneRows)
      setSicknessRows(sickness)
      setInjuryRows(injuries)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load tracking data')
      setLogs([])
      setMeasurements([])
      setMilestones([])
      setSicknessRows([])
      setInjuryRows([])
    } finally {
      setLoading(false)
    }
  }, [ownBabies])

  useEffect(() => {
    if (!authReady) return
    void loadData()
  }, [authReady, loadData])

  const selectedBaby = useMemo(
    () => ownBabies.find((b) => b.id === selectedBabyId) ?? ownBabies[0] ?? null,
    [ownBabies, selectedBabyId],
  )

  const babyLogs = useMemo(() => {
    if (!selectedBaby?.id) return logs
    return logs.filter((log) => {
      const babyId = log.details.babyId?.trim()
      return !babyId || babyId === selectedBaby.id
    })
  }, [logs, selectedBaby?.id])

  const babyMeasurements = useMemo(() => {
    if (!selectedBaby?.id) return measurements
    return measurements.filter((m) => m.babyId === selectedBaby.id)
  }, [measurements, selectedBaby?.id])

  const babyMilestones = useMemo(() => {
    if (!selectedBaby?.id) return milestones
    return milestones.filter((m) => m.babyId === selectedBaby.id)
  }, [milestones, selectedBaby?.id])

  const babySickness = useMemo(() => {
    if (!selectedBaby?.id) return sicknessRows
    return sicknessRows.filter((row) => row.babyId === selectedBaby.id)
  }, [sicknessRows, selectedBaby?.id])

  const babyInjuries = useMemo(() => {
    if (!selectedBaby?.id) return injuryRows
    return injuryRows.filter((row) => row.babyId === selectedBaby.id)
  }, [injuryRows, selectedBaby?.id])

  const bounds = useMemo(() => getWeekBounds(weekSelection), [weekSelection])

  const weekly = useMemo(
    () => buildWeeklyReport(babyLogs, babyMeasurements, babyMilestones, babySickness, babyInjuries, bounds),
    [babyLogs, babyMeasurements, babyMilestones, babySickness, babyInjuries, bounds],
  )

  const narrativeOutline = useMemo(
    () => buildWeeklyNarrativeOutline(weekly.report, selectedBaby?.fullName ?? '', bounds),
    [weekly.report, selectedBaby?.fullName, bounds],
  )

  const narrative = useMemo(
    () => buildWeeklyNarrative(weekly.report, selectedBaby?.fullName ?? '', bounds),
    [weekly.report, selectedBaby?.fullName, bounds],
  )

  const highlights = useMemo(() => buildWeeklyHighlights(weekly.report), [weekly.report])

  const plainText = useMemo(
    () => formatWeeklySummaryPlainText(weekly.report, selectedBaby?.fullName ?? '', bounds),
    [weekly.report, selectedBaby?.fullName, bounds],
  )

  const copySummary = useCallback(async () => {
    await Clipboard.setStringAsync(plainText)
  }, [plainText])

  return {
    logs: babyLogs,
    report: weekly.report,
    bounds,
    narrative,
    narrativeOutline,
    highlights,
    plainText,
    loading,
    error,
    weekSelection,
    setWeekSelection,
    selectedBaby,
    selectedBabyId,
    setSelectedBabyId,
    ownBabies,
    reload: loadData,
    copySummary,
    hasBaby: ownBabies.length > 0,
  }
}
