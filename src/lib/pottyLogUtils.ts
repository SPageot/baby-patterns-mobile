import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { isoLocalYmd } from '@/lib/trackUtils'

export const POTTY_RESULT_LABELS: Record<string, string> = {
  success: 'Success',
  pee: 'Pee',
  poop: 'Poop',
  both: 'Pee & poop',
  accident: 'Accident',
  dry_attempt: 'Dry attempt',
}

/** Form options (excludes legacy Success). */
export const POTTY_RESULT_OPTIONS = Object.entries(POTTY_RESULT_LABELS).filter(
  ([value]) => value !== 'success',
)

export const DEFAULT_POTTY_RESULT = 'pee'

export const POTTY_LOCATION_LABELS: Record<string, string> = {
  'potty-chair': 'Potty chair',
  toilet: 'Toilet',
  'training-seat': 'Training seat',
  other: 'Other',
}

export function formatPottyLogStamp(atIso: string): { date: string; time: string } {
  const d = new Date(atIso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

export function getPottyResultBadge(result: string): string {
  return POTTY_RESULT_LABELS[result] ?? result.replace(/_/g, ' ')
}

export function getPottyContentBadges(details: Record<string, string>): string[] {
  const badge = getPottyResultBadge(details.result?.trim() || DEFAULT_POTTY_RESULT)
  return badge ? [badge] : []
}

export function getPottyLogMeta(details: Record<string, string>): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = []
  const location = details.location?.trim()
  if (location) {
    items.push({
      label: 'Where',
      value: POTTY_LOCATION_LABELS[location] ?? location,
    })
  }
  const notes = details.notes?.trim()
  if (notes) items.push({ label: 'Notes', value: notes })
  if (details.isTeething === 'true') items.push({ label: 'Teething', value: 'Yes' })
  if (details.isSick === 'true') items.push({ label: 'Sick', value: 'Yes' })
  return items
}

export function filterPottyLogs(
  logs: LogRecord[],
  filters: { babyId?: string; dateYmd?: string },
  babies: Baby[],
): LogRecord[] {
  const potty = logs.filter((l) => l.kind === 'potty')
  return potty.filter((log) => {
    if (filters.babyId?.trim()) {
      const babyId = log.details.babyId?.trim()
      const babyName = log.details.babyName?.trim()
      const matchById = babyId === filters.babyId
      const matchByName =
        !babyId &&
        babyName &&
        babies.find((b) => b.id === filters.babyId)?.fullName?.trim() === babyName
      if (!matchById && !matchByName) return false
    }
    if (filters.dateYmd?.trim()) {
      const day = isoLocalYmd(log.atIso)
      if (day !== filters.dateYmd) return false
    }
    return true
  })
}
