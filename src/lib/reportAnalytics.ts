import type { LogKind, LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { buildGrowthMilestonesReport } from '@/lib/growthReportAnalytics'
import { buildHealthEventsReport } from '@/lib/healthReportAnalytics'
import { formatSleepUtcStamp } from '@/lib/sleepLogUtils'
import { isoLocalYmd } from '@/lib/trackUtils'

export type ReportRange = 7 | 30 | 90 | 0
export type DayRank = {
  date: string
  label: string
  value: number
  displayValue: string
}

export type HourRank = {
  hour: number
  label: string
  value: number
  displayValue: string
  /** Stable list key (sleep session id, etc.). */
  id?: string
}

export type WeekdayAverage = {
  weekday: number
  label: string
  value: number
  displayValue: string
}

export type KindReport = {
  kind: LogKind
  title: string
  totalEvents: number
  daysTracked: number
  avgPerDay: number
  avgDisplay: string
  bestDays: DayRank[]
  worstDays: DayRank[]
  bestHours: HourRank[]
  worstHours: HourRank[]
  dailyTrend: { key: string; label: string; value: number }[]
  hourlyDistribution: HourRank[]
  weekdayAverages: WeekdayAverage[]
  unit: 'minutes' | 'count'
  /** Sleep only — sessions logged with the nap checkbox. */
  napSection?: NapReportSection
}

export type NapReportSection = {
  count: number
  daysTracked: number
  avgPerDay: number
  avgDisplay: string
  bestDays: DayRank[]
  worstDays: DayRank[]
  bestHours: HourRank[]
  worstHours: HourRank[]
  dailyTrend: { key: string; label: string; value: number }[]
  hourlyDistribution: HourRank[]
  weekdayAverages: WeekdayAverage[]
}

const KIND_TITLES: Record<LogKind, string> = {
  diaper: 'Diapers',
  feeding: 'Feeding',
  sleep: 'Sleep',
  potty: 'Potty',
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function formatReportMinutes(m: number): string {
  if (m < 1) return '0 min'
  if (m < 60) return `${Math.round(m)} min`
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

export function formatReportCount(n: number): string {
  return `${Math.round(n * 10) / 10}`.replace(/\.0$/, '')
}

function formatDayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/** UTC calendar label — matches sleep log timestamps (stored as UTC wall clock). */
function formatUtcDayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatHourLabel(hour: number): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric' })
}

function formatUtcHourLabel(hour: number): string {
  const d = new Date(Date.UTC(2000, 0, 1, hour, 0, 0))
  return d.toLocaleTimeString(undefined, { timeZone: 'UTC', hour: 'numeric' })
}

function utcYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function localYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type SleepInterval = {
  start: Date
  end: Date
  minutes: number
}

/** Parse sleep using only sleepStartTime and sleepEndTime (no duration, date, or legacy fields). */
export function parseSleepInterval(log: LogRecord): SleepInterval | null {
  if (log.kind !== 'sleep') return null
  const startIso = log.details.sleepStartTime?.trim()
  const endIso = log.details.sleepEndTime?.trim()
  if (!startIso || !endIso) return null

  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null

  return {
    start,
    end,
    minutes: (end.getTime() - start.getTime()) / 60000,
  }
}

function startTimeSortKey(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

function formatSleepSessionDisplay(avgMinutes: number, sessionCount: number, noun = 'session'): string {
  const duration = formatReportMinutes(avgMinutes)
  const label = sessionCount === 1 ? noun : `${noun}s`
  if (sessionCount <= 1) return `slept ${duration}`
  return `slept ${duration} avg · ${sessionCount} ${label}`
}

export function isSleepNapLog(log: LogRecord): boolean {
  return log.kind === 'sleep' && log.details.isNap === 'true'
}

type SleepSessionAccum = {
  validSessions: number
  totalSleepMinutes: number
  dailyMap: Map<string, number>
  fallAsleepHourMinutes: Map<number, number>
  fallAsleepHourCounts: Map<number, number>
  sessionRanks: HourRank[]
  weekdayMap: Map<number, { total: number; days: Set<string> }>
}

function accumulateSleepSessions(logs: LogRecord[]): SleepSessionAccum {
  const dailyMap = new Map<string, number>()
  const fallAsleepHourMinutes = new Map<number, number>()
  const fallAsleepHourCounts = new Map<number, number>()
  const sessionRanks: HourRank[] = []
  const weekdayMap = new Map<number, { total: number; days: Set<string> }>()

  let validSessions = 0
  let totalSleepMinutes = 0

  for (const log of logs) {
    const interval = parseSleepInterval(log)
    if (!interval) continue

    validSessions += 1
    totalSleepMinutes += interval.minutes

    const wakeDay = utcYmd(interval.end)
    dailyMap.set(wakeDay, (dailyMap.get(wakeDay) ?? 0) + interval.minutes)

    const startHour = interval.start.getUTCHours()
    fallAsleepHourMinutes.set(
      startHour,
      (fallAsleepHourMinutes.get(startHour) ?? 0) + interval.minutes,
    )
    fallAsleepHourCounts.set(startHour, (fallAsleepHourCounts.get(startHour) ?? 0) + 1)

    const startIso = log.details.sleepStartTime!.trim()
    const { date: startDate, time: startTime } = formatSleepUtcStamp(startIso)
    sessionRanks.push({
      id: log.id,
      hour: startTimeSortKey(interval.start),
      label: `${startDate} · ${startTime}`,
      value: interval.minutes,
      displayValue: formatReportMinutes(interval.minutes),
    })

    const weekday = new Date(`${wakeDay}T12:00:00Z`).getUTCDay()
    const entry = weekdayMap.get(weekday) ?? { total: 0, days: new Set<string>() }
    entry.total += interval.minutes
    entry.days.add(wakeDay)
    weekdayMap.set(weekday, entry)
  }

  return {
    validSessions,
    totalSleepMinutes,
    dailyMap,
    fallAsleepHourMinutes,
    fallAsleepHourCounts,
    sessionRanks,
    weekdayMap,
  }
}

function buildSleepMetricsFromAccum(
  accum: SleepSessionAccum,
  rangeDays: ReportRange,
  sessionNoun = 'session',
): Pick<
  KindReport,
  | 'totalEvents'
  | 'daysTracked'
  | 'avgPerDay'
  | 'avgDisplay'
  | 'bestDays'
  | 'worstDays'
  | 'bestHours'
  | 'worstHours'
  | 'dailyTrend'
  | 'hourlyDistribution'
  | 'weekdayAverages'
> {
  const {
    validSessions,
    totalSleepMinutes,
    dailyMap,
    fallAsleepHourMinutes,
    fallAsleepHourCounts,
    sessionRanks,
    weekdayMap,
  } = accum

  const dayRanks: DayRank[] = [...dailyMap.entries()].map(([date, value]) => ({
    date,
    label: formatUtcDayLabel(date),
    value,
    displayValue: formatReportMinutes(value),
  }))

  const { best: bestDays, worst: worstDays } = topAndBottom(dayRanks)

  const daysTracked = dailyMap.size
  const avgPerDay = daysTracked > 0 ? totalSleepMinutes / daysTracked : 0

  const hourlyDistribution: HourRank[] = Array.from({ length: 24 }, (_, hour) => {
    const sessionCount = fallAsleepHourCounts.get(hour) ?? 0
    if (sessionCount === 0) {
      return {
        hour,
        label: formatUtcHourLabel(hour),
        value: 0,
        displayValue: '0',
      }
    }
    const totalMinutes = fallAsleepHourMinutes.get(hour) ?? 0
    const avgSession = totalMinutes / sessionCount
    return {
      hour,
      label: formatUtcHourLabel(hour),
      value: totalMinutes,
      displayValue: formatSleepSessionDisplay(avgSession, sessionCount, sessionNoun),
    }
  })

  const sortedSessions = [...sessionRanks].sort((a, b) => b.value - a.value)
  const bestHours = sortedSessions.slice(0, 5)
  const worstHours = [...sessionRanks]
    .filter((row) => row.value > 0)
    .sort((a, b) => a.value - b.value)
    .slice(0, 5)

  const dailyTrend = buildUtcDailyTrend(dailyMap, rangeDays)

  const weekdayAverages: WeekdayAverage[] = Array.from({ length: 7 }, (_, weekday) => {
    const entry = weekdayMap.get(weekday)
    const dayCount = entry?.days.size ?? 0
    const avg = dayCount > 0 ? entry!.total / dayCount : 0
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday],
      value: avg,
      displayValue: formatReportMinutes(avg),
    }
  })

  return {
    totalEvents: validSessions,
    daysTracked,
    avgPerDay,
    avgDisplay: `${formatReportMinutes(avgPerDay)} avg/day`,
    bestDays,
    worstDays,
    bestHours,
    worstHours,
    dailyTrend,
    hourlyDistribution,
    weekdayAverages,
  }
}

function buildNapSection(logs: LogRecord[], rangeDays: ReportRange): NapReportSection {
  const napLogs = logs.filter(isSleepNapLog)
  const accum = accumulateSleepSessions(napLogs)
  const metrics = buildSleepMetricsFromAccum(accum, rangeDays, 'nap')

  return {
    count: metrics.totalEvents,
    daysTracked: metrics.daysTracked,
    avgPerDay: metrics.avgPerDay,
    avgDisplay: metrics.avgDisplay,
    bestDays: metrics.bestDays,
    worstDays: metrics.worstDays,
    bestHours: metrics.bestHours,
    worstHours: metrics.worstHours,
    dailyTrend: metrics.dailyTrend,
    hourlyDistribution: metrics.hourlyDistribution,
    weekdayAverages: metrics.weekdayAverages,
  }
}

function buildUtcDailyTrend(
  dailyMap: Map<string, number>,
  rangeDays: ReportRange,
): { key: string; label: string; value: number }[] {
  const trendDays = rangeDays === 0 ? 90 : rangeDays
  const today = new Date()
  const dailyTrend: { key: string; label: string; value: number }[] = []

  for (let i = trendDays - 1; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 12, 0, 0),
    )
    const key = utcYmd(d)
    dailyTrend.push({
      key,
      label: d.toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric' }),
      value: dailyMap.get(key) ?? 0,
    })
  }

  return dailyTrend
}

