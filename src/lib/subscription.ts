import type { ReportRange } from './reportAnalytics'
import type { User } from '@/schemas/user'

export const FREE_REPORT_MAX_DAYS: ReportRange = 7

export function isSiteDeveloper(user: User | null | undefined): boolean {
  return Boolean(user?.isSiteDeveloper)
}

export function isPaidProUser(user: User | null | undefined): boolean {
  return Boolean(user?.isPro)
}

export function isProUser(user: User | null | undefined): boolean {
  if (!user) return false
  if (user.hasProAccess != null) return Boolean(user.hasProAccess)
  return Boolean(user.isPro || user.isSiteDeveloper)
}

export function userPlanLabel(user: User | null | undefined): string | null {
  if (isSiteDeveloper(user)) return 'Site developer'
  if (isPaidProUser(user)) return 'Pro'
  return null
}

export function reportRangeOptionsForUser(
  user: User | null | undefined,
): { value: ReportRange; label: string }[] {
  if (isProUser(user)) {
    return [
      { value: 30, label: '30 days' },
      { value: 90, label: '90 days' },
      { value: 0, label: 'All time' },
    ]
  }
  return [{ value: 7, label: '7 days' }]
}
