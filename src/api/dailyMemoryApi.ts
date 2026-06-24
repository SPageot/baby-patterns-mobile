import { apiFetch } from '@/api/client'
import type { DailyMemory, DailyMemoryWrite } from '@/schemas/dailyMemory'
import type { TrackingMediaType } from '@/types/growth'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function normalizeMediaType(raw: unknown): TrackingMediaType | null {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'video') return 'video'
  if (s === 'image') return 'image'
  return null
}

function normalizeMemory(raw: unknown): DailyMemory | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const content = pickStr(o, 'content', 'Content')
  const memoryDate = pickStr(o, 'memoryDate', 'MemoryDate')
  if (!id || !content || !memoryDate) return null

  return {
    id,
    babyId: pickStr(o, 'babyId', 'BabyId'),
    memoryDate,
    title: pickStr(o, 'title', 'Title') || null,
    content,
    mediaUrl: pickStr(o, 'mediaUrl', 'MediaUrl') || null,
    mediaType: normalizeMediaType(o.mediaType ?? o.MediaType),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    updatedAt: pickStr(o, 'updatedAt', 'UpdatedAt') || null,
  }
}

function unwrapPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = raw as Record<string, unknown>
  return o.results ?? o.Results ?? o.result ?? o.Result ?? raw
}

function normalizeList(data: unknown): DailyMemory[] {
  const payload = unwrapPayload(data)
  if (Array.isArray(payload)) {
    return payload.map(normalizeMemory).filter((r): r is DailyMemory => r != null)
  }
  const one = normalizeMemory(payload)
  return one ? [one] : []
}

function toApiBody(payload: DailyMemoryWrite): Record<string, unknown> {
  const body: Record<string, unknown> = {
    babyId: payload.babyId.trim(),
    memoryDate: payload.memoryDate.trim(),
    title: payload.title?.trim() || null,
    content: payload.content.trim(),
  }
  const id = payload.id?.trim()
  if (id) body.id = id
  return body
}

export async function fetchDailyMemoriesForBaby(babyId: string): Promise<DailyMemory[]> {
  const id = babyId.trim()
  if (!id) return []
  const data = await apiFetch<unknown>(`api/dailymemory/${encodeURIComponent(id)}`)
  return normalizeList(data)
}

export async function createDailyMemory(payload: DailyMemoryWrite): Promise<DailyMemory> {
  if (!payload.babyId.trim()) throw new Error('Baby id is required')
  if (!payload.content.trim()) throw new Error('Memory content is required')
  const data = await apiFetch<unknown>('api/dailymemory', {
    method: 'POST',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeMemory(unwrapPayload(data))
  if (row) return row
  throw new Error('Daily memory: invalid response from server')
}

export async function updateDailyMemory(payload: DailyMemoryWrite): Promise<DailyMemory> {
  const id = payload.id?.trim()
  if (!id) throw new Error('Memory id is required to update')
  const data = await apiFetch<unknown>(`api/dailymemory?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toApiBody(payload)),
  })
  const row = normalizeMemory(unwrapPayload(data))
  if (row) return row
  throw new Error('Daily memory: invalid response from server')
}

export async function deleteDailyMemory(id: string): Promise<void> {
  const memoryId = id.trim()
  if (!memoryId) return
  await apiFetch<void>(`api/dailymemory?id=${encodeURIComponent(memoryId)}`, { method: 'DELETE' })
}

export async function loadDailyMemoriesForBabies(
  babies: { id: string; fullName: string }[],
): Promise<(DailyMemory & { babyName: string })[]> {
  if (!babies.length) return []
  const batches = await Promise.all(
    babies.map(async (baby) => {
      const rows = await fetchDailyMemoriesForBaby(baby.id)
      return rows.map((row) => ({
        ...row,
        babyId: row.babyId || baby.id,
        babyName: baby.fullName?.trim() || 'Baby',
      }))
    }),
  )
  return batches
    .flat()
    .sort((a, b) => (a.memoryDate < b.memoryDate ? 1 : a.memoryDate > b.memoryDate ? -1 : 0))
}

export type DailyMemoryMediaUpload = {
  uri: string
  name: string
  type: string
}

export async function uploadDailyMemoryMedia(
  id: string,
  file: DailyMemoryMediaUpload,
): Promise<DailyMemory> {
  const memoryId = id.trim()
  if (!memoryId) throw new Error('Memory id is required to upload media')
  const form = new FormData()
  form.append('media', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob)
  const data = await apiFetch<unknown>(`api/dailymemory/media?id=${encodeURIComponent(memoryId)}`, {
    method: 'POST',
    body: form,
  })
  const row = normalizeMemory(unwrapPayload(data))
  if (row) return row
  throw new Error('Daily memory media: invalid response from server')
}

export async function deleteDailyMemoryMedia(id: string): Promise<DailyMemory> {
  const memoryId = id.trim()
  if (!memoryId) throw new Error('Memory id is required to remove media')
  const data = await apiFetch<unknown>(`api/dailymemory/media?id=${encodeURIComponent(memoryId)}`, {
    method: 'DELETE',
  })
  const row = normalizeMemory(unwrapPayload(data))
  if (row) return row
  throw new Error('Daily memory media: invalid response from server')
}
