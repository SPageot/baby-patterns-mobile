import { toUtcIsoTime } from './diaperApi'
import { apiFetch } from './client'
import { getBabyId } from './config'
import type { FeedingLogCreate, LogRecord } from '../types/babyLog'

export type FeedingLogDto = {
  id: string
  babyId?: string
  feedingType: string
  feedingAt: string
  amountOz?: string | number | null
  durationMin?: string | number | null
  notes?: string | null
  isTeething?: boolean
  isSick?: boolean
}

export type FeedingLogWrite = FeedingLogCreate & {
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

function pickFeedingId(obj: Record<string, unknown>): string {
  const direct = pickStr(obj, 'id', 'Id', 'feedingId', 'FeedingId')
  if (direct && direct !== '0') return direct
  for (const k of ['id', 'Id', 'feedingId', 'FeedingId']) {
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v) && v !== 0) return String(v)
  }
  return ''
}

const FEEDING_TYPE_BY_ENUM: Record<string, string> = {
  '0': 'breast',
  '1': 'bottle',
  '2': 'solids',
  '3': 'snack',
  breast: 'breast',
  bottle: 'bottle',
  solids: 'solids',
  snack: 'snack',
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

function normalizeFeedingType(raw: unknown): string {
  const s = String(raw ?? '').trim()
  if (!s) return 'breast'
  const mapped = FEEDING_TYPE_BY_ENUM[s.toLowerCase()] ?? FEEDING_TYPE_BY_ENUM[s]
  if (mapped) return mapped
  return s.charAt(0).toLowerCase() + s.slice(1).toLowerCase()
}

function normalizeOptionalNumber(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const n = Number(raw)
  if (Number.isFinite(n)) return String(n)
  return String(raw).trim()
}

function pickFeedingAt(o: Record<string, unknown>): string {
  return pickStr(
    o,
    'feedingAt',
    'FeedingAt',
    'time',
    'Time',
    'when',
    'When',
    'fedAt',
    'FedAt',
    'createdAt',
    'CreatedAt',
  )
}

function looksLikeFeeding(o: Record<string, unknown>): boolean {
  const hasFields = Boolean(
    pickStr(o, 'feedingType', 'FeedingType', 'type', 'Type', 'feedType', 'FeedType') ||
      pickFeedingAt(o) ||
      pickStr(o, 'notes', 'Notes') ||
      o.amountOz != null ||
      o.AmountOz != null ||
      o.durationMin != null ||
      o.DurationMin != null,
  )
  if (pickFeedingId(o)) return hasFields || Boolean(pickStr(o, 'babyId', 'BabyId'))
  return Boolean(pickFeedingAt(o) && pickStr(o, 'babyId', 'BabyId'))
}

function syntheticFeedingId(o: Record<string, unknown>, feedingAtIso: string): string {
  const babyId = pickStr(o, 'babyId', 'BabyId')
  const type = pickStr(o, 'feedingType', 'FeedingType', 'type', 'Type') || 'feed'
  return `feed-${babyId}-${feedingAtIso}-${type}`.replace(/[^a-zA-Z0-9_-]+/g, '_')
}

function normalizeFeeding(raw: unknown): FeedingLogDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (!looksLikeFeeding(o)) return null

  const feedingAtRaw = pickFeedingAt(o)
  const feedingAtIso = feedingAtRaw ? toUtcIsoTime(feedingAtRaw) : new Date().toISOString()
  const id = pickFeedingId(o) || syntheticFeedingId(o, feedingAtIso)
  const feedingTypeRaw =
    o.feedingType ?? o.FeedingType ?? o.type ?? o.Type ?? o.feedType ?? o.FeedType

  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId') || undefined,
    feedingType: normalizeFeedingType(feedingTypeRaw),
    feedingAt: feedingAtIso,
    amountOz: normalizeOptionalNumber(o.amountOz ?? o.AmountOz) || undefined,
    durationMin: normalizeOptionalNumber(o.durationMin ?? o.DurationMin) || undefined,
    notes: pickStr(o, 'notes', 'Notes') || null,
    isTeething: pickBool(o, 'isTeething', 'IsTeething'),
    isSick: pickBool(o, 'isSick', 'IsSick'),
  }
}

/** Flatten JSON.NET `$values` and nested list wrappers. */
function flattenFeedingNodes(payload: unknown): FeedingLogDto[] {
  const out: FeedingLogDto[] = []
  const seen = new Set<unknown>()

  const visit = (node: unknown) => {
    if (node == null) return
    if (typeof node === 'object' || typeof node === 'function') {
      if (seen.has(node)) return
      seen.add(node)
    }

    const row = normalizeFeeding(node)
    if (row) {
      out.push(row)
      return
    }

    if (Array.isArray(node)) {
      for (const item of node) visit(item)
      return
    }

    if (typeof node !== 'object') return
    const o = node as Record<string, unknown>

    const values = o.$values ?? o.Values
    if (Array.isArray(values)) {
      for (const item of values) visit(item)
    }

    for (const key of [
      'result',
      'Result',
      'results',
      'Results',
      'feeding',
      'Feeding',
      'feedings',
      'Feedings',
      'feedingLogs',
      'FeedingLogs',
      'data',
      'Data',
      'items',
      'Items',
      'value',
      'Value',
    ]) {
      if (o[key] != null) visit(o[key])
    }
  }

  visit(unwrapFeedingEnvelope(payload))
  return out
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text) return value
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return value
    }
  }
  return value
}

