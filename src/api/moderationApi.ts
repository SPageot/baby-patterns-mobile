import { apiFetch } from '@/api/client'
import type { ContentReportReason, ModerationContentType } from '@/schemas/moderation'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function normalizeBlockedIds(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return []
  const o = raw as Record<string, unknown>
  const list = o.blockedUserIds ?? o.BlockedUserIds
  if (!Array.isArray(list)) return []
  return list.map((id) => String(id).trim()).filter(Boolean)
}

export async function fetchBlockedUserIds(): Promise<string[]> {
  const data = await apiFetch<unknown>('/api/moderation/blocked')
  return normalizeBlockedIds(data)
}

export async function blockUser(userId: string): Promise<void> {
  await apiFetch(`/api/moderation/block/${encodeURIComponent(userId)}`, { method: 'POST' })
}

export async function unblockUser(userId: string): Promise<void> {
  await apiFetch(`/api/moderation/block/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

export async function reportContent(
  contentType: ModerationContentType,
  contentId: string,
  reason: ContentReportReason,
  details?: string,
): Promise<void> {
  await apiFetch('/api/moderation/report', {
    method: 'POST',
    body: JSON.stringify({
      contentType,
      contentId,
      reason,
      details: details?.trim() || undefined,
    }),
  })
}

export function parseReportError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Could not complete that action. Please try again.'
}

export function pickAuthorId(author: { id?: string; Id?: string } | null | undefined): string {
  if (!author) return ''
  return pickStr(author as Record<string, unknown>, 'id', 'Id')
}
