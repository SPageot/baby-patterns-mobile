import { apiFetch } from './client'
import { getBabyId } from './config'
import type { DiaperLogCreate, LogRecord } from '../types/babyLog'

export type DiaperLogDto = {
  id: string
  babyId?: string
  isTherePee: boolean
  isTherePoop: boolean
  isThereAnythingElse: boolean
  anythingElseDescription: string | null
  time: string
  diaperBrand: string
  diaperSize: string
  diaperCreamUsed: string
  isTeething: boolean
  isSick: boolean
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

function normalizeDiaper(raw: unknown): DiaperLogDto | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null

  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId') || undefined,
    isTherePee: pickBool(o, 'isTherePee', 'IsTherePee'),
    isTherePoop: pickBool(o, 'isTherePoop', 'IsTherePoop'),
    isThereAnythingElse: pickBool(o, 'isThereAnythingElse', 'IsThereAnythingElse'),
    anythingElseDescription: pickStr(o, 'anythingElseDescription', 'AnythingElseDescription') || null,
    time: pickStr(o, 'time', 'Time', 'lastChangeTime', 'LastChangeTime'),
    diaperBrand: pickStr(o, 'diaperBrand', 'DiaperBrand'),
    diaperSize: pickStr(o, 'diaperSize', 'DiaperSize'),
    diaperCreamUsed: pickStr(o, 'diaperCreamUsed', 'DiaperCreamUsed'),
    isTeething: pickBool(o, 'isTeething', 'IsTeething'),
    isSick: pickBool(o, 'isSick', 'IsSick'),
  }
}

function normalizeDiaperList(data: unknown): DiaperLogDto[] {
  if (Array.isArray(data)) {
    const flat: DiaperLogDto[] = []
    for (const item of data) {
      const direct = normalizeDiaper(item)
      if (direct) {
        flat.push(direct)
        continue
      }
      if (item && typeof item === 'object') {
        const nested =
          (item as Record<string, unknown>).diapers ??
          (item as Record<string, unknown>).Diapers ??
          (item as Record<string, unknown>).diaperLogs ??
          (item as Record<string, unknown>).DiaperLogs
        if (Array.isArray(nested)) {
          for (const row of nested) {
            const d = normalizeDiaper(row)
            if (d) flat.push(d)
          }
        }
      }
    }
    return flat
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const list = o.data ?? o.items ?? o.results ?? o.value ?? o.result ?? o.Result
    if (Array.isArray(list)) return normalizeDiaperList(list)
  }
  return []
}

/** GET `api/diapers/baby?id={babyId}` */
export async function fetchBabyDiapers(babyId: string): Promise<DiaperLogDto[]> {
  const q = new URLSearchParams({ id: babyId })
  const data = await apiFetch<unknown>(`api/diapers/baby?${q}`)
  return normalizeDiaperList(data)
}

/** Convert form value or API time to UTC ISO 8601 (`…Z`). */
export function toUtcIsoTime(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return new Date().toISOString()

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)).toISOString()
  }

  return new Date().toISOString()
}

function diaperTimeToAtIso(time: string): string {
  return toUtcIsoTime(time)
}

export function diaperDtoToLogRecord(dto: DiaperLogDto): LogRecord {
  const atIso = dto.time ? diaperTimeToAtIso(dto.time) : new Date().toISOString()
  return {
    id: dto.id,
    kind: 'diaper',
    atIso,
    details: {
      isTherePee: String(dto.isTherePee),
      isTherePoop: String(dto.isTherePoop),
      isThereAnythingElse: String(dto.isThereAnythingElse),
      anythingElseDescription: dto.anythingElseDescription ?? '',
      time: atIso,
      diaperBrand: dto.diaperBrand,
      diaperSize: dto.diaperSize,
      diaperCreamUsed: dto.diaperCreamUsed,
      isTeething: String(dto.isTeething),
      isSick: String(dto.isSick),
      ...(dto.babyId ? { babyId: dto.babyId } : {}),
    },
  }
}

function enrichDiaperLogRecord(
  dto: DiaperLogDto,
  babyId: string,
  babyFullName: string,
): LogRecord {
  const record = diaperDtoToLogRecord({ ...dto, babyId: dto.babyId ?? babyId })
  return {
    ...record,
    details: {
      ...record.details,
      babyId,
      babyName: babyFullName?.trim() || 'Baby',
    },
  }
}