/** Unwrap .NET envelopes: `{ result | Result: T }`, including JSON string `result`. */
function unwrapFeedingEnvelope(data: unknown): unknown {
  let current = data
  for (let depth = 0; depth < 4; depth += 1) {
    if (current == null) return current
    if (Array.isArray(current)) return current

    if (typeof current === 'string') {
      const parsed = parseMaybeJson(current)
      if (parsed === current) return current
      current = parsed
      continue
    }

    if (typeof current !== 'object') return current

    const o = current as Record<string, unknown>
    const nested = o.result ?? o.Result ?? o.results ?? o.Results
    if (nested == null) return current

    const next = parseMaybeJson(nested)
    current = next
  }
  return current
}

function normalizeFeedingList(data: unknown): FeedingLogDto[] {
  const flat = flattenFeedingNodes(data)
  const byId = new Map<string, FeedingLogDto>()
  for (const row of flat) {
    const id = row.id?.trim()
    if (!id || id === '0') continue
    byId.set(id, row)
  }
  return Array.from(byId.values())
}

function unwrapFeedingPayload(raw: unknown): unknown {
  const payload = unwrapFeedingEnvelope(raw)
  if (Array.isArray(payload)) return payload.length > 0 ? payload[0] : payload
  return payload
}

function pickFeedingIdFromEnvelope(raw: unknown): string {
  const payload = unwrapFeedingEnvelope(raw)
  if (typeof payload === 'string') {
    const s = payload.trim()
    if (s && s !== '0') return s
  }
  const row = normalizeFeeding(payload)
  if (row?.id) return row.id
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return pickFeedingId(payload as Record<string, unknown>)
  }
  return ''
}

function feedingIdQuery(feedingId: string) {
  return new URLSearchParams({ id: feedingId })
}

function toApiBody(payload: FeedingLogWrite): Record<string, unknown> {
  const feedingAt = toUtcIsoTime(payload.feedingAt)
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    feedingType: normalizeFeedingType(payload.feedingType),
    feedingAt,
    amountOz: payload.amountOz?.trim() ? Number(payload.amountOz) : null,
    durationMin: payload.durationMin?.trim() ? Number(payload.durationMin) : null,
    notes: payload.notes?.trim() || null,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

function feedingFromWrite(payload: FeedingLogWrite, data: unknown, resolvedId: string): FeedingLogDto {
  const unwrapped = unwrapFeedingPayload(data)
  const row = normalizeFeeding(unwrapped)
  if (row) return { ...row, babyId: row.babyId || payload.babyId }

  const id = resolvedId || payload.id?.trim()
  if (!id) throw new Error('Feeding: invalid response from server')

  return {
    id,
    babyId: payload.babyId,
    feedingType: normalizeFeedingType(payload.feedingType),
    feedingAt: toUtcIsoTime(payload.feedingAt),
    amountOz: payload.amountOz?.trim() || undefined,
    durationMin: payload.durationMin?.trim() || undefined,
    notes: payload.notes?.trim() || null,
    isTeething: Boolean(payload.isTeething),
    isSick: Boolean(payload.isSick),
  }
}

async function resolveFeedingIdAfterWrite(
  babyId: string,
  fields: FeedingLogCreate,
  data: unknown,
  row: FeedingLogDto | null,
): Promise<string> {
  const fromRow = row?.id?.trim()
  if (fromRow && fromRow !== '0') return fromRow

  const fromEnvelope = pickFeedingIdFromEnvelope(data)
  if (fromEnvelope && fromEnvelope !== '0') return fromEnvelope

  const recent = await fetchFeedingsForBaby(babyId)
  const targetMs = new Date(toUtcIsoTime(fields.feedingAt)).getTime()
  let best: FeedingLogDto | null = null
  let bestDelta = Infinity

  for (const dto of recent) {
    if (dto.feedingType !== normalizeFeedingType(fields.feedingType)) continue
    const ms = new Date(dto.feedingAt).getTime()
    if (Number.isNaN(ms)) continue
    const delta = Math.abs(ms - targetMs)
    if (delta < bestDelta) {
      bestDelta = delta
      best = dto
    }
  }

  if (best && bestDelta <= 15 * 60_000) return best.id
  return ''
}

/** GET `api/feeding/{babyId}` — all feedings for one baby (Task envelope with `result`). */
export async function fetchFeedingsForBaby(babyId: string): Promise<FeedingLogDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/feeding/${encodeURIComponent(id)}`)
  if (data == null) return []
  return normalizeFeedingList(data)
}

/** GET `api/feeding?id={feedingId}` — single feeding (`result` envelope). */
export async function fetchFeedingById(feedingId: string): Promise<FeedingLogDto | null> {
  const id = feedingId.trim()
  if (!id) return null
  const q = feedingIdQuery(id)
  const data = await apiFetch<unknown>(`api/feeding?${q}`)
  const list = normalizeFeedingList(data)
  if (list.length) return list[0]
  return normalizeFeeding(unwrapFeedingPayload(data))
}

/** POST `api/feeding` — create. */
export async function createFeedingLog(payload: FeedingLogWrite): Promise<FeedingLogDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required to create a feeding log')
  const data = await apiFetch<unknown>('api/feeding', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeFeeding(unwrapFeedingPayload(data))
  const resolvedId = await resolveFeedingIdAfterWrite(payload.babyId, payload, data, row)
  return feedingFromWrite(payload, data, resolvedId)
}

/** PUT `api/feeding?id={feedingId}` — update. */
export async function updateFeedingLog(payload: FeedingLogWrite): Promise<FeedingLogDto> {
  const feedingId = payload.id?.trim()
  if (!feedingId) throw new Error('Feeding id is required to update')
  if (!payload.babyId.trim()) throw new Error('Baby id is required to update a feeding log')

  const data = await apiFetch<unknown>(`api/feeding?${feedingIdQuery(feedingId)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody({ ...payload, id: feedingId })),
  })
  const row = normalizeFeeding(unwrapFeedingPayload(data))
  const resolvedId = (await resolveFeedingIdAfterWrite(payload.babyId, payload, data, row)) || feedingId
  return feedingFromWrite({ ...payload, id: feedingId }, data, resolvedId)
}

