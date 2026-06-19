import type { User } from '@/schemas/user'
import { FREE_REPORT_MAX_DAYS, isProUser } from '@/lib/subscription'

export const FREE_HEALTH_HISTORY_DAYS = FREE_REPORT_MAX_DAYS

export function healthHistoryCutoffDate(now = new Date()): Date {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - FREE_HEALTH_HISTORY_DAYS)
  cutoff.setHours(0, 0, 0, 0)
  return cutoff
}

export function isWithinFreeHealthHistory(iso: string, now = new Date()): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d >= healthHistoryCutoffDate(now)
}

export function filterSicknessHistoryForUser<T extends { startedAt: string }>(
  rows: T[],
  user: User | null | undefined,
): T[] {
  if (isProUser(user)) return rows
  return rows.filter((row) => isWithinFreeHealthHistory(row.startedAt))
}

export function filterInjuryHistoryForUser<T extends { occurredAt: string }>(
  rows: T[],
  user: User | null | undefined,
): T[] {
  if (isProUser(user)) return rows
  return rows.filter((row) => isWithinFreeHealthHistory(row.occurredAt))
}

export function filterPediatricianHistoryForUser<T extends { visitedAt: string }>(
  rows: T[],
  user: User | null | undefined,
): T[] {
  if (isProUser(user)) return rows
  return rows.filter((row) => isWithinFreeHealthHistory(row.visitedAt))
}

export const FREE_HEALTH_HISTORY_MESSAGE =
  'Free includes sickness and injury logging with 7 days of history. Upgrade to Pro for unlimited history, family alerts, and PDF export.'

export const FREE_TRACKING_HISTORY_MESSAGE =
  'Free includes logging with 7 days of history. Upgrade to Pro for unlimited history, family alerts, PDF export, and weekly summaries.'
