import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Baby } from '@/schemas/user'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { MILESTONE_CATEGORY_LABELS } from '@/types/growth'
import type { LogRecord } from '@/types/babyLog'
import type { ReportRange } from './reportAnalytics'
import { buildReportPdfContent } from './reportPdfContent'
import {
  formatInjuryCareSummary,
  formatInjuryRowSummary,
  formatPediatricianRowSummary,
  formatSicknessCareSummary,
} from './healthReportAnalytics'
import { formatHealthDuration } from '@/types/health'
import { formatWhen } from './trackUtils'
import { appendTrackWeeklyLogSections } from './trackWeeklyLogPdfSections'
import { PDF_GROWTH_COLORS } from './pdfChartDrawing'
import { pdfT } from './pdfUi'
import { sharePdfDocument } from '@/lib/sharePdfDocument'

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

type ReportOptions = {
  logs: LogRecord[]
  measurements?: GrowthMeasurementDto[]
  milestones?: MilestoneDto[]
  sickness?: SicknessEventDto[]
  injuries?: InjuryEventDto[]
  pediatricianVisits?: PediatricianVisitDto[]
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
    doc.text(pdfT('footerPediatric'), MARGIN, FOOTER_Y)
    doc.text(pdfT('pageOf', { current: i, total: pages }), PAGE_W - MARGIN, FOOTER_Y, { align: 'right' })
  }
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

function pediatricianRow(row: PediatricianVisitDto, babies: Baby[]): string[] {
  const baby = babies.find((b) => b.id === row.babyId)
  return [
    formatWhen(row.visitedAt),
    baby?.fullName?.trim() || 'Baby',
    row.pediatricianName,
    row.hospital?.trim() || '—',
    row.immunizations.length > 0 ? row.immunizations.join(', ') : '—',
    formatPediatricianRowSummary(row),
    row.notes?.trim() || '—',
  ]
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
  pediatricianVisits = [],
  babies,
  parentName,
  includeAnalysis: _includeAnalysis = false,
  rangeDays = 0,
}: ReportOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  void _includeAnalysis

  const pdfContent = buildReportPdfContent(logs, rangeDays, babies, parentName, {
    measurements,
    milestones,
    sickness,
    injuries,
    pediatricianVisits,
  })
  const analysis = pdfContent.analysis

  const growthRows = analysis.growth.measurements
  const milestoneRows = analysis.growth.milestones
  const sicknessRows = analysis.health.sickness
  const injuryRows = analysis.health.injuries
  const pediatricianVisitRows = analysis.health.pediatricianVisits

  appendTrackWeeklyLogSections(doc, logs, babies, parentName, rangeDays)

  doc.addPage()
  addPageFooter(doc)
  let y = 22
  y = addSectionTitle(
    doc,
    'Appendix — Health & growth records',
    'Detailed health and growth data for the reporting period.',
    y,
  )
  y += 4

  y = addAppendixSection(
    doc,
    'Growth measurements',
    y,
    [['When', 'Baby', 'Weight', 'Height', 'Head', 'Notes']],
    growthRows.map((row) => growthMeasurementRow(row, babies)),
    PDF_GROWTH_COLORS.weight,
    'No growth measurements in this period.',
  )

  y = addAppendixSection(
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

  y = addAppendixSection(
    doc,
    'Injuries',
    y,
    [['When', 'Baby', 'Description', 'Details', 'Swelling', 'Care', 'Notes']],
    injuryRows.map((row) => injuryRow(row, babies)),
    PDF_HEALTH_COLOR,
    'No injuries in this period.',
  )

  addAppendixSection(
    doc,
    'Pediatrician visits',
    y,
    [['When', 'Baby', 'Pediatrician', 'Hospital', 'Immunizations', 'Details', 'Notes']],
    pediatricianVisitRows.map((row) => pediatricianRow(row, babies)),
    PDF_HEALTH_COLOR,
    'No pediatrician visits in this period.',
  )

  addPageFooter(doc)

  const stamp = new Date().toISOString().slice(0, 10)
  await sharePdfDocument(doc, `baby-patterns-report-${stamp}.pdf`)
}
