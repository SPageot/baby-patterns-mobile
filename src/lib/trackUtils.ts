import { formatDiaperContents, getDiaperLogMeta } from './diaperFeedUtils'
import { isoLocalYmd } from './dateUtils'
import { BABYLOG_STORAGE_KEY, type LogKind, type LogRecord } from '../types/babyLog'

export { formatWhen, isoLocalYmd } from './dateUtils'

/** Stable unique key for list rendering (avoids duplicate `id` from API). */
export function logRecordKey(log: LogRecord, index: number): string {
  const id = log.id?.trim()
  if (id) return `${log.kind}-${id}`
  return `${log.kind}-${log.atIso}-${index}`
}

export function nowLocalInputValue() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function nowLocalDateValue() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function utcPad(n: number) {
  return String(n).padStart(2, '0')
}

function formatUtcInputFromDate(d: Date) {
  return `${d.getUTCFullYear()}-${utcPad(d.getUTCMonth() + 1)}-${utcPad(d.getUTCDate())}T${utcPad(d.getUTCHours())}:${utcPad(d.getUTCMinutes())}`
}

function formatUtcDateFromDate(d: Date) {
  return `${d.getUTCFullYear()}-${utcPad(d.getUTCMonth() + 1)}-${utcPad(d.getUTCDate())}`
}

export function nowUtcInputValue(): string {
  return formatUtcInputFromDate(new Date())
}

export function nowUtcDateValue(): string {
  return formatUtcDateFromDate(new Date())
}

/** ISO instant → `datetime-local` value using UTC wall clock (`YYYY-MM-DDTHH:mm`). */
export function isoToDatetimeUtcValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return nowUtcInputValue()
  return formatUtcInputFromDate(d)
}

/** ISO instant → UTC calendar date `YYYY-MM-DD`. */
export function isoToUtcDateValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return nowUtcDateValue()
  return formatUtcDateFromDate(d)
}

/** `datetime-local`-style string interpreted as UTC → ISO `…Z`. */
export function datetimeUtcInputToIso(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return new Date().toISOString()

  const localStyle = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(trimmed)
  if (localStyle && !/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const d = new Date(
      Date.UTC(
        Number(localStyle[1]),
        Number(localStyle[2]) - 1,
        Number(localStyle[3]),
        Number(localStyle[4]),
        Number(localStyle[5]),
        0,
        0,
      ),
    )
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return new Date().toISOString()
}

/** Minutes between two UTC wall-clock `datetime-local` strings. */
export function minutesBetweenUtcDateTimeInputs(start: string, end: string) {
  const a = new Date(datetimeUtcInputToIso(start))
  const b = new Date(datetimeUtcInputToIso(end))
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000))
}

/** `YYYY-MM-DD` → ISO at local noon (stable sort within a day, avoids UTC date shift). */
export function dateYmdToLocalNoonIso(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return new Date().toISOString()
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  return new Date(y, mo - 1, d, 12, 0, 0).toISOString()
}

function titleCase(s: string) {
  if (!s) return s
  return s[0].toUpperCase() + s.slice(1).toLowerCase()
}

const FEEDING_TYPE_LABELS: Record<string, string> = {
  breast: 'Breastfeed',
  bottle: 'Bottle',
  solids: 'Solids',
  snack: 'Snack',
}

/** Local `YYYY-MM-DD` (date input) → UTC calendar `YYYY-MM-DD`. */
export function localDateYmdToUtcYmd(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return ymd.trim()
  const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
  if (Number.isNaN(local.getTime())) return ymd.trim()
  return local.toISOString().slice(0, 10)
}

/** Parse `sleepDuration` from API minutes string or `HH:MM:SS` / `H:MM:SS`. */
export function parseSleepDurationMinutes(value: string): number {
  const s = value.trim()
  if (!s) return 0
  const n = Number(s)
  if (Number.isFinite(n) && !s.includes(':')) return Math.max(0, Math.round(n))
  const parts = s.split(':').map((p) => Number(p))
  if (parts.length >= 2 && parts.every((p) => Number.isFinite(p))) {
    const [h, m, sec = 0] = parts
    return Math.max(0, Math.round(h * 60 + m + sec / 60))
  }
  return 0
}

