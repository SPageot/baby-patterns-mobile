import { toUtcIsoTime } from './diaperApi'
import { apiFetch } from './client'
import { extractUserId } from './userApi'
import { getBabyId } from './config'
import {
  datetimeUtcInputToIso,
  minutesToTimeSpanHms,
  parseSleepDurationMinutes,
} from '../lib/trackUtils'
import type { LogRecord, SleepLogCreate } from '../types/babyLog'

function sleepTimeToUtcIso(value: string): string {
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !/[zZ]$|[+-]\d{2}:?\d{2}$/.test(v)) {
    return datetimeUtcInputToIso(v)
  }
  return toUtcIsoTime(v)
}

/** Normalize sleep form fields for API (times as ISO `…Z`, date as UTC `YYYY-MM-DD`, duration as `HH:MM:SS`). */
export function sleepFieldsToUtc(fields: SleepLogCreate): SleepLogCreate {
  const sleepStartTime = sleepTimeToUtcIso(fields.sleepStartTime)
  const sleepEndTime = sleepTimeToUtcIso(fields.sleepEndTime)
  const sleepDateRaw = fields.sleepDate.trim()
  const sleepDate = sleepDateRaw || sleepStartTime.slice(0, 10)
  const sleepDuration = minutesToTimeSpanHms(parseSleepDurationMinutes(fields.sleepDuration))

  return {
    ...fields,
    sleepDate,
    sleepDuration,
    sleepStartTime,
    sleepEndTime,
  }
}

export type SleepLogDto = {
  id: string
  babyId?: string
  sleepDate: string
  sleepDuration: string
  sleepMood: string
  sleepStartTime: string
  sleepEndTime: string
  sleepEnvironment: string
  isTeething: boolean
  isSick: boolean
  isNap: boolean
}

export type SleepLogWrite = SleepLogCreate & {
  babyId: string
  id?: string
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (v === true || v === 'true' || v === 1 || v === '1') return true
  }
  return false
}

