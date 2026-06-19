import { toUtcIsoTime } from './diaperApi'
import { apiFetch } from './client'
import { getBabyId } from './config'
import type { LogRecord, PottyLogCreate } from '../types/babyLog'

export type PottyLogDto = {
  id: string
  babyId?: string
  result: string
  loggedAt: string
  location: string
  notes?: string | null
  isTeething?: boolean
  isSick?: boolean
}

export type PottyLogWrite = PottyLogCreate & {
  babyId: string
  id?: string
}

const RESULT_BY_ENUM: Record<string, string> = {
  '0': 'success',
  '1': 'pee',
  '2': 'poop',
  '3': 'both',
  '4': 'accident',
  '5': 'dry_attempt',
  success: 'success',
  pee: 'pee',
  poop: 'poop',
  both: 'both',
  accident: 'accident',
  dryattempt: 'dry_attempt',
  dry_attempt: 'dry_attempt',
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return false
}

function normalizePottyResult(raw: unknown): string {
  const s = String(raw ?? '').trim()
  if (!s) return 'pee'
  const mapped = RESULT_BY_ENUM[s.toLowerCase()] ?? RESULT_BY_ENUM[s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()]
  return mapped || s.charAt(0).toLowerCase() + s.slice(1)
}

function normalizePotty(raw: unknown): PottyLogDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const loggedAt = pickStr(o, 'loggedAt', 'LoggedAt', 'time', 'Time')
  if (!loggedAt && !id) return null

  return {
    id: id || `local-${Date.now()}`,
    babyId: pickStr(o, 'babyId', 'BabyId') || undefined,
    result: normalizePottyResult(o.result ?? o.Result),
    loggedAt: loggedAt || new Date().toISOString(),
    location: pickStr(o, 'location', 'Location') || 'potty-chair',
    notes: pickStr(o, 'notes', 'Notes') || null,
    isTeething: pickBool(o, 'isTeething', 'IsTeething'),
    isSick: pickBool(o, 'isSick', 'IsSick'),
  }
}

function normalizePottyList(data: unknown): PottyLogDto[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.map(normalizePotty).filter((r): r is PottyLogDto => r != null)
  }
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const nested = o.result ?? o.Result ?? o.data ?? o.Data
    if (nested != null) return normalizePottyList(nested)
    const row = normalizePotty(data)
    return row ? [row] : []
  }
  return []
}

function toApiBody(payload: PottyLogWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    result: normalizePottyResult(payload.result),
    loggedAt: toUtcIsoTime(payload.loggedAt),
    location: payload.location.trim() || 'potty-chair',
    notes: payload.notes?.trim() || null,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

function pottyIdQuery(pottyId: string) {
  return new URLSearchParams({ id: pottyId })
}

export async function fetchPottyLogsForBaby(babyId: string): Promise<PottyLogDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/potty/${encodeURIComponent(id)}`)
  return normalizePottyList(data)
}

export async function createPottyLog(payload: PottyLogWrite): Promise<PottyLogDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required to create a potty log')
  const data = await apiFetch<unknown>('api/potty', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizePotty(data)
  if (row) return { ...row, babyId: row.babyId || payload.babyId }
  return {
    id: payload.id?.trim() || `local-${Date.now()}`,
    babyId: payload.babyId,
    result: normalizePottyResult(payload.result),
    loggedAt: toUtcIsoTime(payload.loggedAt),
    location: payload.location,
    notes: payload.notes?.trim() || null,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
  }
}

export async function updatePottyLog(payload: PottyLogWrite): Promise<PottyLogDto> {
  const pottyId = payload.id?.trim()
  if (!pottyId) throw new Error('Potty id is required to update')
  const data = await apiFetch<unknown>(`api/potty?${pottyIdQuery(pottyId)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody({ ...payload, id: pottyId })),
  })
  const row = normalizePotty(data)
  if (row) return { ...row, id: row.id || pottyId, babyId: row.babyId || payload.babyId }
  return {
    id: pottyId,
    babyId: payload.babyId,
    result: normalizePottyResult(payload.result),
    loggedAt: toUtcIsoTime(payload.loggedAt),
    location: payload.location,
    notes: payload.notes?.trim() || null,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
  }
}

export async function deletePottyLog(pottyId: string): Promise<void> {
  const id = pottyId.trim()
  if (!id) throw new Error('Potty log id is required to delete')
  await apiFetch<void>(`api/potty?${pottyIdQuery(id)}`, { method: 'DELETE' })
}

export function pottyDtoToLogRecord(dto: PottyLogDto): LogRecord {
  const atIso = dto.loggedAt ? toUtcIsoTime(dto.loggedAt) : new Date().toISOString()
  return {
    id: dto.id,
    kind: 'potty',
    atIso,
    details: {
      result: dto.result,
      loggedAt: atIso,
      location: dto.location,
      notes: (dto.notes ?? '').trim(),
      isTeething: dto.isTeething ? 'true' : 'false',
      isSick: dto.isSick ? 'true' : 'false',
      ...(dto.babyId ? { babyId: dto.babyId } : {}),
    },
  }
}

function enrichPottyLogRecord(dto: PottyLogDto, babyId: string, babyFullName: string): LogRecord {
  const record = pottyDtoToLogRecord({ ...dto, babyId: dto.babyId ?? babyId })
  return {
    ...record,
    details: {
      ...record.details,
      babyId,
      babyName: babyFullName?.trim() || 'Baby',
    },
  }
}

export function dedupePottyLogs(logs: LogRecord[]): LogRecord[] {
  const byId = new Map<string, LogRecord>()
  for (const row of logs.filter((l) => l.kind === 'potty')) {
    const id = row.id?.trim()
    if (!id || id === '0') continue
    byId.set(id, row)
  }
  return Array.from(byId.values()).sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export async function loadPottyLogsForBabies(
  babies: { id: string; fullName: string }[],
): Promise<LogRecord[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const dtos = await fetchPottyLogsForBaby(baby.id)
      return dtos.map((dto) => enrichPottyLogRecord(dto, baby.id, baby.fullName))
    }),
  )
  return dedupePottyLogs(batches.flat())
}

export function pottyWriteFromForm(babyId: string, fields: PottyLogCreate, id?: string): PottyLogWrite {
  return { babyId, ...fields, ...(id ? { id } : {}) }
}

export async function loadPottyLogs(): Promise<LogRecord[]> {
  const babyId = getBabyId()
  if (!babyId) throw new Error('Add a baby profile before viewing potty logs.')
  const dtos = await fetchPottyLogsForBaby(babyId)
  return dtos.map(pottyDtoToLogRecord)
}
