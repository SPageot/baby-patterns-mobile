import { toUtcIsoTime } from '@/api/diaperApi'
import { apiFetch } from '@/api/client'
import type { MilestoneCategory, MilestoneDto, MilestoneWrite, TrackingMediaType } from '@/types/growth'

const CATEGORY_BY_ENUM: Record<string, MilestoneCategory> = {
  '0': 'motor',
  '1': 'social',
  '2': 'language',
  '3': 'cognitive',
  '4': 'other',
  motor: 'motor',
  social: 'social',
  language: 'language',
  cognitive: 'cognitive',
  other: 'other',
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function normalizeCategory(raw: unknown): MilestoneCategory {
  const s = String(raw ?? '').trim().toLowerCase()
  return CATEGORY_BY_ENUM[s] ?? 'other'
}

function normalizeMediaType(raw: unknown): TrackingMediaType | null {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'video') return 'video'
  if (s === 'image') return 'image'
  return null
}

function normalizeMilestone(raw: unknown): MilestoneDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const title = pickStr(o, 'title', 'Title')
  if (!id || !title) return null
  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId'),
    title,
    category: normalizeCategory(o.category ?? o.Category),
    achievedAt: pickStr(o, 'achievedAt', 'AchievedAt'),
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

function normalizeList(data: unknown): MilestoneDto[] {
  const payload = unwrapPayload(data)
  if (Array.isArray(payload)) {
    return payload.map(normalizeMilestone).filter((r): r is MilestoneDto => r != null)
  }
  const one = normalizeMilestone(payload)
  return one ? [one] : []
}

function toApiBody(payload: MilestoneWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    title: payload.title.trim(),
    category: payload.category.charAt(0).toUpperCase() + payload.category.slice(1),
    achievedAt: toUtcIsoTime(payload.achievedAt),
    notes: payload.notes?.trim() || null,
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

export async function fetchMilestonesForBaby(babyId: string): Promise<MilestoneDto[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/milestone/${encodeURIComponent(id)}`)
  return normalizeList(data)
}

export async function createMilestone(payload: MilestoneWrite): Promise<MilestoneDto> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required')
  if (!payload.title.trim()) throw new Error('Milestone title is required')
  const data = await apiFetch<unknown>('api/milestone', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeMilestone(unwrapPayload(data))
  if (row) return row
  throw new Error('Milestone: invalid response from server')
}

export async function updateMilestone(payload: MilestoneWrite): Promise<MilestoneDto> {
  const id = payload.id?.trim()
  if (!id) throw new Error('Milestone id is required to update')
  const data = await apiFetch<unknown>(`api/milestone?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeMilestone(unwrapPayload(data))
  if (row) return row
  throw new Error('Milestone: invalid response from server')
}

export async function deleteMilestone(id: string): Promise<void> {
  const milestoneId = id.trim()
  if (!milestoneId) return
  await apiFetch<void>(`api/milestone?id=${encodeURIComponent(milestoneId)}`, { method: 'DELETE' })
}

export type MilestoneMediaUpload = {
  uri: string
  name: string
  type: string
}

export async function uploadMilestoneMedia(
  id: string,
  file: MilestoneMediaUpload,
): Promise<MilestoneDto> {
  const milestoneId = id.trim()
  if (!milestoneId) throw new Error('Milestone id is required to upload media')
  const form = new FormData()
  form.append('media', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob)
  const data = await apiFetch<unknown>(`api/milestone/media?id=${encodeURIComponent(milestoneId)}`, {
    method: 'POST',
    body: form,
  })
  const row = normalizeMilestone(unwrapPayload(data))
  if (row) return row
  throw new Error('Milestone media: invalid response from server')
}

export async function deleteMilestoneMedia(id: string): Promise<MilestoneDto> {
  const milestoneId = id.trim()
  if (!milestoneId) throw new Error('Milestone id is required to remove media')
  const data = await apiFetch<unknown>(`api/milestone/media?id=${encodeURIComponent(milestoneId)}`, {
    method: 'DELETE',
  })
  const row = normalizeMilestone(unwrapPayload(data))
  if (row) return row
  throw new Error('Milestone media: invalid response from server')
}

export async function loadMilestonesForBabies(
  babies: { id: string; fullName: string }[],
): Promise<(MilestoneDto & { babyName: string })[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const rows = await fetchMilestonesForBaby(baby.id)
      return rows.map((row) => ({
        ...row,
        babyId: row.babyId || baby.id,
        babyName: baby.fullName?.trim() || 'Baby',
      }))
    }),
  )
  return batches.flat().sort((a, b) => (a.achievedAt < b.achievedAt ? 1 : -1))
}
