export const PARENT_PROBLEM_CATEGORIES = [
  { id: 'sleep_bedtime', label: 'Sleep & Bedtime' },
  { id: 'money_budgeting', label: 'Money & Budgeting' },
  { id: 'co_parenting', label: 'Co-Parenting' },
  { id: 'self_care_burnout', label: 'Self-Care & Burnout' },
  { id: 'single_parent_corner', label: 'Single Parent Corner' },
  { id: 'other', label: 'Other' },
] as const

export type ParentProblemCategoryId = (typeof PARENT_PROBLEM_CATEGORIES)[number]['id']

export type ParentAuthor = {
  id: string
  username: string
  fullName: string
  avatarUrl?: string
  isPro?: boolean
  isSiteDeveloper?: boolean
}

export type ParentSolution = {
  id: string
  problemId: string
  body: string
  colorIndex: number
  rotationDeg: number
  createdAt: string
  updatedAt?: string
  author: ParentAuthor
  isMine: boolean
  upvoteCount: number
  upvotedByMe: boolean
  isMostUpvoted: boolean
  helpedSomeone: boolean
}

export type ParentProblem = {
  id: string
  title: string
  description: string
  category: string
  isAnonymous: boolean
  colorIndex: number
  rotationDeg: number
  createdAt: string
  updatedAt?: string
  author: ParentAuthor | null
  isMine: boolean
  meTooCount: number
  solutionCount: number
  meTooByMe: boolean
  isNew: boolean
  isTrending: boolean
  solutions?: ParentSolution[]
}

export type CreateParentProblemInput = {
  title: string
  description: string
  category: string
  isAnonymous: boolean
}
