import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Baby } from '@/schemas/user'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import { MILESTONE_CATEGORY_LABELS } from '@/types/growth'
import type { LogRecord } from '@/types/babyLog'
import {
  buildFullReport,
  filterLogsForKindReport,
  formatReportMinutes,
  reportRangeLabel,
  type FullReport,
  type KindReport,
  type ReportRange,
} from '@/lib/reportAnalytics'
import type { GrowthMilestonesReport } from '@/lib/growthReportAnalytics'
import { growthMilestoneSummaryLines } from '@/lib/growthReportAnalytics'
import type { HealthEventsReport } from '@/lib/healthReportAnalytics'
import {
  formatInjuryCareSummary,
  formatInjuryRowSummary,
  formatSicknessCareSummary,
  healthSummaryLines,
} from '@/lib/healthReportAnalytics'
import { formatHealthDuration } from '@/types/health'
import { formatDiaperContents, getDiaperLogMeta } from '@/lib/diaperFeedUtils'
import { feedingTypeLabel, formatFeedingWhen } from '@/lib/feedingLogUtils'
import { formatSleepDurationDisplay, formatSleepUtcStamp } from '@/lib/sleepLogUtils'
import { formatWhen } from '@/lib/trackUtils'
import { sharePdfDocument } from '@/lib/sharePdfDocument'
import {
  drawMetricTrendChart,
  drawMilestoneCategoryBars,
  drawStatRow,
  drawTrendLineChart,
  drawVerticalBarChart,
  drawWeekdayBarChart,
  formatChartValue,
  PDF_GROWTH_COLORS,
  PDF_KIND_COLORS,
} from '@/lib/pdfChartDrawing'

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

type ReportOptions = {
  logs: LogRecord[]
  measurements?: GrowthMeasurementDto[]
  milestones?: MilestoneDto[]
  sickness?: SicknessEventDto[]
  injuries?: InjuryEventDto[]
  babies: Baby[]
  parentName: string
  includeAnalysis?: boolean
  rangeDays?: ReportRange
}

const PDF_HEALTH_COLOR: [number, number, number] = [196, 92, 122]

const MARGIN = 14
const PAGE_W = 210
const CONTENT_W = PAGE_W - MARGIN * 2
const BRAND: [number, number, number] = [124, 92, 196]
const FOOTER_Y = 287

function babyNameForLog(log: LogRecord, babies: Baby[]): string {
  const id = log.details.babyId?.trim()
  if (id) {
    const match = babies.find((b) => b.id === id)
    if (match?.fullName?.trim()) return match.fullName.trim()
  }
  return log.details.babyName?.trim() || 'Baby'
}

function sortNewestFirst(logs: LogRecord[]): LogRecord[] {
  return [...logs].sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

function ensurePage(doc: jsPDF, y: number, needed = 40): number {
  if (y > FOOTER_Y - needed) {
    doc.addPage()
    addPageFooter(doc)
    return 22
  }
  return y
}

function addPageFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 146, 162)
    doc.text('Baby Patterns — Pediatric Care Report', MARGIN, FOOTER_Y)
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' })
  }
}

function addCoverHeader(
  doc: jsPDF,
  parentName: string,
  generated: string,
  babyNames: string,
  rangeLabel: string,
): number {
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PAGE_W, 36, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text('Baby Patterns', MARGIN, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Pediatric Tracking Report', MARGIN, 24)

  let y = 48
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(47, 42, 56)
  doc.text('Care Summary & Pattern Analysis', MARGIN, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 84, 100)
  doc.text(`Prepared for ${parentName}`, MARGIN, y)
  y += 6
  doc.text(`Reporting period: ${rangeLabel}`, MARGIN, y)
  y += 6
  doc.text(`Generated ${generated}`, MARGIN, y)
  y += 6
  if (babyNames) doc.text(`Babies: ${babyNames}`, MARGIN, y)
  y += 10

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(120, 116, 130)
  const disclaimer =
    'This report summarizes caregiver-entered data for informational purposes. It is not a medical diagnosis. Share with your pediatrician as a supplement to clinical assessment.'
  const lines = doc.splitTextToSize(disclaimer, CONTENT_W)
  doc.text(lines, MARGIN, y)
  return y + lines.length * 4.5 + 6
}

function addSectionTitle(doc: jsPDF, title: string, subtitle: string | undefined, y: number): number {
  y = ensurePage(doc, y, 24)
  doc.setFillColor(...BRAND)
  doc.rect(MARGIN, y - 4, 3, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(47, 42, 56)
  doc.text(title, MARGIN + 6, y + 2)
  y += 8
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 116, 130)
    const subLines = doc.splitTextToSize(subtitle, CONTENT_W)
    doc.text(subLines, MARGIN, y)
    y += subLines.length * 4 + 2
  }
  return y + 2
}

