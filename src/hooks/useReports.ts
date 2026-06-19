import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import { loadDiaperLogsForBabies } from '@/api/diaperApi'
import { loadFeedingLogsForBabies } from '@/api/feedingApi'
import { loadGrowthForBabies } from '@/api/growthApi'
import { loadInjuryForBabies } from '@/api/injuryApi'
import { loadPediatricianVisitsForBabies } from '@/api/pediatricianApi'
import { loadMilestonesForBabies } from '@/api/milestoneApi'
import { loadSicknessForBabies } from '@/api/sicknessApi'
import { loadSleepLogsForBabies } from '@/api/sleepApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { buildFullReport, type FullReport, type ReportRange } from '@/lib/reportAnalytics'
import { FREE_REPORT_MAX_DAYS, isProUser } from '@/lib/subscription'

export function useReports() {
  const { user, babies, authReady } = useApp()
  const ownBabies = useMemo(() => babies.filter((baby) => !baby.isShared), [babies])
  const isPro = isProUser(user)
  const defaultRange: ReportRange = isPro ? 30 : FREE_REPORT_MAX_DAYS

  const [logs, setLogs] = useState<LogRecord[]>([])
  const [measurements, setMeasurements] = useState<GrowthMeasurementDto[]>([])
  const [milestones, setMilestones] = useState<MilestoneDto[]>([])
  const [sicknessRows, setSicknessRows] = useState<SicknessEventDto[]>([])
  const [injuryRows, setInjuryRows] = useState<InjuryEventDto[]>([])
  const [pediatricianRows, setPediatricianRows] = useState<PediatricianVisitDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rangeDays, setRangeDaysState] = useState<ReportRange>(defaultRange)
  const [exportingPdf, setExportingPdf] = useState(false)

  const setRangeDays = useCallback(
    (next: ReportRange) => {
      if (!isPro && next !== FREE_REPORT_MAX_DAYS) return
      setRangeDaysState(next)
    },
    [isPro],
  )

  useEffect(() => {
    setRangeDaysState(isPro ? 30 : FREE_REPORT_MAX_DAYS)
  }, [isPro])

  const loadLogs = useCallback(async () => {
    if (!isApiConfigured() || ownBabies.length === 0) {
      setLogs([])
      setMeasurements([])
      setMilestones([])
      setSicknessRows([])
      setInjuryRows([])
      setPediatricianRows([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const babyRefs = ownBabies.map((baby) => ({ id: baby.id, fullName: baby.fullName }))
      const [diapers, sleep, feeding, growthRows, milestoneRows, sickness, injuries, pediatricianVisits] =
        await Promise.all([
        loadDiaperLogsForBabies(babyRefs),
        loadSleepLogsForBabies(babyRefs),
        loadFeedingLogsForBabies(babyRefs),
        loadGrowthForBabies(babyRefs),
        loadMilestonesForBabies(babyRefs),
        loadSicknessForBabies(babyRefs),
        loadInjuryForBabies(babyRefs),
        loadPediatricianVisitsForBabies(babyRefs),
      ])
      setLogs([...diapers, ...sleep, ...feeding])
      setMeasurements(growthRows)
      setMilestones(milestoneRows)
      setSicknessRows(sickness)
      setInjuryRows(injuries)
      setPediatricianRows(pediatricianVisits)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load tracking data')
      setLogs([])
      setMeasurements([])
      setMilestones([])
      setSicknessRows([])
      setInjuryRows([])
      setPediatricianRows([])
    } finally {
      setLoading(false)
    }
  }, [ownBabies])

  useEffect(() => {
    if (!authReady) return
    void loadLogs()
  }, [authReady, loadLogs])

  const report = useMemo<FullReport>(
    () =>
      buildFullReport(logs, rangeDays, {
        measurements,
        milestones,
        sickness: sicknessRows,
        injuries: injuryRows,
        pediatricianVisits: pediatricianRows,
      }),
    [logs, rangeDays, measurements, milestones, sicknessRows, injuryRows, pediatricianRows],
  )

  const downloadPdf = useCallback(async () => {
    if (!isPro) {
      Alert.alert('Pro feature', 'PDF reports are a Pro feature. Upgrade on the pricing page.')
      return
    }
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to export reports.')
      return
    }
    if (ownBabies.length === 0) {
      setError('Add a baby before downloading a report.')
      return
    }

    setExportingPdf(true)
    setError(null)
    try {
      const parentName = user?.fullName?.trim() || user?.username?.trim() || 'Parent'
      const { downloadTrackingReportPdf } = await import('@/lib/trackingReportPdf')
      await downloadTrackingReportPdf({
        logs,
        measurements,
        milestones,
        sickness: sicknessRows,
        injuries: injuryRows,
        pediatricianVisits: pediatricianRows,
        babies: ownBabies,
        parentName,
        includeAnalysis: true,
        rangeDays,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create PDF report')
    } finally {
      setExportingPdf(false)
    }
  }, [logs, measurements, milestones, sicknessRows, injuryRows, pediatricianRows, ownBabies, user, rangeDays, isPro])

  return {
    logs,
    report,
    loading,
    error,
    rangeDays,
    setRangeDays,
    reload: loadLogs,
    downloadPdf,
    exportingPdf,
    hasBaby: ownBabies.length > 0,
    isPro,
  }
}
