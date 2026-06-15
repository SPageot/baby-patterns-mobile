import type { Post } from '@/schemas/post'

export function normalizeUserId(id: string | undefined | null): string {
  return (id ?? '').trim().toLowerCase()
}

export function isOwnPost(post: Post, currentUserId: string | undefined | null): boolean {
  const authorId = normalizeUserId(post.author.id)
  const viewerId = normalizeUserId(currentUserId)
  if (!authorId || !viewerId) return false
  return authorId === viewerId
}
