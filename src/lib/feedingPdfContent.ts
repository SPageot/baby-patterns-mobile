import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { feedingLogFromDetails } from '@/types/babyLog'
import { diaperLogMatchesBaby } from './diaperFeedUtils'
import { feedingLogDateYmd, feedingTypeLabel } from './feedingLogUtils'
import { isoLocalYmd, parseYmd, startOfWeekMonday, ymdFromDate } from './trackUtils'

export type FeedingEntryPdf = {
  logId: string
  dateYmd: string
  atMs: number
  type: string
  amount: string
  duration: string
  status: string
  notes: string
  isBottle: boolean
}

export type FeedingWeekRow = {
  dateShort: string
  time: string
  type: string
  amount: string
  duration: string
  status: string
  notes: string
  notesFull?: string
}

export type FeedingPdfHighlights = {
  leastFeeds: string
  mostFeeds: string
  leastBottleDays: string
  mostBottleDays: string
}

export type FeedingWeekPdf = {
  weekStartYmd: string
  weekLabel: string
  statsLine: string
  highlights: FeedingPdfHighlights
  rows: FeedingWeekRow[]
  notesAppendix: { dateShort: string; full: string }[]
}

export type FeedingPdfAggregates = {
  feedCount: number
  breastPct: string
  bottlePct: string
  solidsPct: string
  teethingPct: string
}

