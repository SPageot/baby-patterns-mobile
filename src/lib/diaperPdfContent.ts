import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { diaperLogFromDetails } from '@/types/babyLog'
import {
  diaperLogMatchesBaby,
  diaperMixType,
  formatDiaperContents,
} from './diaperFeedUtils'
import { isoLocalYmd, parseYmd, startOfWeekMonday, ymdFromDate } from './trackUtils'

export type DiaperEntryPdf = {
  logId: string
  dateYmd: string
  atMs: number
  contents: string
  brand: string
  size: string
  cream: string
  status: string
  other: string
  isPoop: boolean
}

export type DiaperWeekRow = {
  dateShort: string
  time: string
  contents: string
  brandSize: string
  cream: string
  status: string
  other: string
  otherFull?: string
}

export type DiaperPdfHighlights = {
  leastChanges: string
  mostChanges: string
  leastBmDays: string
  mostBmDays: string
}

export type DiaperWeekPdf = {
  weekStartYmd: string
  weekLabel: string
  statsLine: string
  highlights: DiaperPdfHighlights
  rows: DiaperWeekRow[]
  notesAppendix: { dateShort: string; full: string }[]
}

export type DiaperPdfAggregates = {
  changeCount: number
  wetPct: string
  bmPct: string
  teethingPct: string
  sickPct: string
}

export type DiaperPdfContent = {
  babyName: string
  caregiverName: string
  generatedLabel: string
  periodLabel: string
  aggregates: DiaperPdfAggregates
  highlights: DiaperPdfHighlights
  weeks: DiaperWeekPdf[]
}

const NOTES_MAX = 28

function shortDateLabel(ymd: string): string {
  const d = parseYmd(ymd)
  if (Number.isNaN(d.getTime())) return ymd.slice(5).replace('-', '/')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function compactTimeMs(ms: number): string {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  let h = d.getHours()
  const m = d.getMinutes()
  const ap = h >= 12 ? 'p' : 'a'
  h = h % 12 || 12
  if (m === 0) return `${h}${ap}`
  return `${h}:${String(m).padStart(2, '0')}${ap}`
}

function truncateText(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1))}…`
}

function pct(count: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((count / total) * 100)}%`
}

function weekStartYmd(ymd: string): string {
  return ymdFromDate(startOfWeekMonday(parseYmd(ymd)))
}