function kindNarrative(report: KindReport): string[] {
  if (report.totalEvents === 0) return ['No logs recorded in this reporting period.']

  const noun =
    report.kind === 'sleep' ? 'sleep sessions' : report.kind === 'feeding' ? 'feeds' : 'diaper changes'
  const lines = [
    `Recorded ${report.totalEvents} ${noun} across ${report.daysTracked} active days (${report.avgDisplay}).`,
  ]

  if (report.bestDays[0]) {
    lines.push(`Highest day: ${report.bestDays[0].label} (${report.bestDays[0].displayValue}).`)
  }
  if (report.worstDays[0] && report.worstDays[0].value < report.bestDays[0]?.value) {
    lines.push(`Lowest day: ${report.worstDays[0].label} (${report.worstDays[0].displayValue}).`)
  }

  const weekdayPeak = [...report.weekdayAverages].sort((a, b) => b.value - a.value)[0]
  if (weekdayPeak && weekdayPeak.value > 0) {
    lines.push(`Strongest weekday pattern: ${weekdayPeak.label} (${weekdayPeak.displayValue} average).`)
  }

  return lines
}

function addNarrativeBlock(doc: jsPDF, lines: string[], y: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(70, 66, 80)
  for (const line of lines) {
    y = ensurePage(doc, y, 8)
    const wrapped = doc.splitTextToSize(line, CONTENT_W)
    doc.text(wrapped, MARGIN, y)
    y += wrapped.length * 4.5 + 1
  }
  return y + 4
}

function addRankTable(
  doc: jsPDF,
  title: string,
  rows: { label: string; displayValue: string }[],
  y: number,
  headColor: [number, number, number],
): number {
  if (rows.length === 0) return y
  y = ensurePage(doc, y, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(47, 42, 56)
  doc.text(title, MARGIN, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Period', 'Value']],
    body: rows.map((row, i) => [String(i + 1), row.label, row.displayValue]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: headColor, textColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 14 }, 2: { halign: 'right' } },
    margin: { left: MARGIN, right: MARGIN },
    theme: 'striped',
  })
  return (doc as PdfWithTable).lastAutoTable?.finalY ?? y + 10
}

