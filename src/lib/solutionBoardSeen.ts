import type { SolutionChallengeGroup } from '@/lib/solutionBoardGroups'

export type SolutionBoardSeenState = Record<string, string[]>

const STORAGE_KEY = 'solution-board-seen-v1'

export function solutionBoardSeenStorageKey(): string {
  return STORAGE_KEY
}

export function parseSolutionBoardSeenState(raw: string | null | undefined): SolutionBoardSeenState {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const state: SolutionBoardSeenState = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue
      const ids = value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      if (ids.length) state[key] = ids
    }
    return state
  } catch {
    return {}
  }
}

export function serializeSolutionBoardSeenState(state: SolutionBoardSeenState): string {
  return JSON.stringify(state)
}

export function groupHasUnseenNotes(
  group: SolutionChallengeGroup,
  seen: SolutionBoardSeenState,
): boolean {
  const seenIds = new Set(seen[group.key] ?? [])
  return group.notes.some((note) => !seenIds.has(note.id))
}

export function markChallengeGroupSeen(
  group: SolutionChallengeGroup,
  seen: SolutionBoardSeenState,
): SolutionBoardSeenState {
  return {
    ...seen,
    [group.key]: group.notes.map((note) => note.id),
  }
}
