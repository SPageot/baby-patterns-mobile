import { apiFetch } from './client'
import type {
  CreateParentProblemInput,
  ParentAuthor,
  ParentProblem,
  ParentSolution,
} from '@/schemas/parentSolutionBoard'

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

function normalizeAuthor(raw: unknown): ParentAuthor | null {
  if (raw == null) return null
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  const avatarRaw = pickStr(o, 'avatarUrl', 'AvatarUrl')
  return {
    id,
    username: pickStr(o, 'username', 'Username'),
    fullName: pickStr(o, 'fullName', 'FullName'),
    avatarUrl: avatarRaw || undefined,
    isPro: pickBool(o, 'isPro', 'IsPro'),
    isSiteDeveloper: pickBool(o, 'isSiteDeveloper', 'IsSiteDeveloper'),
  }
}

export function normalizeParentSolution(raw: unknown): ParentSolution | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  const author = normalizeAuthor(o.author ?? o.Author)
  if (!author) return null
  const updatedRaw = pickStr(o, 'updatedAt', 'UpdatedAt')
  return {
    id,
    problemId: pickStr(o, 'problemId', 'ProblemId'),
    body: pickStr(o, 'body', 'Body'),
    colorIndex: pickNum(o, 'colorIndex', 'ColorIndex'),
    rotationDeg: pickNum(o, 'rotationDeg', 'RotationDeg'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    updatedAt: updatedRaw || undefined,
    author,
    isMine: pickBool(o, 'isMine', 'IsMine'),
    upvoteCount: pickNum(o, 'upvoteCount', 'UpvoteCount'),
    upvotedByMe: pickBool(o, 'upvotedByMe', 'UpvotedByMe'),
    isMostUpvoted: pickBool(o, 'isMostUpvoted', 'IsMostUpvoted'),
    helpedSomeone: pickBool(o, 'helpedSomeone', 'HelpedSomeone'),
  }
}

export function normalizeParentProblem(raw: unknown): ParentProblem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  const updatedRaw = pickStr(o, 'updatedAt', 'UpdatedAt')
  const solutionsRaw = o.solutions ?? o.Solutions
  const solutions = Array.isArray(solutionsRaw)
    ? solutionsRaw.map(normalizeParentSolution).filter((s): s is ParentSolution => s != null)
    : undefined
  return {
    id,
    title: pickStr(o, 'title', 'Title'),
    description: pickStr(o, 'description', 'Description'),
    category: pickStr(o, 'category', 'Category') || 'other',
    isAnonymous: pickBool(o, 'isAnonymous', 'IsAnonymous'),
    colorIndex: pickNum(o, 'colorIndex', 'ColorIndex'),
    rotationDeg: pickNum(o, 'rotationDeg', 'RotationDeg'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    updatedAt: updatedRaw || undefined,
    author: normalizeAuthor(o.author ?? o.Author),
    isMine: pickBool(o, 'isMine', 'IsMine'),
    meTooCount: pickNum(o, 'meTooCount', 'MeTooCount'),
    solutionCount: pickNum(o, 'solutionCount', 'SolutionCount'),
    meTooByMe: pickBool(o, 'meTooByMe', 'MeTooByMe'),
    isNew: pickBool(o, 'isNew', 'IsNew'),
    isTrending: pickBool(o, 'isTrending', 'IsTrending'),
    solutions,
  }
}

export async function fetchParentProblems(category?: string, page = 1): Promise<ParentProblem[]> {
  const params = new URLSearchParams({ page: String(page), pageSize: '50' })
  if (category && category !== 'all') params.set('category', category)
  const data = await apiFetch<unknown>(`api/solutionboard/problems?${params}`)
  if (!Array.isArray(data)) return []
  return data.map(normalizeParentProblem).filter((p): p is ParentProblem => p != null)
}

export async function fetchParentProblem(problemId: string): Promise<ParentProblem> {
  const data = await apiFetch<unknown>(`api/solutionboard/problems/${encodeURIComponent(problemId)}`)
  const problem = normalizeParentProblem(data)
  if (!problem) throw new Error('Invalid response from server')
  return problem
}

export async function createParentProblem(input: CreateParentProblemInput): Promise<ParentProblem> {
  const data = await apiFetch<unknown>('api/solutionboard/problems', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      isAnonymous: input.isAnonymous,
    }),
  })
  const problem = normalizeParentProblem(data)
  if (!problem) throw new Error('Invalid response from server')
  return problem
}

export async function deleteParentProblem(problemId: string): Promise<void> {
  await apiFetch<void>(`api/solutionboard/problems/${encodeURIComponent(problemId)}`, {
    method: 'DELETE',
  })
}

export async function addParentSolution(problemId: string, body: string): Promise<ParentSolution> {
  const data = await apiFetch<unknown>(
    `api/solutionboard/problems/${encodeURIComponent(problemId)}/solutions`,
    { method: 'POST', body: JSON.stringify({ body: body.trim() }) },
  )
  const solution = normalizeParentSolution(data)
  if (!solution) throw new Error('Invalid response from server')
  return solution
}

export async function deleteParentSolution(solutionId: string): Promise<void> {
  await apiFetch<void>(`api/solutionboard/solutions/${encodeURIComponent(solutionId)}`, {
    method: 'DELETE',
  })
}

export async function toggleProblemMeToo(
  problemId: string,
): Promise<{ meToo: boolean; meTooCount: number }> {
  const data = await apiFetch<Record<string, unknown>>(
    `api/solutionboard/problems/${encodeURIComponent(problemId)}/metoo`,
    { method: 'POST' },
  )
  return {
    meToo: pickBool(data, 'meToo', 'MeToo'),
    meTooCount: pickNum(data, 'meTooCount', 'MeTooCount'),
  }
}

export async function toggleSolutionUpvote(
  solutionId: string,
): Promise<{ upvoted: boolean; upvoteCount: number }> {
  const data = await apiFetch<Record<string, unknown>>(
    `api/solutionboard/solutions/${encodeURIComponent(solutionId)}/upvote`,
    { method: 'POST' },
  )
  return {
    upvoted: pickBool(data, 'upvoted', 'Upvoted'),
    upvoteCount: pickNum(data, 'upvoteCount', 'UpvoteCount'),
  }
}