function addKindAnalysisSection(doc: jsPDF, report: KindReport, y: number): number {
  const color = PDF_KIND_COLORS[report.kind]
  const hourlyTitle =
    report.kind === 'sleep' ? 'Sleep by fall-asleep time (UTC)' : 'Activity by time of day'

  y = addSectionTitle(doc, report.title, kindNarrative(report).join(' '), y)
  y += 2

  if (report.totalEvents === 0) {
    return addNarrativeBlock(doc, ['No data to chart in this period.'], y)
  }

  y = drawStatRow(
    doc,
    MARGIN,
    y,
    CONTENT_W,
    [
      { label: 'Total logs', value: String(report.totalEvents) },
      { label: 'Active days', value: String(report.daysTracked) },
      { label: 'Daily average', value: report.avgDisplay },
    ],
    color,
  )
  y += 6

  y = ensurePage(doc, y, 52)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(47, 42, 56)
  doc.text('Daily trend', MARGIN, y)
  y += 3
  y = drawTrendLineChart(
    doc,
    MARGIN,
    y,
    CONTENT_W,
    42,
    report.dailyTrend,
    color,
    (v) => formatChartValue(report, v),
  )
  y += 5

  const halfW = (CONTENT_W - 4) / 2
  y = ensurePage(doc, y, 52)
  doc.text(hourlyTitle, MARGIN, y)
  doc.text('Weekday averages', MARGIN + halfW + 4, y)
  y += 3
  const chartBottom = Math.max(
    drawVerticalBarChart(
      doc,
      MARGIN,
      y,
      halfW,
      40,
      report.hourlyDistribution.map((h) => ({ label: h.label, value: h.value })),
      color,
      report.kind === 'sleep' ? 4 : 3,
    ),
    drawWeekdayBarChart(
      doc,
      MARGIN + halfW + 4,
      y,
      halfW,
      40,
      report.weekdayAverages,
      color,
      (v) => formatChartValue(report, v),
    ),
  )
  y = chartBottom + 6

  const dayUnit = report.kind === 'sleep' ? 'sleep' : 'activity'
  y = addRankTable(doc, `Top days (${dayUnit})`, report.bestDays, y, color)
  y += 4
  y = addRankTable(doc, `Lowest days (${dayUnit})`, report.worstDays, y, color)
  y += 8

  if (report.kind === 'sleep' && report.napSection && report.napSection.count > 0) {
    const nap = report.napSection
    y = addSectionTitle(
      doc,
      'Nap analysis',
      `${nap.count} nap sessions across ${nap.daysTracked} days · ${nap.avgDisplay}`,
      y,
    )
    y += 2
    y = drawTrendLineChart(
      doc,
      MARGIN,
      y,
      CONTENT_W,
      36,
      nap.dailyTrend,
      color,
      (v) => formatReportMinutes(v),
    )
    y += 8
  }

  return y
}

function addExecutiveSummary(doc: jsPDF, analysis: FullReport, y: number): number {
  y = addSectionTitle(
    doc,
    'Executive summary',
    'At-a-glance metrics across all tracking categories for the selected period.',
    y,
  )
  y += 2

  const { sleep, diapers, feeding, growth, health } = analysis
  const summaryRows = [
    ['Sleep', `${sleep.totalEvents} sessions`, sleep.avgDisplay, sleep.bestDays[0]?.label ?? '—'],
    ['Diapers', `${diapers.totalEvents} changes`, diapers.avgDisplay, diapers.bestDays[0]?.label ?? '—'],
    ['Feeding', `${feeding.totalEvents} feeds`, feeding.avgDisplay, feeding.bestDays[0]?.label ?? '—'],
    [
      'Growth',
      `${growth.measurementCount} measurements`,
      growth.latestWeightDisplay,
      growth.weightChangeDisplay ?? '—',
    ],
    ['Milestones', `${growth.milestoneCount} recorded`, '—', '—'],
    [
      'Health',
      `${health.sicknessCount} sickness · ${health.injuryCount} injuries`,
      health.totalEvents > 0 ? `${health.withDoctorCount} doctor visits` : '—',
      health.ongoingSicknessCount + health.ongoingInjuryCount > 0
        ? `${health.ongoingSicknessCount + health.ongoingInjuryCount} ongoing`
        : '—',
    ],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Volume', 'Key metric', 'Highlight']],
    body: summaryRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255] },
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
  })

  return ((doc as PdfWithTable).lastAutoTable?.finalY ?? y) + 10
}

