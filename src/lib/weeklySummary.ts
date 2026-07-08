import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import {
  buildFullReport,
  formatReportCount,
  formatReportMinutes,
  parseSleepInterval,
  type DayRank,
  type FullReport,
  type HourRank,
  type KindReport,
  type NapReportSection,
} from '@/lib/reportAnalytics'
import { growthMilestoneSummaryLines } from '@/lib/growthReportAnalytics'
import { healthSummaryLines } from '@/lib/healthReportAnalytics'

export type WeekSelection = 'last' | 'this'

export type WeekBounds = {
  start: Date
  end: Date
  label: string
  shortLabel: string
}

function startOfWeekMonday(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function getWeekBounds(selection: WeekSelection, ref = new Date()): WeekBounds {
  const thisMonday = startOfWeekMonday(ref)
  const start = new Date(thisMonday)
  if (selection === 'last') {
    start.setDate(start.getDate() - 7)
  }
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  const prefix = selection === 'last' ? 'Last week' : 'This week'
  const label = `${prefix} · ${formatWeekDate(start)} – ${formatWeekDate(end)}`
  const shortLabel = `${formatWeekDate(start)} – ${formatWeekDate(end)}`

  return { start, end, label, shortLabel }
}

function inWeekBounds(iso: string, bounds: WeekBounds): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d >= bounds.start && d <= bounds.end
}

