import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { diaperLogMatchesBaby } from './diaperFeedUtils'
import { formatMinutesHuman, parseSleepDurationMinutes, sleepLogDayKey } from './trackUtils'

export type SleepLogFilters = {
  babyId: string
  dateYmd: string
}

export function sleepLogDateYmd(log: LogRecord): string {
  return sleepLogDayKey(log)
}

export function formatSleepUtcStamp(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' }
  return {
    date: d.toLocaleDateString(undefined, {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString(undefined, {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  }
}

export function formatSleepDurationDisplay(log: LogRecord): string {
  const d = log.details
  const fromField =
    d.sleepDuration != null && d.sleepDuration !== ''
      ? parseSleepDurationMinutes(d.sleepDuration)
      : NaN
  if (Number.isFinite(fromField) && fromField > 0) return formatMinutesHuman(fromField)

  const start = d.sleepStartTime || d.start
  const end = d.sleepEndTime || d.end
  if (start && end) {
    const min = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    if (Number.isFinite(min) && min > 0) return formatMinutesHuman(min)
  }
  if (start && !end) return 'In progress'
  return '—'
}

export function filterSleepLogs(
  logs: LogRecord[],
  filters: SleepLogFilters,
  babies: Baby[],
): LogRecord[] {
  return logs
    .filter((l) => l.kind === 'sleep')
    .filter((l) => diaperLogMatchesBaby(l, filters.babyId, babies))
    .filter((l) => !filters.dateYmd || sleepLogDateYmd(l) === filters.dateYmd)
    .sort((a, b) => {
      const aStart = a.details.sleepStartTime || a.atIso
      const bStart = b.details.sleepStartTime || b.atIso
      return aStart < bStart ? 1 : -1
    })
}