function addGrowthSection(doc: jsPDF, growth: GrowthMilestonesReport, y: number): number {
  y = addSectionTitle(
    doc,
    'Growth & milestones',
    growthMilestoneSummaryLines(growth).join(' '),
    y,
  )
  y += 2

  if (growth.measurementCount === 0 && growth.milestoneCount === 0) {
    return addNarrativeBlock(doc, ['No growth or milestone data in this period.'], y)
  }

  y = drawStatRow(
    doc,
    MARGIN,
    y,
    CONTENT_W,
    [
      { label: 'Measurements', value: String(growth.measurementCount) },
      { label: 'Milestones', value: String(growth.milestoneCount) },
      { label: 'Latest weight', value: growth.latestWeightDisplay },
      { label: 'Latest height', value: growth.latestHeightDisplay },
    ],
    PDF_GROWTH_COLORS.weight,
  )
  y += 6

  if (growth.weightTrend.length > 0) {
    y = ensurePage(doc, y, 48)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Weight trend (lb)', MARGIN, y)
    y += 3
    y = drawMetricTrendChart(doc, MARGIN, y, CONTENT_W, 38, growth.weightTrend, PDF_GROWTH_COLORS.weight, 'lb')
    y += 5
  }

  const halfW = (CONTENT_W - 4) / 2
  if (growth.heightTrend.length > 0 || growth.headTrend.length > 0) {
    y = ensurePage(doc, y, 48)
    if (growth.heightTrend.length > 0) {
      doc.text('Height trend (in)', MARGIN, y)
      drawMetricTrendChart(doc, MARGIN, y + 3, halfW, 36, growth.heightTrend, PDF_GROWTH_COLORS.height, 'in')
    }
    if (growth.headTrend.length > 0) {
      doc.text('Head circumference (in)', MARGIN + halfW + 4, y)
      drawMetricTrendChart(
        doc,
        MARGIN + halfW + 4,
        y + 3,
        halfW,
        36,
        growth.headTrend,
        PDF_GROWTH_COLORS.head,
        'in',
      )
    }
    y += 44
  }

  if (growth.milestoneCount > 0) {
    y = ensurePage(doc, y, 30)
    doc.text('Milestones by category', MARGIN, y)
    y += 3
    const categories = (Object.keys(MILESTONE_CATEGORY_LABELS) as Array<keyof typeof MILESTONE_CATEGORY_LABELS>).map(
      (cat) => ({
        label: MILESTONE_CATEGORY_LABELS[cat],
        count: growth.categoryCounts[cat],
      }),
    )
    y = drawMilestoneCategoryBars(doc, MARGIN, y, CONTENT_W, categories, PDF_GROWTH_COLORS.milestone)
    y += 6
  }

  return y
}

function addHealthSection(doc: jsPDF, health: HealthEventsReport, y: number): number {
  y = addSectionTitle(doc, 'Health events', healthSummaryLines(health).join(' '), y)
  y += 2

  if (health.totalEvents === 0) {
    return addNarrativeBlock(doc, ['No sickness or injury data in this period.'], y)
  }

  y = drawStatRow(
    doc,
    MARGIN,
    y,
    CONTENT_W,
    [
      { label: 'Sickness logs', value: String(health.sicknessCount) },
      { label: 'Injuries', value: String(health.injuryCount) },
      { label: 'Ongoing', value: String(health.ongoingSicknessCount + health.ongoingInjuryCount) },
      { label: 'Doctor care', value: String(health.withDoctorCount) },
    ],
    PDF_HEALTH_COLOR,
  )

  return y + 8
}

function sicknessRow(row: SicknessEventDto, babies: Baby[]): string[] {
  const baby = babies.find((b) => b.id === row.babyId)
  return [
    formatWhen(row.startedAt),
    baby?.fullName?.trim() || 'Baby',
    row.sicknessType,
    formatHealthDuration(row.startedAt, row.endedAt),
    row.temperatureF ? `${row.temperatureF}°F` : '—',
    row.symptoms.length > 0 ? row.symptoms.join(', ') : '—',
    formatSicknessCareSummary(row),
    row.notes?.trim() || '—',
  ]
}

function injuryRow(row: InjuryEventDto, babies: Baby[]): string[] {
  const baby = babies.find((b) => b.id === row.babyId)
  return [
    formatWhen(row.occurredAt),
    baby?.fullName?.trim() || 'Baby',
    row.description,
    formatInjuryRowSummary(row),
    row.hasSwelling ? 'Yes' : 'No',
    formatInjuryCareSummary(row),
    row.notes?.trim() || '—',
  ]
}

