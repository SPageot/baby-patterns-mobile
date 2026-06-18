import { toUtcIsoTime } from '@/api/diaperApi'
import { apiFetch } from '@/api/client'
import type { SicknessEventDto, SicknessEventWrite } from '@/types/health'

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

function pickSymptoms(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => String(s).trim()).filter(Boolean)
}

function normalizeSickness(raw: unknown): SicknessEventDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  const temp = o.temperatureF ?? o.TemperatureF
  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId'),
    sicknessType: pickStr(o, 'sicknessType', 'SicknessType'),
    startedAt: pickStr(o, 'startedAt', 'StartedAt'),
    endedAt: pickStr(o, 'endedAt', 'EndedAt') || null,
    temperatureF: temp == null || temp === '' ? null : String(temp),
    symptoms: pickSymptoms(o.symptoms ?? o.Symptoms),
    usedDoctorRecommendations: pickBool(o, 'usedDoctorRecommendations', 'UsedDoctorRecommendations'),
    doctorRecommendations: pickStr(o, 'doctorRecommendations', 'DoctorRecommendations') || null,
    usedNaturalRemedies: pickBool(o, 'usedNaturalRemedies', 'UsedNaturalRemedies'),
    naturalRemedies: pickStr(o, 'naturalRemedies', 'NaturalRemedies') || null,
    usedMedication: pickBool(o, 'usedMedication', 'UsedMedication'),
    medicationUsed: pickStr(o, 'medicationUsed', 'MedicationUsed') || null,
    medicationAmount: pickStr(o, 'medicationAmount', 'MedicationAmount') || null,
    notes: pickStr(o, 'notes', 'Notes') || null,
  }
}

function unwrapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  return o.results ?? o.Results ?? o.result ?? o.Result ?? raw
}

function normalizeList(data: unknown): SicknessEventDto[] {
  const payload = unwrapPayload(data)
  if (Array.isArray(payload)) {
    return payload.map(normalizeSickness).filter((r): r is SicknessEventDto => r != null)
  }
  const one = normalizeSickness(payload)
  return one ? [one] : []
}

function toApiBody(payload: SicknessEventWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    sicknessType: payload.sicknessType.trim(),
    startedAt: toUtcIsoTime(payload.startedAt),
    endedAt: payload.endedAt?.trim() ? toUtcIsoTime(payload.endedAt) : null,
    temperatureF: payload.temperatureF?.trim() ? Number(payload.temperatureF) : null,
    symptoms: payload.symptoms.map((s) => s.trim()).filter(Boolean),
    usedDoctorRecommendations: payload.usedDoctorRecommendations,
    doctorRecommendations: payload.doctorRecommendations?.trim() || null,
    usedNaturalRemedies: payload.usedNaturalRemedies,
    naturalRemedies: payload.naturalRemedies?.trim() || null,
    usedMedication: payload.usedMedication,
    medicationUsed: payload.medicationUsed?.trim() || null,
    medicationAmount: payload.medicationAmount?.trim() || null,
    notes: payload.notes?.trim() || null,
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

export async function fetchSicknessForBaby(babyId: string): Promise<SicknessEventDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/sickness/${encodeURIComponent(id)}`)
  return normalizeList(data)
}

export async function createSicknessEvent(payload: SicknessEventWrite): Promise<SicknessEventDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required')
  const data = await apiFetch<unknown>('api/sickness', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeSickness(unwrapPayload(data))
  if (row) return row
  throw new Error('Sickness: invalid response from server')
}

export async function updateSicknessEvent(payload: SicknessEventWrite): Promise<SicknessEventDto> {
  const id = payload.id?.trim()
  if (!id) throw new Error('Sickness id is required to update')
  const data = await apiFetch<unknown>(`api/sickness?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeSickness(unwrapPayload(data))
  if (row) return row
  throw new Error('Sickness: invalid response from server')
}

export async function deleteSicknessEvent(id: string): Promise<void> {
  const sicknessId = id.trim()
  if (!sicknessId) return
  await apiFetch<void>(`api/sickness?id=${encodeURIComponent(sicknessId)}`, { method: 'DELETE' })
}

export async function loadSicknessForBabies(
  babies: { id: string; fullName: string }[],
): Promise<(SicknessEventDto & { babyName: string })[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const rows = await fetchSicknessForBaby(baby.id)
      return rows.map((row) => ({ ...row, babyName: baby.fullName }))
    }),
  )
  return batches.flat().sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}
