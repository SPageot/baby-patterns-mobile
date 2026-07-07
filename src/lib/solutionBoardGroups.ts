import type { SolutionNote, SolutionNoteAuthor } from '@/schemas/solutionNote'

export function normalizeChallengeKey(challenge: string): string {
  return challenge.trim().toLowerCase().replace(/\s+/g, ' ')
}

export type SolutionChallengeGroup = {
  key: string
  challenge: string
  notes: SolutionNote[]
  latestNote: SolutionNote
}

export function groupSolutionNotesByChallenge(notes: SolutionNote[]): SolutionChallengeGroup[] {
  const map = new Map<string, SolutionNote[]>()

  for (const note of notes) {
    const key = normalizeChallengeKey(note.challenge)
    if (!key) continue
    const list = map.get(key) ?? []
    list.push(note)
    map.set(key, list)
  }

  const groups: SolutionChallengeGroup[] = []

  for (const [key, groupNotes] of map) {
    const sorted = [...groupNotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    groups.push({
      key,
      challenge: sorted[0].challenge.trim(),
      notes: sorted,
      latestNote: sorted[0],
    })
  }

  return groups.sort(
    (a, b) => new Date(b.latestNote.createdAt).getTime() - new Date(a.latestNote.createdAt).getTime(),
  )
}

/** Unique authors, most recently active first (walks notes newest → oldest). */
export function uniqueAuthorsFromNotes(notes: SolutionNote[]): SolutionNoteAuthor[] {
  const seen = new Set<string>()
  const authors: SolutionNoteAuthor[] = []
  for (const note of notes) {
    const id = note.author.id?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    authors.push(note.author)
  }
  return authors
}

export function filterChallengeGroupsByQuery(
  groups: SolutionChallengeGroup[],
  query: string,
): SolutionChallengeGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups
  return groups.filter((group) => group.challenge.toLowerCase().includes(q))
}
