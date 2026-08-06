import type { jsPDF } from 'jspdf'
import type { KindReport } from '@/lib/reportAnalytics'
import { formatReportMinutes } from '@/lib/reportAnalytics'
import type { MetricTrendPoint } from '@/lib/growthReportAnalytics'

export type PdfRgb = [number, number, number]

export const PDF_KIND_COLORS: Record<KindReport['kind'], PdfRgb> = {
  sleep: [122, 159, 212],
  feeding: [90, 154, 114],
  diaper: [199, 160, 140],
  potty: [107, 143, 113],
  behavior: [196, 140, 90],
}

export const PDF_GROWTH_COLORS = {
  weight: [124, 92, 196] as PdfRgb,
  height: [74, 154, 114] as PdfRgb,
  head: [196, 122, 92] as PdfRgb,
  milestone: [196, 122, 92] as PdfRgb,
}

const GRID: PdfRgb = [230, 226, 238]
const TICK: PdfRgb = [120, 116, 130]
const LABEL: PdfRgb = [70, 66, 80]
const MUTED: PdfRgb = [150, 146, 162]
const CARD_BG: PdfRgb = [248, 246, 252]
const CARD_BORDER: PdfRgb = [220, 214, 232]

export function formatChartValue(report: KindReport, value: number): string {
  if (report.unit === 'minutes') return formatReportMinutes(value)
  return String(Math.round(value * 10) / 10).replace(/\.0$/, '')
}

function setFill(doc: jsPDF, rgb: PdfRgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setStroke(doc: jsPDF, rgb: PdfRgb, width = 0.2) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  doc.setLineWidth(width)
}

function drawChartFrame(doc: jsPDF, x: number, y: number, w: number, h: number) {
  setFill(doc, [255, 255, 255])
  setStroke(doc, CARD_BORDER, 0.3)
  doc.roundedRect(x, y, w, h, 2, 2, 'FD')
}

function drawEmptyChart(doc: jsPDF, x: number, y: number, w: number, h: number, message: string) {
  drawChartFrame(doc, x, y, w, h)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(message, x + w / 2, y + h / 2, { align: 'center' })
}

export function drawTrendLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  series: { label: string; value: number }[],
  color: PdfRgb,
  formatValue: (n: number) => string,
): number {
  drawChartFrame(doc, x, y, w, h)

  const padL = 12
  const padR = 4
  const padT = 6
  const padB = 14
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const baseX = x + padL
  const baseY = y + padT + innerH

  if (series.length === 0 || series.every((p) => p.value === 0)) {
    drawEmptyChart(doc, x, y, w, h, 'No data in this period')
    return y + h
  }

  const max = Math.max(1, ...series.map((p) => p.value))
  const tickCount = 3

  setStroke(doc, GRID, 0.15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...TICK)

  for (let i = 0; i <= tickCount; i += 1) {
    const tickVal = (max * (tickCount - i)) / tickCount
    const ty = y + padT + (innerH * i) / tickCount
    doc.line(baseX, ty, x + w - padR, ty)
    doc.text(formatValue(tickVal), x + 2, ty + 1.5)
  }

  const pts = series.map((row, i) => {
    const px =
      baseX + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW)
    const py = baseY - (row.value / max) * innerH
    return { ...row, px, py }
  })

  if (pts.length > 1) {
    const areaPoints: [number, number][] = [
      [pts[0].px - baseX, pts[0].py - baseY],
      ...pts.slice(1).map((p) => [p.px - baseX, p.py - baseY] as [number, number]),
      [pts[pts.length - 1].px - baseX, 0],
      [pts[0].px - baseX, 0],
    ]
    const blended: PdfRgb = [
      Math.round(color[0] * 0.14 + 255 * 0.86),
      Math.round(color[1] * 0.14 + 255 * 0.86),
      Math.round(color[2] * 0.14 + 255 * 0.86),
    ]
    setFill(doc, blended)
    doc.lines(areaPoints, baseX, baseY, [1, 1], 'F', true)
  }

  setStroke(doc, color, 0.8)
  for (let i = 1; i < pts.length; i += 1) {
    doc.line(pts[i - 1].px, pts[i - 1].py, pts[i].px, pts[i].py)
  }

  setFill(doc, color)
  for (const p of pts) {
    doc.circle(p.px, p.py, 0.8, 'F')
  }

  const labelStep = Math.max(1, Math.floor(series.length / 5))
  doc.setFontSize(6.5)
  doc.setTextColor(...LABEL)
  pts.forEach((p, i) => {
    if (i % labelStep !== 0 && i !== pts.length - 1) return
    doc.text(p.label, p.px, y + h - 4, { align: 'center', maxWidth: innerW / 4 })
  })

  return y + h
}

