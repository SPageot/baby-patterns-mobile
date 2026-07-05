import type { Baby } from '@/schemas/user'
import type { LogRecord, SleepLogCreate, SleepWakeUp } from '@/types/babyLog'
import { sleepLogFromDetails } from '@/types/babyLog'
import { diaperLogMatchesBaby } from './diaperFeedUtils'
import {
  HOW_FELL_ASLEEP,
  PRE_SLEEP_ACTIVITIES,
  SLEEP_EXTRA_TAGS,
  SLEEP_QUALITY,
  WAKE_UP_REASONS,
  sleepOptionLabel,
} from './sleepLogOptions'
import {
  formatMinutesHuman,
  parseSleepDurationMinutes,
  parseYmd,
  startOfWeekMonday,
  ymdFromDate,
} from './trackUtils'

export type SleepNightFlag = 'teething' | 'sick' | 'nap' | 'fragmented'

export type SleepNightWakeUp = {
  timeMs: number
  timeLabel: string
  durationMinutes: number
  reason?: string
  reasonLabel: string
}

export type SleepNightPdf = {
  logId: string
  dateYmd: string
  dateLabel: string
  startMs: number
  endMs: number
  startLabel: string
  endLabel: string
  durationMinutes: number
  durationLabel: string
  quality?: string
  qualityLabel: string
  flags: SleepNightFlag[]
  wakeUps: SleepNightWakeUp[]
  preSleepActivity: string[]
  preSleepActivityLabels: string[]
  environment: string
  extraTags: string[]
  extraTagLabels: string[]
  sleepMood: string
  howFellAsleep?: string
  howFellAsleepLabel: string
  notes?: string
  inProgress: boolean
}

export type SleepWeekRow = {
  dateShort: string
  sleepWindow: string
  qualityLabel: string
  fellAsleep: string
  wakeUps: string
  notes: string
  notesFull?: string
}

export type SleepPdfHighlights = {
  leastSleep: string
  mostSleep: string
  leastNapDays: string
  mostNapDays: string
}

export type SleepWeekPdf = {
  weekStartYmd: string
  weekLabel: string
  statsLine: string
  highlights: SleepPdfHighlights
  rows: SleepWeekRow[]
  notesAppendix: { dateShort: string; full: string }[]
}

export type SleepPdfAggregates = {
  avgDurationLabel: string
  avgWakeUps: string
  teethingPct: string
  sickPct: string
  nightCount: number
}

export type SleepPdfContent = {
  babyName: string
  caregiverName: string
  generatedLabel: string
  periodLabel: string
  aggregates: SleepPdfAggregates
  highlights: SleepPdfHighlights
  weeks: SleepWeekPdf[]
}

const FLAG_EMOJI: Record<SleepNightFlag, string> = {
  teething: '🦷',
  sick: '🤒',
  nap: '☀️',
  fragmented: '〰️',
}

const HOW_SHORT: Record<string, string> = {
  breastfeeding: 'BF',
  bottle: 'Bottle',
  rocked: 'Rocked',
  'self-soothed': 'Self',
  stroller: 'Stroller',
  car: 'Car',
  other: 'Other',
}

const NOTES_MAX = 28
const REASON_MAX = 6
const WAKEUPS_MAX = 36

