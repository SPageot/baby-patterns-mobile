export type SolutionNoteAuthor = {
  id: string
  username: string
  fullName: string
  avatarUrl?: string
  isPro: boolean
  isSiteDeveloper: boolean
}

export type SolutionNote = {
  id: string
  challenge: string
  solution: string
  colorIndex: number
  rotationDeg: number
  createdAt: string
  updatedAt?: string
  author: SolutionNoteAuthor
  isMine: boolean
}

export type SolutionNoteInput = {
  challenge: string
  solution: string
}