function normalizeSleepDuration(raw: unknown): string {
  if (raw == null || raw === '') return '00:00:00'
  const s = String(raw).trim()
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => Number(p))
    if (parts.length >= 2 && parts.every((p) => Number.isFinite(p))) {
      const [h, m, sec = 0] = parts
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${pad(h)}:${pad(m)}:${pad(sec)}`
    }
  }
  const mins =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.round(raw)
      : parseSleepDurationMinutes(s)
  return minutesToTimeSpanHms(mins)
}

function hasSleepShape(o: Record<string, unknown>): boolean {
  return Boolean(
    pickStr(o, 'sleepDate', 'SleepDate') ||
      pickStr(o, 'sleepStartTime', 'SleepStartTime') ||
      pickStr(o, 'sleepEndTime', 'SleepEndTime') ||
      pickStr(o, 'sleepDuration', 'SleepDuration') ||
      pickStr(o, 'sleepMood', 'SleepMood') ||
      pickStr(o, 'sleepEnvironment', 'SleepEnvironment'),
  )
}

function normalizeSleep(raw: unknown): SleepLogDto | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!hasSleepShape(o)) return null
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId') || undefined,
    sleepDate: pickStr(o, 'sleepDate', 'SleepDate'),
    sleepDuration: normalizeSleepDuration(o.sleepDuration ?? o.SleepDuration),
    sleepMood: pickStr(o, 'sleepMood', 'SleepMood'),
    sleepStartTime: pickStr(o, 'sleepStartTime', 'SleepStartTime'),
    sleepEndTime: pickStr(o, 'sleepEndTime', 'SleepEndTime'),
    sleepEnvironment: pickStr(o, 'sleepEnvironment', 'SleepEnvironment'),
    isTeething: pickBool(o, 'isTeething', 'IsTeething'),
    isSick: pickBool(o, 'isSick', 'IsSick'),
    isNap: pickBool(o, 'isNap', 'IsNap'),
  }
}

function unwrapSleepListEnvelope(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const o = data as Record<string, unknown>
  const nested = o.results ?? o.Results ?? o.result ?? o.Result
  if (nested != null) return nested
  return data
}

function normalizeSleepList(data: unknown): SleepLogDto[] {
  const payload = unwrapSleepListEnvelope(data)

  if (Array.isArray(payload)) {
    const flat: SleepLogDto[] = []
    for (const item of payload) {
      const direct = normalizeSleep(item)
      if (direct) {
        flat.push(direct)
        continue
      }
      if (item && typeof item === 'object') {
        const nested = (item as Record<string, unknown>).sleepLogs ?? (item as Record<string, unknown>).SleepLogs
        if (Array.isArray(nested)) {
          for (const s of nested) {
            const row = normalizeSleep(s)
            if (row) flat.push(row)
          }
        }
      }
    }
    return flat
  }
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const list =
      o.results ??
      o.Results ??
      o.result ??
      o.Result ??
      o.data ??
      o.items ??
      o.value ??
      o.sleepLogs ??
      o.SleepLogs ??
      o.sleeps ??
      o.Sleeps
    if (Array.isArray(list)) return normalizeSleepList(list)

    const one = normalizeSleep(payload)
    if (one) return [one]
  }
  return []
}

function toApiBody(payload: SleepLogWrite): Record<string, unknown> {
  const utc = sleepFieldsToUtc(payload)
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    sleepDate: utc.sleepDate,
    sleepDuration: utc.sleepDuration,
    sleepMood: utc.sleepMood,
    sleepStartTime: utc.sleepStartTime,
    sleepEndTime: utc.sleepEndTime,
    sleepEnvironment: utc.sleepEnvironment,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
    isNap: Boolean(payload.isNap),
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

/** GET `api/sleep/all?id={babyId}` — all sleep logs for one baby. */
export async function fetchAllSleepForBaby(babyId: string): Promise<SleepLogDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const q = new URLSearchParams({ id })
  const data = await apiFetch<unknown>(`api/sleep/all?${q}`)
  return normalizeSleepList(data)
}

function sleepIdQuery(sleepId: string) {
  return new URLSearchParams({ id: sleepId })
}

function unwrapSleepPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  const nested = o.results ?? o.Results ?? o.result ?? o.Result
  if (Array.isArray(nested) && nested.length > 0) return nested[0]
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    if (normalizeSleep(nested)) return nested
  }
  return raw
}

function sleepFromCreateResponse(payload: SleepLogWrite, data: unknown): SleepLogDto {
  const unwrapped = unwrapSleepPayload(data)
  const row = normalizeSleep(unwrapped)
  if (row) return { ...row, babyId: row.babyId || payload.babyId }

  const id = extractUserId(unwrapped) || extractUserId(data)
  if (!id) throw new Error('Create sleep: invalid response from server')

  const utc = sleepFieldsToUtc(payload)
  return {
    id,
    babyId: payload.babyId,
    sleepDate: utc.sleepDate,
    sleepDuration: utc.sleepDuration,
    sleepMood: utc.sleepMood,
    sleepStartTime: utc.sleepStartTime,
    sleepEndTime: utc.sleepEndTime,
    sleepEnvironment: utc.sleepEnvironment,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
    isNap: Boolean(payload.isNap),
  }
}

/** POST `api/sleep` — `babyId` in JSON body only */
export async function createSleepLog(payload: SleepLogWrite): Promise<SleepLogDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required to create sleep log')
  const data = await apiFetch<unknown>('api/sleep', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  return sleepFromCreateResponse(payload, data)
}

/** PUT `api/sleep/baby?id={sleepId}` */
export async function updateSleepLog(payload: SleepLogWrite): Promise<SleepLogDto> {
  const sleepId = payload.id?.trim()
  if (!sleepId) throw new Error('Sleep id is required to update')
  if (!payload.babyId.trim()) throw new Error('Baby id is required to update sleep log')
  const data = await apiFetch<unknown>(`api/sleep/baby?${sleepIdQuery(sleepId)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const unwrapped = unwrapSleepPayload(data)
  const row = normalizeSleep(unwrapped)
  if (row) return { ...row, id: row.id || sleepId, babyId: row.babyId || payload.babyId }
  return sleepFromCreateResponse(payload, data)
}

/** DELETE `api/sleep/baby?id={sleepId}` */
export async function deleteSleepLog(sleepId: string): Promise<void> {
  await apiFetch<void>(`api/sleep/baby?${sleepIdQuery(sleepId)}`, { method: 'DELETE' })
}

export function sleepDtoToLogRecord(dto: SleepLogDto): LogRecord {
  return {
    id: dto.id,
    kind: 'sleep',
    atIso: dto.sleepEndTime || dto.sleepStartTime || new Date().toISOString(),
    details: {
      sleepDate: dto.sleepDate,
      sleepDuration: dto.sleepDuration,
      sleepMood: dto.sleepMood,
      sleepStartTime: dto.sleepStartTime,
      sleepEndTime: dto.sleepEndTime,
      sleepEnvironment: dto.sleepEnvironment,
      isTeething: String(dto.isTeething),
      isSick: String(dto.isSick),
      isNap: String(dto.isNap),
      ...(dto.babyId ? { babyId: dto.babyId } : {}),
    },
  }
}

function enrichSleepLogRecord(
  dto: SleepLogDto,
  babyId: string,
  babyFullName: string,
): LogRecord {
  const record = sleepDtoToLogRecord({ ...dto, babyId: dto.babyId ?? babyId })
  return {
    ...record,
    details: {
      ...record.details,
      babyId,
      babyName: babyFullName?.trim() || 'Baby',
    },
  }
}

export function sleepLogFromCreate(
  dto: SleepLogDto,
  babyId: string,
  babyFullName: string,
): LogRecord {
  return enrichSleepLogRecord(dto, babyId, babyFullName)
}

/** Load and merge sleep logs for every baby. */
export async function loadSleepLogsForBabies(
  babies: { id: string; fullName: string }[],
): Promise<LogRecord[]> {
  if (!babies.length) return []

  const batches = await Promise.all(
    babies.map(async (baby) => {
      const dtos = await fetchAllSleepForBaby(baby.id)
      return dtos.map((dto) => enrichSleepLogRecord(dto, baby.id, baby.fullName))
    }),
  )

  const byId = new Map<string, LogRecord>()
  for (const row of batches.flat()) {
    byId.set(row.id, row)
  }
  return Array.from(byId.values()).sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export function sleepWriteFromForm(
  babyId: string,
  fields: SleepLogCreate,
  id?: string
): SleepLogWrite {
  return { babyId, ...fields, ...(id ? { id } : {}) }
}

/** Load sleep for the active baby via `api/sleep/all?id={babyId}`. */
export async function loadSleepLogs(): Promise<LogRecord[]> {
  const babyId = getBabyId()
  if (!babyId) throw new Error('Add a baby profile before viewing sleep logs.')
  const dtos = await fetchAllSleepForBaby(babyId)
  return dtos.map(sleepDtoToLogRecord)
}