export function diaperLogFromCreate(
  dto: DiaperLogDto,
  babyId: string,
  babyFullName: string,
): LogRecord {
  return enrichDiaperLogRecord(dto, babyId, babyFullName)
}

function toApiBody(babyId: string, fields: DiaperLogCreate, id?: string): Record<string, unknown> {
  return {
    id,
    babyId,
    isTherePee: fields.isTherePee,
    isTherePoop: fields.isTherePoop,
    isThereAnythingElse: fields.isThereAnythingElse,
    anythingElseDescription: fields.anythingElseDescription,
    time: toUtcIsoTime(fields.time),
    diaperBrand: fields.diaperBrand,
    diaperSize: fields.diaperSize,
    diaperCreamUsed: fields.diaperCreamUsed,
    isTeething: Boolean(fields.isTeething),
    isSick: Boolean(fields.isSick),
  }
}

function normBoolStr(value: string | undefined): string {
  const v = (value ?? '').trim().toLowerCase()
  return v === 'true' || v === '1' ? '1' : '0'
}

function diaperBabyKey(d: Record<string, string>): string {
  return (d.babyId ?? '').trim().toLowerCase() || (d.babyName ?? '').trim().toLowerCase()
}

/** Match optimistic `local-*` rows to server rows when timestamps differ. */
function diaperLogContentKey(log: LogRecord): string {
  const d = log.details
  return [
    diaperBabyKey(d),
    normBoolStr(d.isTherePee),
    normBoolStr(d.isTherePoop),
    normBoolStr(d.isThereAnythingElse),
    (d.anythingElseDescription ?? '').trim(),
    (d.diaperBrand ?? '').trim(),
    (d.diaperSize ?? '').trim(),
    (d.diaperCreamUsed ?? '').trim(),
    normBoolStr(d.isTeething),
    normBoolStr(d.isSick),
  ].join('|')
}

function diaperLogFingerprint(log: LogRecord): string {
  const d = log.details
  const t = new Date(log.atIso)
  const minute = Number.isNaN(t.getTime())
    ? log.atIso
    : String(Math.floor(t.getTime() / 60_000))
  return [
    diaperBabyKey(d),
    minute,
    normBoolStr(d.isTherePee),
    normBoolStr(d.isTherePoop),
    normBoolStr(d.isThereAnythingElse),
    (d.anythingElseDescription ?? '').trim(),
    (d.diaperBrand ?? '').trim(),
    (d.diaperSize ?? '').trim(),
    (d.diaperCreamUsed ?? '').trim(),
    normBoolStr(d.isTeething),
    normBoolStr(d.isSick),
  ].join('|')
}

function isLocalDiaperLogId(id: string | undefined): boolean {
  return Boolean(id?.startsWith('local-'))
}

function normalizeDiaperLogId(id: string | undefined): string {
  const trimmed = id?.trim()
  if (!trimmed || trimmed === '0') return ''
  return trimmed
}

function diaperIdScore(id: string | undefined): number {
  const normalized = normalizeDiaperLogId(id)
  if (!normalized) return 0
  if (isLocalDiaperLogId(normalized)) return 1
  if (/^\d+$/.test(normalized)) return 3
  return 2
}

function pickPreferredDiaperLog(a: LogRecord, b: LogRecord): LogRecord {
  const scoreA = diaperIdScore(a.id)
  const scoreB = diaperIdScore(b.id)
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b
  const lenA = normalizeDiaperLogId(a.id).length
  const lenB = normalizeDiaperLogId(b.id).length
  return lenB > lenA ? b : a
}

function diaperLogContentNearKey(log: LogRecord): string {
  const t = new Date(log.atIso)
  const fiveMin = Number.isNaN(t.getTime()) ? '' : String(Math.floor(t.getTime() / 300_000))
  return `${diaperLogContentKey(log)}|${fiveMin}`
}