function diaperDetails(log: LogRecord): string {
  const meta = getDiaperLogMeta(log.details)
    .map((item) => `${item.label}: ${item.value}`)
    .join('; ')
  return meta || '—'
}

function diaperWhen(log: LogRecord): string {
  return formatWhen(log.details.time?.trim() || log.atIso)
}

function sleepRow(log: LogRecord, babies: Baby[]): string[] {
  const startIso = log.details.sleepStartTime || log.details.start || log.atIso
  const endIso = log.details.sleepEndTime || log.details.end || ''
  const start = formatSleepUtcStamp(startIso)
  const end = endIso ? formatSleepUtcStamp(endIso) : { date: '—', time: '' }
  const date = log.details.sleepDate?.slice(0, 10) || start.date
  return [
    date,
    babyNameForLog(log, babies),
    `${start.date} ${start.time}`.trim(),
    endIso ? `${end.date} ${end.time}`.trim() : '—',
    formatSleepDurationDisplay(log),
    log.details.isNap === 'true' ? 'Nap' : '—',
    log.details.sleepMood?.trim() || '—',
    log.details.sleepEnvironment?.trim() || '—',
  ]
}

function feedingRow(log: LogRecord, babies: Baby[]): string[] {
  const d = log.details
  return [
    formatFeedingWhen(log),
    babyNameForLog(log, babies),
    feedingTypeLabel(d.feedingType ?? ''),
    d.amountOz?.trim() ? `${d.amountOz.trim()} oz` : '—',
    d.durationMin?.trim() ? `${d.durationMin.trim()} min` : '—',
    d.notes?.trim() || '—',
  ]
}