export function drawVerticalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  bars: { label: string; value: number }[],
  color: PdfRgb,
  labelEvery = 3,
): number {
  drawChartFrame(doc, x, y, w, h)

  const padL = 10
  const padR = 4
  const padT = 6
  const padB = 16
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const baseX = x + padL
  const baseY = y + padT + innerH

  if (bars.length === 0 || bars.every((b) => b.value === 0)) {
    drawEmptyChart(doc, x, y, w, h, 'No data in this period')
    return y + h
  }

  const max = Math.max(1, ...bars.map((b) => b.value))
  const barSlot = innerW / bars.length
  const barW = Math.max(1.2, barSlot - 1.2)

  setFill(doc, color)
  bars.forEach((bar, i) => {
    const barH = (bar.value / max) * innerH
    const bx = baseX + i * barSlot + (barSlot - barW) / 2
    const by = baseY - barH
    if (barH > 0) doc.roundedRect(bx, by, barW, barH, 0.6, 0.6, 'F')
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...LABEL)
  bars.forEach((bar, i) => {
    if (i % labelEvery !== 0) return
    const bx = baseX + i * barSlot + barSlot / 2
    doc.text(bar.label, bx, y + h - 5, { align: 'center', maxWidth: barSlot + 2 })
  })

  return y + h
}

export function drawWeekdayBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  weekdays: { label: string; value: number }[],
  color: PdfRgb,
  formatValue: (n: number) => string,
): number {
  drawChartFrame(doc, x, y, w, h)

  const padL = 8
  const padR = 4
  const padT = 8
  const padB = 14
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const baseX = x + padL
  const baseY = y + padT + innerH

  const ordered = [1, 2, 3, 4, 5, 6, 0].map((i) => weekdays[i]).filter(Boolean)
  if (ordered.length === 0 || ordered.every((d) => d.value === 0)) {
    drawEmptyChart(doc, x, y, w, h, 'No data in this period')
    return y + h
  }

  const max = Math.max(1, ...ordered.map((d) => d.value))
  const barSlot = innerW / 7
  const barW = barSlot - 3

  setFill(doc, color)
  ordered.forEach((day, i) => {
    const barH = (day.value / max) * innerH
    const bx = baseX + i * barSlot + 1.5
    const by = baseY - barH
    if (barH > 0) doc.roundedRect(bx, by, barW, barH, 1, 1, 'F')
    if (barH > 8) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6)
      doc.setTextColor(255, 255, 255)
      doc.text(formatValue(day.value), bx + barW / 2, by + 4, { align: 'center' })
    }
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...LABEL)
  ordered.forEach((day, i) => {
    const bx = baseX + i * barSlot + barSlot / 2
    doc.text(day.label, bx, y + h - 5, { align: 'center' })
  })

  return y + h
}

export function drawMetricTrendChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  series: MetricTrendPoint[],
  color: PdfRgb,
  unit: string,
): number {
  if (series.length === 0) {
    drawEmptyChart(doc, x, y, w, h, 'No measurements in this period')
    return y + h
  }
  return drawTrendLineChart(doc, x, y, w, h, series, color, (n) => `${n} ${unit}`)
}

export function drawStatRow(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  stats: { label: string; value: string }[],
  accent: PdfRgb,
): number {
  const gap = 3
  const colW = (w - gap * (stats.length - 1)) / stats.length
  const boxH = 16

  stats.forEach((stat, i) => {
    const bx = x + i * (colW + gap)
    setFill(doc, CARD_BG)
    setStroke(doc, CARD_BORDER, 0.25)
    doc.roundedRect(bx, y, colW, boxH, 1.5, 1.5, 'FD')
    doc.setFillColor(accent[0], accent[1], accent[2])
    doc.rect(bx, y, colW, 1.2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(stat.label.toUpperCase(), bx + 3, y + 6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(47, 42, 56)
    doc.text(stat.value, bx + 3, y + 12, { maxWidth: colW - 6 })
  })

  return y + boxH
}

export function drawMilestoneCategoryBars(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  categories: { label: string; count: number }[],
  color: PdfRgb,
): number {
  const rows = categories.filter((c) => c.count > 0)
  const h = rows.length > 0 ? 8 + rows.length * 7 : 24

  drawChartFrame(doc, x, y, w, h)
  if (rows.length === 0) {
    drawEmptyChart(doc, x, y, w, h, 'No milestones in this period')
    return y + h
  }

  const max = Math.max(1, ...rows.map((r) => r.count))
  const barMaxW = w - 50

  doc.setFont('helvetica', 'normal')
  rows.forEach((row, i) => {
    const rowY = y + 6 + i * 7
    doc.setFontSize(8)
    doc.setTextColor(...LABEL)
    doc.text(row.label, x + 4, rowY + 3)
    const barW = (row.count / max) * barMaxW
    setFill(doc, color)
    doc.roundedRect(x + 42, rowY, barW, 4, 0.5, 0.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(47, 42, 56)
    doc.text(String(row.count), x + 44 + barW + 2, rowY + 3)
  })

  return y + h
}