/** Total minutes → .NET TimeSpan-style `HH:MM:SS` (e.g. `"08:30:00"`). */
export function minutesToTimeSpanHms(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:00`
}

/** UTC calendar `YYYY-MM-DD` → local `YYYY-MM-DD` for date inputs. */
export function utcDateYmdToLocalYmd(utcYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(utcYmd.trim())
  if (!m) return utcYmd.trim()
  const utc = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0))
  if (Number.isNaN(utc.getTime())) return utcYmd.trim()
  return isoLocalYmd(utc.toISOString())
}

export function formatLogSummary(l: LogRecord): string {
  if (l.kind === 'feeding') {
    const d = l.details
    const typeKey = (d.feedingType ?? '').trim()
    const label = FEEDING_TYPE_LABELS[typeKey] ?? titleCase(typeKey || 'Feed')
    const parts = [label]
    if (d.amountOz?.trim()) parts.push(`${d.amountOz.trim()} oz`)
    if (d.durationMin?.trim()) {
      const n = Number(d.durationMin)
      if (Number.isFinite(n) && n > 0) parts.push(`${n} min`)
    }
    if (d.notes?.trim()) parts.push(d.notes.trim())
    if (d.isTeething === 'true') parts.push('Teething')
    if (d.isSick === 'true') parts.push('Sick')
    return parts.join(' · ')
  }
  if (l.kind === 'diaper') {
    const d = l.details
    const parts = [formatDiaperContents(d)]
    for (const item of getDiaperLogMeta(d)) {
      parts.push(item.label === 'Size' ? `Size ${item.value}` : item.value)
    }
    return parts.filter(Boolean).join(' · ')
  }
  if (l.kind === 'sleep') {
    const d = l.details
    if (d.sleepStartTime && d.sleepEndTime) {
      const parts: string[] = []
      const n =
        d.sleepDuration != null && d.sleepDuration !== ''
          ? parseSleepDurationMinutes(d.sleepDuration)
          : NaN
      if (Number.isFinite(n) && n > 0) {
        if (n < 60) parts.push(`${n} min`)
        else {
          const h = Math.floor(n / 60)
          const m = n % 60
          parts.push(m > 0 ? `${h}h ${m}m` : `${h}h`)
        }
      } else {
        const s = d.sleepStartTime || d.start
        const e = d.sleepEndTime || d.end
        if (s && e) {
          const min = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000)
          if (Number.isFinite(min) && min > 0) {
            if (min < 60) parts.push(`${min} min`)
            else {
              const h = Math.floor(min / 60)
              const m = min % 60
              parts.push(m > 0 ? `${h}h ${m}m` : `${h}h`)
            }
          }
        }
      }
      if (d.sleepMood?.trim()) parts.push(d.sleepMood.trim())
      if (d.sleepEnvironment?.trim()) parts.push(d.sleepEnvironment.trim())
      if (d.isTeething === 'true') parts.push('Teething')
      if (d.isSick === 'true') parts.push('Sick')
      return parts.length ? parts.join(' · ') : 'Sleep'
    }
  }
  const start = l.details.start
  const end = l.details.end
  if (start && end) {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (!Number.isNaN(ms) && ms >= 0) {
      const min = Math.round(ms / 60000)
      if (min < 1) return 'under 1 min'
      if (min < 60) return `${min} min`
      const h = Math.floor(min / 60)
      const m = min % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
  }
  if (l.kind === 'sleep') {
    return 'session'
  }
  return '—'
}

export function minutesBetweenDateTimeLocal(start: string, end: string) {
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000))
}

export function formatMinutesHuman(min: number) {
  if (min < 1) return 'under 1 min'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function loadLocalLogs(): LogRecord[] {
  try {
    const raw = localStorage.getItem(BABYLOG_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return (parsed as LogRecord[]).filter((l) => l.kind === 'diaper')
  } catch {
    return []
  }
}

export function saveLocalLogs(logs: LogRecord[]) {
  const localOnly = logs.filter((l) => l.kind === 'diaper')
  localStorage.setItem(BABYLOG_STORAGE_KEY, JSON.stringify(localOnly))
}

export function isoToDatetimeLocalValue(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return nowLocalInputValue()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function todayCount(logs: LogRecord[], kind: LogKind) {
  return filterLogsForToday(logs, kind).length
}

/** Logs whose local calendar day matches today (same rules as the track page counters). */
export function filterLogsForToday(logs: LogRecord[], kind: LogKind): LogRecord[] {
  const ymd = nowLocalDateValue()
  return logs.filter((l) => {
    if (l.kind !== kind) return false
    const day = kind === 'sleep' ? sleepLogDayKey(l) : isoLocalYmd(l.atIso)
    return day === ymd
  })
}

function monthPrefix(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Calendar month key `YYYY-MM` for a log row. */
export function logMonthKey(log: LogRecord): string {
  if (log.kind === 'sleep') {
    const day = sleepLogDayKey(log)
    return day ? day.slice(0, 7) : ''
  }
  const ymd = isoLocalYmd(log.atIso)
  return ymd ? ymd.slice(0, 7) : ''
}

/** True when an ISO instant falls in the local calendar month. */
export function isoInLocalMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d.getFullYear() === year && d.getMonth() + 1 === month
}

export function monthCount(logs: LogRecord[], kind: LogKind, year: number, month: number) {
  const prefix = monthPrefix(year, month)
  let n = 0
  for (const l of logs) {
    if (l.kind !== kind) continue
    if (kind === 'sleep') {
      const day = sleepLogDayKey(l)
      if (!day.startsWith(prefix)) continue
    } else if (logMonthKey(l) !== prefix) {
      continue
    }
    n += 1
  }
  return n
}

/** Sleep duration in minutes for a single log row. */
export function logSleepDurationMinutes(log: LogRecord): number {
  if (log.kind !== 'sleep') return 0
  const d = log.details
  const fromField =
    d.sleepDuration != null && d.sleepDuration !== ''
      ? parseSleepDurationMinutes(d.sleepDuration)
      : NaN
  if (Number.isFinite(fromField) && fromField > 0) return fromField

  const start = d.sleepStartTime || d.start
  const end = d.sleepEndTime || d.end
  if (start && end) {
    const min = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    if (Number.isFinite(min) && min > 0) return min
  }
  return 0
}

/**
 * Local calendar day `YYYY-MM-DD` for a sleep log.
 * Uses wake time (end) so overnight sleep and same-day naps land on one calendar day.
 */
export function sleepLogDayKey(log: LogRecord): string {
  const end = log.details.sleepEndTime || log.details.end
  if (end) {
    const day = isoLocalYmd(end)
    if (day) return day
  }
  const sleepDate = log.details.sleepDate?.trim()
  if (sleepDate && /^\d{4}-\d{2}-\d{2}/.test(sleepDate)) {
    return utcDateYmdToLocalYmd(sleepDate.slice(0, 10))
  }
  const start = log.details.sleepStartTime || log.details.start || log.atIso
  return isoLocalYmd(start) || isoLocalYmd(log.atIso)
}

export function ymdFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYmd(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`)
}