function buildLocalDailyTrend(
  dailyMap: Map<string, number>,
  rangeDays: ReportRange,
): { key: string; label: string; value: number }[] {
  const trendDays = rangeDays === 0 ? 90 : rangeDays
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dailyTrend: { key: string; label: string; value: number }[] = []

  for (let i = trendDays - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = localYmd(d)
    dailyTrend.push({
      key,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: dailyMap.get(key) ?? 0,
    })
  }

  return dailyTrend
}

export function filterLogsForKindReport(
  logs: LogRecord[],
  kind: LogKind,
  rangeDays: ReportRange,
): LogRecord[] {
  if (kind === 'sleep') return filterSleepLogs(logs, rangeDays)
  return filterByRange(
    logs.filter((log) => log.kind === kind),
    rangeDays,
  )
}

function filterSleepLogs(logs: LogRecord[], rangeDays: ReportRange): LogRecord[] {
  const sleepLogs = logs.filter((log) => log.kind === 'sleep')
  if (rangeDays === 0) return sleepLogs

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - rangeDays)
  cutoff.setHours(0, 0, 0, 0)

  return sleepLogs.filter((log) => {
    const interval = parseSleepInterval(log)
    if (!interval) return false
    return interval.end >= cutoff
  })
}

function buildSleepReport(logs: LogRecord[], rangeDays: ReportRange): KindReport {
  const filtered = filterSleepLogs(logs, rangeDays)
  const metrics = buildSleepMetricsFromAccum(accumulateSleepSessions(filtered), rangeDays, 'session')
  const napSection = buildNapSection(filtered, rangeDays)

  return {
    kind: 'sleep',
    title: KIND_TITLES.sleep,
    ...metrics,
    unit: 'minutes',
    napSection,
  }
}