/** DELETE `api/feeding?id={feedingId}` */
export async function deleteFeedingLog(feedingId: string): Promise<void> {
  const id = feedingId.trim()
  if (!id) throw new Error('Feeding id is required to delete')
  await apiFetch<void>(`api/feeding?${feedingIdQuery(id)}`, {
    method: 'DELETE',
  })
}

export function feedingDtoToLogRecord(dto: FeedingLogDto): LogRecord {
  const atIso = dto.feedingAt ? toUtcIsoTime(dto.feedingAt) : new Date().toISOString()
  return {
    id: dto.id,
    kind: 'feeding',
    atIso,
    details: {
      feedingType: dto.feedingType,
      feedingAt: atIso,
      amountOz: normalizeOptionalNumber(dto.amountOz),
      durationMin: normalizeOptionalNumber(dto.durationMin),
      notes: (dto.notes ?? '').trim(),
      isTeething: dto.isTeething ? 'true' : 'false',
      isSick: dto.isSick ? 'true' : 'false',
      ...(dto.babyId ? { babyId: dto.babyId } : {}),
    },
  }
}

function enrichFeedingLogRecord(
  dto: FeedingLogDto,
  babyId: string,
  babyFullName: string,
): LogRecord {
  const record = feedingDtoToLogRecord({ ...dto, babyId: dto.babyId ?? babyId })
  return {
    ...record,
    details: {
      ...record.details,
      babyId,
      babyName: babyFullName?.trim() || 'Baby',
    },
  }
}

export function feedingLogFromCreate(
  dto: FeedingLogDto,
  babyId: string,
  babyFullName: string,
): LogRecord {
  return enrichFeedingLogRecord(dto, babyId, babyFullName)
}

export function dedupeFeedingLogs(logs: LogRecord[]): LogRecord[] {
  const feedings = logs.filter((l) => l.kind === 'feeding')
  const byId = new Map<string, LogRecord>()
  for (const row of feedings) {
    const id = row.id?.trim()
    if (!id || id === '0') continue
    byId.set(id, row)
  }
  return Array.from(byId.values()).sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

/** Load and merge feeding logs for every baby. */
export async function loadFeedingLogsForBabies(
  babies: { id: string; fullName: string }[],
): Promise<LogRecord[]> {
  if (!babies.length) return []

  const batches = await Promise.all(
    babies.map(async (baby) => {
      const dtos = await fetchFeedingsForBaby(baby.id)
      return dtos.map((dto) => enrichFeedingLogRecord(dto, baby.id, baby.fullName))
    }),
  )

  return dedupeFeedingLogs(batches.flat())
}

export function feedingWriteFromForm(
  babyId: string,
  fields: FeedingLogCreate,
  id?: string,
): FeedingLogWrite {
  return { babyId, ...fields, ...(id ? { id } : {}) }
}

/** Load feedings for the active baby. */
export async function loadFeedingLogs(): Promise<LogRecord[]> {
  const babyId = getBabyId()
  if (!babyId) throw new Error('Add a baby profile before viewing feeding logs.')
  const dtos = await fetchFeedingsForBaby(babyId)
  return dtos.map(feedingDtoToLogRecord)
}
