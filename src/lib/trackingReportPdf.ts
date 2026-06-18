import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import type { Baby } from '@/schemas/user'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import { MILESTONE_CATEGORY_LABELS } from '@/types/growth'
import type { LogRecord } from '@/types/babyLog'
import { buildFullReport, type KindReport, type ReportRange } from '@/lib/reportAnalytics'
import { growthMilestoneSummaryLines } from '@/lib/growthReportAnalytics'
import { formatDiaperContents, getDiaperLogMeta } from '@/lib/diaperFeedUtils'
import { feedingTypeLabel, formatFeedingWhen } from '@/lib/feedingLogUtils'
import { formatSleepDurationDisplay, formatSleepUtcStamp } from '@/lib/sleepLogUtils'
import { formatWhen } from '@/lib/trackUtils'
import { sharePdfDocument } from '@/lib/sharePdfDocument'

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

export type TrackingReportPdfOptions = {
  logs: LogRecord[]
  measurements?: GrowthMeasurementDto[]
  milestones?: MilestoneDto[]
  babies: Baby[]
  parentName: string
  includeAnalysis?: boolean
  rangeDays?: ReportRange
}

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

function diaperDetails(log: LogRecord): string {
  const meta = getDiaperLogMeta(log.details)
    .map((item) => `${item.label}: ${item.value}`)
    .join('; ')
  return meta || '—'
}

