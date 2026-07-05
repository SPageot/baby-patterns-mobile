import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { formatBabyAge } from './babyAge'
import { diaperMixType } from './diaperFeedUtils'
import { feedingTypeLabel } from './feedingLogUtils'
import { buildGrowthMilestonesReport } from './growthReportAnalytics'
import { buildHealthEventsReport } from './healthReportAnalytics'
import {
  buildFullReport,
  filterLogsForKindReport,
  formatReportCount,
  formatReportMinutes,
  isSleepNapLog,
  parseSleepInterval,
  reportRangeLabel,
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

export function reportPeriodDates(rangeDays: ReportRange): { start: string; end: string; label: string } {
  const label = reportRangeLabel(rangeDays)
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

function timeBucket(hour: number): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Night'
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
    const nap = isSleepNapLog(log) ? 'Nap' : 'Sleep'
    return `${nap} · ${formatSleepDuration(log)}`
  }
  if (log.kind === 'feeding') {
    const parts = [feedingTypeLabel(log.details.feedingType ?? '')]
    if (log.details.amountOz?.trim()) parts.push(`${log.details.amountOz.trim()} oz`)
    return parts.join(' · ')
  }
  if (log.kind === 'diaper') {
    const mix = diaperMixType(log)
    if (mix === 'wet') return 'Wet diaper'
    if (mix === 'dirty') return 'Dirty diaper'
    if (mix === 'mixed') return 'Mixed diaper'
    return 'Diaper change'
  }
  if (log.kind === 'potty') {
    const result = log.details.result?.trim() || 'visit'
    return result.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
    { label: 'Morning', value: avgMinutesDisplay(napByPeriod.morning, napCounts.morning) },
    { label: 'Afternoon', value: avgMinutesDisplay(napByPeriod.afternoon, napCounts.afternoon) },
    { label: 'Evening', value: avgMinutesDisplay(napByPeriod.evening, napCounts.evening) },
  ]

  const insights: string[] = []
  if (filtered.length === 0) {
    insights.push('No sleep logs recorded in this period.')
  } else {
    if (bedtimeTrend.length >= 3) {
      const spread = Math.max(...bedtimeTrend.map((b) => b.value)) - Math.min(...bedtimeTrend.map((b) => b.value))
      if (spread <= 30) insights.push('Bedtime is becoming more consistent.')
      else insights.push('Bedtime varies across nights — a steady routine may help.')
    }
    if (avgWakings > 0 && avgWakings < 2) insights.push('Night wakings remain relatively low for this period.')
    if (napSessions > 0 && napByPeriod.afternoon > napByPeriod.morning) {
      insights.push('Afternoon naps account for a large share of daytime sleep.')
    }
    insights.push('Sleep averages are summarized from caregiver-entered logs.')
  }

  const sleepTimeline = filtered
    .slice(0, 8)
    .flatMap((log) => {
      const interval = parseSleepInterval(log)
      if (!interval) return []
      const start = interval.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      const end = interval.end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      return [
        { time: start, label: 'Sleeping', sortKey: interval.start.getTime() },
        { time: end, label: isSleepNapLog(log) ? 'Wake (nap)' : 'Wake', sortKey: interval.end.getTime() },
      ]
    })
    .sort((a, b) => a.sortKey - b.sortKey)

  return {
    summary: [
      { label: 'Average daily sleep', value: formatReportMinutes(avgDaily) },
      { label: 'Night sleep', value: formatReportMinutes(avgNight) },
      { label: 'Day sleep', value: formatReportMinutes(avgNap) },
      { label: 'Average bedtime', value: avgTimeDisplay(bedtimes) },
      { label: 'Average wake time', value: avgTimeDisplay(wakeTimes) },
      { label: 'Avg night wakings', value: nightSessions > 0 ? formatReportCount(avgWakings) : '—' },
      { label: 'Longest sleep stretch', value: longestStretch > 0 ? formatReportMinutes(longestStretch) : '—' },
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
    label: feedingTypeLabel(type),
    value: typeCounts[type]
      ? `${formatReportCount((typeCounts[type] ?? 0) / dayCount)}/day`
      : '—',
  }))

  const bottleStats: PdfStat[] = [
    {
      label: 'Average ounces',
      value: bottleOz.length > 0 ? `${formatReportCount(bottleOz.reduce((s, v) => s + v, 0) / bottleOz.length)} oz` : '—',
    },
    {
      label: 'Largest bottle',
      value: bottleOz.length > 0 ? `${Math.max(...bottleOz)} oz` : '—',
    },
    {
      label: 'Smallest bottle',
      value: bottleOz.length > 0 ? `${Math.min(...bottleOz)} oz` : '—',
    },
    {
      label: 'Daily intake (avg)',
      value:
        bottleOz.length > 0
          ? `${formatReportCount(bottleOz.reduce((s, v) => s + v, 0) / dayCount)} oz/day`
          : '—',
    },
  ]

  const breastfeedingStats: PdfStat[] = [
    {
      label: 'Avg session length',
      value:
        breastDurations.length > 0
          ? formatReportMinutes(breastDurations.reduce((s, v) => s + v, 0) / breastDurations.length)
          : '—',
    },
  ]

  const topFoods = [...foodMentions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([food, count]) => ({ label: food, value: `${count} log${count === 1 ? '' : 's'}` }))

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
  if (filtered.length === 0) insights.push('No feeding logs in this period.')
  else {
    if ((typeCounts.solids ?? 0) > (typeCounts.bottle ?? 0)) insights.push('Solid food logs outnumber bottle feeds in this period.')
    if ((typeCounts.bottle ?? 0) > 0 && bottleOz.length >= 2) {
      const firstHalf = bottleOz.slice(0, Math.floor(bottleOz.length / 2))
      const secondHalf = bottleOz.slice(Math.floor(bottleOz.length / 2))
      const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
      const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
      if (avgSecond < avgFirst * 0.9) insights.push('Bottle intake appears to be decreasing over the period.')
      if (avgSecond > avgFirst * 1.1) insights.push('Bottle intake appears to be increasing over the period.')
    }
    insights.push('Feeding patterns are based on caregiver-entered logs.')
  }

  return { byType, bottleStats, breastfeedingStats, topFoods, schedule, insights }
}

