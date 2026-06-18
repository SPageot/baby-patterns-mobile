export type LogKind = 'diaper' | 'feeding' | 'sleep'

/** Create/update payload for feeding logs. */
export type FeedingLogCreate = {
  /** breast | bottle | solids | snack */
  feedingType: string
  /** ISO-ish timestamp from datetime-local converted to UTC */
  feedingAt: string
  amountOz?: string
  durationMin?: string
  notes?: string
  isTeething?: boolean
  isSick?: boolean
}

/** Build a FeedingLogCreate from stored `LogRecord` details. */
export function feedingLogFromDetails(
  details: Record<string, string>,
  atIso: string,
): FeedingLogCreate {
  return {
    feedingType: details.feedingType?.trim() || 'breast',
    feedingAt: details.feedingAt?.trim() || atIso,
    amountOz: details.amountOz?.trim() || undefined,
    durationMin: details.durationMin?.trim() || undefined,
    notes: details.notes?.trim() || undefined,
    isTeething: details.isTeething === 'true',
    isSick: details.isSick === 'true',
  }
}

export type LogRecord = {
  id: string
  kind: LogKind
  atIso: string
  details: Record<string, string>
}

/** Matches create/update payload for a diaper log (Id omitted when creating). Stored as string values in `details` for localStorage. */
export type DiaperLogCreate = {
  isTherePee: boolean
  isTherePoop: boolean
  isThereAnythingElse: boolean
  anythingElseDescription: string | null
  /** UTC ISO 8601 on API; datetime-local string in the form before submit */
  time: string
  diaperBrand: string
  diaperSize: string
  diaperCreamUsed: string
  isTeething?: boolean
  isSick?: boolean
}

const BOOL = (v: string | undefined) => v === 'true'

function isoToLocalYmd(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Build a DiaperLogCreate from stored `LogRecord` details + row `atIso` (for legacy `lastChangeTime` rows). */
export function diaperLogFromDetails(
  details: Record<string, string>,
  atIso: string
): DiaperLogCreate {
  const time =
    details.time ||
    (details.lastChangeTime ? isoToLocalYmd(details.lastChangeTime) : '') ||
    isoToLocalYmd(atIso) ||
    ''
  return {
    isTherePee: BOOL(details.isTherePee),
    isTherePoop: BOOL(details.isTherePoop),
    isThereAnythingElse: BOOL(details.isThereAnythingElse),
    anythingElseDescription: details.anythingElseDescription?.trim() || null,
    time,
    diaperBrand: details.diaperBrand ?? '',
    diaperSize: details.diaperSize ?? '',
    diaperCreamUsed: details.diaperCreamUsed ?? '',
    isTeething: BOOL(details.isTeething),
    isSick: BOOL(details.isSick),
  }
}

/** Sleep log create payload. `sleepDuration` is sent as `HH:MM:SS` (e.g. `"08:30:00"`) for .NET `TimeSpan`. */
export type SleepLogCreate = {
  /** Local calendar date, `YYYY-MM-DD` (maps to C# `SleepDate` date component). */
  sleepDate: string
  /** Minutes while editing; converted to `HH:MM:SS` before POST/PUT. */
  sleepDuration: string
  sleepMood: string
  sleepStartTime: string
  sleepEndTime: string
  sleepEnvironment: string
  isTeething?: boolean
  isSick?: boolean
  isNap?: boolean
}

/** Build a SleepLogCreate from stored `LogRecord` details + `atIso` (legacy `start` / `end` supported). */
export function sleepLogFromDetails(details: Record<string, string>, atIso: string): SleepLogCreate {
  const startIso = details.sleepStartTime || details.start || ''
  const endIso = details.sleepEndTime || details.end || atIso
  const startD = startIso ? new Date(startIso) : null
  const endD = endIso ? new Date(endIso) : new Date(atIso)
  let durationMin = 0
  if (details.sleepDuration != null && details.sleepDuration !== '') {
    const n = Number(details.sleepDuration)
    if (Number.isFinite(n) && n >= 0) durationMin = Math.round(n)
  } else if (startD && endD && !Number.isNaN(startD.getTime()) && !Number.isNaN(endD.getTime())) {
    durationMin = Math.max(0, Math.round((endD.getTime() - startD.getTime()) / 60000))
  }
  const sleepDate =
    details.sleepDate ||
    (endIso
      ? isoToLocalYmd(endIso)
      : startIso
        ? isoToLocalYmd(startIso)
        : isoToLocalYmd(atIso)) ||
    ''
  return {
    sleepDate,
    sleepDuration: String(durationMin),
    sleepMood: details.sleepMood?.trim() ?? '',
    sleepStartTime: startIso || atIso,
    sleepEndTime: endIso,
    sleepEnvironment: details.sleepEnvironment?.trim() ?? '',
    isTeething: BOOL(details.isTeething),
    isSick: BOOL(details.isSick),
    isNap: BOOL(details.isNap),
  }
}

export const BABYLOG_STORAGE_KEY = 'babylog:logs:v1'
