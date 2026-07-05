export type LogKind = 'diaper' | 'feeding' | 'sleep' | 'potty'

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

/** Potty training log create/update payload. */
export type PottyLogCreate = {
  /** success | pee | poop | both | accident | dry_attempt */
  result: string
  loggedAt: string
  /** potty-chair | toilet | training-seat | other */
  location: string
  notes?: string | null
  isTeething?: boolean
  isSick?: boolean
}

export function pottyLogFromDetails(
  details: Record<string, string>,
  atIso: string,
): PottyLogCreate {
  const raw = details.result?.trim()
  const result = raw && raw !== 'success' ? raw : 'pee'
  return {
    result,
    loggedAt: details.loggedAt?.trim() || atIso,
    location: details.location?.trim() || 'potty-chair',
    notes: details.notes?.trim() || null,
    isTeething: BOOL(details.isTeething),
    isSick: BOOL(details.isSick),
  }
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

/** Wake-up during a sleep session. */
export type SleepWakeUp = {
  time: string
  durationMinutes: number
  reason?: string
}

/** Sleep log create payload. `sleepDuration` is sent as `HH:MM:SS` (e.g. `"08:30:00"`) for .NET `TimeSpan`. */
export type SleepLogCreate = {
  sleepDate: string
  sleepDuration: string
  sleepMood: string
  sleepStartTime: string
  sleepEndTime: string
  sleepEnvironment: string
  isTeething?: boolean
  isSick?: boolean
  isNap?: boolean
  sleepType?: string
  quality?: string
  howFellAsleep?: string
  wakeUps?: SleepWakeUp[]
  preSleepActivity?: string[]
  notes?: string
  tags?: string[]
  isNightSleepFragmented?: boolean
}

/** Build a SleepLogCreate from stored `LogRecord` details + `atIso` (legacy `start` / `end` supported). */
export function sleepLogFromDetails(details: Record<string, string>, atIso: string): SleepLogCreate {
  const startIso = details.sleepStartTime || details.start || ''
  const endIso = details.sleepEndTime || details.end || ''
  const startD = startIso ? new Date(startIso) : null
  const endD = endIso ? new Date(endIso) : null
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

  let wakeUps: SleepWakeUp[] | undefined
  if (details.wakeUps?.trim()) {
    try {
      const parsed = JSON.parse(details.wakeUps) as SleepWakeUp[]
      if (Array.isArray(parsed)) wakeUps = parsed
    } catch {
      /* ignore */
    }
  }

  let preSleepActivity: string[] | undefined
  if (details.preSleepActivity?.trim()) {
    try {
      const parsed = JSON.parse(details.preSleepActivity) as string[]
      if (Array.isArray(parsed)) preSleepActivity = parsed
    } catch {
      /* ignore */
    }
  }

  let tags: string[] | undefined
  if (details.tags?.trim()) {
    try {
      const parsed = JSON.parse(details.tags) as string[]
      if (Array.isArray(parsed)) tags = parsed
    } catch {
      /* ignore */
    }
  }

  const isNap = BOOL(details.isNap)
  const sleepType = details.sleepType?.trim() || (isNap ? 'nap' : 'night')

  const mergedTags = [...(tags ?? [])]
  if (BOOL(details.isTeething) && !mergedTags.includes('teething')) mergedTags.push('teething')
  if (BOOL(details.isSick) && !mergedTags.includes('sick')) mergedTags.push('sick')

  const sleepMood =
    details.sleepMood?.trim() ||
    details.moodBeforeSleep?.trim() ||
    ''

  return {
    sleepDate,
    sleepDuration: String(durationMin),
    sleepMood,
    sleepStartTime: startIso || atIso,
    sleepEndTime: endIso,
    sleepEnvironment: details.sleepEnvironment?.trim() ?? '',
    isTeething: BOOL(details.isTeething) || mergedTags.includes('teething'),
    isSick: BOOL(details.isSick) || mergedTags.includes('sick'),
    isNap: isNap || sleepType === 'nap',
    sleepType,
    quality: details.quality?.trim() || undefined,
    howFellAsleep: details.howFellAsleep?.trim() || undefined,
    wakeUps,
    preSleepActivity,
    notes: details.notes?.trim() || undefined,
    tags: mergedTags.length ? mergedTags : undefined,
    isNightSleepFragmented: BOOL(details.isNightSleepFragmented),
  }
}

export const BABYLOG_STORAGE_KEY = 'babylog:logs:v1'