function logEventDate(log: LogRecord): Date | null {
  if (log.kind === 'sleep') {
    const interval = parseSleepInterval(log)
    return interval?.end ?? null
  }
  if (log.kind === 'diaper') {
    const raw = log.details.time?.trim() || log.atIso
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (log.kind === 'feeding') {
    const raw = log.details.feedingAt?.trim() || log.atIso
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(log.atIso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function filterLogsForWeek(logs: LogRecord[], bounds: WeekBounds): LogRecord[] {
  return logs.filter((log) => {
    const when = logEventDate(log)
    if (!when) return false
    return when >= bounds.start && when <= bounds.end
  })
}

export function filterGrowthForWeek(
  measurements: GrowthMeasurementDto[],
  milestones: MilestoneDto[],
  bounds: WeekBounds,
) {
  return {
    measurements: measurements.filter((m) => inWeekBounds(m.recordedAt, bounds)),
    milestones: milestones.filter((m) => inWeekBounds(m.achievedAt, bounds)),
  }
}

export function filterHealthForWeek(
  sickness: SicknessEventDto[],
  injuries: InjuryEventDto[],
  pediatricianVisits: PediatricianVisitDto[],
  bounds: WeekBounds,
) {
  return {
    sickness: sickness.filter((row) => inWeekBounds(row.startedAt, bounds)),
    injuries: injuries.filter((row) => inWeekBounds(row.occurredAt, bounds)),
    pediatricianVisits: pediatricianVisits.filter((row) => inWeekBounds(row.visitedAt, bounds)),
  }
}

export function buildWeeklyReport(
  logs: LogRecord[],
  measurements: GrowthMeasurementDto[],
  milestones: MilestoneDto[],
  sickness: SicknessEventDto[],
  injuries: InjuryEventDto[],
  pediatricianVisits: PediatricianVisitDto[],
  bounds: WeekBounds,
) {
  const weekLogs = filterLogsForWeek(logs, bounds)
  const growth = filterGrowthForWeek(measurements, milestones, bounds)
  const health = filterHealthForWeek(sickness, injuries, pediatricianVisits, bounds)
  const report = buildFullReport(weekLogs, 0, {
    measurements: growth.measurements,
    milestones: growth.milestones,
    sickness: health.sickness,
    injuries: health.injuries,
    pediatricianVisits: health.pediatricianVisits,
  })
  return { report, bounds, weekLogs }
}

export type WeeklyHighlight = {
  id: string
  label: string
  value: string
  detail?: string
}

export function buildWeeklyHighlights(report: FullReport): WeeklyHighlight[] {
  const nap = report.sleep.napSection
  const highlights: WeeklyHighlight[] = [
    {
      id: 'sleep',
      label: 'Sleep',
      value: report.sleep.totalEvents > 0 ? `${report.sleep.totalEvents} sessions` : 'No logs',
      detail: report.sleep.totalEvents > 0 ? report.sleep.avgDisplay : undefined,
    },
    {
      id: 'naps',
      label: 'Naps',
      value: nap && nap.count > 0 ? `${nap.count} naps` : 'no naps saved',
      detail: nap && nap.count > 0 ? nap.avgDisplay : undefined,
    },
    {
      id: 'diapers',
      label: 'Diapers',
      value: report.diapers.totalEvents > 0 ? `${report.diapers.totalEvents} changes` : 'No logs',
      detail: report.diapers.totalEvents > 0 ? report.diapers.avgDisplay : undefined,
    },
    {
      id: 'feeding',
      label: 'Feeding',
      value: report.feeding.totalEvents > 0 ? `${report.feeding.totalEvents} feeds` : 'No logs',
      detail: report.feeding.totalEvents > 0 ? report.feeding.avgDisplay : undefined,
    },
    {
      id: 'growth',
      label: 'Growth',
      value:
        report.growth.measurementCount > 0
          ? `${report.growth.measurementCount} measurement${report.growth.measurementCount === 1 ? '' : 's'}`
          : '—',
      detail:
        report.growth.measurementCount > 0
          ? `${report.growth.latestWeightDisplay} · ${report.growth.latestHeightDisplay}`
          : undefined,
    },
    {
      id: 'milestones',
      label: 'Milestones',
      value:
        report.growth.milestoneCount > 0
          ? `${report.growth.milestoneCount} logged`
          : 'None this week',
      detail: report.growth.weightChangeDisplay ?? undefined,
    },
    {
      id: 'health',
      label: 'Health',
      value:
        report.health.totalEvents > 0
          ? [
              report.health.sicknessCount > 0
                ? `${report.health.sicknessCount} sickness`
                : null,
              report.health.injuryCount > 0
                ? `${report.health.injuryCount} injur${report.health.injuryCount === 1 ? 'y' : 'ies'}`
                : null,
              report.health.pediatricianCount > 0
                ? `${report.health.pediatricianCount} visit${report.health.pediatricianCount === 1 ? '' : 's'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : 'No health events',
      detail:
        report.health.totalEvents > 0 && report.health.ongoingSicknessCount + report.health.ongoingInjuryCount > 0
          ? `${report.health.ongoingSicknessCount + report.health.ongoingInjuryCount} ongoing`
          : undefined,
    },
  ]
  return highlights
}

export type WeeklyTrendCategory = 'sleep' | 'nap' | 'diaper' | 'feeding'

export type WeeklyTrendStat = {
  label: string
  value: string
}

export type WeeklyTrendBreakdown = {
  summaryLine: string
  stats: WeeklyTrendStat[]
  mostLabel: string
  most: string | null
  leastLabel: string
  least: string | null
  topDays: { label: string; value: string }[]
  lowDays: { label: string; value: string }[]
  busiestWeekday: string | null
  quietestWeekday: string | null
  busiestTimeLabel: string
  busiestTime: string | null
  quietestTimeLabel: string
  quietestTime: string | null
  dailyRows: { label: string; displayValue: string }[]
}

type TrendBreakdownSource = Pick<
  KindReport,
  | 'totalEvents'
  | 'daysTracked'
  | 'avgDisplay'
  | 'unit'
  | 'bestDays'
  | 'worstDays'
  | 'bestHours'
  | 'worstHours'
  | 'weekdayAverages'
  | 'dailyTrend'
>

const TREND_CATEGORY_COPY: Record<
  WeeklyTrendCategory,
  { summaryTotal: (count: number) => string; mostDay: string; leastDay: string }
> = {
  sleep: {
    summaryTotal: (count) =>
      `${count} sleep session${count === 1 ? '' : 's'}`,
    mostDay: 'Most sleep',
    leastDay: 'Least sleep',
  },
  nap: {
    summaryTotal: (count) => `${count} nap${count === 1 ? '' : 's'}`,
    mostDay: 'Most naps',
    leastDay: 'Least naps',
  },
  diaper: {
    summaryTotal: (count) =>
      `${count} diaper change${count === 1 ? '' : 's'}`,
    mostDay: 'Most diaper changes',
    leastDay: 'Least diaper changes',
  },
  feeding: {
    summaryTotal: (count) => `${count} feeding session${count === 1 ? '' : 's'}`,
    mostDay: 'Most feedings',
    leastDay: 'Least feedings',
  },
}

const TOTAL_STAT_LABEL: Record<WeeklyTrendCategory, string> = {
  sleep: 'Sleep sessions',
  nap: 'Naps logged',
  diaper: 'Diaper changes',
  feeding: 'Feeding sessions',
}

function hourStatLabels(category: WeeklyTrendCategory): { best: string; worst: string } {
  if (category === 'sleep' || category === 'nap') {
    return { best: 'Longest session at', worst: 'Shortest session at' }
  }
  return { best: 'Busiest time of day', worst: 'Quietest time of day' }
}

function formatHourRank(rank: HourRank | undefined): string | null {
  if (!rank) return null
  return `${rank.label} · ${rank.displayValue}`
}

function weekdayExtremes(
  weekdays: KindReport['weekdayAverages'],
): { busiest: string | null; quietest: string | null } {
  const withData = weekdays.filter((row) => row.value > 0)
  if (withData.length === 0) return { busiest: null, quietest: null }

  const sorted = [...withData].sort((a, b) => b.value - a.value)
  const busiest = sorted[0]
  const quietest = sorted[sorted.length - 1]

  return {
    busiest: `${busiest.label} · ${busiest.displayValue} avg`,
    quietest:
      sorted.length > 1 && quietest.weekday !== busiest.weekday
        ? `${quietest.label} · ${quietest.displayValue} avg`
        : null,
  }
}

function buildStatsGrid(
  category: WeeklyTrendCategory,
  report: TrendBreakdownSource,
): WeeklyTrendStat[] {
  const stats: WeeklyTrendStat[] = [
    { label: TOTAL_STAT_LABEL[category], value: String(report.totalEvents) },
    { label: 'Days tracked', value: String(report.daysTracked) },
    { label: 'Daily average', value: report.avgDisplay },
  ]

  const dailyValues = report.dailyTrend.filter((row) => row.value > 0).map((row) => row.value)
  if (dailyValues.length > 0) {
    const max = Math.max(...dailyValues)
    const min = Math.min(...dailyValues)
    stats.push(
      { label: 'Highest day', value: formatTrendDailyValue(category, max, report.unit) },
      { label: 'Lowest day', value: formatTrendDailyValue(category, min, report.unit) },
    )
  }

  return stats
}

function rankRows(ranks: DayRank[], limit = 3): { label: string; value: string }[] {
  return ranks.slice(0, limit).map((row) => ({
    label: row.label,
    value: row.displayValue,
  }))
}

function formatTrendDailyValue(
  category: WeeklyTrendCategory,
  value: number,
  unit: 'minutes' | 'count',
): string {
  if (unit === 'minutes') return formatReportMinutes(value)
  if (category === 'feeding') {
    return `${formatReportCount(value)} ${value === 1 ? 'feed' : 'feeds'}`
  }
  if (category === 'diaper') {
    return `${formatReportCount(value)} ${value === 1 ? 'change' : 'changes'}`
  }
  return `${formatReportCount(value)} ${value === 1 ? 'nap' : 'naps'}`
}

function formatDayRank(rank: DayRank | undefined): string | null {
  if (!rank) return null
  return `${rank.label} · ${rank.displayValue}`
}

export function buildWeeklyTrendBreakdown(
  category: WeeklyTrendCategory,
  report: TrendBreakdownSource,
): WeeklyTrendBreakdown | null {
  if (report.totalEvents <= 0) return null

  const copy = TREND_CATEGORY_COPY[category]
  const summaryLine = `${copy.summaryTotal(report.totalEvents)} across ${report.daysTracked} day${report.daysTracked === 1 ? '' : 's'} · ${report.avgDisplay} avg per day`

  const best = report.bestDays[0]
  const worst = report.worstDays[0]
  const showLeast =
    worst &&
    (report.worstDays.length > 1 || !best || worst.date !== best.date || worst.value !== best.value)

  const dailyRows = report.dailyTrend
    .filter((row) => row.value > 0)
    .map((row) => ({
      label: row.label,
      displayValue: formatTrendDailyValue(category, row.value, report.unit),
    }))

  const hourLabels = hourStatLabels(category)
  const weekdays = weekdayExtremes(report.weekdayAverages)
  const bestHour = report.bestHours[0]
  const worstHour = report.worstHours[0]
  const showQuietHour =
    worstHour &&
    (report.worstHours.length > 1 ||
      !bestHour ||
      worstHour.hour !== bestHour.hour ||
      worstHour.value !== bestHour.value)

  return {
    summaryLine,
    stats: buildStatsGrid(category, report),
    mostLabel: copy.mostDay,
    most: formatDayRank(best),
    leastLabel: copy.leastDay,
    least: showLeast ? formatDayRank(worst) : null,
    topDays: rankRows(report.bestDays),
    lowDays: showLeast ? rankRows(report.worstDays) : [],
    busiestWeekday: weekdays.busiest,
    quietestWeekday: weekdays.quietest,
    busiestTimeLabel: hourLabels.best,
    busiestTime: formatHourRank(bestHour),
    quietestTimeLabel: hourLabels.worst,
    quietestTime: showQuietHour ? formatHourRank(worstHour) : null,
    dailyRows,
  }
}

export function buildNapTrendBreakdown(nap: NapReportSection): WeeklyTrendBreakdown | null {
  return buildWeeklyTrendBreakdown('nap', {
    totalEvents: nap.count,
    daysTracked: nap.daysTracked,
    avgDisplay: nap.avgDisplay,
    unit: 'count',
    bestDays: nap.bestDays,
    worstDays: nap.worstDays,
    bestHours: nap.bestHours,
    worstHours: nap.worstHours,
    weekdayAverages: nap.weekdayAverages,
    dailyTrend: nap.dailyTrend,
  })
}

export type WeeklyNarrativeBullet = {
  id: string
  text: string
}

export type WeeklyNarrativeOutline = {
  intro: string | null
  bullets: WeeklyNarrativeBullet[]
}

export function buildWeeklyNarrativeOutline(
  report: FullReport,
  babyName: string,
  bounds: WeekBounds,
): WeeklyNarrativeOutline {
  const name = babyName.trim() || 'Your baby'
  const intro = `A quick read on ${name}'s week (${bounds.shortLabel}).`
  const bullets: WeeklyNarrativeBullet[] = []
  const hasTracking =
    report.sleep.totalEvents > 0 ||
    report.diapers.totalEvents > 0 ||
    report.feeding.totalEvents > 0 ||
    report.growth.measurementCount > 0 ||
    report.growth.milestoneCount > 0 ||
    report.health.totalEvents > 0

  if (!hasTracking) {
    return {
      intro,
      bullets: [
        {
          id: 'empty',
          text: 'No sleep, diaper, feeding, growth, milestone, or health logs this week. Add a few entries to unlock trends next time.',
        },
      ],
    }
  }

  if (report.sleep.totalEvents > 0) {
    bullets.push({
      id: 'sleep-total',
      text: `${report.sleep.totalEvents} sleep session${report.sleep.totalEvents === 1 ? '' : 's'} logged · ${report.sleep.avgDisplay} on average`,
    })
  }

  if (report.sleep.napSection && report.sleep.napSection.count > 0) {
    bullets.push({
      id: 'naps-total',
      text: `${report.sleep.napSection.count} nap${report.sleep.napSection.count === 1 ? '' : 's'} · ${report.sleep.napSection.avgDisplay}`,
    })
  }

  if (report.diapers.totalEvents > 0) {
    bullets.push({
      id: 'diapers-total',
      text: `${report.diapers.totalEvents} diaper change${report.diapers.totalEvents === 1 ? '' : 's'} · ${report.diapers.avgDisplay}`,
    })
  }

  if (report.feeding.totalEvents > 0) {
    bullets.push({
      id: 'feeding-total',
      text: `${report.feeding.totalEvents} feeding session${report.feeding.totalEvents === 1 ? '' : 's'} · ${report.feeding.avgDisplay}`,
    })
  }

  if (report.sleep.bestDays[0]) {
    bullets.push({
      id: 'sleep-best',
      text: `Best sleep day: ${report.sleep.bestDays[0].label} (${report.sleep.bestDays[0].displayValue} total)`,
    })
  }

  if (report.sleep.worstDays[0] && report.sleep.daysTracked > 1) {
    const worst = report.sleep.worstDays[0]
    const best = report.sleep.bestDays[0]
    if (!best || worst.date !== best.date) {
      bullets.push({
        id: 'sleep-lightest',
        text: `Lightest sleep day: ${worst.label} (${worst.displayValue} total)`,
      })
    }
  }

  if (report.diapers.bestDays[0]) {
    bullets.push({
      id: 'diapers-most',
      text: `Most diaper changes: ${report.diapers.bestDays[0].label} (${report.diapers.bestDays[0].displayValue})`,
    })
  }

  if (report.diapers.worstDays[0] && report.diapers.daysTracked > 1) {
    const worst = report.diapers.worstDays[0]
    const best = report.diapers.bestDays[0]
    if (!best || worst.date !== best.date) {
      bullets.push({
        id: 'diapers-fewest',
        text: `Fewest diaper changes: ${worst.label} (${worst.displayValue})`,
      })
    }
  }

  if (report.feeding.bestDays[0]) {
    bullets.push({
      id: 'feeding-most',
      text: `Most feedings: ${report.feeding.bestDays[0].label} (${report.feeding.bestDays[0].displayValue})`,
    })
  }

  if (report.feeding.worstDays[0] && report.feeding.daysTracked > 1) {
    const worst = report.feeding.worstDays[0]
    const best = report.feeding.bestDays[0]
    if (!best || worst.date !== best.date) {
      bullets.push({
        id: 'feeding-fewest',
        text: `Fewest feedings: ${worst.label} (${worst.displayValue})`,
      })
    }
  }

  if (report.growth.measurementCount > 0) {
    bullets.push({
      id: 'growth-latest',
      text: `Latest growth: ${report.growth.latestWeightDisplay} · ${report.growth.latestHeightDisplay}`,
    })
    if (report.growth.weightChangeDisplay) {
      bullets.push({
        id: 'growth-change',
        text: report.growth.weightChangeDisplay,
      })
    }
  }

  if (report.growth.milestoneCount > 0) {
    const titles = report.growth.milestones
      .slice(0, 3)
      .map((m) => m.title)
      .join(', ')
    const more =
      report.growth.milestoneCount > 3 ? ` and ${report.growth.milestoneCount - 3} more` : ''
    bullets.push({
      id: 'milestones',
      text: `Milestones celebrated: ${titles}${more}`,
    })
  }

  if (report.health.sicknessCount > 0) {
    bullets.push({
      id: 'health-sickness',
      text: `${report.health.sicknessCount} sickness log${report.health.sicknessCount === 1 ? '' : 's'} this week${
        report.health.ongoingSicknessCount > 0
          ? ` (${report.health.ongoingSicknessCount} still ongoing)`
          : ''
      }.`,
    })
  }

  if (report.health.injuryCount > 0) {
    bullets.push({
      id: 'health-injury',
      text: `${report.health.injuryCount} injur${report.health.injuryCount === 1 ? 'y' : 'ies'} logged this week.`,
    })
  }

  if (report.health.pediatricianCount > 0) {
    bullets.push({
      id: 'health-pediatrician',
      text: `${report.health.pediatricianCount} pediatrician visit${report.health.pediatricianCount === 1 ? '' : 's'} this week${
        report.health.withImmunizationCount > 0
          ? ` (${report.health.withImmunizationCount} with immunizations)`
          : ''
      }.`,
    })
  }

  return { intro, bullets }
}

export function buildWeeklyNarrative(report: FullReport, babyName: string, bounds: WeekBounds): string[] {
  const { intro, bullets } = buildWeeklyNarrativeOutline(report, babyName, bounds)
  return [intro ?? '', ...bullets.map((bullet) => bullet.text)].filter(Boolean)
}

export function formatWeeklySummaryPlainText(
  report: FullReport,
  babyName: string,
  bounds: WeekBounds,
): string {
  const outline = buildWeeklyNarrativeOutline(report, babyName, bounds)
  const highlights = buildWeeklyHighlights(report)
  const growthLines = growthMilestoneSummaryLines(report.growth)
  const healthLines = healthSummaryLines(report.health)

  const blocks = [
    `Baby Pattern — Weekly summary`,
    bounds.label,
    babyName.trim() ? `Baby: ${babyName.trim()}` : '',
    '',
    ...(outline.intro ? [outline.intro] : []),
    ...outline.bullets.map((bullet) => `• ${bullet.text}`),
    '',
    'Highlights',
    ...highlights.map((h) => `- ${h.label}: ${h.value}${h.detail ? ` (${h.detail})` : ''}`),
  ]

  if (growthLines.length > 0) {
    blocks.push('', ...growthLines)
  }

  if (healthLines.length > 0) {
    blocks.push('', 'Health', ...healthLines.map((line) => `- ${line}`))
  }

  return blocks.filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== '')).join('\n')
}