function eventDateYmd(log: LogRecord): string {
  if (log.kind === 'diaper') {
    const t = log.details.time?.trim() || log.atIso
    return isoLocalYmd(t) || isoLocalYmd(log.atIso)
  }
  if (log.kind === 'feeding') {
    const t = log.details.feedingAt?.trim() || log.atIso
    return isoLocalYmd(t) || isoLocalYmd(log.atIso)
  }
  return isoLocalYmd(log.atIso)
}

function eventHour(log: LogRecord): number | null {
  let iso = log.atIso
  if (log.kind === 'diaper') iso = log.details.time?.trim() || log.atIso
  else if (log.kind === 'feeding') iso = log.details.feedingAt?.trim() || log.atIso

  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours()
}

function filterByRange(logs: LogRecord[], rangeDays: ReportRange): LogRecord[] {
  if (rangeDays === 0) return logs
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - rangeDays)
  cutoff.setHours(0, 0, 0, 0)
  return logs.filter((log) => {
    const ymd = eventDateYmd(log)
    const d = new Date(`${ymd}T12:00:00`)
    return !Number.isNaN(d.getTime()) && d >= cutoff
  })
}

function topAndBottom<T extends { value: number }>(items: T[], count = 5) {
  const sorted = [...items].filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
  if (sorted.length === 0) return { best: [] as T[], worst: [] as T[] }
  return {
    best: sorted.slice(0, count),
    worst: [...sorted].reverse().slice(0, count),
  }
}

function displayForDayValue(value: number): string {
  return formatReportCount(value)
}

