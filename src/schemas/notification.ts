export type NotificationType = 'mention' | 'post_liked' | 'comment_liked' | 'family_share_request'

export type AppNotification = {
  id: string
  type: NotificationType
  postId: string | null
  commentId: string | null
  familyRequestId: string | null
  isRead: boolean
  createdAt: string
  message: string
  actor: {
    id: string
    username: string
    fullName: string
  }
}