/** Drop duplicate diaper rows (same change, different ids from optimistic vs server merge). */
export function dedupeDiaperLogs(logs: LogRecord[]): LogRecord[] {
  const diapers = logs.filter((l) => l.kind === 'diaper')
  if (!diapers.length) return []

  const byId = new Map<string, LogRecord>()
  const noId: LogRecord[] = []

  for (const row of diapers) {
    const id = normalizeDiaperLogId(row.id)
    if (!id) {
      noId.push(row)
      continue
    }
    const existing = byId.get(id)
    byId.set(id, existing ? pickPreferredDiaperLog(existing, row) : { ...row, id })
  }

  const byFingerprint = new Map<string, LogRecord>()
  for (const row of [...byId.values(), ...noId]) {
    const fp = diaperLogFingerprint(row)
    const existing = byFingerprint.get(fp)
    byFingerprint.set(fp, existing ? pickPreferredDiaperLog(existing, row) : row)
  }

  const serverByContent = new Map<string, LogRecord>()
  for (const row of byFingerprint.values()) {
    if (!isLocalDiaperLogId(row.id)) {
      serverByContent.set(diaperLogContentKey(row), row)
    }
  }

  const merged = Array.from(byFingerprint.values()).filter((row) => {
    if (!isLocalDiaperLogId(row.id)) return true
    const server = serverByContent.get(diaperLogContentKey(row))
    return !server
  })

  const byNearContent = new Map<string, LogRecord>()
  for (const row of merged) {
    const key = diaperLogContentNearKey(row)
    const existing = byNearContent.get(key)
    byNearContent.set(key, existing ? pickPreferredDiaperLog(existing, row) : row)
  }

  return Array.from(byNearContent.values()).sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

/** Merge server rows with local rows; dedupe by content fingerprint. */
export function mergeDiaperLogLists(server: LogRecord[], local: LogRecord[]): LogRecord[] {
  return dedupeDiaperLogs([...server, ...local])
}

function unwrapDiaperPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  const nested = o.result ?? o.Result
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    if (normalizeDiaper(nested)) return nested
  }
  return raw
}

/** Read diaper id from POST/PUT envelopes without picking up user/baby ids. */
function pickDiaperIdFromEnvelope(raw: unknown): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ''
  const o = raw as Record<string, unknown>

  for (const key of ['id', 'Id', 'diaperId', 'DiaperId']) {
    const v = o[key]
    if (v != null && v !== '') {
      const id = normalizeDiaperLogId(String(v))
      if (id) return id
    }
  }

  const nested = o.result ?? o.Result
  if (nested != null && typeof nested !== 'object') {
    return normalizeDiaperLogId(String(nested))
  }

  return ''
}

function diaperFieldsMatchDto(dto: DiaperLogDto, fields: DiaperLogCreate): boolean {
  return (
    dto.isTherePee === fields.isTherePee &&
    dto.isTherePoop === fields.isTherePoop &&
    dto.isThereAnythingElse === fields.isThereAnythingElse &&
    (dto.anythingElseDescription ?? '') === (fields.anythingElseDescription ?? '') &&
    dto.diaperBrand.trim() === fields.diaperBrand.trim() &&
    dto.diaperSize.trim() === fields.diaperSize.trim() &&
    dto.diaperCreamUsed.trim() === fields.diaperCreamUsed.trim() &&
    dto.isTeething === Boolean(fields.isTeething) &&
    dto.isSick === Boolean(fields.isSick)
  )
}

async function resolveDiaperIdAfterWrite(
  babyId: string,
  fields: DiaperLogCreate,
  data: unknown,
  row: DiaperLogDto | null,
): Promise<string> {
  const fromRow = normalizeDiaperLogId(row?.id)
  if (fromRow) return fromRow

  const payload = unwrapDiaperPayload(data)
  const fromEnvelope = pickDiaperIdFromEnvelope(payload) || pickDiaperIdFromEnvelope(data)
  if (fromEnvelope) return fromEnvelope

  const recent = await fetchBabyDiapers(babyId)
  const targetIso = toUtcIsoTime(fields.time)
  const targetMs = new Date(targetIso).getTime()

  let best: DiaperLogDto | null = null
  let bestDelta = Infinity

  for (const dto of recent) {
    if (!normalizeDiaperLogId(dto.id)) continue
    if (!diaperFieldsMatchDto(dto, fields)) continue
    const ms = new Date(toUtcIsoTime(dto.time)).getTime()
    if (Number.isNaN(ms)) continue
    const delta = Math.abs(ms - targetMs)
    if (delta < bestDelta) {
      bestDelta = delta
      best = dto
    }
  }

  if (best && bestDelta <= 15 * 60_000) return normalizeDiaperLogId(best.id)
  return ''
}