export function formatDayLabel(ymd: string, style: 'short' | 'long' = 'short'): string {
  const d = parseYmd(ymd)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(
    undefined,
    style === 'long'
      ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
      : { weekday: 'short', month: 'short', day: 'numeric' },
  )
}

export type DailyKindCounts = {
  date: string
  label: string
  diapers: number
  sleep: number
  sleepMinutes: number
  feeding: number
}

export function emptyDailyCounts(date: string): DailyKindCounts {
  return { date, label: formatDayLabel(date), diapers: 0, sleep: 0, sleepMinutes: 0, feeding: 0 }
}

/** Map `YYYY-MM-DD` → combined daily counts (sleep minutes combined per day). */
export function buildDailyCountsMap(logs: LogRecord[]): Map<string, DailyKindCounts> {
  const byDate = new Map<
    string,
    { diapers: number; sleep: number; sleepMinutes: number; feeding: number }
  >()

  for (const l of logs) {
    if (l.kind === 'sleep') {
      const day = sleepLogDayKey(l)
      if (!day) continue
      const entry = byDate.get(day) ?? { diapers: 0, sleep: 0, sleepMinutes: 0, feeding: 0 }
      entry.sleep += 1
      entry.sleepMinutes += logSleepDurationMinutes(l)
      byDate.set(day, entry)
      continue
    }

    const day = l.kind === 'diaper' || l.kind === 'feeding' ? isoLocalYmd(l.atIso) : ''
    if (!day) continue
    const entry = byDate.get(day) ?? { diapers: 0, sleep: 0, sleepMinutes: 0, feeding: 0 }
    if (l.kind === 'diaper') entry.diapers += 1
    else if (l.kind === 'feeding') entry.feeding += 1
    byDate.set(day, entry)
  }

  const result = new Map<string, DailyKindCounts>()
  for (const [date, counts] of byDate) {
    result.set(date, { date, label: formatDayLabel(date), ...counts })
  }
  return result
}