function formatTimeLabel(ms: number): string {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
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

function compactDuration(minutes: number): string {
  if (minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

function shortDateLabel(ymd: string): string {
  const d = parseYmd(ymd)
  if (Number.isNaN(d.getTime())) return ymd.slice(5).replace('-', '/')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function truncateText(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1))}…`
}

function truncateReason(label: string): string {
  if (!label || label === '—') return ''
  const lower = label.toLowerCase().replace(/\s+/g, '')
  return truncateText(lower, REASON_MAX)
}

function formatDateLabel(ymd: string, startMs: number): string {
  const d = new Date(startMs)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return ymd
}

function durationMinutesFromFields(fields: SleepLogCreate): number {
  const fromField = parseSleepDurationMinutes(fields.sleepDuration)
  if (Number.isFinite(fromField) && fromField > 0) return fromField

  const start = new Date(fields.sleepStartTime).getTime()
  const end = fields.sleepEndTime?.trim() ? new Date(fields.sleepEndTime).getTime() : NaN
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    return Math.round((end - start) / 60000)
  }
  return 0
}

function wakeUpsFromFields(
  fields: SleepLogCreate,
  startMs: number,
  endMs: number,
): SleepNightWakeUp[] {
  if (!fields.wakeUps?.length) return []

  return fields.wakeUps
    .map((row: SleepWakeUp) => {
      const timeMs = new Date(row.time).getTime()
      return {
        timeMs: Number.isFinite(timeMs) ? timeMs : startMs,
        timeLabel: formatTimeLabel(timeMs),
        durationMinutes: Math.max(0, Math.round(row.durationMinutes ?? 0)),
        reason: row.reason?.trim() || undefined,
        reasonLabel: sleepOptionLabel(WAKE_UP_REASONS, row.reason ?? '') || row.reason?.trim() || '—',
      }
    })
    .filter((row) => Number.isFinite(row.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs)
    .filter((row) => !endMs || row.timeMs <= endMs + 60000)
}

function extraTagsFromFields(fields: SleepLogCreate): string[] {
  const tags = fields.tags ?? []
  return tags.filter((tag) => tag !== 'teething' && tag !== 'sick')
}

function logToNight(log: LogRecord): SleepNightPdf | null {
  const fields = sleepLogFromDetails(log.details, log.atIso)
  const startMs = new Date(fields.sleepStartTime).getTime()
  if (!Number.isFinite(startMs)) return null

  const hasEnd = Boolean(fields.sleepEndTime?.trim())
  const endMs = hasEnd ? new Date(fields.sleepEndTime).getTime() : startMs
  const inProgress = !hasEnd || !Number.isFinite(endMs)
  const durationMinutes = inProgress ? 0 : durationMinutesFromFields(fields)

  const flags: SleepNightFlag[] = []
  if (fields.isTeething) flags.push('teething')
  if (fields.isSick) flags.push('sick')
  if (fields.isNap) flags.push('nap')
  if (fields.isNightSleepFragmented) flags.push('fragmented')

  const extraTags = extraTagsFromFields(fields)

  return {
    logId: log.id,
    dateYmd: fields.sleepDate,
    dateLabel: formatDateLabel(fields.sleepDate, startMs),
    startMs,
    endMs: inProgress ? startMs : endMs,
    startLabel: formatTimeLabel(startMs),
    endLabel: inProgress ? 'In progress' : formatTimeLabel(endMs),
    durationMinutes,
    durationLabel: inProgress ? 'In progress' : formatMinutesHuman(durationMinutes),
    quality: fields.quality,
    qualityLabel: sleepOptionLabel(SLEEP_QUALITY, fields.quality ?? '') || fields.quality?.trim() || '—',
    flags,
    wakeUps: wakeUpsFromFields(fields, startMs, inProgress ? startMs : endMs),
    preSleepActivity: fields.preSleepActivity ?? [],
    preSleepActivityLabels: (fields.preSleepActivity ?? []).map((v) =>
      sleepOptionLabel(PRE_SLEEP_ACTIVITIES, v),
    ),
    environment: fields.sleepEnvironment?.trim() || '—',
    extraTags,
    extraTagLabels: extraTags.map((v) => sleepOptionLabel(SLEEP_EXTRA_TAGS, v) || v),
    sleepMood: fields.sleepMood?.trim() || '—',
    howFellAsleep: fields.howFellAsleep,
    howFellAsleepLabel:
      sleepOptionLabel(HOW_FELL_ASLEEP, fields.howFellAsleep ?? '') ||
      fields.howFellAsleep?.trim() ||
      '—',
    notes: fields.notes?.trim() || undefined,
    inProgress,
  }
}

function pct(count: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((count / total) * 100)}%`
}

function weekStartYmd(ymd: string): string {
  return ymdFromDate(startOfWeekMonday(parseYmd(ymd)))
}

function weekLabel(weekStartYmdValue: string, nights: SleepNightPdf[]): string {
  const start = parseYmd(weekStartYmdValue)
  const endYmd = nights.reduce((max, n) => (n.dateYmd > max ? n.dateYmd : max), weekStartYmdValue)
  const end = parseYmd(endYmd)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (Number.isNaN(start.getTime())) return `Week of ${weekStartYmdValue}`
  if (ymdFromDate(start) === endYmd) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

function isNapNight(night: SleepNightPdf): boolean {
  return night.flags.includes('nap')
}

function buildHighlights(nights: SleepNightPdf[]): SleepPdfHighlights {
  const completed = nights.filter((n) => !n.inProgress && n.durationMinutes > 0)

  let leastSleep = '—'
  let mostSleep = '—'
  if (completed.length) {
    const shortest = completed.reduce((a, b) => (a.durationMinutes <= b.durationMinutes ? a : b))
    const longest = completed.reduce((a, b) => (a.durationMinutes >= b.durationMinutes ? a : b))
    leastSleep = `${shortDateLabel(shortest.dateYmd)} · ${compactDuration(shortest.durationMinutes)}`
    mostSleep = `${shortDateLabel(longest.dateYmd)} · ${compactDuration(longest.durationMinutes)}`
  }

  const napCountByDay = new Map<string, number>()
  for (const day of new Set(nights.map((n) => n.dateYmd))) {
    napCountByDay.set(day, 0)
  }
  for (const night of nights) {
    if (!isNapNight(night)) continue
    napCountByDay.set(night.dateYmd, (napCountByDay.get(night.dateYmd) ?? 0) + 1)
  }

  let leastNapDays = '—'
  let mostNapDays = '—'
  if (napCountByDay.size > 0) {
    const entries = [...napCountByDay.entries()]
    const fewest = entries.reduce((a, b) => (a[1] <= b[1] ? a : b))
    const most = entries.reduce((a, b) => (a[1] >= b[1] ? a : b))
    leastNapDays = `${shortDateLabel(fewest[0])} (${fewest[1]} nap${fewest[1] === 1 ? '' : 's'})`
    mostNapDays = `${shortDateLabel(most[0])} (${most[1]} nap${most[1] === 1 ? '' : 's'})`
  }

  return { leastSleep, mostSleep, leastNapDays, mostNapDays }
}

function buildWeekStatsLine(nights: SleepNightPdf[]): string {
  const completed = nights.filter((n) => !n.inProgress && n.durationMinutes > 0)
  const avgMin =
    completed.length > 0
      ? Math.round(completed.reduce((sum, n) => sum + n.durationMinutes, 0) / completed.length)
      : 0
  const wakeTotal = nights.reduce((sum, n) => sum + n.wakeUps.length, 0)
  const avgWake = nights.length ? (wakeTotal / nights.length).toFixed(1) : '—'
  const teething = pct(nights.filter((n) => n.flags.includes('teething')).length, nights.length)
  const sick = pct(nights.filter((n) => n.flags.includes('sick')).length, nights.length)

  return [
    `Avg ${completed.length ? compactDuration(avgMin) : '—'}`,
    `${avgWake} wake-ups/night`,
    `${teething} teething`,
    `${sick} sick`,
  ].join(' · ')
}

export function formatSleepWindowCell(night: SleepNightPdf): string {
  if (night.inProgress) {
    return `${compactTimeMs(night.startMs)}–…\nIn progress`
  }
  return `${compactTimeMs(night.startMs)}–${compactTimeMs(night.endMs)}\n${compactDuration(night.durationMinutes)}`
}

export function formatWakeUpsInline(wakeUps: SleepNightWakeUp[]): string {
  if (!wakeUps.length) return '—'

  const segments = wakeUps.map((wake) => {
    const time = compactTimeMs(wake.timeMs)
    const reason = truncateReason(wake.reasonLabel)
    const dur = wake.durationMinutes > 0 ? `${wake.durationMinutes}m` : ''
    if (dur && reason) return `${dur}@${time}-${reason}`
    if (dur) return `${dur}@${time}`
    if (reason) return `@${time}-${reason}`
    return `@${time}`
  })

  return `${wakeUps.length} (${segments.join(', ')})`
}

export function formatFlagsEmoji(flags: SleepNightFlag[]): string {
  if (!flags.length) return ''
  const order: SleepNightFlag[] = ['teething', 'sick', 'nap', 'fragmented']
  return order.filter((f) => flags.includes(f)).map((f) => FLAG_EMOJI[f]).join('')
}

export function formatFellAsleepShort(night: SleepNightPdf): string {
  const key = night.howFellAsleep?.trim().toLowerCase()
  if (key && HOW_SHORT[key]) return HOW_SHORT[key]
  if (night.howFellAsleepLabel && night.howFellAsleepLabel !== '—') {
    return truncateText(night.howFellAsleepLabel, 10)
  }
  return '—'
}

function formatNotesCell(notes?: string): { display: string; full?: string } {
  if (!notes?.trim()) return { display: '—' }
  const full = notes.trim()
  if (full.length <= NOTES_MAX) return { display: full }
  return { display: truncateText(full, NOTES_MAX), full }
}

function nightToRow(night: SleepNightPdf): SleepWeekRow {
  const notesCell = formatNotesCell(night.notes)
  const wakeUps = formatWakeUpsInline(night.wakeUps)
  return {
    dateShort: shortDateLabel(night.dateYmd),
    sleepWindow: formatSleepWindowCell(night),
    qualityLabel: night.qualityLabel !== '—' ? night.qualityLabel : '—',
    fellAsleep: formatFellAsleepShort(night),
    wakeUps: wakeUps.length > WAKEUPS_MAX ? truncateText(wakeUps, WAKEUPS_MAX) : wakeUps,
    notes: notesCell.display,
    notesFull: notesCell.full,
  }
}

function buildWeekPdf(weekStart: string, nights: SleepNightPdf[]): SleepWeekPdf {
  const sorted = [...nights].sort((a, b) => a.dateYmd.localeCompare(b.dateYmd))
  const rows = sorted.map(nightToRow)
  const notesAppendix = rows
    .filter((row) => row.notesFull)
    .map((row) => ({ dateShort: row.dateShort, full: row.notesFull! }))

  return {
    weekStartYmd: weekStart,
    weekLabel: weekLabel(weekStart, sorted),
    statsLine: buildWeekStatsLine(sorted),
    highlights: buildHighlights(sorted),
    rows,
    notesAppendix,
  }
}

function groupNightsByWeek(nights: SleepNightPdf[]): SleepWeekPdf[] {
  const map = new Map<string, SleepNightPdf[]>()
  for (const night of nights) {
    const key = weekStartYmd(night.dateYmd)
    const list = map.get(key) ?? []
    list.push(night)
    map.set(key, list)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekNights]) => buildWeekPdf(weekStart, weekNights))
}

