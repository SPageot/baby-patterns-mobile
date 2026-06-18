import type { ReportRange } from './reportAnalytics'
import type { User } from '@/schemas/user'

export const FREE_REPORT_MAX_DAYS: ReportRange = 7

export function isSiteDeveloper(user: Pick<User, 'isSiteDeveloper'> | null | undefined): boolean {
  return Boolean(user?.isSiteDeveloper)
}

export function isPaidProUser(user: Pick<User, 'isPro'> | null | undefined): boolean {
  return Boolean(user?.isPro)
}

export function shouldShowPricingInNav(
  user: Pick<User, 'isPro' | 'isSiteDeveloper'> | null | undefined,
): boolean {
  if (!user) return true
  if (isSiteDeveloper(user)) return true
  return !isPaidProUser(user)
}

export function isProUser(user: User | null | undefined): boolean {
  if (!user) return false
  if (user.isSiteDeveloper) return true
  if (user.isPro) return true
  if (user.hasProAccess) return true
  return false
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
