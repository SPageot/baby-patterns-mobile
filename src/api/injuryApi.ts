import { toUtcIsoTime } from '@/api/diaperApi'
import { apiFetch } from '@/api/client'
import type { InjuryEventDto, InjuryEventWrite } from '@/types/health'

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
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return false
}

function normalizeInjury(raw: unknown): InjuryEventDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId'),
    description: pickStr(o, 'description', 'Description'),
    bodyPart: pickStr(o, 'bodyPart', 'BodyPart') || null,
    hasSwelling: pickBool(o, 'hasSwelling', 'HasSwelling'),
    occurredAt: pickStr(o, 'occurredAt', 'OccurredAt'),
    endedAt: pickStr(o, 'endedAt', 'EndedAt') || null,
    usedDoctorRecommendations: pickBool(o, 'usedDoctorRecommendations', 'UsedDoctorRecommendations'),
    doctorRecommendations: pickStr(o, 'doctorRecommendations', 'DoctorRecommendations') || null,
    usedNaturalRemedies: pickBool(o, 'usedNaturalRemedies', 'UsedNaturalRemedies'),
    naturalRemedies: pickStr(o, 'naturalRemedies', 'NaturalRemedies') || null,
    notes: pickStr(o, 'notes', 'Notes') || null,
  }
}

function unwrapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  return o.results ?? o.Results ?? o.result ?? o.Result ?? raw
}

function normalizeList(data: unknown): InjuryEventDto[] {
  const payload = unwrapPayload(data)
  if (Array.isArray(payload)) {
    return payload.map(normalizeInjury).filter((r): r is InjuryEventDto => r != null)
  }
  const one = normalizeInjury(payload)
  return one ? [one] : []
}

function toApiBody(payload: InjuryEventWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    description: payload.description.trim(),
    bodyPart: payload.bodyPart?.trim() || null,
    hasSwelling: payload.hasSwelling,
    occurredAt: toUtcIsoTime(payload.occurredAt),
    endedAt: payload.endedAt?.trim() ? toUtcIsoTime(payload.endedAt) : null,
    usedDoctorRecommendations: payload.usedDoctorRecommendations,
    doctorRecommendations: payload.doctorRecommendations?.trim() || null,
    usedNaturalRemedies: payload.usedNaturalRemedies,
    naturalRemedies: payload.naturalRemedies?.trim() || null,
    notes: payload.notes?.trim() || null,
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

export async function fetchInjuryForBaby(babyId: string): Promise<InjuryEventDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/injury/${encodeURIComponent(id)}`)
  return normalizeList(data)
}

export async function createInjuryEvent(payload: InjuryEventWrite): Promise<InjuryEventDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required')
  const data = await apiFetch<unknown>('api/injury', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeInjury(unwrapPayload(data))
  if (row) return row
  throw new Error('Injury: invalid response from server')
}

export async function updateInjuryEvent(payload: InjuryEventWrite): Promise<InjuryEventDto> {
  const id = payload.id?.trim()
  if (!id) throw new Error('Injury id is required to update')
  const data = await apiFetch<unknown>(`api/injury?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeInjury(unwrapPayload(data))
  if (row) return row
  throw new Error('Injury: invalid response from server')
}

export async function deleteInjuryEvent(id: string): Promise<void> {
  const injuryId = id.trim()
  if (!injuryId) return
  await apiFetch<void>(`api/injury?id=${encodeURIComponent(injuryId)}`, { method: 'DELETE' })
}

export async function loadInjuryForBabies(
  babies: { id: string; fullName: string }[],
): Promise<(InjuryEventDto & { babyName: string })[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const rows = await fetchInjuryForBaby(baby.id)
      return rows.map((row) => ({ ...row, babyName: baby.fullName }))
    }),
  )
  return batches.flat().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
