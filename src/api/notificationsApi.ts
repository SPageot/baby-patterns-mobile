import { apiFetch } from '@/api/client'
import type { AppNotification } from '@/schemas/notification'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
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

function normalizeNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null

  const actorRaw = o.actor ?? o.Actor
  const actorObj = actorRaw && typeof actorRaw === 'object' ? (actorRaw as Record<string, unknown>) : {}

  const typeRaw = pickStr(o, 'type', 'Type').toLowerCase()
  const type: AppNotification['type'] =
    typeRaw === 'mention' ||
    typeRaw === 'post_liked' ||
    typeRaw === 'comment_liked' ||
    typeRaw === 'family_share_request'
      ? typeRaw
      : 'mention'

  return {
    id,
    type,
    postId: pickStr(o, 'postId', 'PostId') || null,
    commentId: pickStr(o, 'commentId', 'CommentId') || null,
    familyRequestId: pickStr(o, 'familyRequestId', 'FamilyRequestId') || null,
    isRead: pickBool(o, 'isRead', 'IsRead'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    message: pickStr(o, 'message', 'Message'),
    actor: {
      id: pickStr(actorObj, 'id', 'Id'),
      username: pickStr(actorObj, 'username', 'Username'),
      fullName: pickStr(actorObj, 'fullName', 'FullName'),
    },
  }
}

export async function fetchNotifications(page = 1): Promise<AppNotification[]> {
  const q = new URLSearchParams({ page: String(page), pageSize: '20' })
  const data = await apiFetch<unknown>(`api/notifications?${q}`)
  if (!Array.isArray(data)) return []
  return data.map(normalizeNotification).filter((n): n is AppNotification => n != null)
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const data = await apiFetch<unknown>('api/notifications/unread-count')
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const count = Number(o.unreadCount ?? o.UnreadCount ?? 0)
  return Number.isFinite(count) ? count : 0
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiFetch<void>(`api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<void>('api/notifications/read-all', { method: 'POST' })
}

export async function clearAllNotifications(): Promise<void> {
  await apiFetch<void>('api/notifications', { method: 'DELETE' })
}
