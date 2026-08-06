import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { formatBabyAge } from './babyAge'
import { diaperMixType } from './diaperFeedUtils'
import { buildGrowthMilestonesReport } from './growthReportAnalytics'
import { buildHealthEventsReport } from './healthReportAnalytics'
import { pdfT } from './pdfUi'
import {
  buildFullReport,
  filterLogsForKindReport,
  formatReportCount,
  formatReportMinutes,
  isSleepNapLog,
  parseSleepInterval,
  type FullReport,
  type ReportExtras,
  type ReportRange,
} from './reportAnalytics'
import { formatWhen, isoLocalYmd } from './trackUtils'

export type PdfStat = { label: string; value: string }
export type PdfBar = { key?: string; label: string; value: number; displayValue?: string }
export type PdfTimelineItem = { time: string; label: string; sortKey: number }

export type ReportPdfContent = {
  header: {
    childName: string
    childAge: string
    periodLabel: string
    periodRange: string
    generatedDate: string
    caregivers: string
  }
  dashboard: PdfStat[]
  sleep: {
    summary: PdfStat[]
    dailySleepBars: PdfBar[]
    bedtimeTrend: PdfBar[]
    napDurations: PdfStat[]
    insights: string[]
    sleepTimeline: PdfTimelineItem[]
  }
  feeding: {
    byType: PdfStat[]
    bottleStats: PdfStat[]
    breastfeedingStats: PdfStat[]
    topFoods: PdfStat[]
    schedule: PdfTimelineItem[]
    insights: string[]
  }
  diaper: {
    summary: PdfStat[]
    timeOfDay: PdfBar[]
    insights: string[]
  }
  health: {
    summary: PdfStat[]
    illnessTimeline: { date: string; lines: string[] }[]
    symptomFrequency: PdfBar[]
    medications: { medicine: string; dose: string; times: string }[]
    vaccines: { name: string; date: string; note: string }[]
    injuries: { date: string; description: string; details: string }[]
    insights: string[]
  }
  growth: {
    summary: PdfStat[]
    weightTimeline: PdfBar[]
    heightTimeline: PdfBar[]
    milestones: PdfStat[]
    insights: string[]
  }
  potty: {
    summary: PdfStat[]
    timeOfDay: PdfBar[]
    weeklySuccess: PdfBar[]
    insights: string[]
  }
  dailyTimeline: PdfTimelineItem[]
  correlations: string[]
  aiSummary: string
  analysis: FullReport
}

type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night'

const TIME_BUCKETS: TimeBucket[] = ['morning', 'afternoon', 'evening', 'night']

function reportPeriodLabel(rangeDays: ReportRange): string {
  if (rangeDays === 0) return pdfT('report.period.allTime')
  if (rangeDays === 90) return pdfT('report.period.last90')
  if (rangeDays === 7) return pdfT('report.period.last7')
  return pdfT('report.period.last30')
}

export function reportPeriodDates(rangeDays: ReportRange): { start: string; end: string; label: string } {
  const label = reportPeriodLabel(rangeDays)
  if (rangeDays === 0) return { start: '', end: '', label }

  const end = new Date()
  end.setHours(12, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - (rangeDays - 1))

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

  return { start: fmt(start), end: fmt(end), label }
}

function avgMinutesDisplay(total: number, count: number): string {
  if (count === 0) return '—'
  return formatReportMinutes(total / count)
}