export type FeedingPdfContent = {
  babyName: string
  caregiverName: string
  generatedLabel: string
  periodLabel: string
  aggregates: FeedingPdfAggregates
  highlights: FeedingPdfHighlights
  weeks: FeedingWeekPdf[]
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

function weekLabel(weekStartYmdValue: string, entries: FeedingEntryPdf[]): string {
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

function formatAmount(amountOz?: string): string {
  const raw = amountOz?.trim()
  if (!raw) return '—'
  return raw.endsWith('oz') ? raw : `${raw} oz`
}

function formatDuration(durationMin?: string): string {
  const raw = durationMin?.trim()
  if (!raw) return '—'
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)} min`
  return raw
}

function logToEntry(log: LogRecord): FeedingEntryPdf | null {
  if (log.kind !== 'feeding') return null
  const fields = feedingLogFromDetails(log.details, log.atIso)
  const atIso = fields.feedingAt || log.atIso
  const atMs = new Date(atIso).getTime()
  if (!Number.isFinite(atMs)) return null

  const typeKey = fields.feedingType?.trim().toLowerCase() || 'breast'

  return {
    logId: log.id,
    dateYmd: feedingLogDateYmd(log) || isoLocalYmd(atIso),
    atMs,
    type: feedingTypeLabel(typeKey),
    amount: formatAmount(fields.amountOz),
    duration: formatDuration(fields.durationMin),
    status: formatStatus(fields),
    notes: fields.notes?.trim() || '',
    isBottle: typeKey === 'bottle',
  }
}

function buildHighlights(entries: FeedingEntryPdf[]): FeedingPdfHighlights {
  const feedCountByDay = new Map<string, number>()
  const bottleCountByDay = new Map<string, number>()

  for (const entry of entries) {
    feedCountByDay.set(entry.dateYmd, (feedCountByDay.get(entry.dateYmd) ?? 0) + 1)
    if (entry.isBottle) {
      bottleCountByDay.set(entry.dateYmd, (bottleCountByDay.get(entry.dateYmd) ?? 0) + 1)
    }
  }

  let leastFeeds = '—'
  let mostFeeds = '—'
  if (feedCountByDay.size > 0) {
    const rows = [...feedCountByDay.entries()]
    const fewest = rows.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = rows.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastFeeds = `${shortDateLabel(fewest[0])} (${fewest[1]} feed${fewest[1] === 1 ? '' : 's'})`
    mostFeeds = `${shortDateLabel(most[0])} (${most[1]} feed${most[1] === 1 ? '' : 's'})`
  }

  let leastBottleDays = '—'
  let mostBottleDays = '—'
  if (feedCountByDay.size > 0) {
    for (const day of feedCountByDay.keys()) {
      if (!bottleCountByDay.has(day)) bottleCountByDay.set(day, 0)
    }
    const rows = [...bottleCountByDay.entries()]
    const fewest = rows.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = rows.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastBottleDays = `${shortDateLabel(fewest[0])} (${fewest[1]} bottle${fewest[1] === 1 ? '' : 's'})`
    mostBottleDays = `${shortDateLabel(most[0])} (${most[1]} bottle${most[1] === 1 ? '' : 's'})`
  }

  return { leastFeeds, mostFeeds, leastBottleDays, mostBottleDays }
}

function buildWeekStatsLine(entries: FeedingEntryPdf[]): string {
  if (!entries.length) return 'No feeds this week'

  const days = new Set(entries.map((e) => e.dateYmd)).size
  const avgPerDay = (entries.length / Math.max(days, 1)).toFixed(1)
  const breast = entries.filter((e) => e.type === 'Breastfeed').length
  const bottle = entries.filter((e) => e.isBottle).length
  const solids = entries.filter((e) => e.type === 'Solids' || e.type === 'Snack').length
  const teething = entries.filter((e) => e.status.includes('Teething')).length

  return [
    `Avg ${avgPerDay} feeds/day`,
    `${pct(breast, entries.length)} breast`,
    `${pct(bottle, entries.length)} bottle`,
    `${pct(solids, entries.length)} solids/snack`,
    `${pct(teething, entries.length)} teething`,
  ].join(' · ')
}

function formatNotesCell(notes: string): { display: string; full?: string } {
  if (!notes.trim()) return { display: '—' }
  const full = notes.trim()
  if (full.length <= NOTES_MAX) return { display: full }
  return { display: truncateText(full, NOTES_MAX), full }
}

function entryToRow(entry: FeedingEntryPdf): FeedingWeekRow {
  const notesCell = formatNotesCell(entry.notes)
  return {
    dateShort: shortDateLabel(entry.dateYmd),
    time: compactTimeMs(entry.atMs),
    type: entry.type,
    amount: entry.amount,
    duration: entry.duration,
    status: entry.status,
    notes: notesCell.display,
    notesFull: notesCell.full,
  }
}

function buildWeekPdf(weekStart: string, entries: FeedingEntryPdf[]): FeedingWeekPdf {
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

function groupEntriesByWeek(entries: FeedingEntryPdf[]): FeedingWeekPdf[] {
  const map = new Map<string, FeedingEntryPdf[]>()
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

function buildAggregates(entries: FeedingEntryPdf[]): FeedingPdfAggregates {
  const breast = entries.filter((e) => e.type === 'Breastfeed').length
  const bottle = entries.filter((e) => e.isBottle).length
  const solids = entries.filter((e) => e.type === 'Solids' || e.type === 'Snack').length
  return {
    feedCount: entries.length,
    breastPct: pct(breast, entries.length),
    bottlePct: pct(bottle, entries.length),
    solidsPct: pct(solids, entries.length),
    teethingPct: pct(
      entries.filter((e) => e.status.includes('Teething')).length,
      entries.length,
    ),
  }
}

function periodLabelFromWeeks(weeks: FeedingWeekPdf[]): string {
  if (!weeks.length) return 'No feeding logs'
  if (weeks.length === 1) return weeks[0].weekLabel
  return `${weeks[0].weekLabel} – ${weeks[weeks.length - 1].weekLabel}`
}

export function filterFeedingLogsForPdf(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
): LogRecord[] {
  return logs
    .filter((log) => log.kind === 'feeding')
    .filter((log) => !selectedBabyId || diaperLogMatchesBaby(log, selectedBabyId, babies))
    .sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export function buildFeedingPdfContent(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
  caregiverName: string,
): FeedingPdfContent {
  const filtered = filterFeedingLogsForPdf(logs, babies, selectedBabyId)
  const entries = filtered.map(logToEntry).filter((e): e is FeedingEntryPdf => e != null)
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
