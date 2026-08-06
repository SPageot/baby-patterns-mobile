import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { PDF_KIND_COLORS } from './pdfChartDrawing'
import { pdfT } from './pdfUi'
import { sharePdfDocument } from '@/lib/sharePdfDocument'
import {
  buildFeedingPdfContent,
  type FeedingPdfContent,
  type FeedingPdfHighlights,
  type FeedingWeekPdf,
} from './feedingPdfContent'

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

const MARGIN = 12
const PAGE_W = 210
const FOOTER_Y = 287
const FEEDING_COLOR = PDF_KIND_COLORS.feeding
const HIGHLIGHT_HEAD: [number, number, number] = [62, 118, 78]
const TEXT = [47, 42, 56] as const
const MUTED = [120, 116, 130] as const

function addPageFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 146, 162)
    doc.text(pdfT('footerFeeding'), MARGIN, FOOTER_Y)
    doc.text(pdfT('pageOf', { current: i, total: pages }), PAGE_W - MARGIN, FOOTER_Y, { align: 'right' })
  }
}

function highlightsEqual(a: FeedingPdfHighlights, b: FeedingPdfHighlights): boolean {
  return (
    a.leastFeeds === b.leastFeeds &&
    a.mostFeeds === b.mostFeeds &&
    a.leastBottleDays === b.leastBottleDays &&
    a.mostBottleDays === b.mostBottleDays
  )
}

function addHighlightsTable(
  doc: jsPDF,
  y: number,
  title: string,
  highlights: FeedingPdfHighlights,
): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT)
  doc.text(title, MARGIN, y)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[pdfT('leastFeeds'), pdfT('mostFeeds'), pdfT('leastBottleDays'), pdfT('mostBottleDays')]],
    body: [[
      highlights.leastFeeds,
      highlights.mostFeeds,
      highlights.leastBottleDays,
      highlights.mostBottleDays,
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

function addFeedingLogTable(doc: jsPDF, y: number, week: FeedingWeekPdf): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT)
  doc.text(pdfT('dailyFeedingLog'), MARGIN, y)
  y += 4

  const headers = [
    pdfT('date'),
    pdfT('time'),
    pdfT('type'),
    pdfT('amount'),
    pdfT('duration'),
    pdfT('status'),
    pdfT('notes'),
  ]

  const body = week.rows.map((row) => [
    row.dateShort,
    row.time,
    row.type,
    row.amount,
    row.duration,
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
      fillColor: FEEDING_COLOR,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 12 },
      2: { cellWidth: 22 },
      3: { cellWidth: 16 },
      4: { cellWidth: 16 },
      5: { cellWidth: 18, fontSize: 6.5 },
      6: { cellWidth: 'auto', fontSize: 6.5 },
    },
    alternateRowStyles: { fillColor: [250, 252, 251] },
  })
}

function addWeekPage(
  doc: jsPDF,
  content: FeedingPdfContent,
  week: FeedingWeekPdf,
  isFirst: boolean,
): void {
  if (!isFirst) doc.addPage()

  let y = 16

  doc.setFillColor(...FEEDING_COLOR)
  doc.rect(0, 0, PAGE_W, isFirst ? 22 : 14, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(isFirst ? 13 : 11)
  doc.setTextColor(255, 255, 255)
  const title = isFirst ? pdfT('titleFeeding', { name: content.babyName }) : content.babyName
  doc.text(title, MARGIN, isFirst ? 10 : 9)

  if (isFirst) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(
      `${content.periodLabel} · ${content.aggregates.feedCount} feeds · ${content.generatedLabel}`,
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
    y = addHighlightsTable(doc, y, pdfT('reportHighlights'), content.highlights)
    if (!highlightsEqual(content.highlights, week.highlights)) {
      y = addHighlightsTable(doc, y, pdfT('weekHighlights'), week.highlights)
    }
  } else {
    y = addHighlightsTable(doc, y, pdfT('weekHighlights'), week.highlights)
  }

  addFeedingLogTable(doc, y, week)
}

function addNotesAppendix(doc: jsPDF, content: FeedingPdfContent): void {
  const entries = content.weeks.flatMap((week) =>
    week.notesAppendix.map((note) => ({ week: week.weekLabel, ...note })),
  )
  if (!entries.length) return

  doc.addPage()
  let y = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT)
  doc.text(pdfT('notesAppendix'), MARGIN, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(pdfT('notesAppendixHint'), MARGIN, y)
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

export function appendFeedingReportPages(
  doc: jsPDF,
  content: FeedingPdfContent,
  options?: { continueDocument?: boolean },
): void {
  if (!content.weeks.length) return

  if (options?.continueDocument) doc.addPage()
  content.weeks.forEach((week, index) => {
    addWeekPage(doc, content, week, index === 0)
  })
  addNotesAppendix(doc, content)
}

function buildFeedingReportPdf(content: FeedingPdfContent): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  if (!content.weeks.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...TEXT)
    doc.text(pdfT('titleFeeding', { name: content.babyName }), MARGIN, 24)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text(pdfT('emptyFeeding'), MARGIN, 34)
    addPageFooter(doc)
    return doc
  }

  appendFeedingReportPages(doc, content)
  addPageFooter(doc)
  return doc
}

export async function downloadFeedingReportPdf({
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
  const content = buildFeedingPdfContent(logs, babies, selectedBabyId, caregiverName)
  const doc = buildFeedingReportPdf(content)
  const slug = content.babyName.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'baby'
  const date = new Date().toISOString().slice(0, 10)
  await sharePdfDocument(doc, `feeding-report-${slug}-${date}.pdf`)
}

export { buildFeedingPdfContent, buildFeedingReportPdf }
