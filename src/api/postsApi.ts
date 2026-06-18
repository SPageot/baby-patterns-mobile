import { getApiBaseUrl, getMediaBaseUrl } from './config'
import { isPostBadge } from '@/lib/postBadges'
import { resolveAvatarUrl } from './userApi'
import { apiFetch } from './client'
import type { Post, PostComment, PostLinkPreview, PostSubmitInput } from '@/schemas/post'

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

function normalizeAuthor(raw: unknown): Post['author'] {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const avatarRaw = pickStr(o, 'avatarUrl', 'AvatarUrl')
  return {
    id: pickStr(o, 'id', 'Id'),
    username: pickStr(o, 'username', 'Username'),
    fullName: pickStr(o, 'fullName', 'FullName'),
    avatarUrl: avatarRaw ? resolveAvatarUrl(avatarRaw) : undefined,
    isPro: pickBool(o, 'isPro', 'IsPro'),
    isSiteDeveloper: pickBool(o, 'isSiteDeveloper', 'IsSiteDeveloper'),
  }
}

function resolveMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const base = trimmed.startsWith('/uploads/') ? getMediaBaseUrl() : getApiBaseUrl()
  if (!base) return trimmed
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

function normalizeBadge(raw: string): Post['badge'] {
  const value = raw.trim().toLowerCase()
  return isPostBadge(value) ? value : null
}

function normalizeCustomBadge(raw: string): string | null {
  const value = raw.trim()
  return value || null
}

function normalizeLinkPreview(raw: unknown): PostLinkPreview | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const url = pickStr(o, 'url', 'Url')
  if (!url) return null

  return {
    id: id || url,
    url,
    title: pickStr(o, 'title', 'Title'),
    description: pickStr(o, 'description', 'Description'),
    imageUrl: pickStr(o, 'imageUrl', 'ImageUrl'),
    siteName: pickStr(o, 'siteName', 'SiteName'),
  }
}

function normalizeMedia(raw: unknown): Post['media'] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const url = resolveMediaUrl(pickStr(o, 'url', 'Url'))
      const mediaTypeRaw = pickStr(o, 'mediaType', 'MediaType').toLowerCase()
      const mediaType = mediaTypeRaw === 'video' ? 'video' : 'image'
      const id = pickStr(o, 'id', 'Id')
      if (!id || !url) return null
      return { id, url, mediaType } as Post['media'][number]
    })
    .filter((m): m is Post['media'][number] => m != null)
}

export function normalizePost(raw: unknown): Post | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null

  const badgeRaw = pickStr(o, 'badge', 'Badge')
  const customBadgeRaw = pickStr(o, 'customBadge', 'CustomBadge')
  const linkPreviewsRaw = o.linkPreviews ?? o.LinkPreviews

  return {
    id,
    content: pickStr(o, 'content', 'Content'),
    badge: badgeRaw ? normalizeBadge(badgeRaw) : null,
    customBadge: customBadgeRaw ? normalizeCustomBadge(customBadgeRaw) : null,
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    updatedAt: pickStr(o, 'updatedAt', 'UpdatedAt') || null,
    author: normalizeAuthor(o.author ?? o.Author),
    media: normalizeMedia(o.media ?? o.Media),
    linkPreviews: Array.isArray(linkPreviewsRaw)
      ? linkPreviewsRaw.map(normalizeLinkPreview).filter((p): p is PostLinkPreview => p != null)
      : [],
    likeCount: pickNum(o, 'likeCount', 'LikeCount'),
    commentCount: pickNum(o, 'commentCount', 'CommentCount'),
    likedByMe: pickBool(o, 'likedByMe', 'LikedByMe'),
  }
}

function normalizePostList(raw: unknown): Post[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizePost).filter((p): p is Post => p != null)
}

function normalizeComment(raw: unknown): PostComment | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    content: pickStr(o, 'content', 'Content'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    author: normalizeAuthor(o.author ?? o.Author),
    likeCount: pickNum(o, 'likeCount', 'LikeCount'),
    likedByMe: pickBool(o, 'likedByMe', 'LikedByMe'),
  }
}

function appendPostFormFields(form: FormData, input: PostSubmitInput): void {
  form.append('content', input.content.trim())
  form.append('badge', input.badge ?? '')
  form.append('customBadge', input.customBadge?.trim() ?? '')
  if (input.removeMediaIds.length > 0) {
    form.append('removeMediaIds', input.removeMediaIds.join(','))
  }
}

export async function fetchPosts(page = 1): Promise<Post[]> {
  const q = new URLSearchParams({ page: String(page), pageSize: '20' })
  const data = await apiFetch<unknown>(`api/posts?${q}`)
  return normalizePostList(data)
}

export async function createPost(input: PostSubmitInput): Promise<Post> {
  const form = new FormData()
  appendPostFormFields(form, input)

  const data = await apiFetch<unknown>('api/posts', { method: 'POST', body: form })
  const post = normalizePost(data)
  if (!post) throw new Error('Invalid post response from server')
  return post
}

export async function updatePost(postId: string, input: PostSubmitInput): Promise<Post> {
  const form = new FormData()
  appendPostFormFields(form, input)

  const data = await apiFetch<unknown>(`api/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: form,
  })
  const post = normalizePost(data)
  if (!post) throw new Error('Invalid post response from server')
  return post
}

export async function togglePostLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  const data = await apiFetch<unknown>(`api/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
  })
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  return {
    liked: pickBool(o, 'liked', 'Liked'),
    likeCount: pickNum(o, 'likeCount', 'LikeCount'),
  }
}

export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const data = await apiFetch<unknown>(`api/posts/comments/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
  })
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  return {
    liked: pickBool(o, 'liked', 'Liked'),
    likeCount: pickNum(o, 'likeCount', 'LikeCount'),
  }
}

export async function fetchPostComments(postId: string): Promise<PostComment[]> {
  const data = await apiFetch<unknown>(`api/posts/${encodeURIComponent(postId)}/comments`)
  if (!Array.isArray(data)) return []
  return data.map(normalizeComment).filter((c): c is PostComment => c != null)
}

export async function addPostComment(postId: string, content: string): Promise<PostComment> {
  const data = await apiFetch<unknown>(`api/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  const comment = normalizeComment(data)
  if (!comment) throw new Error('Invalid comment response from server')
  return comment
}

export async function deletePost(postId: string): Promise<void> {
  await apiFetch<void>(`api/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' })
}

export { resolveMediaUrl }