function diaperWhen(log: LogRecord): string {
  const raw = log.details.time?.trim() || log.atIso
  return formatWhen(raw)
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

function fmtGrowthNum(v: string | number | null | undefined, suffix: string): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n} ${suffix}`
}

function growthMeasurementRow(row: GrowthMeasurementDto, babies: Baby[]): string[] {
  const baby = babies.find((b) => b.id === row.babyId)
  const when = formatWhen(row.recordedAt)
  return [
    when,
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

function addGrowthAnalysisBlock(doc: jsPDF, startY: number, lines: string[]): number {
  let y = ensurePage(doc, startY, 40)
  y = addSectionTitle(doc, 'Growth & milestones — Analysis', y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(70, 66, 80)
  for (const line of lines) {
    y = ensurePage(doc, y, 8)
    doc.text(line, 14, y)
    y += 6
  }
  return y + 4
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

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(40, 40, 48)
  doc.text(title, 14, y)
  return y + 6
}

function ensurePage(doc: jsPDF, y: number, needed = 40): number {
  if (y > 280 - needed) {
    doc.addPage()
    return 18
  }
  return y
}

function addAnalysisBlock(doc: jsPDF, report: KindReport, startY: number): number {
  let y = ensurePage(doc, startY, 80)
  y = addSectionTitle(doc, `${report.title} — Analysis`, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(70, 66, 80)

  const lines = [
    `Total logs: ${report.totalEvents} · Active days: ${report.daysTracked} · Average: ${report.avgDisplay}`,
  ]

  const dayLabel = report.kind === 'sleep' ? 'sleep' : 'activity'
  if (report.bestDays[0]) {
    lines.push(`Most ${dayLabel}: ${report.bestDays[0].label} (${report.bestDays[0].displayValue})`)
  }
  if (report.worstDays[0]) {
    lines.push(`Least ${dayLabel}: ${report.worstDays[0].label} (${report.worstDays[0].displayValue})`)
  }
  if (report.bestHours[0]) {
    const bestLabel = report.kind === 'sleep' ? 'Longest nap at' : 'Busiest time'
    lines.push(`${bestLabel}: ${report.bestHours[0].label} (${report.bestHours[0].displayValue})`)
  }
  if (report.worstHours[0]) {
    const worstLabel = report.kind === 'sleep' ? 'Shortest nap at' : 'Quietest time'
    lines.push(`${worstLabel}: ${report.worstHours[0].label} (${report.worstHours[0].displayValue})`)
  }

  for (const line of lines) {
    y = ensurePage(doc, y, 8)
    doc.text(line, 14, y)
    y += 6
  }

  const hourBestTitle =
    report.kind === 'sleep' ? 'Longest naps (fall-asleep time)' : 'Busiest times of day'
  const hourWorstTitle =
    report.kind === 'sleep' ? 'Shortest naps (fall-asleep time)' : 'Quietest times of day'

  const rankSections = [
    { title: `Top days (${dayLabel})`, rows: report.bestDays },
    { title: `Lowest days (${dayLabel})`, rows: report.worstDays },
    { title: hourBestTitle, rows: report.bestHours },
    { title: hourWorstTitle, rows: report.worstHours },
  ]

  for (const section of rankSections) {
    if (section.rows.length === 0) continue
    y = ensurePage(doc, y, 24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(section.title, 14, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    for (const row of section.rows) {
      y = ensurePage(doc, y, 6)
      doc.text(`• ${row.label}: ${row.displayValue}`, 18, y)
      y += 5
    }
    y += 3
  }

  return y + 4
}

export async function downloadTrackingReportPdf({
  logs,
  measurements = [],
  milestones = [],
  babies,
  parentName,
  includeAnalysis = false,
  rangeDays = 0,
}: TrackingReportPdfOptions): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generated = new Date().toLocaleString()
  const diapers = sortNewestFirst(logs.filter((l) => l.kind === 'diaper'))
  const sleepLogs = sortNewestFirst(logs.filter((l) => l.kind === 'sleep'))
  const feedingLogs = sortNewestFirst(logs.filter((l) => l.kind === 'feeding'))
  const analysis = includeAnalysis
    ? buildFullReport(logs, rangeDays, { measurements, milestones })
    : null

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(47, 42, 56)
  doc.text('Baby Patterns — Tracking Report', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 84, 100)
  doc.text(`Prepared for ${parentName}`, 14, 26)
  doc.text(`Generated ${generated}`, 14, 32)

  const babyNames = babies.map((b) => b.fullName?.trim()).filter(Boolean).join(', ')
  if (babyNames) {
    doc.text(`Babies: ${babyNames}`, 14, 38)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(47, 42, 56)
  doc.text(
    `Summary — ${diapers.length} diaper changes · ${sleepLogs.length} sleep logs · ${feedingLogs.length} feedings · ${analysis?.growth.measurementCount ?? measurements.length} growth measurements · ${analysis?.growth.milestoneCount ?? milestones.length} milestones`,
    14,
    46,
  )

  let startY = 54

  if (analysis) {
    startY = addSectionTitle(doc, 'Insights summary', startY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(90, 84, 100)
    doc.text('Best and worst days and times across all recorded data.', 14, startY)
    startY += 10

    startY = addAnalysisBlock(doc, analysis.sleep, startY)
    startY = addAnalysisBlock(doc, analysis.diapers, startY)
    startY = addAnalysisBlock(doc, analysis.feeding, startY)
    startY = addGrowthAnalysisBlock(doc, startY, growthMilestoneSummaryLines(analysis.growth))
    doc.addPage()
    startY = 18
  }

  const growthRows = analysis?.growth.measurements ?? measurements
  const milestoneRows = analysis?.growth.milestones ?? milestones

  startY = addSectionTitle(doc, 'Diapers', startY)

  if (diapers.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 116, 130)
    doc.text('No diaper logs recorded.', 14, startY + 4)
    startY += 12
  } else {
    autoTable(doc, {
      startY,
      head: [['When', 'Baby', 'Contents', 'Details']],
      body: diapers.map((log) => [
        diaperWhen(log),
        babyNameForLog(log, babies),
        formatDiaperContents(log.details),
        diaperDetails(log),
      ]),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [199, 160, 140], textColor: [20, 15, 16] },
      margin: { left: 14, right: 14 },
    })
    startY = (doc as PdfWithTable).lastAutoTable?.finalY ?? startY
    startY += 10
  }

  startY = addSectionTitle(doc, 'Sleep', startY)

  if (sleepLogs.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 116, 130)
    doc.text('No sleep logs recorded.', 14, startY + 4)
    startY += 12
  } else {
    autoTable(doc, {
      startY,
      head: [['Date', 'Baby', 'Start (UTC)', 'End (UTC)', 'Duration', 'Type', 'Mood', 'Environment']],
      body: sleepLogs.map((log) => sleepRow(log, babies)),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [122, 159, 212], textColor: [20, 22, 40] },
      margin: { left: 14, right: 14 },
    })
    startY = (doc as PdfWithTable).lastAutoTable?.finalY ?? startY
    startY += 10
  }

  startY = addSectionTitle(doc, 'Feeding', startY)

  if (feedingLogs.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 116, 130)
    doc.text('No feeding logs recorded.', 14, startY + 4)
  } else {
    autoTable(doc, {
      startY,
      head: [['When', 'Baby', 'Type', 'Amount', 'Duration', 'Notes']],
      body: feedingLogs.map((log) => feedingRow(log, babies)),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [90, 154, 114], textColor: [16, 32, 24] },
      margin: { left: 14, right: 14 },
    })
    startY = (doc as PdfWithTable).lastAutoTable?.finalY ?? startY
    startY += 10
  }

  startY = ensurePage(doc, startY, 40)
  startY = addSectionTitle(doc, 'Growth measurements', startY)

  if (growthRows.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 116, 130)
    doc.text('No growth measurements recorded.', 14, startY + 4)
    startY += 12
  } else {
    autoTable(doc, {
      startY,
      head: [['When', 'Baby', 'Weight', 'Height', 'Head', 'Notes']],
      body: growthRows.map((row) => growthMeasurementRow(row, babies)),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [124, 92, 196], textColor: [24, 16, 40] },
      margin: { left: 14, right: 14 },
    })
    startY = (doc as PdfWithTable).lastAutoTable?.finalY ?? startY
    startY += 10
  }

  startY = ensurePage(doc, startY, 40)
  startY = addSectionTitle(doc, 'Milestones', startY)

  if (milestoneRows.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 116, 130)
    doc.text('No milestones recorded.', 14, startY + 4)
  } else {
    autoTable(doc, {
      startY,
      head: [['When', 'Baby', 'Milestone', 'Category', 'Notes']],
      body: milestoneRows.map((row) => milestoneRow(row, babies)),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [196, 122, 92], textColor: [40, 24, 16] },
      margin: { left: 14, right: 14 },
    })
  }

  const stamp = new Date().toISOString().slice(0, 10)
  await sharePdfDocument(doc, `baby-patterns-tracking-${stamp}.pdf`)
}