function buildAggregates(nights: SleepNightPdf[]): SleepPdfAggregates {
  const completed = nights.filter((n) => !n.inProgress && n.durationMinutes > 0)
  const avgMin =
    completed.length > 0
      ? Math.round(completed.reduce((sum, n) => sum + n.durationMinutes, 0) / completed.length)
      : 0
  const wakeTotal = nights.reduce((sum, n) => sum + n.wakeUps.length, 0)

  return {
    avgDurationLabel: completed.length ? formatMinutesHuman(avgMin) : '—',
    avgWakeUps: nights.length ? (wakeTotal / nights.length).toFixed(1) : '—',
    teethingPct: pct(nights.filter((n) => n.flags.includes('teething')).length, nights.length),
    sickPct: pct(nights.filter((n) => n.flags.includes('sick')).length, nights.length),
    nightCount: nights.length,
  }
}

function periodLabelFromWeeks(weeks: SleepWeekPdf[]): string {
  if (!weeks.length) return 'No sleep logs'
  if (weeks.length === 1) return weeks[0].weekLabel
  return `${weeks[0].weekLabel} – ${weeks[weeks.length - 1].weekLabel}`
}

export function filterSleepLogsForPdf(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
): LogRecord[] {
  return logs
    .filter((log) => log.kind === 'sleep')
    .filter((log) => !selectedBabyId || diaperLogMatchesBaby(log, selectedBabyId, babies))
    .sort((a, b) => {
      const aStart = a.details.sleepStartTime || a.atIso
      const bStart = b.details.sleepStartTime || b.atIso
      return aStart < bStart ? 1 : -1
    })
}

export function buildSleepPdfContent(
  logs: LogRecord[],
  babies: Baby[],
  selectedBabyId: string,
  caregiverName: string,
): SleepPdfContent {
  const filtered = filterSleepLogsForPdf(logs, babies, selectedBabyId)
  const nights = filtered.map(logToNight).filter((n): n is SleepNightPdf => n != null)
  const weeks = groupNightsByWeek(nights)

  const babyName =
    (selectedBabyId
      ? babies.find((b) => b.id === selectedBabyId)?.fullName?.trim()
      : babies.map((b) => b.fullName?.trim()).filter(Boolean).join(', ')) || 'Baby'

  return {
    babyName,
    caregiverName: caregiverName.trim() || 'Caregiver',
    generatedLabel: new Date().toLocaleString(),
    periodLabel: periodLabelFromWeeks(weeks),
    aggregates: buildAggregates(nights),
    highlights: buildHighlights(nights),
    weeks,
  }
}

export function qualityRgb(quality?: string): [number, number, number] {
  const q = quality?.trim().toLowerCase()
  if (q === 'excellent' || q === 'good') return [74, 154, 114]
  if (q === 'fair') return [212, 168, 75]
  if (q === 'poor') return [196, 92, 122]
  return [190, 186, 198]
}
