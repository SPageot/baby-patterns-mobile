import type { PostBadge } from '@/schemas/post'

export const CUSTOM_BADGE_MAX_LENGTH = 24

export const POST_BADGES: { value: PostBadge; label: string }[] = [
  { value: 'advice', label: 'Advice' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'question', label: 'Question' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'tip', label: 'Tip' },
]

export const SITE_DEVELOPER_POST_BADGES: { value: PostBadge; label: string }[] = [
  { value: 'site-error', label: 'Site issue' },
]

const PRESET_LABELS = new Map<string, string>([
  ...POST_BADGES.map((item) => [item.value, item.label] as const),
  ...SITE_DEVELOPER_POST_BADGES.map((item) => [item.value, item.label] as const),
])

export function getAvailablePostBadges(isSiteDeveloper: boolean) {
  return isSiteDeveloper ? [...POST_BADGES, ...SITE_DEVELOPER_POST_BADGES] : POST_BADGES
}

export function isPostBadge(value: string): value is PostBadge {
  return PRESET_LABELS.has(value)
}

export function postBadgeLabel(badge: PostBadge | null | undefined): string | null {
  if (!badge) return null
  return PRESET_LABELS.get(badge) ?? badge
}

export function normalizeCustomBadgeInput(value: string): string {
  return value.trim().slice(0, CUSTOM_BADGE_MAX_LENGTH)
}

export function isValidCustomBadge(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > CUSTOM_BADGE_MAX_LENGTH) return false
  return /^[a-zA-Z0-9][a-zA-Z0-9 '\-&]*$/.test(trimmed)
}

export function postBadgeTone(badge: PostBadge | 'custom'): string {
  return badge
}
