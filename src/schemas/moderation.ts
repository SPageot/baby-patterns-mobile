export const CONTENT_REPORT_REASONS = ['spam', 'harassment', 'inappropriate', 'other'] as const

export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number]

export type ModerationContentType =
  | 'post'
  | 'post_comment'
  | 'solution_note'
  | 'product_review'

export const CONTENT_REPORT_REASON_LABELS: Record<ContentReportReason, string> = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  inappropriate: 'Inappropriate content',
  other: 'Other',
}
