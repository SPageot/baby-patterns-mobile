import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { pottyLogFromDetails } from '@/types/babyLog'
import { diaperLogMatchesBaby } from './diaperFeedUtils'
import {
  getPottyResultBadge,
  POTTY_LOCATION_LABELS,
} from './pottyLogUtils'
import { isoLocalYmd, parseYmd, startOfWeekMonday, ymdFromDate } from './trackUtils'

export type PottyEntryPdf = {
  logId: string
  dateYmd: string
  atMs: number
  result: string
  location: string
  status: string
  notes: string
  isSuccess: boolean
}

export type PottyWeekRow = {
  dateShort: string
  time: string
  result: string
  location: string
  status: string
  notes: string
  notesFull?: string
}

export type PottyPdfHighlights = {
  leastVisits: string
  mostVisits: string
  leastSuccessDays: string
  mostSuccessDays: string
}

export type PottyWeekPdf = {
  weekStartYmd: string
  weekLabel: string
  statsLine: string
  highlights: PottyPdfHighlights
  rows: PottyWeekRow[]
  notesAppendix: { dateShort: string; full: string }[]
}

export type PottyPdfAggregates = {
  visitCount: number
  successPct: string
  accidentPct: string
  teethingPct: string
  sickPct: string
}

export type PottyPdfContent = {
  babyName: string
  caregiverName: string
  generatedLabel: string
  periodLabel: string
  aggregates: PottyPdfAggregates
  highlights: PottyPdfHighlights
  weeks: PottyWeekPdf[]
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

function weekLabel(weekStartYmdValue: string, entries: PottyEntryPdf[]): string {
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

function isPottySuccess(result: string): boolean {
  const key = result.trim().toLowerCase()
  return key !== 'accident'
}

function logToEntry(log: LogRecord): PottyEntryPdf | null {
  if (log.kind !== 'potty') return null
  const fields = pottyLogFromDetails(log.details, log.atIso)
  const atIso = fields.loggedAt || log.atIso
  const atMs = new Date(atIso).getTime()
  if (!Number.isFinite(atMs)) return null

  const resultKey = fields.result?.trim() || 'success'
  const locationKey = fields.location?.trim() || 'potty-chair'

  return {
    logId: log.id,
    dateYmd: isoLocalYmd(atIso),
    atMs,
    result: getPottyResultBadge(resultKey),
    location: POTTY_LOCATION_LABELS[locationKey] ?? locationKey,
    status: formatStatus(fields),
    notes: fields.notes?.trim() || '',
    isSuccess: isPottySuccess(resultKey),
  }
}

function buildHighlights(entries: PottyEntryPdf[]): PottyPdfHighlights {
  const visitCountByDay = new Map<string, number>()
  const successCountByDay = new Map<string, number>()

  for (const entry of entries) {
    visitCountByDay.set(entry.dateYmd, (visitCountByDay.get(entry.dateYmd) ?? 0) + 1)
    if (entry.isSuccess) {
      successCountByDay.set(entry.dateYmd, (successCountByDay.get(entry.dateYmd) ?? 0) + 1)
    }
  }

  let leastVisits = '—'
  let mostVisits = '—'
  if (visitCountByDay.size > 0) {
    const rows = [...visitCountByDay.entries()]
    const fewest = rows.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = rows.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastVisits = `${shortDateLabel(fewest[0])} (${fewest[1]} visit${fewest[1] === 1 ? '' : 's'})`
    mostVisits = `${shortDateLabel(most[0])} (${most[1]} visit${most[1] === 1 ? '' : 's'})`
  }

  let leastSuccessDays = '—'
  let mostSuccessDays = '—'
  if (visitCountByDay.size > 0) {
    for (const day of visitCountByDay.keys()) {
      if (!successCountByDay.has(day)) successCountByDay.set(day, 0)
    }
    const rows = [...successCountByDay.entries()]
    const fewest = rows.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = rows.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastSuccessDays = `${shortDateLabel(fewest[0])} (${fewest[1]} success${fewest[1] === 1 ? '' : 'es'})`
    mostSuccessDays = `${shortDateLabel(most[0])} (${most[1]} success${most[1] === 1 ? '' : 'es'})`
  }

  return { leastVisits, mostVisits, leastSuccessDays, mostSuccessDays }
}

function buildWeekStatsLine(entries: PottyEntryPdf[]): string {
  if (!entries.length) return 'No potty logs this week'

  const days = new Set(entries.map((e) => e.dateYmd)).size
  const avgPerDay = (entries.length / Math.max(days, 1)).toFixed(1)
  const success = entries.filter((e) => e.isSuccess).length
  const accidents = entries.filter((e) => e.result === 'Accident').length
  const teething = entries.filter((e) => e.status.includes('Teething')).length
  const sick = entries.filter((e) => e.status.includes('Sick')).length

  return [
    `Avg ${avgPerDay} visits/day`,
    `${pct(success, entries.length)} success`,
    `${pct(accidents, entries.length)} accidents`,
    `${pct(teething, entries.length)} teething`,
    `${pct(sick, entries.length)} sick`,
  ].join(' · ')
}

function formatNotesCell(notes: string): { display: string; full?: string } {
  if (!notes.trim()) return { display: '—' }
  const full = notes.trim()
  if (full.length <= NOTES_MAX) return { display: full }
  return { display: truncateText(full, NOTES_MAX), full }
}

function entryToRow(entry: PottyEntryPdf): PottyWeekRow {
  const notesCell = formatNotesCell(entry.notes)
  return {
    dateShort: shortDateLabel(entry.dateYmd),
    time: compactTimeMs(entry.atMs),
    result: entry.result,
    location: entry.location,
    status: entry.status,
    notes: notesCell.display,
    notesFull: notesCell.full,
  }
}

function buildWeekPdf(weekStart: string, entries: PottyEntryPdf[]): PottyWeekPdf {
  const sorted = [...entries].sort((a, b) => a.atMs - b.atMs)
  const rows = sorted.map(entryToRow)
  const notesAppendix = rows
    .filter((row) => row.notesFull)
    .map((row) => ({ dateShort: `${row.dateShort} ${row.time}`, full: row.notesFull! }))

  return {
    weekStartYmd: weekStart,
    weekLabel: weekLabel(weekStart, sorted),
    statsLine: buildWeekStatsLine(sorted),
    highlights: buildHighlights(sorted),
    rows,
    notesAppendix,
  }
}

function groupEntriesByWeek(entries: PottyEntryPdf[]): PottyWeekPdf[] {
  const map = new Map<string, PottyEntryPdf[]>()
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

function buildAggregates(entries: PottyEntryPdf[]): PottyPdfAggregates {
  const success = entries.filter((e) => e.isSuccess).length
  const accidents = entries.filter((e) => e.result === 'Accident').length
  return {
    visitCount: entries.length,
    successPct: pct(success, entries.length),
    accidentPct: pct(accidents, entries.length),
    teethingPct: pct(
      entries.filter((e) => e.status.includes('Teething')).length,
      entries.length,
    ),
    sickPct: pct(entries.filter((e) => e.status.includes('Sick')).length, entries.length),
  }
}

function periodLabelFromWeeks(weeks: PottyWeekPdf[]): string {
  if (!weeks.length) return 'No potty logs'
  if (weeks.length === 1) return weeks[0].weekLabel
  return `${weeks[0].weekLabel} – ${weeks[weeks.length - 1].weekLabel}`
}

export function filterPottyLogsForPdf(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
): LogRecord[] {
  return logs
    .filter((log) => log.kind === 'potty')
    .filter((log) => !selectedBabyId || diaperLogMatchesBaby(log, selectedBabyId, babies))
    .sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export function buildPottyPdfContent(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
  caregiverName: string,
): PottyPdfContent {
  const filtered = filterPottyLogsForPdf(logs, babies, selectedBabyId)
  const entries = filtered.map(logToEntry).filter((e): e is PottyEntryPdf => e != null)
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
