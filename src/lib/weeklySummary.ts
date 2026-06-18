import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import { buildFullReport, parseSleepInterval, type FullReport } from '@/lib/reportAnalytics'
import { growthMilestoneSummaryLines } from '@/lib/growthReportAnalytics'

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

export function buildWeeklyReport(
  logs: LogRecord[],
  measurements: GrowthMeasurementDto[],
  milestones: MilestoneDto[],
  bounds: WeekBounds,
) {
  const weekLogs = filterLogsForWeek(logs, bounds)
  const growth = filterGrowthForWeek(measurements, milestones, bounds)
  const report = buildFullReport(weekLogs, 0, growth)
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
  return [
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
  ]
}

export function buildWeeklyNarrative(report: FullReport, babyName: string, bounds: WeekBounds): string[] {
  const name = babyName.trim() || 'Your baby'
  const lines: string[] = []
  const hasTracking =
    report.sleep.totalEvents > 0 ||
    report.diapers.totalEvents > 0 ||
    report.feeding.totalEvents > 0 ||
    report.growth.measurementCount > 0 ||
    report.growth.milestoneCount > 0

  lines.push(`Here is ${name}'s weekly summary for ${bounds.shortLabel}.`)

  if (!hasTracking) {
    lines.push(
      'No sleep, diaper, feeding, growth, or milestone logs were recorded this week. Log a few entries to unlock trends next time.',
    )
    return lines
  }

  const parts: string[] = []
  if (report.sleep.totalEvents > 0) {
    parts.push(
      `${report.sleep.totalEvents} sleep session${report.sleep.totalEvents === 1 ? '' : 's'} (${report.sleep.avgDisplay})`,
    )
  }
  if (report.sleep.napSection && report.sleep.napSection.count > 0) {
    parts.push(
      `${report.sleep.napSection.count} nap${report.sleep.napSection.count === 1 ? '' : 's'} (${report.sleep.napSection.avgDisplay})`,
    )
  }
  if (report.diapers.totalEvents > 0) {
    parts.push(
      `${report.diapers.totalEvents} diaper change${report.diapers.totalEvents === 1 ? '' : 's'} (${report.diapers.avgDisplay})`,
    )
  }
  if (report.feeding.totalEvents > 0) {
    parts.push(
      `${report.feeding.totalEvents} feeding session${report.feeding.totalEvents === 1 ? '' : 's'} (${report.feeding.avgDisplay})`,
    )
  }

  if (parts.length > 0) {
    lines.push(`This week you logged ${parts.join(', ')}.`)
  }

  if (report.sleep.bestDays[0]) {
    lines.push(
      `Best sleep day: ${report.sleep.bestDays[0].label} with ${report.sleep.bestDays[0].displayValue} total.`,
    )
  }

  if (report.growth.measurementCount > 0) {
    lines.push(
      `Growth: latest weight ${report.growth.latestWeightDisplay}, height ${report.growth.latestHeightDisplay}.`,
    )
    if (report.growth.weightChangeDisplay) {
      lines.push(report.growth.weightChangeDisplay)
    }
  }

  if (report.growth.milestoneCount > 0) {
    const titles = report.growth.milestones
      .slice(0, 3)
      .map((m) => m.title)
      .join(', ')
    const more = report.growth.milestoneCount > 3 ? ` and ${report.growth.milestoneCount - 3} more` : ''
    lines.push(`Milestones celebrated: ${titles}${more}.`)
  }

  return lines
}

export function formatWeeklySummaryPlainText(
  report: FullReport,
  babyName: string,
  bounds: WeekBounds,
): string {
  const narrative = buildWeeklyNarrative(report, babyName, bounds)
  const highlights = buildWeeklyHighlights(report)
  const growthLines = growthMilestoneSummaryLines(report.growth)

  const blocks = [
    'Baby Patterns — Weekly summary',
    bounds.label,
    babyName.trim() ? `Baby: ${babyName.trim()}` : '',
    '',
    ...narrative,
    '',
    'Highlights',
    ...highlights.map((h) => `- ${h.label}: ${h.value}${h.detail ? ` (${h.detail})` : ''}`),
  ]

  if (growthLines.length > 0) {
    blocks.push('', ...growthLines)
  }

  return blocks.filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== '')).join('\n')
}
