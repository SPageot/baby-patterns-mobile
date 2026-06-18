import type { GrowthMeasurementDto, MilestoneCategory, MilestoneDto } from '@/types/growth'
import { MILESTONE_CATEGORY_LABELS } from '@/types/growth'
import type { ReportRange } from '@/lib/reportAnalytics'

export type MetricTrendPoint = { key: string; label: string; value: number }

export type GrowthMilestonesReport = {
  measurementCount: number
  milestoneCount: number
  latestWeightDisplay: string
  latestHeightDisplay: string
  latestHeadDisplay: string
  weightChangeDisplay: string | null
  weightTrend: MetricTrendPoint[]
  heightTrend: MetricTrendPoint[]
  headTrend: MetricTrendPoint[]
  categoryCounts: Record<MilestoneCategory, number>
  measurements: GrowthMeasurementDto[]
  milestones: MilestoneDto[]
}

function inRange(iso: string, rangeDays: ReportRange): boolean {
  if (rangeDays === 0) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - rangeDays)
  cutoff.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d >= cutoff
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtNum(v: string | number | null | undefined, suffix: string): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n} ${suffix}`
}

function buildMetricTrend(
  rows: GrowthMeasurementDto[],
  field: 'weightLbs' | 'heightInches' | 'headCircumferenceInches',
): MetricTrendPoint[] {
  return [...rows]
    .filter((r) => {
      const v = r[field]
      if (v == null || v === '') return false
      const n = Number(v)
      return Number.isFinite(n) && n > 0
    })
    .sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : 1))
    .map((r) => ({
      key: r.id,
      label: formatStamp(r.recordedAt),
      value: Number(r[field]),
    }))
}

const EMPTY_COUNTS: Record<MilestoneCategory, number> = {
  motor: 0,
  social: 0,
  language: 0,
  cognitive: 0,
  other: 0,
}

export function buildGrowthMilestonesReport(
  measurements: GrowthMeasurementDto[],
  milestones: MilestoneDto[],
  rangeDays: ReportRange,
): GrowthMilestonesReport {
  const filteredMeasurements = measurements
    .filter((m) => inRange(m.recordedAt, rangeDays))
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))

  const filteredMilestones = milestones
    .filter((m) => inRange(m.achievedAt, rangeDays))
    .sort((a, b) => (a.achievedAt < b.achievedAt ? 1 : -1))

  const weightTrend = buildMetricTrend(filteredMeasurements, 'weightLbs')
  const heightTrend = buildMetricTrend(filteredMeasurements, 'heightInches')
  const headTrend = buildMetricTrend(filteredMeasurements, 'headCircumferenceInches')

  const latestByTime = [...filteredMeasurements].sort((a, b) =>
    a.recordedAt < b.recordedAt ? -1 : 1,
  )
  const latest = latestByTime[latestByTime.length - 1]

  const categoryCounts = { ...EMPTY_COUNTS }
  for (const m of filteredMilestones) {
    categoryCounts[m.category] = (categoryCounts[m.category] ?? 0) + 1
  }

  let weightChangeDisplay: string | null = null
  if (weightTrend.length >= 2) {
    const first = weightTrend[0].value
    const last = weightTrend[weightTrend.length - 1].value
    const delta = Math.round((last - first) * 10) / 10
    weightChangeDisplay =
      delta === 0 ? 'No weight change in period' : `${delta > 0 ? '+' : ''}${delta} lb in period`
  }

  return {
    measurementCount: filteredMeasurements.length,
    milestoneCount: filteredMilestones.length,
    latestWeightDisplay: latest ? fmtNum(latest.weightLbs, 'lb') : '—',
    latestHeightDisplay: latest ? fmtNum(latest.heightInches, 'in') : '—',
    latestHeadDisplay: latest ? fmtNum(latest.headCircumferenceInches, 'in') : '—',
    weightChangeDisplay,
    weightTrend,
    heightTrend,
    headTrend,
    categoryCounts,
    measurements: filteredMeasurements,
    milestones: filteredMilestones,
  }
}

export function growthMilestoneSummaryLines(report: GrowthMilestonesReport): string[] {
  const lines = [
    `Measurements: ${report.measurementCount} · Milestones: ${report.milestoneCount}`,
  ]
  if (report.measurementCount > 0) {
    lines.push(
      `Latest — Weight: ${report.latestWeightDisplay} · Height: ${report.latestHeightDisplay} · Head: ${report.latestHeadDisplay}`,
    )
    if (report.weightChangeDisplay) lines.push(report.weightChangeDisplay)
  }
  const topCategory = (Object.entries(report.categoryCounts) as [MilestoneCategory, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])[0]
  if (topCategory) {
    lines.push(`Most milestones: ${MILESTONE_CATEGORY_LABELS[topCategory[0]]} (${topCategory[1]})`)
  }
  return lines
}
