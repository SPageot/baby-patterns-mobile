import { toUtcIsoTime } from '@/api/diaperApi'
import { apiFetch } from '@/api/client'
import type { PediatricianVisitDto, PediatricianVisitWrite } from '@/types/pediatrician'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function pickImmunizations(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => String(s).trim()).filter(Boolean)
}

function normalizeVisit(raw: unknown): PediatricianVisitDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId'),
    visitedAt: pickStr(o, 'visitedAt', 'VisitedAt'),
    hospital: pickStr(o, 'hospital', 'Hospital') || null,
    pediatricianName: pickStr(o, 'pediatricianName', 'PediatricianName'),
    recommendations: pickStr(o, 'recommendations', 'Recommendations') || null,
    immunizations: pickImmunizations(o.immunizations ?? o.Immunizations),
    notes: pickStr(o, 'notes', 'Notes') || null,
  }
}

function unwrapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  return o.results ?? o.Results ?? o.result ?? o.Result ?? raw
}

function normalizeList(data: unknown): PediatricianVisitDto[] {
  const payload = unwrapPayload(data)
  if (Array.isArray(payload)) {
    return payload.map(normalizeVisit).filter((r): r is PediatricianVisitDto => r != null)
  }
  const one = normalizeVisit(payload)
  return one ? [one] : []
}

function toApiBody(payload: PediatricianVisitWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    visitedAt: toUtcIsoTime(payload.visitedAt),
    hospital: payload.hospital?.trim() || null,
    pediatricianName: payload.pediatricianName.trim(),
    recommendations: payload.recommendations?.trim() || null,
    immunizations: payload.immunizations.map((s) => s.trim()).filter(Boolean),
    notes: payload.notes?.trim() || null,
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

export async function fetchPediatricianVisitsForBaby(babyId: string): Promise<PediatricianVisitDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/pediatrician/${encodeURIComponent(id)}`)
  return normalizeList(data)
}

export async function createPediatricianVisit(
  payload: PediatricianVisitWrite,
): Promise<PediatricianVisitDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required')
  const data = await apiFetch<unknown>('api/pediatrician', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeVisit(unwrapPayload(data))
  if (row) return row
  throw new Error('Pediatrician visit: invalid response from server')
}

export async function updatePediatricianVisit(
  payload: PediatricianVisitWrite,
): Promise<PediatricianVisitDto> {
  const id = payload.id?.trim()
  if (!id) throw new Error('Pediatrician visit id is required to update')
  const data = await apiFetch<unknown>(`api/pediatrician?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeVisit(unwrapPayload(data))
  if (row) return row
  throw new Error('Pediatrician visit: invalid response from server')
}

export async function deletePediatricianVisit(id: string): Promise<void> {
  const visitId = id.trim()
  if (!visitId) return
  await apiFetch<void>(`api/pediatrician?id=${encodeURIComponent(visitId)}`, { method: 'DELETE' })
}

export async function loadPediatricianVisitsForBabies(
  babies: { id: string; fullName: string }[],
): Promise<(PediatricianVisitDto & { babyName: string })[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const rows = await fetchPediatricianVisitsForBaby(baby.id)
      return rows.map((row) => ({ ...row, babyName: baby.fullName }))
    }),
  )
  return batches.flat().sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
}