function fmtGrowthNum(v: string | number | null | undefined, suffix: string): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n} ${suffix}`
}

function growthMeasurementRow(row: GrowthMeasurementDto, babies: Baby[]): string[] {
  const baby = babies.find((b) => b.id === row.babyId)
  return [
    formatWhen(row.recordedAt),
    baby?.fullName?.trim() || 'Baby',
    fmtGrowthNum(row.weightLbs, 'lb'),
    fmtGrowthNum(row.heightInches, 'in'),
    fmtGrowthNum(row.headCircumferenceInches, 'in'),
    row.notes?.trim() || '—',
  ]
}

function milestoneRow(row: MilestoneDto, babies: Baby[]): string[] {
  const baby = babies.find((b) => b.id === row.babyId)
  return [
    formatWhen(row.achievedAt),
    baby?.fullName?.trim() || 'Baby',
    row.title,
    MILESTONE_CATEGORY_LABELS[row.category],
    row.notes?.trim() || '—',
  ]
}

function addAppendixSection(
  doc: jsPDF,
  title: string,
  y: number,
  head: string[][],
  body: string[][],
  headColor: [number, number, number],
  emptyMessage: string,
): number {
  y = ensurePage(doc, y, 30)
  y = addSectionTitle(doc, title, 'Detailed log records for the reporting period.', y)

  if (body.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 116, 130)
    doc.text(emptyMessage, MARGIN, y)
    return y + 10
  }

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: headColor, textColor: [255, 255, 255] },
    margin: { left: MARGIN, right: MARGIN },
    theme: 'striped',
  })
  return ((doc as PdfWithTable).lastAutoTable?.finalY ?? y) + 10
}

export async function downloadTrackingReportPdf({
  logs,
  measurements = [],
  milestones = [],
  sickness = [],
  injuries = [],
  babies,
  parentName,
  includeAnalysis = false,
  rangeDays = 0,
}: ReportOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generated = new Date().toLocaleString()
  const rangeLabel = reportRangeLabel(rangeDays)
  const babyNames = babies.map((b) => b.fullName?.trim()).filter(Boolean).join(', ')

  const analysis = includeAnalysis
    ? buildFullReport(logs, rangeDays, { measurements, milestones, sickness, injuries })
    : null

  const diapers = sortNewestFirst(filterLogsForKindReport(logs, 'diaper', rangeDays))
  const sleepLogs = sortNewestFirst(filterLogsForKindReport(logs, 'sleep', rangeDays))
  const feedingLogs = sortNewestFirst(filterLogsForKindReport(logs, 'feeding', rangeDays))
  const growthRows = analysis?.growth.measurements ?? measurements
  const milestoneRows = analysis?.growth.milestones ?? milestones
  const sicknessRows = analysis?.health.sickness ?? sickness
  const injuryRows = analysis?.health.injuries ?? injuries

  let y = addCoverHeader(doc, parentName, generated, babyNames, rangeLabel)

  if (analysis) {
    y = addExecutiveSummary(doc, analysis, y)
    doc.addPage()
    addPageFooter(doc)
    y = 22

    y = addKindAnalysisSection(doc, analysis.sleep, y)
    y += 4
    y = addKindAnalysisSection(doc, analysis.feeding, y)
    y += 4
    y = addKindAnalysisSection(doc, analysis.diapers, y)
    y += 4
    y = addGrowthSection(doc, analysis.growth, y)
    y += 4
    y = addHealthSection(doc, analysis.health, y)

    doc.addPage()
    addPageFooter(doc)
    y = 22
    y = addSectionTitle(doc, 'Appendix — Detailed records', 'Chronological log data referenced in this report.', y)
    y += 4
  }

  y = addAppendixSection(
    doc,
    'Diapers',
    y,
    [['When', 'Baby', 'Contents', 'Details']],
    diapers.map((log) => [
      diaperWhen(log),
      babyNameForLog(log, babies),
      formatDiaperContents(log.details),
      diaperDetails(log),
    ]),
    PDF_KIND_COLORS.diaper,
    'No diaper logs in this period.',
  )

  y = addAppendixSection(
    doc,
    'Sleep',
    y,
    [['Date', 'Baby', 'Start (UTC)', 'End (UTC)', 'Duration', 'Type', 'Mood', 'Environment']],
    sleepLogs.map((log) => sleepRow(log, babies)),
    PDF_KIND_COLORS.sleep,
    'No sleep logs in this period.',
  )

  y = addAppendixSection(
    doc,
    'Feeding',
    y,
    [['When', 'Baby', 'Type', 'Amount', 'Duration', 'Notes']],
    feedingLogs.map((log) => feedingRow(log, babies)),
    PDF_KIND_COLORS.feeding,
    'No feeding logs in this period.',
  )

  y = addAppendixSection(
    doc,
    'Growth measurements',
    y,
    [['When', 'Baby', 'Weight', 'Height', 'Head', 'Notes']],
    growthRows.map((row) => growthMeasurementRow(row, babies)),
    PDF_GROWTH_COLORS.weight,
    'No growth measurements in this period.',
  )

  addAppendixSection(
    doc,
    'Milestones',
    y,
    [['When', 'Baby', 'Milestone', 'Category', 'Notes']],
    milestoneRows.map((row) => milestoneRow(row, babies)),
    PDF_GROWTH_COLORS.milestone,
    'No milestones in this period.',
  )

  y = addAppendixSection(
    doc,
    'Sickness logs',
    y,
    [['Started', 'Baby', 'Type', 'Duration', 'Temp', 'Symptoms', 'Care', 'Notes']],
    sicknessRows.map((row) => sicknessRow(row, babies)),
    PDF_HEALTH_COLOR,
    'No sickness logs in this period.',
  )

  addAppendixSection(
    doc,
    'Injuries',
    y,
    [['When', 'Baby', 'Description', 'Details', 'Swelling', 'Care', 'Notes']],
    injuryRows.map((row) => injuryRow(row, babies)),
    PDF_HEALTH_COLOR,
    'No injuries in this period.',
  )

  addPageFooter(doc)

  const stamp = new Date().toISOString().slice(0, 10)
  await sharePdfDocument(doc, `baby-patterns-report-${stamp}.pdf`)
}
