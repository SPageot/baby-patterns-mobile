import type { AppPalette } from '@/constants/homeTheme'
import type { KindReport } from '@/lib/reportAnalytics'

export function reportKindColor(kind: KindReport['kind'], colors: AppPalette): string {
  if (kind === 'diaper') {
    return colors.mode === 'dark' ? 'rgba(199, 160, 140, 0.95)' : '#a67c68'
  }
  if (kind === 'feeding') {
    return colors.mode === 'dark' ? 'rgba(130, 200, 160, 0.95)' : '#4a9a72'
  }
  return colors.mode === 'dark' ? 'rgba(130, 175, 255, 0.9)' : '#5a7fd4'
}
