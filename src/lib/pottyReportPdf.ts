import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { PDF_KIND_COLORS } from './pdfChartDrawing'
import { sharePdfDocument } from '@/lib/sharePdfDocument'
import {
  buildPottyPdfContent,
  type PottyPdfContent,
  type PottyPdfHighlights,
  type PottyWeekPdf,
} from './pottyPdfContent'

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

const MARGIN = 12
const PAGE_W = 210
const FOOTER_Y = 287
const POTTY_COLOR = PDF_KIND_COLORS.potty
const HIGHLIGHT_HEAD: [number, number, number] = [72, 102, 76]
const TEXT = [47, 42, 56] as const
const MUTED = [120, 116, 130] as const

function addPageFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 146, 162)
    doc.text('Baby Pattern — Potty Report', MARGIN, FOOTER_Y)
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' })
  }
}

function highlightsEqual(a: PottyPdfHighlights, b: PottyPdfHighlights): boolean {
  return (
    a.leastVisits === b.leastVisits &&
    a.mostVisits === b.mostVisits &&
    a.leastSuccessDays === b.leastSuccessDays &&
    a.mostSuccessDays === b.mostSuccessDays
  )
}

function addHighlightsTable(
  doc: jsPDF,
  y: number,
  title: string,
  highlights: PottyPdfHighlights,
): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT)
  doc.text(title, MARGIN, y)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Least visits', 'Most visits', 'Least success days', 'Most success days']],
    body: [[
      highlights.leastVisits,
      highlights.mostVisits,
      highlights.leastSuccessDays,
      highlights.mostSuccessDays,
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      halign: 'center',
      valign: 'middle',
      lineColor: [220, 214, 232],
      lineWidth: 0.2,
      textColor: [...TEXT],
    },
    headStyles: {
      fillColor: HIGHLIGHT_HEAD,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fillColor: [248, 252, 249],
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
    },
  })

  return ((doc as PdfWithTable).lastAutoTable?.finalY ?? y) + 6
}

function addPottyLogTable(doc: jsPDF, y: number, week: PottyWeekPdf): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT)
  doc.text('Daily potty log', MARGIN, y)
  y += 4

  const headers = ['Date', 'Time', 'Result', 'Location', 'Status', 'Notes']

  const body = week.rows.map((row) => [
    row.dateShort,
    row.time,
    row.result,
    row.location,
    row.status,
    row.notes,
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    head: [headers],
    body,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [220, 214, 232],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: POTTY_COLOR,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 12 },
      2: { cellWidth: 22 },
      3: { cellWidth: 24 },
      4: { cellWidth: 18, fontSize: 6.5 },
      5: { cellWidth: 'auto', fontSize: 6.5 },
    },
    alternateRowStyles: { fillColor: [250, 252, 251] },
  })
}

function addWeekPage(
  doc: jsPDF,
  content: PottyPdfContent,
  week: PottyWeekPdf,
  isFirst: boolean,
): void {
  if (!isFirst) doc.addPage()

  let y = 16

  doc.setFillColor(...POTTY_COLOR)
  doc.rect(0, 0, PAGE_W, isFirst ? 22 : 14, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(isFirst ? 13 : 11)
  doc.setTextColor(255, 255, 255)
  const title = isFirst ? `${content.babyName} — Potty Report` : content.babyName
  doc.text(title, MARGIN, isFirst ? 10 : 9)

  if (isFirst) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(
      `${content.periodLabel} · ${content.aggregates.visitCount} visits · ${content.generatedLabel}`,
      MARGIN,
      17,
    )
    y = 30
  } else {
    y = 22
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT)
  doc.text(week.weekLabel, MARGIN, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(week.statsLine, MARGIN, y)
  y += 6

  if (isFirst) {
    y = addHighlightsTable(doc, y, 'Report highlights', content.highlights)
    if (!highlightsEqual(content.highlights, week.highlights)) {
      y = addHighlightsTable(doc, y, 'Week highlights', week.highlights)
    }
  } else {
    y = addHighlightsTable(doc, y, 'Week highlights', week.highlights)
  }

  addPottyLogTable(doc, y, week)
}

function addNotesAppendix(doc: jsPDF, content: PottyPdfContent): void {
  const entries = content.weeks.flatMap((week) =>
    week.notesAppendix.map((note) => ({ week: week.weekLabel, ...note })),
  )
  if (!entries.length) return

  doc.addPage()
  let y = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT)
  doc.text('Notes appendix', MARGIN, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('Full notes for rows truncated in weekly tables.', MARGIN, y)
  y += 8

  for (const entry of entries) {
    if (y > FOOTER_Y - 20) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT)
    doc.text(`${entry.dateShort} (${entry.week})`, MARGIN, y)
    y += 4
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(90, 84, 100)
    const lines = doc.splitTextToSize(entry.full, PAGE_W - MARGIN * 2)
    doc.text(lines, MARGIN, y)
    y += lines.length * 3.8 + 5
  }
}

export function appendPottyReportPages(
  doc: jsPDF,
  content: PottyPdfContent,
  options?: { continueDocument?: boolean },
): void {
  if (!content.weeks.length) return

  if (options?.continueDocument) doc.addPage()
  content.weeks.forEach((week, index) => {
    addWeekPage(doc, content, week, index === 0)
  })
  addNotesAppendix(doc, content)
}

function buildPottyReportPdf(content: PottyPdfContent): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  if (!content.weeks.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...TEXT)
    doc.text(`${content.babyName} — Potty Report`, MARGIN, 24)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('No potty logs to include in this report.', MARGIN, 34)
    addPageFooter(doc)
    return doc
  }

  appendPottyReportPages(doc, content)
  addPageFooter(doc)
  return doc
}

export async function downloadPottyReportPdf({
  logs,
  babies,
  selectedBabyId,
  caregiverName,
}: {
  logs: LogRecord[]
  babies: Baby[]
  selectedBabyId: string
  caregiverName: string
}) {
  const content = buildPottyPdfContent(logs, babies, selectedBabyId, caregiverName)
  const doc = buildPottyReportPdf(content)
  const slug = content.babyName.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'baby'
  const date = new Date().toISOString().slice(0, 10)
  await sharePdfDocument(doc, `potty-report-${slug}-${date}.pdf`)
}

export { buildPottyPdfContent, buildPottyReportPdf }
