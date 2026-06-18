import type { Baby } from '../schemas/user'

export type MultiBabyDraft<T> = {
  babyId: string
  babyName: string
  fields: T
}

export type MultiBabyFormStep = 'entry' | 'review'

export function cloneLogFields<T>(fields: T): T {
  return JSON.parse(JSON.stringify(fields)) as T
}

export function createMultiBabyDrafts<T>(
  babyIds: string[],
  babies: Baby[],
  template: T,
): MultiBabyDraft<T>[] {
  return babyIds.map((babyId) => ({
    babyId,
    babyName: babies.find((b) => b.id === babyId)?.fullName?.trim() || 'Baby',
    fields: cloneLogFields(template),
  }))
}

export function updateMultiBabyDraft<T>(
  drafts: MultiBabyDraft<T>[],
  babyId: string,
  fields: T,
): MultiBabyDraft<T>[] {
  return drafts.map((draft) => (draft.babyId === babyId ? { ...draft, fields } : draft))
}

export function toggleBabyIdInList(ids: string[], babyId: string): string[] {
  if (ids.includes(babyId)) {
    const next = ids.filter((id) => id !== babyId)
    return next.length > 0 ? next : ids
  }
  return [...ids, babyId]
}
