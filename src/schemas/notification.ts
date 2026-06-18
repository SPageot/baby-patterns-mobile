export type SocialNotificationType =
  | 'mention'
  | 'post_liked'
  | 'comment_liked'
  | 'family_share_request'

export type TrackingNotificationType =
  | 'diaper_logged'
  | 'diaper_updated'
  | 'feeding_logged'
  | 'feeding_updated'
  | 'sleep_logged'
  | 'sleep_updated'
  | 'growth_logged'
  | 'growth_updated'
  | 'milestone_logged'
  | 'milestone_updated'
  | 'sickness_logged'
  | 'sickness_updated'
  | 'injury_logged'
  | 'injury_updated'

export type NotificationType = SocialNotificationType | TrackingNotificationType

const NOTIFICATION_TYPES = new Set<string>([
  'mention',
  'post_liked',
  'comment_liked',
  'family_share_request',
  'diaper_logged',
  'diaper_updated',
  'feeding_logged',
  'feeding_updated',
  'sleep_logged',
  'sleep_updated',
  'growth_logged',
  'growth_updated',
  'milestone_logged',
  'milestone_updated',
  'sickness_logged',
  'sickness_updated',
  'injury_logged',
  'injury_updated',
])

export function isNotificationType(value: string): value is NotificationType {
  return NOTIFICATION_TYPES.has(value)
}

export function notificationRoute(type: NotificationType): string {
  if (type === 'family_share_request') return '/profile'
  if (type.startsWith('diaper_')) return '/diapers'
  if (type.startsWith('feeding_')) return '/feeding'
  if (type.startsWith('sleep_')) return '/sleep'
  if (type.startsWith('growth_') || type.startsWith('milestone_')) return '/growth'
  if (type.startsWith('sickness_') || type.startsWith('injury_')) return '/health'
  return '/parents-corner'
}

export type AppNotification = {
  id: string
  type: NotificationType
  postId: string | null
  commentId: string | null
  familyRequestId: string | null
  babyId: string | null
  trackingEntityId: string | null
  isRead: boolean
  createdAt: string
  message: string
  actor: {
    id: string
    username: string
    fullName: string
  }
}