function buildDiaperSection(logs: LogRecord[], rangeDays: ReportRange) {
  const filtered = filterLogsForKindReport(logs, 'diaper', rangeDays)
  let wet = 0
  let dirty = 0
  let mixed = 0
  const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }

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
  const timeOfDay = (Object.keys(buckets) as Array<keyof typeof buckets>).map((label) => ({
    label,
    value: buckets[label],
  }))

  const insights: string[] = []
  if (filtered.length === 0) insights.push('No diaper logs in this period.')
  else {
    insights.push('Wet and dirty counts reflect caregiver-entered diaper changes.')
    if (dirty / dayCount < 2) insights.push('Dirty diaper frequency is on the lower side for this period.')
  }

  return {
    summary: [
      { label: 'Wet', value: String(wet) },
      { label: 'Dirty', value: String(dirty) },
      { label: 'Mixed', value: String(mixed) },
      { label: 'Wet (avg/day)', value: formatReportCount(wet / dayCount) },
      { label: 'Dirty (avg/day)', value: formatReportCount(dirty / dayCount) },
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
  const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }
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
      label: `Week ${i + 1}`,
      value: row.total > 0 ? Math.round((row.success / row.total) * 100) : 0,
      displayValue: row.total > 0 ? `${Math.round((row.success / row.total) * 100)}%` : '—',
    }))

  const insights: string[] = []
  if (attempts === 0) insights.push('No potty logs in this period.')
  else {
    if (successRate >= 70) insights.push('Potty success rate is strong for this period.')
    if (buckets.Evening > buckets.Morning && accidents > 0) {
      insights.push('Most accidents may cluster later in the day — extra reminders before bedtime can help.')
    }
    if (weeklySuccess.length >= 2) {
      const first = weeklySuccess[0].value
      const last = weeklySuccess[weeklySuccess.length - 1].value
      if (last > first) insights.push(`Success rate improved from about ${first}% to ${last}% across recent weeks.`)
    }
  }

  return {
    summary: [
      { label: 'Attempts', value: String(attempts) },
      { label: 'Successful', value: String(successes) },
      { label: 'Accidents', value: String(accidents) },
      { label: 'Success rate', value: attempts > 0 ? `${successRate}%` : '—' },
    ],
    timeOfDay: (Object.keys(buckets) as Array<keyof typeof buckets>).map((label) => ({
      label,
      value: buckets[label],
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
      symptomMap.set('Fever', (symptomMap.get('Fever') ?? 0) + 1)
    }
  }

  const illnessTimeline = health.sickness.slice(0, 6).map((row) => {
    const lines = [row.sicknessType]
    if (row.temperatureF) lines.push(`Fever ${row.temperatureF}°F`)
    if (row.usedMedication && row.medicationUsed) lines.push(`Medicine: ${row.medicationUsed}`)
    if (row.endedAt) lines.push(`Recovered ${formatWhen(row.endedAt)}`)
    return { date: formatWhen(row.startedAt), lines }
  })

  const medications = health.sickness
    .filter((s) => s.usedMedication && s.medicationUsed)
    .slice(0, 8)
    .map((s) => ({
      medicine: s.medicationUsed ?? '—',
      dose: s.medicationAmount?.trim() || '—',
      times: 'As logged',
    }))

  const vaccines = health.pediatricianVisits.flatMap((visit) =>
    visit.immunizations.map((name) => ({
      name,
      date: formatWhen(visit.visitedAt),
      note: visit.notes?.trim() || 'No reactions noted in log',
    })),
  )

  const injuryRows = health.injuries.slice(0, 6).map((row) => ({
    date: formatWhen(row.occurredAt),
    description: row.description,
    details: [row.bodyPart, row.hasSwelling ? 'Swelling noted' : null, row.notes].filter(Boolean).join(' · ') || '—',
  }))

  const insights: string[] = []
  if (health.totalEvents === 0) insights.push('No health events logged in this period.')
  else {
    if (feverEpisodes > 0) insights.push('Fever episodes were logged — monitor recovery and contact your pediatrician if concerned.')
    if (health.ongoingSicknessCount + health.ongoingInjuryCount > 0) {
      insights.push(`${health.ongoingSicknessCount + health.ongoingInjuryCount} health event(s) were still ongoing at report time.`)
    }
    insights.push('Health observations are caregiver-entered and not medical conclusions.')
  }

  return {
    summary: [
      { label: 'Illnesses', value: String(health.sicknessCount) },
      { label: 'Doctor visits', value: String(health.pediatricianCount) },
      { label: 'Medicine days', value: String(health.withMedicationCount) },
      { label: 'Fever episodes', value: String(feverEpisodes) },
      { label: 'Injuries', value: String(health.injuryCount) },
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
    displayValue: `${p.value} lb`,
  }))
  const heightTimeline = growth.heightTrend.slice(-6).map((p) => ({
    key: p.key,
    label: p.label,
    value: p.value,
    displayValue: `${p.value} in`,
  }))

  const milestoneStats = growth.milestones.slice(0, 8).map((m) => ({
    label: m.title,
    value: formatWhen(m.achievedAt),
  }))

  const insights: string[] = []
  if (growth.measurementCount === 0 && growth.milestoneCount === 0) {
    insights.push('No growth measurements or milestones in this period.')
  } else {
    if (growth.weightChangeDisplay) insights.push(`Weight change in period: ${growth.weightChangeDisplay}.`)
    if (heightChange) insights.push(`Height change in period: ${heightChange}.`)
    insights.push('Growth trends follow caregiver-entered measurements.')
  }

  return {
    summary: [
      { label: 'Latest weight', value: growth.latestWeightDisplay },
      { label: 'Latest height', value: growth.latestHeightDisplay },
      { label: 'Latest head', value: growth.latestHeadDisplay },
      { label: 'Weight change', value: growth.weightChangeDisplay ?? '—' },
      { label: 'Height change', value: heightChange ?? '—' },
      { label: 'Milestones', value: String(growth.milestoneCount) },
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

  if (analysis.sleep.napSection && analysis.sleep.napSection.avgPerDay > 90 && sleep.summary[5]?.value !== '—') {
    lines.push('Longer afternoon naps may be associated with nighttime sleep patterns — review sleep logs for your child.')
  }
  if (feeding.insights.some((i) => i.includes('decreasing')) && feeding.byType.some((t) => t.label === 'Solids')) {
    lines.push('Reduced daytime milk intake often corresponds with changing solid food patterns in this period.')
  }
  if (analysis.health.sicknessCount > 0 && analysis.sleep.totalEvents > 0) {
    lines.push('Illness periods may coincide with changes in sleep and appetite — compare health and feeding sections.')
  }
  if (analysis.diapers.totalEvents > 0 && feeding.byType.some((t) => t.label === 'Bottle')) {
    lines.push('Diaper and feeding frequency can shift together — review fluid intake on lower-output days.')
  }
  if (potty.summary[0] && Number(potty.summary[0].value) > 0) {
    lines.push('Potty training success often improves with consistent bathroom reminders and routine.')
  }

  if (lines.length === 0) {
    lines.push('Log more data across categories to surface cross-activity patterns in future reports.')
  }

  return lines.map((line) => `${line} (Observation — not a medical conclusion.)`)
}

function buildAiSummary(
  childName: string,
  rangeLabel: string,
  analysis: FullReport,
  potty: ReportPdfContent['potty'],
  feeding: ReportPdfContent['feeding'],
  health: ReportPdfContent['health'],
): string {
  const sleepAvg = analysis.sleep.avgDisplay.replace(' avg/day', ' per day')
  const feedingStable = feeding.insights.some((i) => i.includes('increasing') || i.includes('decreasing'))
    ? 'with some shifts in bottle and solid intake'
    : 'remained relatively stable'
  const diaperNote =
    analysis.diapers.totalEvents > 0
      ? 'Diaper frequency stayed within the range recorded in your logs'
      : 'Diaper logging was light in this period'
  const illnessNote =
    health.summary[0] && Number(health.summary[0].value) > 0
      ? `while ${health.summary[0].value} illness log(s) were noted`
      : 'with no illness logs recorded'
  const pottyNote =
    potty.summary[3]?.value && potty.summary[3].value !== '—'
      ? `Potty training shows a ${potty.summary[3].value} success rate in this period.`
      : ''

  return (
    `Over ${rangeLabel.toLowerCase()}, ${childName} averaged ${sleepAvg}. ` +
    `Feeding patterns ${feedingStable}, ${diaperNote}, ${illnessNote}. ` +
    `${pottyNote} ` +
    `Overall, routines and development are summarized from caregiver-entered data for discussion with your pediatrician.`
  ).replace(/\s+/g, ' ')
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
      ? primaryBaby?.fullName?.trim() || 'Your child'
      : babies.map((b) => b.fullName?.trim()).filter(Boolean).join(', ') || 'Your children'
  const childAge =
    babies.length === 1 && primaryBaby?.birthdate
      ? formatBabyAge(primaryBaby.birthdate)
      : babies.length > 1
        ? 'Multiple children'
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
    { label: 'Average sleep', value: analysis.sleep.avgDisplay.replace(' avg/day', '/day') },
    { label: 'Feedings', value: analysis.feeding.avgDisplay },
    { label: 'Wet diapers', value: diaper.summary[3]?.value ? `${diaper.summary[3].value}/day` : '—' },
    { label: 'Dirty diapers', value: diaper.summary[4]?.value ? `${diaper.summary[4].value}/day` : '—' },
    { label: 'Health events', value: String(analysis.health.totalEvents) },
    {
      label: 'Growth',
      value: [growth.summary[3]?.value, growth.summary[4]?.value].filter((v) => v && v !== '—').join(' · ') || '—',
    },
    { label: 'Potty success', value: potty.summary[3]?.value ?? '—' },
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