function avgTimeDisplay(minutesFromMidnight: number[]): string {
  if (minutesFromMidnight.length === 0) return '—'
  const avg = minutesFromMidnight.reduce((s, v) => s + v, 0) / minutesFromMidnight.length
  const h = Math.floor(avg / 60) % 24
  const m = Math.round(avg % 60)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function timeBucket(hour: number): TimeBucket {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function timeBucketLabel(bucket: TimeBucket): string {
  return pdfT(`report.timeOfDay.${bucket}`)
}

function feedingTypePdfLabel(type: string): string {
  const key = type.trim().toLowerCase()
  const known = ['breast', 'bottle', 'solids', 'snack'] as const
  if ((known as readonly string[]).includes(key)) return pdfT(`report.feedingType.${key}`)
  if (key) return key.charAt(0).toUpperCase() + key.slice(1)
  return pdfT('report.feedingType.feed')
}

function pottyResultLabel(result: string): string {
  const key = result.trim().toLowerCase()
  const known = ['success', 'pee', 'poop', 'both', 'accident', 'dry_attempt'] as const
  if ((known as readonly string[]).includes(key)) return pdfT(`report.pottyResult.${key}`)
  if (!key) return pdfT('report.timeline.pottyVisit')
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function countWakeUps(log: LogRecord): number {
  const raw = log.details.wakeUps?.trim()
  if (!raw) return log.details.isNightSleepFragmented === 'true' ? 1 : 0
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed.length
  } catch {
    /* ignore */
  }
  return 0
}

function isPottySuccess(result: string): boolean {
  const r = result.trim().toLowerCase()
  return r === 'success' || r === 'pee' || r === 'poop' || r === 'both' || r === 'dry_attempt'
}

function eventIso(log: LogRecord): string {
  if (log.kind === 'diaper') return log.details.time?.trim() || log.atIso
  if (log.kind === 'feeding') return log.details.feedingAt?.trim() || log.atIso
  if (log.kind === 'potty') return log.details.loggedAt?.trim() || log.atIso
  if (log.kind === 'sleep') return log.details.sleepEndTime?.trim() || log.details.sleepStartTime?.trim() || log.atIso
  return log.atIso
}

function timelineLabel(log: LogRecord): string {
  if (log.kind === 'sleep') {
    const nap = isSleepNapLog(log) ? pdfT('report.timeline.nap') : pdfT('report.timeline.sleep')
    return pdfT('report.timeline.sleepDuration', { kind: nap, duration: formatSleepDuration(log) })
  }
  if (log.kind === 'feeding') {
    const parts = [feedingTypePdfLabel(log.details.feedingType ?? '')]
    if (log.details.amountOz?.trim()) {
      parts.push(pdfT('report.timeline.amountOz', { amount: log.details.amountOz.trim() }))
    }
    return parts.join(' · ')
  }
  if (log.kind === 'diaper') {
    const mix = diaperMixType(log)
    if (mix === 'wet') return pdfT('report.timeline.wetDiaper')
    if (mix === 'dirty') return pdfT('report.timeline.dirtyDiaper')
    if (mix === 'mixed') return pdfT('report.timeline.mixedDiaper')
    return pdfT('report.timeline.diaperChange')
  }
  if (log.kind === 'potty') {
    return pottyResultLabel(log.details.result?.trim() || '')
  }
  return log.kind
}

function formatSleepDuration(log: LogRecord): string {
  const interval = parseSleepInterval(log)
  return interval ? formatReportMinutes(interval.minutes) : '—'
}

function buildSleepSection(logs: LogRecord[], rangeDays: ReportRange) {
  const filtered = filterLogsForKindReport(logs, 'sleep', rangeDays)
  let nightMinutes = 0
  let napMinutes = 0
  let nightSessions = 0
  let napSessions = 0
  const bedtimes: number[] = []
  const wakeTimes: number[] = []
  let wakeUpTotal = 0
  let wakeUpSessions = 0
  let longestStretch = 0
  const napByPeriod = { morning: 0, afternoon: 0, evening: 0 }
  const napCounts = { morning: 0, afternoon: 0, evening: 0 }
  const bedtimeByDay: { key: string; label: string; minutes: number }[] = []

  for (const log of filtered) {
    const interval = parseSleepInterval(log)
    if (!interval) continue

    longestStretch = Math.max(longestStretch, interval.minutes)
    const isNap = isSleepNapLog(log)

    if (isNap) {
      napMinutes += interval.minutes
      napSessions += 1
      const bucket =
        interval.start.getHours() < 12 ? 'morning' : interval.start.getHours() < 17 ? 'afternoon' : 'evening'
      napByPeriod[bucket] += interval.minutes
      napCounts[bucket] += 1
    } else {
      nightMinutes += interval.minutes
      nightSessions += 1
      bedtimes.push(interval.start.getHours() * 60 + interval.start.getMinutes())
      wakeTimes.push(interval.end.getHours() * 60 + interval.end.getMinutes())
      const dayKey = isoLocalYmd(interval.start.toISOString())
      bedtimeByDay.push({
        key: dayKey,
        label: new Date(`${dayKey}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        minutes: interval.start.getHours() * 60 + interval.start.getMinutes(),
      })
      const wakes = countWakeUps(log)
      if (wakes > 0 || log.details.isNightSleepFragmented === 'true') {
        wakeUpTotal += wakes > 0 ? wakes : 1
        wakeUpSessions += 1
      }
    }
  }

  const days = new Set(
    filtered
      .map((l) => {
        const i = parseSleepInterval(l)
        return i ? isoLocalYmd(i.end.toISOString()) : ''
      })
      .filter(Boolean),
  ).size

  const avgDaily = days > 0 ? (nightMinutes + napMinutes) / days : 0
  const avgNight = nightSessions > 0 ? nightMinutes / nightSessions : 0
  const avgNap = napSessions > 0 ? napMinutes / napSessions : 0
  const avgWakings = nightSessions > 0 ? wakeUpTotal / nightSessions : 0

  const analysis = buildFullReport(logs, rangeDays)
  const dailySleepBars = analysis.sleep.weekdayAverages.map((d) => ({
    label: d.label,
    value: d.value,
    displayValue: d.displayValue,
  }))

  const bedtimeTrend = bedtimeByDay
    .slice(-7)
    .map((row) => ({
      label: row.label,
      value: row.minutes,
      displayValue: avgTimeDisplay([row.minutes]),
    }))

  const napDurations: PdfStat[] = [
    { label: timeBucketLabel('morning'), value: avgMinutesDisplay(napByPeriod.morning, napCounts.morning) },
    { label: timeBucketLabel('afternoon'), value: avgMinutesDisplay(napByPeriod.afternoon, napCounts.afternoon) },
    { label: timeBucketLabel('evening'), value: avgMinutesDisplay(napByPeriod.evening, napCounts.evening) },
  ]

  const insights: string[] = []
  if (filtered.length === 0) {
    insights.push(pdfT('report.sleepInsight.noLogs'))
  } else {
    if (bedtimeTrend.length >= 3) {
      const spread = Math.max(...bedtimeTrend.map((b) => b.value)) - Math.min(...bedtimeTrend.map((b) => b.value))
      if (spread <= 30) insights.push(pdfT('report.sleepInsight.bedtimeConsistent'))
      else insights.push(pdfT('report.sleepInsight.bedtimeVaries'))
    }
    if (avgWakings > 0 && avgWakings < 2) insights.push(pdfT('report.sleepInsight.wakingsLow'))
    if (napSessions > 0 && napByPeriod.afternoon > napByPeriod.morning) {
      insights.push(pdfT('report.sleepInsight.afternoonNaps'))
    }
    insights.push(pdfT('report.sleepInsight.averagesSummary'))
  }

  const sleepTimeline = filtered
    .slice(0, 8)
    .flatMap((log) => {
      const interval = parseSleepInterval(log)
      if (!interval) return []
      const start = interval.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      const end = interval.end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      return [
        { time: start, label: pdfT('report.timeline.sleeping'), sortKey: interval.start.getTime() },
        {
          time: end,
          label: isSleepNapLog(log) ? pdfT('report.timeline.wakeNap') : pdfT('report.timeline.wake'),
          sortKey: interval.end.getTime(),
        },
      ]
    })
    .sort((a, b) => a.sortKey - b.sortKey)

  return {
    summary: [
      { label: pdfT('report.sleepSummary.avgDaily'), value: formatReportMinutes(avgDaily) },
      { label: pdfT('report.sleepSummary.nightSleep'), value: formatReportMinutes(avgNight) },
      { label: pdfT('report.sleepSummary.daySleep'), value: formatReportMinutes(avgNap) },
      { label: pdfT('report.sleepSummary.avgBedtime'), value: avgTimeDisplay(bedtimes) },
      { label: pdfT('report.sleepSummary.avgWakeTime'), value: avgTimeDisplay(wakeTimes) },
      { label: pdfT('report.sleepSummary.avgNightWakings'), value: nightSessions > 0 ? formatReportCount(avgWakings) : '—' },
      { label: pdfT('report.sleepSummary.longestStretch'), value: longestStretch > 0 ? formatReportMinutes(longestStretch) : '—' },
    ],
    dailySleepBars: dailySleepBars.some((b) => b.value > 0)
      ? dailySleepBars
      : analysis.sleep.dailyTrend.slice(-7).map((d) => ({
          label: d.label,
          value: d.value,
          displayValue: formatReportMinutes(d.value),
        })),
    bedtimeTrend,
    napDurations,
    insights,
    sleepTimeline,
  }
}

function buildFeedingSection(logs: LogRecord[], rangeDays: ReportRange) {
  const filtered = filterLogsForKindReport(logs, 'feeding', rangeDays)
  const typeCounts: Record<string, number> = {}
  const bottleOz: number[] = []
  const breastDurations: number[] = []
  const foodMentions = new Map<string, number>()
  const days = new Set<string>()

  for (const log of filtered) {
    const type = (log.details.feedingType ?? 'breast').trim().toLowerCase()
    typeCounts[type] = (typeCounts[type] ?? 0) + 1
    const day = isoLocalYmd(eventIso(log))
    if (day) days.add(day)

    if (type === 'bottle') {
      const oz = Number(log.details.amountOz)
      if (Number.isFinite(oz) && oz > 0) bottleOz.push(oz)
    }
    if (type === 'breast') {
      const min = Number(log.details.durationMin)
      if (Number.isFinite(min) && min > 0) breastDurations.push(min)
    }
    if (type === 'solids' || type === 'snack') {
      const note = log.details.notes?.trim()
      if (note) foodMentions.set(note, (foodMentions.get(note) ?? 0) + 1)
    }
  }

  const dayCount = Math.max(1, days.size)
  const byType: PdfStat[] = ['breast', 'bottle', 'solids', 'snack'].map((type) => ({
    label: feedingTypePdfLabel(type),
    value: typeCounts[type]
      ? pdfT('report.feedingSummary.perDay', { count: formatReportCount((typeCounts[type] ?? 0) / dayCount) })
      : '—',
  }))

  const bottleStats: PdfStat[] = [
    {
      label: pdfT('report.feedingSummary.avgOunces'),
      value:
        bottleOz.length > 0
          ? pdfT('report.feedingSummary.oz', {
              count: formatReportCount(bottleOz.reduce((s, v) => s + v, 0) / bottleOz.length),
            })
          : '—',
    },
    {
      label: pdfT('report.feedingSummary.largestBottle'),
      value: bottleOz.length > 0 ? pdfT('report.feedingSummary.oz', { count: Math.max(...bottleOz) }) : '—',
    },
    {
      label: pdfT('report.feedingSummary.smallestBottle'),
      value: bottleOz.length > 0 ? pdfT('report.feedingSummary.oz', { count: Math.min(...bottleOz) }) : '—',
    },
    {
      label: pdfT('report.feedingSummary.dailyIntakeAvg'),
      value:
        bottleOz.length > 0
          ? pdfT('report.feedingSummary.ozPerDay', {
              count: formatReportCount(bottleOz.reduce((s, v) => s + v, 0) / dayCount),
            })
          : '—',
    },
  ]

  const breastfeedingStats: PdfStat[] = [
    {
      label: pdfT('report.feedingSummary.avgSessionLength'),
      value:
        breastDurations.length > 0
          ? formatReportMinutes(breastDurations.reduce((s, v) => s + v, 0) / breastDurations.length)
          : '—',
    },
  ]

  const topFoods = [...foodMentions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([food, count]) => ({
      label: food,
      value:
        count === 1
          ? pdfT('report.feedingSummary.logCount', { count })
          : pdfT('report.feedingSummary.logCountPlural', { count }),
    }))

  const schedule = filtered
    .slice(0, 12)
    .map((log) => {
      const d = new Date(eventIso(log))
      return {
        time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
        label: timelineLabel(log),
        sortKey: d.getTime(),
      }
    })
    .sort((a, b) => a.sortKey - b.sortKey)

  const insights: string[] = []
  if (filtered.length === 0) insights.push(pdfT('report.feedingInsight.noLogs'))
  else {
    if ((typeCounts.solids ?? 0) > (typeCounts.bottle ?? 0)) {
      insights.push(pdfT('report.feedingInsight.solidsOutnumberBottle'))
    }
    if ((typeCounts.bottle ?? 0) > 0 && bottleOz.length >= 2) {
      const firstHalf = bottleOz.slice(0, Math.floor(bottleOz.length / 2))
      const secondHalf = bottleOz.slice(Math.floor(bottleOz.length / 2))
      const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
      const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
      if (avgSecond < avgFirst * 0.9) insights.push(pdfT('report.feedingInsight.bottleDecreasing'))
      if (avgSecond > avgFirst * 1.1) insights.push(pdfT('report.feedingInsight.bottleIncreasing'))
    }
    insights.push(pdfT('report.feedingInsight.patternsSummary'))
  }

  return { byType, bottleStats, breastfeedingStats, topFoods, schedule, insights }
}

function buildDiaperSection(logs: LogRecord[], rangeDays: ReportRange) {
  const filtered = filterLogsForKindReport(logs, 'diaper', rangeDays)
  let wet = 0
  let dirty = 0
  let mixed = 0
  const buckets: Record<TimeBucket, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }

  const days = new Set<string>()
  for (const log of filtered) {
    const mix = diaperMixType(log)
    if (mix === 'wet') wet += 1
    else if (mix === 'dirty') dirty += 1
    else if (mix === 'mixed') mixed += 1

    const iso = eventIso(log)
    const day = isoLocalYmd(iso)
    if (day) days.add(day)
    const hour = new Date(iso).getHours()
    if (!Number.isNaN(hour)) buckets[timeBucket(hour)] += 1
  }

  const dayCount = Math.max(1, days.size)
  const timeOfDay = TIME_BUCKETS.map((bucket) => ({
    label: timeBucketLabel(bucket),
    value: buckets[bucket],
  }))

  const insights: string[] = []
  if (filtered.length === 0) insights.push(pdfT('report.diaperInsight.noLogs'))
  else {
    insights.push(pdfT('report.diaperInsight.countsSummary'))
    if (dirty / dayCount < 2) insights.push(pdfT('report.diaperInsight.dirtyLow'))
  }

  return {
    summary: [
      { label: pdfT('report.diaperSummary.wet'), value: String(wet) },
      { label: pdfT('report.diaperSummary.dirty'), value: String(dirty) },
      { label: pdfT('report.diaperSummary.mixed'), value: String(mixed) },
      { label: pdfT('report.diaperSummary.wetAvgDay'), value: formatReportCount(wet / dayCount) },
      { label: pdfT('report.diaperSummary.dirtyAvgDay'), value: formatReportCount(dirty / dayCount) },
    ],
    timeOfDay,
    insights,
  }
}

function buildPottySection(logs: LogRecord[], rangeDays: ReportRange) {
  const filtered = filterLogsForKindReport(logs, 'potty', rangeDays)
  let attempts = 0
  let successes = 0
  let accidents = 0
  const buckets: Record<TimeBucket, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  const weekMap = new Map<string, { success: number; total: number }>()

  for (const log of filtered) {
    attempts += 1
    const result = log.details.result?.trim() || ''
    if (isPottySuccess(result)) successes += 1
    if (result === 'accident') accidents += 1

    const iso = eventIso(log)
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) {
      buckets[timeBucket(d.getHours())] += 1
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const weekKey = isoLocalYmd(weekStart.toISOString())
      const entry = weekMap.get(weekKey) ?? { success: 0, total: 0 }
      entry.total += 1
      if (isPottySuccess(result)) entry.success += 1
      weekMap.set(weekKey, entry)
    }
  }

  const successRate = attempts > 0 ? Math.round((successes / attempts) * 100) : 0
  const weeklySuccess = [...weekMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-4)
    .map(([, row], i) => ({
      label: pdfT('report.pottySummary.week', { n: i + 1 }),
      value: row.total > 0 ? Math.round((row.success / row.total) * 100) : 0,
      displayValue: row.total > 0 ? `${Math.round((row.success / row.total) * 100)}%` : '—',
    }))

  const insights: string[] = []
  if (attempts === 0) insights.push(pdfT('report.pottyInsight.noLogs'))
  else {
    if (successRate >= 70) insights.push(pdfT('report.pottyInsight.successStrong'))
    if (buckets.evening > buckets.morning && accidents > 0) {
      insights.push(pdfT('report.pottyInsight.accidentsLater'))
    }
    if (weeklySuccess.length >= 2) {
      const first = weeklySuccess[0].value
      const last = weeklySuccess[weeklySuccess.length - 1].value
      if (last > first) {
        insights.push(pdfT('report.pottyInsight.successImproved', { first, last }))
      }
    }
  }

  return {
    summary: [
      { label: pdfT('report.pottySummary.attempts'), value: String(attempts) },
      { label: pdfT('report.pottySummary.successful'), value: String(successes) },
      { label: pdfT('report.pottySummary.accidents'), value: String(accidents) },
      { label: pdfT('report.pottySummary.successRate'), value: attempts > 0 ? `${successRate}%` : '—' },
    ],
    timeOfDay: TIME_BUCKETS.map((bucket) => ({
      label: timeBucketLabel(bucket),
      value: buckets[bucket],
    })),
    weeklySuccess,
    insights,
  }
}

function buildHealthSection(
  sickness: SicknessEventDto[],
  injuries: InjuryEventDto[],
  pediatricianVisits: PediatricianVisitDto[],
  rangeDays: ReportRange,
) {
  const health = buildHealthEventsReport(sickness, injuries, pediatricianVisits, rangeDays)
  const feverEpisodes = health.sickness.filter((s) => s.temperatureF && Number(s.temperatureF) >= 100).length

  const symptomMap = new Map<string, number>()
  for (const row of health.sickness) {
    for (const symptom of row.symptoms) {
      const key = symptom.trim()
      if (key) symptomMap.set(key, (symptomMap.get(key) ?? 0) + 1)
    }
    if (row.temperatureF && Number(row.temperatureF) >= 100) {
      const feverLabel = pdfT('report.health.fever')
      symptomMap.set(feverLabel, (symptomMap.get(feverLabel) ?? 0) + 1)
    }
  }

  const illnessTimeline = health.sickness.slice(0, 6).map((row) => {
    const lines = [row.sicknessType]
    if (row.temperatureF) lines.push(pdfT('report.health.feverTemp', { temp: row.temperatureF }))
    if (row.usedMedication && row.medicationUsed) {
      lines.push(pdfT('report.health.medicine', { name: row.medicationUsed }))
    }
    if (row.endedAt) lines.push(pdfT('report.health.recovered', { when: formatWhen(row.endedAt) }))
    return { date: formatWhen(row.startedAt), lines }
  })

  const medications = health.sickness
    .filter((s) => s.usedMedication && s.medicationUsed)
    .slice(0, 8)
    .map((s) => ({
      medicine: s.medicationUsed ?? '—',
      dose: s.medicationAmount?.trim() || '—',
      times: pdfT('report.health.asLogged'),
    }))

  const vaccines = health.pediatricianVisits.flatMap((visit) =>
    visit.immunizations.map((name) => ({
      name,
      date: formatWhen(visit.visitedAt),
      note: visit.notes?.trim() || pdfT('report.health.noReactions'),
    })),
  )

  const injuryRows = health.injuries.slice(0, 6).map((row) => ({
    date: formatWhen(row.occurredAt),
    description: row.description,
    details:
      [row.bodyPart, row.hasSwelling ? pdfT('report.health.swellingNoted') : null, row.notes]
        .filter(Boolean)
        .join(' · ') || '—',
  }))

  const insights: string[] = []
  if (health.totalEvents === 0) insights.push(pdfT('report.healthInsight.noLogs'))
  else {
    if (feverEpisodes > 0) insights.push(pdfT('report.healthInsight.feverLogged'))
    if (health.ongoingSicknessCount + health.ongoingInjuryCount > 0) {
      insights.push(
        pdfT('report.healthInsight.ongoing', {
          count: health.ongoingSicknessCount + health.ongoingInjuryCount,
        }),
      )
    }
    insights.push(pdfT('report.healthInsight.notMedical'))
  }

  return {
    summary: [
      { label: pdfT('report.healthSummary.illnesses'), value: String(health.sicknessCount) },
      { label: pdfT('report.healthSummary.doctorVisits'), value: String(health.pediatricianCount) },
      { label: pdfT('report.healthSummary.medicineDays'), value: String(health.withMedicationCount) },
      { label: pdfT('report.healthSummary.feverEpisodes'), value: String(feverEpisodes) },
      { label: pdfT('report.healthSummary.injuries'), value: String(health.injuryCount) },
    ],
    illnessTimeline,
    symptomFrequency: [...symptomMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value })),
    medications,
    vaccines: vaccines.slice(0, 8),
    injuries: injuryRows,
    insights,
  }
}

function buildGrowthSection(measurements: GrowthMeasurementDto[], milestones: MilestoneDto[], rangeDays: ReportRange) {
  const growth = buildGrowthMilestonesReport(measurements, milestones, rangeDays)

  let heightChange: string | null = null
  if (growth.heightTrend.length >= 2) {
    const first = growth.heightTrend[0].value
    const last = growth.heightTrend[growth.heightTrend.length - 1].value
    const delta = Math.round((last - first) * 10) / 10
    heightChange = delta === 0 ? null : `${delta > 0 ? '+' : ''}${delta} in`
  }

  const weightTimeline = growth.weightTrend.slice(-6).map((p) => ({
    key: p.key,
    label: p.label,
    value: p.value,
    displayValue: pdfT('report.growth.lb', { value: p.value }),
  }))
  const heightTimeline = growth.heightTrend.slice(-6).map((p) => ({
    key: p.key,
    label: p.label,
    value: p.value,
    displayValue: pdfT('report.growth.in', { value: p.value }),
  }))

  const milestoneStats = growth.milestones.slice(0, 8).map((m) => ({
    label: m.title,
    value: formatWhen(m.achievedAt),
  }))

  const insights: string[] = []
  if (growth.measurementCount === 0 && growth.milestoneCount === 0) {
    insights.push(pdfT('report.growthInsight.noLogs'))
  } else {
    if (growth.weightChangeDisplay) {
      insights.push(pdfT('report.growthInsight.weightChange', { change: growth.weightChangeDisplay }))
    }
    if (heightChange) insights.push(pdfT('report.growthInsight.heightChange', { change: heightChange }))
    insights.push(pdfT('report.growthInsight.trendsSummary'))
  }

  return {
    summary: [
      { label: pdfT('report.growthSummary.latestWeight'), value: growth.latestWeightDisplay },
      { label: pdfT('report.growthSummary.latestHeight'), value: growth.latestHeightDisplay },
      { label: pdfT('report.growthSummary.latestHead'), value: growth.latestHeadDisplay },
      { label: pdfT('report.growthSummary.weightChange'), value: growth.weightChangeDisplay ?? '—' },
      { label: pdfT('report.growthSummary.heightChange'), value: heightChange ?? '—' },
      { label: pdfT('report.growthSummary.milestones'), value: String(growth.milestoneCount) },
    ],
    weightTimeline,
    heightTimeline,
    milestones: milestoneStats,
    insights,
  }
}

function buildDailyTimeline(logs: LogRecord[], rangeDays: ReportRange): PdfTimelineItem[] {
  const filtered = logs.filter((log) => {
    if (rangeDays === 0) return true
    const day = isoLocalYmd(eventIso(log))
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - rangeDays)
    cutoff.setHours(0, 0, 0, 0)
    const d = new Date(`${day}T12:00:00`)
    return day && !Number.isNaN(d.getTime()) && d >= cutoff
  })

  const dayCounts = new Map<string, number>()
  for (const log of filtered) {
    const day = isoLocalYmd(eventIso(log))
    if (day) dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
  }
  const bestDay = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (!bestDay) return []

  return filtered
    .filter((log) => isoLocalYmd(eventIso(log)) === bestDay)
    .map((log) => {
      const d = new Date(eventIso(log))
      return {
        time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
        label: timelineLabel(log),
        sortKey: d.getTime(),
      }
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 16)
}

function buildCorrelations(
  analysis: FullReport,
  sleep: ReportPdfContent['sleep'],
  feeding: ReportPdfContent['feeding'],
  potty: ReportPdfContent['potty'],
): string[] {
  const lines: string[] = []

  // Compare against translated insight/label strings from the same locale (stable codes via pdfT keys).
  const bottleDecreasing = pdfT('report.feedingInsight.bottleDecreasing')
  const solidsLabel = pdfT('report.feedingType.solids')
  const bottleLabel = pdfT('report.feedingType.bottle')

  if (analysis.sleep.napSection && analysis.sleep.napSection.avgPerDay > 90 && sleep.summary[5]?.value !== '—') {
    lines.push(pdfT('report.correlation.napsAndNight'))
  }
  if (feeding.insights.some((i) => i === bottleDecreasing) && feeding.byType.some((t) => t.label === solidsLabel)) {
    lines.push(pdfT('report.correlation.milkAndSolids'))
  }
  if (analysis.health.sicknessCount > 0 && analysis.sleep.totalEvents > 0) {
    lines.push(pdfT('report.correlation.illnessSleep'))
  }
  if (analysis.diapers.totalEvents > 0 && feeding.byType.some((t) => t.label === bottleLabel)) {
    lines.push(pdfT('report.correlation.diaperFeeding'))
  }
  if (potty.summary[0] && Number(potty.summary[0].value) > 0) {
    lines.push(pdfT('report.correlation.pottyReminders'))
  }

  if (lines.length === 0) {
    lines.push(pdfT('report.correlation.needMoreData'))
  }

  return lines.map((line) => pdfT('report.correlation.observationSuffix', { line }))
}

function buildAiSummary(
  childName: string,
  rangeLabel: string,
  analysis: FullReport,
  potty: ReportPdfContent['potty'],
  feeding: ReportPdfContent['feeding'],
  health: ReportPdfContent['health'],
): string {
  const sleepAvg = analysis.sleep.avgDisplay.replace(
    ' avg/day',
    pdfT('report.ai.perDaySuffix'),
  )
  const bottleDecreasing = pdfT('report.feedingInsight.bottleDecreasing')
  const bottleIncreasing = pdfT('report.feedingInsight.bottleIncreasing')
  const feedingStable = feeding.insights.some((i) => i === bottleDecreasing || i === bottleIncreasing)
    ? pdfT('report.ai.feedingShifts')
    : pdfT('report.ai.feedingStable')
  const diaperNote =
    analysis.diapers.totalEvents > 0
      ? pdfT('report.ai.diaperWithinRange')
      : pdfT('report.ai.diaperLight')
  const illnessNote =
    health.summary[0] && Number(health.summary[0].value) > 0
      ? pdfT('report.ai.illnessNoted', { count: health.summary[0].value })
      : pdfT('report.ai.noIllness')
  const pottyNote =
    potty.summary[3]?.value && potty.summary[3].value !== '—'
      ? pdfT('report.ai.pottySuccess', { rate: potty.summary[3].value })
      : ''

  return pdfT('report.ai.summary', {
    range: rangeLabel.toLowerCase(),
    childName,
    sleepAvg,
    feedingStable,
    diaperNote,
    illnessNote,
    pottyNote,
  }).replace(/\s+/g, ' ')
}

export function buildReportPdfContent(
  logs: LogRecord[],
  rangeDays: ReportRange,
  babies: Baby[],
  parentName: string,
  extras: ReportExtras = {},
): ReportPdfContent {
  const analysis = buildFullReport(logs, rangeDays, extras)
  const period = reportPeriodDates(rangeDays)
  const primaryBaby = babies[0]
  const childName =
    babies.length === 1
      ? primaryBaby?.fullName?.trim() || pdfT('report.cover.yourChild')
      : babies.map((b) => b.fullName?.trim()).filter(Boolean).join(', ') || pdfT('report.cover.yourChildren')
  const childAge =
    babies.length === 1 && primaryBaby?.birthdate
      ? formatBabyAge(primaryBaby.birthdate)
      : babies.length > 1
        ? pdfT('report.cover.multipleChildren')
        : ''

  const generatedDate = new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const sleep = buildSleepSection(logs, rangeDays)
  const feeding = buildFeedingSection(logs, rangeDays)
  const diaper = buildDiaperSection(logs, rangeDays)
  const potty = buildPottySection(logs, rangeDays)
  const health = buildHealthSection(
    extras.sickness ?? [],
    extras.injuries ?? [],
    extras.pediatricianVisits ?? [],
    rangeDays,
  )
  const growth = buildGrowthSection(extras.measurements ?? [], extras.milestones ?? [], rangeDays)
  const dailyTimeline = buildDailyTimeline(logs, rangeDays)

  const dashboard: PdfStat[] = [
    {
      label: pdfT('report.dashboard.avgSleep'),
      value: analysis.sleep.avgDisplay.replace(' avg/day', pdfT('report.dashboard.perDayShort')),
    },
    { label: pdfT('report.dashboard.feedings'), value: analysis.feeding.avgDisplay },
    {
      label: pdfT('report.dashboard.wetDiapers'),
      value: diaper.summary[3]?.value
        ? pdfT('report.dashboard.valuePerDay', { value: diaper.summary[3].value })
        : '—',
    },
    {
      label: pdfT('report.dashboard.dirtyDiapers'),
      value: diaper.summary[4]?.value
        ? pdfT('report.dashboard.valuePerDay', { value: diaper.summary[4].value })
        : '—',
    },
    { label: pdfT('report.dashboard.healthEvents'), value: String(analysis.health.totalEvents) },
    {
      label: pdfT('report.dashboard.growth'),
      value: [growth.summary[3]?.value, growth.summary[4]?.value].filter((v) => v && v !== '—').join(' · ') || '—',
    },
    { label: pdfT('report.dashboard.pottySuccess'), value: potty.summary[3]?.value ?? '—' },
  ]

  const correlations = buildCorrelations(analysis, sleep, feeding, potty)
  const aiSummary = buildAiSummary(childName, period.label, analysis, potty, feeding, health)

  return {
    header: {
      childName,
      childAge,
      periodLabel: period.label,
      periodRange: period.start && period.end ? `${period.start} – ${period.end}` : period.label,
      generatedDate,
      caregivers: parentName,
    },
    dashboard,
    sleep,
    feeding,
    diaper,
    health,
    growth,
    potty,
    dailyTimeline,
    correlations,
    aiSummary,
    analysis,
  }
}