export function getDailyCounts(
  map: Map<string, DailyKindCounts>,
  ymd: string,
): DailyKindCounts {
  return map.get(ymd) ?? emptyDailyCounts(ymd)
}

export function startOfWeekMonday(d = new Date()): Date {
  const sod = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const mondayOffset = (sod.getDay() + 6) % 7
  return new Date(sod.getFullYear(), sod.getMonth(), sod.getDate() - mondayOffset)
}

export function addCalendarDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

export function daysInMonthForAvg(year: number, month: number, now = new Date()): number {
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month
  if (isCurrentMonth) return Math.max(1, now.getDate())
  return new Date(year, month, 0).getDate()
}

export function monthAvgPerDay(
  logs: LogRecord[],
  kind: LogKind,
  year: number,
  month: number,
  now = new Date(),
): number {
  const total = monthCount(logs, kind, year, month)
  const days = daysInMonthForAvg(year, month, now)
  if (days <= 0) return 0
  return Math.round((total / days) * 10) / 10
}

export function formatAvgPerDay(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

export function monthSleepMinutesTotal(
  logs: LogRecord[],
  year: number,
  month: number,
): number {
  const prefix = monthPrefix(year, month)
  let total = 0
  for (const l of logs) {
    if (l.kind !== 'sleep') continue
    const day = sleepLogDayKey(l)
    if (!day.startsWith(prefix)) continue
    total += logSleepDurationMinutes(l)
  }
  return total
}

export function monthSleepMinutesAvgPerDay(
  logs: LogRecord[],
  year: number,
  month: number,
  now = new Date(),
): number {
  const total = monthSleepMinutesTotal(logs, year, month)
  const days = daysInMonthForAvg(year, month, now)
  if (days <= 0) return 0
  return Math.round(total / days)
}

export type PeriodSummary = {
  dayCount: number
  diapers: { total: number; avgPerDay: number }
  sleepMinutes: { total: number; avgPerDay: number }
  feeding: { total: number; avgPerDay: number }
}

export function summarizePeriod(counts: DailyKindCounts[]): PeriodSummary {
  const dayCount = Math.max(1, counts.length)
  let diapers = 0
  let sleepMinutes = 0
  let feeding = 0

  for (const c of counts) {
    diapers += c.diapers
    sleepMinutes += c.sleepMinutes
    feeding += c.feeding
  }

  return {
    dayCount,
    diapers: {
      total: diapers,
      avgPerDay: Math.round((diapers / dayCount) * 10) / 10,
    },
    sleepMinutes: {
      total: sleepMinutes,
      avgPerDay: Math.round(sleepMinutes / dayCount),
    },
    feeding: {
      total: feeding,
      avgPerDay: Math.round((feeding / dayCount) * 10) / 10,
    },
  }
}

export function formatSleepDurationShort(minutes: number): string {
  if (minutes <= 0) return '0h'
  return formatMinutesHuman(minutes)
}

export function currentMonthLabel() {
  return new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

export function kindLabel(kind: LogKind) {
  if (kind === 'diaper') return 'Diaper'
  if (kind === 'feeding') return 'Feed'
  return 'Sleep'
}