function formatHourCountDisplay(kind: LogKind, count: number): string {
  if (count === 0) return '0'
  const noun =
    kind === 'feeding' ? (count === 1 ? 'feed' : 'feeds') : count === 1 ? 'change' : 'changes'
  return `${count} ${noun}`
}

export function buildKindReport(logs: LogRecord[], kind: LogKind, rangeDays: ReportRange): KindReport {
  if (kind === 'sleep') {
    return buildSleepReport(logs, rangeDays)
  }

  const filtered = filterByRange(
    logs.filter((log) => log.kind === kind),
    rangeDays,
  )

  const dailyMap = new Map<string, number>()
  const hourlyCountMap = new Map<number, number>()
  const weekdayMap = new Map<number, { total: number; days: Set<string> }>()

  for (const log of filtered) {
    const day = eventDateYmd(log)
    if (!day) continue

    const val = 1
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + val)

    const hour = eventHour(log)
    if (hour != null) {
      hourlyCountMap.set(hour, (hourlyCountMap.get(hour) ?? 0) + 1)
    }

    const weekday = new Date(`${day}T12:00:00`).getDay()
    const entry = weekdayMap.get(weekday) ?? { total: 0, days: new Set<string>() }
    entry.total += val
    entry.days.add(day)
    weekdayMap.set(weekday, entry)
  }

  const dayRanks: DayRank[] = [...dailyMap.entries()].map(([date, value]) => ({
    date,
    label: formatDayLabel(date),
    value,
    displayValue: displayForDayValue(value),
  }))

  const { best: bestDays, worst: worstDays } = topAndBottom(dayRanks)

  const hourlyDistribution: HourRank[] = Array.from({ length: 24 }, (_, hour) => {
    const count = hourlyCountMap.get(hour) ?? 0
    return {
      hour,
      label: formatHourLabel(hour),
      value: count,
      displayValue: formatHourCountDisplay(kind, count),
    }
  })

  const ranked = topAndBottom(hourlyDistribution.filter((row) => row.value > 0))
  const bestHours = ranked.best
  const worstHours = ranked.worst

  const dailyTrend = buildLocalDailyTrend(dailyMap, rangeDays)

  const weekdayAverages: WeekdayAverage[] = Array.from({ length: 7 }, (_, weekday) => {
    const entry = weekdayMap.get(weekday)
    const dayCount = entry?.days.size ?? 0
    const avg = dayCount > 0 ? entry!.total / dayCount : 0
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday],
      value: avg,
      displayValue: displayForDayValue(avg),
    }
  })

  const daysTracked = dailyMap.size
  const totalValue = [...dailyMap.values()].reduce((sum, value) => sum + value, 0)
  const avgPerDay = daysTracked > 0 ? totalValue / daysTracked : 0

  return {
    kind,
    title: KIND_TITLES[kind],
    totalEvents: filtered.length,
    daysTracked,
    avgPerDay,
    avgDisplay: `${displayForDayValue(avgPerDay)}/day`,
    bestDays,
    worstDays,
    bestHours,
    worstHours,
    dailyTrend,
    hourlyDistribution,
    weekdayAverages,
    unit: 'count',
  }
}

export type ReportExtras = {
  measurements?: GrowthMeasurementDto[]
  milestones?: MilestoneDto[]
  sickness?: SicknessEventDto[]
  injuries?: InjuryEventDto[]
  pediatricianVisits?: PediatricianVisitDto[]
}

export function buildFullReport(
  logs: LogRecord[],
  rangeDays: ReportRange,
  extras?: ReportExtras,
) {
  const measurements = extras?.measurements ?? []
  const milestones = extras?.milestones ?? []
  const sickness = extras?.sickness ?? []
  const injuries = extras?.injuries ?? []
  const pediatricianVisits = extras?.pediatricianVisits ?? []

  return {
    diapers: buildKindReport(logs, 'diaper', rangeDays),
    feeding: buildKindReport(logs, 'feeding', rangeDays),
    sleep: buildKindReport(logs, 'sleep', rangeDays),
    growth: buildGrowthMilestonesReport(measurements, milestones, rangeDays),
    health: buildHealthEventsReport(sickness, injuries, pediatricianVisits, rangeDays),
    rangeDays,
  }
}

export type FullReport = ReturnType<typeof buildFullReport>

export function reportRangeLabel(rangeDays: ReportRange): string {
  if (rangeDays === 0) return 'All time'
  if (rangeDays === 90) return 'Last 90 days'
  if (rangeDays === 7) return 'Last 7 days'
  return 'Last 30 days'
}
