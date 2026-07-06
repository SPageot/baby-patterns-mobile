import { apiFetch } from '@/api/client'
import type { SolutionNote, SolutionNoteInput } from '@/schemas/solutionNote'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 0
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

function normalizeAuthor(raw: unknown): SolutionNote['author'] {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const avatarRaw = pickStr(o, 'avatarUrl', 'AvatarUrl')
  return {
    id: pickStr(o, 'id', 'Id'),
    username: pickStr(o, 'username', 'Username'),
    fullName: pickStr(o, 'fullName', 'FullName'),
    avatarUrl: avatarRaw ? avatarRaw : undefined,
    isPro: pickBool(o, 'isPro', 'IsPro'),
    isSiteDeveloper: pickBool(o, 'isSiteDeveloper', 'IsSiteDeveloper'),
  }
}

export function normalizeSolutionNote(raw: unknown): SolutionNote | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null

  const updatedRaw = pickStr(o, 'updatedAt', 'UpdatedAt')
  return {
    id,
    challenge: pickStr(o, 'challenge', 'Challenge'),
    solution: pickStr(o, 'solution', 'Solution'),
    colorIndex: pickNum(o, 'colorIndex', 'ColorIndex'),
    rotationDeg: pickNum(o, 'rotationDeg', 'RotationDeg'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    updatedAt: updatedRaw || undefined,
    author: normalizeAuthor(o.author ?? o.Author),
    isMine: pickBool(o, 'isMine', 'IsMine'),
  }
}

export async function fetchSolutionNotes(page = 1): Promise<SolutionNote[]> {
  const data = await apiFetch<unknown>(`api/solutionnotes?page=${page}&pageSize=50`)
  if (!Array.isArray(data)) return []
  return data.map(normalizeSolutionNote).filter((n): n is SolutionNote => n != null)
}

export async function createSolutionNote(input: SolutionNoteInput): Promise<SolutionNote> {
  try {
    const data = await apiFetch<unknown>('api/solutionnotes', {
      method: 'POST',
      body: JSON.stringify({
        challenge: input.challenge.trim(),
        solution: input.solution.trim(),
      }),
    })
    const note = normalizeSolutionNote(data)
    if (!note) throw new Error('Invalid response from server')
    return note
  } catch (e) {
    if (e instanceof Error) throw e
    throw new Error('Could not add sticky note')
  }
}

export async function updateSolutionNote(noteId: string, input: SolutionNoteInput): Promise<SolutionNote> {
  try {
    const data = await apiFetch<unknown>(`api/solutionnotes/${encodeURIComponent(noteId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        challenge: input.challenge.trim(),
        solution: input.solution.trim(),
      }),
    })
    const note = normalizeSolutionNote(data)
    if (!note) throw new Error('Invalid response from server')
    return note
  } catch (e) {
    if (e instanceof Error) throw e
    throw new Error('Could not update sticky note')
  }
}

export async function deleteSolutionNote(noteId: string): Promise<void> {
  await apiFetch<void>(`api/solutionnotes/${encodeURIComponent(noteId)}`, { method: 'DELETE' })
}
