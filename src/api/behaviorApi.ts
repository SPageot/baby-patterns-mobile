import { apiFetch } from './client'
import { getBabyId } from './config'
import { dateYmdToLocalNoonIso } from '@/lib/trackUtils'
import type { BehaviorLogCreate, LogRecord } from '@/types/babyLog'

export type BehaviorLogDto = {
  id: string
  babyId?: string
  occurredOn: string
  occurredTime?: string | null
  behaviorTag: string
  location: string
  notes?: string | null
  resolution?: string | null
}

export type BehaviorLogWrite = BehaviorLogCreate & {
  babyId: string
  id?: string
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

function normalizeTime(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  // Accept HH:mm, HH:mm:ss, or TimeOnly JSON
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  const hh = m[1].padStart(2, '0')
  const mm = m[2]
  return `${hh}:${mm}`
}

function normalizeBehavior(raw: unknown): BehaviorLogDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const occurredOn = pickStr(o, 'occurredOn', 'OccurredOn')
  if (!occurredOn && !id) return null

  return {
    id: id || `local-${Date.now()}`,
    babyId: pickStr(o, 'babyId', 'BabyId') || undefined,
    occurredOn: occurredOn || new Date().toISOString().slice(0, 10),
    occurredTime: normalizeTime(pickStr(o, 'occurredTime', 'OccurredTime')),
    behaviorTag: pickStr(o, 'behaviorTag', 'BehaviorTag') || 'Tantrum',
    location: pickStr(o, 'location', 'Location') || '',
    notes: pickStr(o, 'notes', 'Notes') || null,
    resolution: pickStr(o, 'resolution', 'Resolution') || null,
  }
}

function normalizeBehaviorList(data: unknown): BehaviorLogDto[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.map(normalizeBehavior).filter((r): r is BehaviorLogDto => r != null)
  }
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const nested = o.result ?? o.Result ?? o.data ?? o.Data
    if (nested != null) return normalizeBehaviorList(nested)
    const row = normalizeBehavior(data)
    return row ? [row] : []
  }
  return []
}

function toApiBody(payload: BehaviorLogWrite): Record<string, unknown> {
  const time = normalizeTime(payload.occurredTime ?? '')
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    occurredOn: payload.occurredOn.trim(),
    occurredTime: time ? `${time}:00` : null,
    behaviorTag: payload.behaviorTag.trim(),
    location: payload.location.trim(),
    notes: payload.notes?.trim() || null,
    resolution: payload.resolution?.trim() || null,
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

function behaviorIdQuery(behaviorId: string) {
  return new URLSearchParams({ id: behaviorId })
}

export function behaviorAtIso(occurredOn: string, occurredTime?: string | null): string {
  const on = occurredOn.trim()
  const time = normalizeTime(occurredTime ?? '')
  if (on && time) {
    const local = new Date(`${on}T${time}:00`)
    if (!Number.isNaN(local.getTime())) return local.toISOString()
  }
  if (on) return dateYmdToLocalNoonIso(on)
  return new Date().toISOString()
}

export async function fetchBehaviorLogsForBaby(babyId: string): Promise<BehaviorLogDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/behavior/${encodeURIComponent(id)}`)
  return normalizeBehaviorList(data)
}

export async function createBehaviorLog(payload: BehaviorLogWrite): Promise<BehaviorLogDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required to create a behavior log')
  const data = await apiFetch<unknown>('api/behavior', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeBehavior(data)
  if (row) return { ...row, babyId: row.babyId || payload.babyId }
  return {
    id: payload.id?.trim() || `local-${Date.now()}`,
    babyId: payload.babyId,
    occurredOn: payload.occurredOn,
    occurredTime: normalizeTime(payload.occurredTime ?? ''),
    behaviorTag: payload.behaviorTag,
    location: payload.location,
    notes: payload.notes?.trim() || null,
    resolution: payload.resolution?.trim() || null,
  }
}

export async function updateBehaviorLog(payload: BehaviorLogWrite): Promise<BehaviorLogDto> {
  const behaviorId = payload.id?.trim()
  if (!behaviorId) throw new Error('Behavior id is required to update')
  const data = await apiFetch<unknown>(`api/behavior?${behaviorIdQuery(behaviorId)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody({ ...payload, id: behaviorId })),
  })
  const row = normalizeBehavior(data)
  if (row) return { ...row, id: row.id || behaviorId, babyId: row.babyId || payload.babyId }
  return {
    id: behaviorId,
    babyId: payload.babyId,
    occurredOn: payload.occurredOn,
    occurredTime: normalizeTime(payload.occurredTime ?? ''),
    behaviorTag: payload.behaviorTag,
    location: payload.location,
    notes: payload.notes?.trim() || null,
    resolution: payload.resolution?.trim() || null,
  }
}

export async function deleteBehaviorLog(behaviorId: string): Promise<void> {
  const id = behaviorId.trim()
  if (!id) throw new Error('Behavior log id is required to delete')
  await apiFetch<void>(`api/behavior?${behaviorIdQuery(id)}`, { method: 'DELETE' })
}

export function behaviorDtoToLogRecord(dto: BehaviorLogDto): LogRecord {
  const atIso = behaviorAtIso(dto.occurredOn, dto.occurredTime)
  return {
    id: dto.id,
    kind: 'behavior',
    atIso,
    details: {
      occurredOn: dto.occurredOn,
      occurredTime: (dto.occurredTime ?? '').trim(),
      behaviorTag: dto.behaviorTag,
      location: dto.location,
      notes: (dto.notes ?? '').trim(),
      resolution: (dto.resolution ?? '').trim(),
      ...(dto.babyId ? { babyId: dto.babyId } : {}),
    },
  }
}

function enrichBehaviorLogRecord(dto: BehaviorLogDto, babyId: string, babyFullName: string): LogRecord {
  const record = behaviorDtoToLogRecord({ ...dto, babyId: dto.babyId ?? babyId })
  return {
    ...record,
    details: {
      ...record.details,
      babyId,
      babyName: babyFullName?.trim() || 'Baby',
    },
  }
}

export function dedupeBehaviorLogs(logs: LogRecord[]): LogRecord[] {
  const byId = new Map<string, LogRecord>()
  for (const row of logs.filter((l) => l.kind === 'behavior')) {
    const id = row.id?.trim()
    if (!id || id === '0') continue
    byId.set(id, row)
  }
  return Array.from(byId.values()).sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export async function loadBehaviorLogsForBabies(
  babies: { id: string; fullName: string }[],
): Promise<LogRecord[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const dtos = await fetchBehaviorLogsForBaby(baby.id)
      return dtos.map((dto) => enrichBehaviorLogRecord(dto, baby.id, baby.fullName))
    }),
  )
  return dedupeBehaviorLogs(batches.flat())
}

export function behaviorWriteFromForm(
  babyId: string,
  fields: BehaviorLogCreate,
  id?: string,
): BehaviorLogWrite {
  return { babyId, ...fields, ...(id ? { id } : {}) }
}

export async function loadBehaviorLogs(): Promise<LogRecord[]> {
  const babyId = getBabyId()
  if (!babyId) throw new Error('Add a baby profile before viewing behavior logs.')
  const dtos = await fetchBehaviorLogsForBaby(babyId)
  return dtos.map(behaviorDtoToLogRecord)
}