function weekLabel(weekStartYmdValue: string, entries: DiaperEntryPdf[]): string {
  const start = parseYmd(weekStartYmdValue)
  const endYmd = entries.reduce((max, e) => (e.dateYmd > max ? e.dateYmd : max), weekStartYmdValue)
  const end = parseYmd(endYmd)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (Number.isNaN(start.getTime())) return `Week of ${weekStartYmdValue}`
  if (ymdFromDate(start) === endYmd) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

function formatStatus(fields: { isTeething?: boolean; isSick?: boolean }): string {
  const parts: string[] = []
  if (fields.isTeething) parts.push('Teething')
  if (fields.isSick) parts.push('Sick')
  return parts.length ? parts.join(', ') : '—'
}

function logToEntry(log: LogRecord): DiaperEntryPdf | null {
  if (log.kind !== 'diaper') return null
  const fields = diaperLogFromDetails(log.details, log.atIso)
  const atMs = new Date(log.atIso).getTime()
  if (!Number.isFinite(atMs)) return null

  const other = fields.anythingElseDescription?.trim() || ''

  return {
    logId: log.id,
    dateYmd: isoLocalYmd(log.atIso),
    atMs,
    contents: formatDiaperContents(log.details),
    brand: fields.diaperBrand?.trim() || '—',
    size: fields.diaperSize?.trim() || '—',
    cream: fields.diaperCreamUsed?.trim() || '—',
    status: formatStatus(fields),
    other,
    isPoop: fields.isTherePoop || diaperMixType(log) === 'dirty' || diaperMixType(log) === 'mixed',
  }
}

function buildHighlights(entries: DiaperEntryPdf[]): DiaperPdfHighlights {
  const changeCountByDay = new Map<string, number>()
  const bmCountByDay = new Map<string, number>()

  for (const entry of entries) {
    changeCountByDay.set(entry.dateYmd, (changeCountByDay.get(entry.dateYmd) ?? 0) + 1)
    if (entry.isPoop) {
      bmCountByDay.set(entry.dateYmd, (bmCountByDay.get(entry.dateYmd) ?? 0) + 1)
    }
  }

  let leastChanges = '—'
  let mostChanges = '—'
  if (changeCountByDay.size > 0) {
    const rows = [...changeCountByDay.entries()]
    const fewest = rows.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = rows.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastChanges = `${shortDateLabel(fewest[0])} (${fewest[1]} change${fewest[1] === 1 ? '' : 's'})`
    mostChanges = `${shortDateLabel(most[0])} (${most[1]} change${most[1] === 1 ? '' : 's'})`
  }

  let leastBmDays = '—'
  let mostBmDays = '—'
  if (changeCountByDay.size > 0) {
    for (const day of changeCountByDay.keys()) {
      if (!bmCountByDay.has(day)) bmCountByDay.set(day, 0)
    }
    const rows = [...bmCountByDay.entries()]
    const fewest = rows.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = rows.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastBmDays = `${shortDateLabel(fewest[0])} (${fewest[1]} BM${fewest[1] === 1 ? '' : 's'})`
    mostBmDays = `${shortDateLabel(most[0])} (${most[1]} BM${most[1] === 1 ? '' : 's'})`
  }

  return { leastChanges, mostChanges, leastBmDays, mostBmDays }
}

function buildWeekStatsLine(entries: DiaperEntryPdf[]): string {
  if (!entries.length) return 'No changes this week'

  const days = new Set(entries.map((e) => e.dateYmd)).size
  const avgPerDay = (entries.length / Math.max(days, 1)).toFixed(1)
  const wet = entries.filter((e) => e.contents.toLowerCase().includes('wet')).length
  const bm = entries.filter((e) => e.isPoop).length
  const teething = entries.filter((e) => e.status.includes('Teething')).length
  const sick = entries.filter((e) => e.status.includes('Sick')).length

  return [
    `Avg ${avgPerDay} changes/day`,
    `${pct(wet, entries.length)} wet`,
    `${pct(bm, entries.length)} BM`,
    `${pct(teething, entries.length)} teething`,
    `${pct(sick, entries.length)} sick`,
  ].join(' · ')
}

function formatOtherCell(other: string): { display: string; full?: string } {
  if (!other.trim()) return { display: '—' }
  const full = other.trim()
  if (full.length <= NOTES_MAX) return { display: full }
  return { display: truncateText(full, NOTES_MAX), full }
}

function entryToRow(entry: DiaperEntryPdf): DiaperWeekRow {
  const otherCell = formatOtherCell(entry.other)
  const brandSize =
    entry.brand === '—' && entry.size === '—'
      ? '—'
      : entry.brand === '—'
        ? entry.size
        : entry.size === '—'
          ? entry.brand
          : `${entry.brand} · ${entry.size}`

  return {
    dateShort: shortDateLabel(entry.dateYmd),
    time: compactTimeMs(entry.atMs),
    contents: entry.contents,
    brandSize: truncateText(brandSize, 24),
    cream: entry.cream,
    status: entry.status,
    other: otherCell.display,
    otherFull: otherCell.full,
  }
}

function buildWeekPdf(weekStart: string, entries: DiaperEntryPdf[]): DiaperWeekPdf {
  const sorted = [...entries].sort((a, b) => a.atMs - b.atMs)
  const rows = sorted.map(entryToRow)
  const notesAppendix = rows
    .filter((row) => row.otherFull)
    .map((row) => ({ dateShort: `${row.dateShort} ${row.time}`, full: row.otherFull! }))

  return {
    weekStartYmd: weekStart,
    weekLabel: weekLabel(weekStart, sorted),
    statsLine: buildWeekStatsLine(sorted),
    highlights: buildHighlights(sorted),
    rows,
    notesAppendix,
  }
}

function groupEntriesByWeek(entries: DiaperEntryPdf[]): DiaperWeekPdf[] {
  const map = new Map<string, DiaperEntryPdf[]>()
  for (const entry of entries) {
    const key = weekStartYmd(entry.dateYmd)
    const list = map.get(key) ?? []
    list.push(entry)
    map.set(key, list)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekEntries]) => buildWeekPdf(weekStart, weekEntries))
}

function buildAggregates(entries: DiaperEntryPdf[]): DiaperPdfAggregates {
  const wet = entries.filter((e) => e.contents.toLowerCase().includes('wet')).length
  const bm = entries.filter((e) => e.isPoop).length
  return {
    changeCount: entries.length,
    wetPct: pct(wet, entries.length),
    bmPct: pct(bm, entries.length),
    teethingPct: pct(
      entries.filter((e) => e.status.includes('Teething')).length,
      entries.length,
    ),
    sickPct: pct(entries.filter((e) => e.status.includes('Sick')).length, entries.length),
  }
}

function periodLabelFromWeeks(weeks: DiaperWeekPdf[]): string {
  if (!weeks.length) return 'No diaper logs'
  if (weeks.length === 1) return weeks[0].weekLabel
  return `${weeks[0].weekLabel} – ${weeks[weeks.length - 1].weekLabel}`
}

export function filterDiaperLogsForPdf(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
): LogRecord[] {
  return logs
    .filter((log) => log.kind === 'diaper')
    .filter((log) => !selectedBabyId || diaperLogMatchesBaby(log, selectedBabyId, babies))
    .sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export function buildDiaperPdfContent(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
  caregiverName: string,
): DiaperPdfContent {
  const filtered = filterDiaperLogsForPdf(logs, babies, selectedBabyId)
  const entries = filtered.map(logToEntry).filter((e): e is DiaperEntryPdf => e != null)
  const weeks = groupEntriesByWeek(entries)

  const babyName =
    (selectedBabyId
      ? babies.find((b) => b.id === selectedBabyId)?.fullName?.trim()
      : babies.map((b) => b.fullName?.trim()).filter(Boolean).join(', ')) || 'Baby'

  return {
    babyName,
    caregiverName: caregiverName.trim() || 'Caregiver',
    generatedLabel: new Date().toLocaleString(),
    periodLabel: periodLabelFromWeeks(weeks),
    aggregates: buildAggregates(entries),
    highlights: buildHighlights(entries),
    weeks,
  }
}