function diaperFromCreateResponse(
  babyId: string,
  fields: DiaperLogCreate,
  data: unknown,
  resolvedId: string,
): DiaperLogDto {
  const payload = unwrapDiaperPayload(data)
  const row = normalizeDiaper(payload)
  const id = normalizeDiaperLogId(resolvedId) || normalizeDiaperLogId(row?.id) || `local-${Date.now()}`
  return {
    id,
    babyId: row?.babyId || babyId,
    isTherePee: row?.isTherePee ?? fields.isTherePee,
    isTherePoop: row?.isTherePoop ?? fields.isTherePoop,
    isThereAnythingElse: row?.isThereAnythingElse ?? fields.isThereAnythingElse,
    anythingElseDescription: row?.anythingElseDescription ?? fields.anythingElseDescription,
    time: row?.time ? row.time : toUtcIsoTime(fields.time),
    diaperBrand: row?.diaperBrand || fields.diaperBrand,
    diaperSize: row?.diaperSize || fields.diaperSize,
    diaperCreamUsed: row?.diaperCreamUsed || fields.diaperCreamUsed,
    isTeething: row?.isTeething ?? Boolean(fields.isTeething),
    isSick: row?.isSick ?? Boolean(fields.isSick),
  }
}

/** DELETE `api/diapers?id={diaperId}` */
export async function deleteDiaperLog(diaperId: string): Promise<void> {
  const id = diaperId.trim()
  if (!id) throw new Error('Diaper log id is required to delete')
  const q = new URLSearchParams({ id })
  await apiFetch<void>(`api/diapers?${q}`, { method: 'DELETE' })
}

/** PUT `api/diapers?id={diaperId}` */
export async function updateDiaperLog(
  diaperId: string,
  babyId: string,
  fields: DiaperLogCreate,
): Promise<DiaperLogDto> {
  const id = diaperId.trim()
  if (!id) throw new Error('Diaper log id is required to update')
  const q = new URLSearchParams({ id })
  const data = await apiFetch<unknown>(`api/diapers?${q}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(babyId, fields, id)),
  })
  const payload = unwrapDiaperPayload(data)
  const row = normalizeDiaper(payload)
  const resolvedId = (await resolveDiaperIdAfterWrite(babyId, fields, data, row)) || id
  const parsed = diaperFromCreateResponse(babyId, fields, data, resolvedId)
  return { ...parsed, id: normalizeDiaperLogId(parsed.id) || id, babyId: parsed.babyId || babyId }
}

/** POST `api/diapers` */
export async function createDiaperLog(
  babyId: string,
  fields: DiaperLogCreate,
): Promise<DiaperLogDto> {
  const data = await apiFetch<unknown>('api/diapers', {
    method: 'POST',
    body: JSON.stringify(toApiBody(babyId, fields)),
  })
  const payload = unwrapDiaperPayload(data)
  const row = normalizeDiaper(payload)
  const resolvedId = await resolveDiaperIdAfterWrite(babyId, fields, data, row)
  return diaperFromCreateResponse(babyId, fields, data, resolvedId)
}

/** Load diapers for the active baby (`api/diapers/baby?id=`). */
export async function loadDiaperLogs(): Promise<LogRecord[]> {
  const babyId = getBabyId()
  if (!babyId) throw new Error('Add a baby profile before viewing diaper logs.')
  const dtos = await fetchBabyDiapers(babyId)
  return dtos.map(diaperDtoToLogRecord)
}

/** Load and merge diaper logs for every baby (tags each row with baby id/name). */
export async function loadDiaperLogsForBabies(
  babies: { id: string; fullName: string }[],
): Promise<LogRecord[]> {
  if (!babies.length) return []

  const batches = await Promise.all(
    babies.map(async (baby) => {
      const dtos = await fetchBabyDiapers(baby.id)
      return dtos.map((dto) => enrichDiaperLogRecord(dto, baby.id, baby.fullName))
    }),
  )

  return dedupeDiaperLogs(batches.flat())
}
