import { toUtcIsoTime } from '@/api/diaperApi'
import { apiFetch } from '@/api/client'
import type { GrowthMeasurementDto, GrowthMeasurementWrite, TrackingMediaType } from '@/types/growth'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function pickOptionalNumber(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const n = Number(raw)
  if (Number.isFinite(n)) return String(n)
  return String(raw).trim()
}

function normalizeMediaType(raw: unknown): TrackingMediaType | null {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'video') return 'video'
  if (s === 'image') return 'image'
  return null
}

function normalizeGrowth(raw: unknown): GrowthMeasurementDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId'),
    recordedAt: pickStr(o, 'recordedAt', 'RecordedAt'),
    weightLbs: pickOptionalNumber(o.weightLbs ?? o.WeightLbs),
    heightInches: pickOptionalNumber(o.heightInches ?? o.HeightInches),
    headCircumferenceInches: pickOptionalNumber(
      o.headCircumferenceInches ?? o.HeadCircumferenceInches,
    ),
    notes: pickStr(o, 'notes', 'Notes') || null,
    mediaUrl: pickStr(o, 'mediaUrl', 'MediaUrl') || null,
    mediaType: normalizeMediaType(o.mediaType ?? o.MediaType),
  }
}

function unwrapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  return o.results ?? o.Results ?? o.result ?? o.Result ?? raw
}

function normalizeList(data: unknown): GrowthMeasurementDto[] {
  const payload = unwrapPayload(data)
  if (Array.isArray(payload)) {
    return payload.map(normalizeGrowth).filter((r): r is GrowthMeasurementDto => r != null)
  }
  const one = normalizeGrowth(payload)
  return one ? [one] : []
}

function toApiBody(payload: GrowthMeasurementWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    recordedAt: toUtcIsoTime(payload.recordedAt),
    weightLbs: payload.weightLbs?.trim() ? Number(payload.weightLbs) : null,
    heightInches: payload.heightInches?.trim() ? Number(payload.heightInches) : null,
    headCircumferenceInches: payload.headCircumferenceInches?.trim()
      ? Number(payload.headCircumferenceInches)
      : null,
    notes: payload.notes?.trim() || null,
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

export async function fetchGrowthForBaby(babyId: string): Promise<GrowthMeasurementDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/growth/${encodeURIComponent(id)}`)
  return normalizeList(data)
}

export async function createGrowthMeasurement(
  payload: GrowthMeasurementWrite,
): Promise<GrowthMeasurementDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required')
  const data = await apiFetch<unknown>('api/growth', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeGrowth(unwrapPayload(data))
  if (row) return row
  throw new Error('Growth: invalid response from server')
}

export async function updateGrowthMeasurement(
  payload: GrowthMeasurementWrite,
): Promise<GrowthMeasurementDto> {
  const id = payload.id?.trim()
  if (!id) throw new Error('Growth id is required to update')
  const data = await apiFetch<unknown>(`api/growth?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeGrowth(unwrapPayload(data))
  if (row) return row
  throw new Error('Growth: invalid response from server')
}

export async function deleteGrowthMeasurement(id: string): Promise<void> {
  const growthId = id.trim()
  if (!growthId) return
  await apiFetch<void>(`api/growth?id=${encodeURIComponent(growthId)}`, { method: 'DELETE' })
}

export type GrowthMediaUpload = {
  uri: string
  name: string
  type: string
}

export async function uploadGrowthMedia(id: string, file: GrowthMediaUpload): Promise<GrowthMeasurementDto> {
  const growthId = id.trim()
  if (!growthId) throw new Error('Growth id is required to upload media')
  const form = new FormData()
  form.append('media', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob)
  const data = await apiFetch<unknown>(`api/growth/media?id=${encodeURIComponent(growthId)}`, {
    method: 'POST',
    body: form,
  })
  const row = normalizeGrowth(unwrapPayload(data))
  if (row) return row
  throw new Error('Growth media: invalid response from server')
}

export async function deleteGrowthMedia(id: string): Promise<GrowthMeasurementDto> {
  const growthId = id.trim()
  if (!growthId) throw new Error('Growth id is required to remove media')
  const data = await apiFetch<unknown>(`api/growth/media?id=${encodeURIComponent(growthId)}`, {
    method: 'DELETE',
  })
  const row = normalizeGrowth(unwrapPayload(data))
  if (row) return row
  throw new Error('Growth media: invalid response from server')
}

export async function loadGrowthForBabies(
  babies: { id: string; fullName: string }[],
): Promise<(GrowthMeasurementDto & { babyName: string })[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const rows = await fetchGrowthForBaby(baby.id)
      return rows.map((row) => ({
        ...row,
        babyId: row.babyId || baby.id,
        babyName: baby.fullName?.trim() || 'Baby',
      }))
    }),
  )
  return batches.flat().sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
}
