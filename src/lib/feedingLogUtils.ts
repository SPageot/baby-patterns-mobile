import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { diaperLogMatchesBaby } from './diaperFeedUtils'

const FEEDING_TYPE_LABELS: Record<string, string> = {
  breast: 'Breastfeed',
  bottle: 'Bottle',
  solids: 'Solids',
  snack: 'Snack',
}

export function feedingTypeLabel(type: string): string {
  const key = type.trim().toLowerCase()
  return FEEDING_TYPE_LABELS[key] ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Feed')
}

export function formatFeedingStamp(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' }
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

export function formatFeedingSummary(log: LogRecord): string {
  const d = log.details
  const parts = [feedingTypeLabel(d.feedingType ?? '')]
  if (d.amountOz?.trim()) parts.push(`${d.amountOz.trim()} oz`)
  if (d.durationMin?.trim()) {
    const n = Number(d.durationMin)
    if (Number.isFinite(n) && n > 0) parts.push(`${n} min`)
  }
  if (d.notes?.trim()) parts.push(d.notes.trim())
  if (d.isTeething === 'true') parts.push('Teething')
  if (d.isSick === 'true') parts.push('Sick')
  return parts.filter(Boolean).join(' · ')
}

export function filterFeedingLogs(
  logs: LogRecord[],
  filters: { babyId: string; dateYmd: string },
  babies: Baby[],
): LogRecord[] {
  return logs
    .filter((l) => l.kind === 'feeding')
    .filter((l) => diaperLogMatchesBaby(l, filters.babyId, babies))
    .filter((l) => {
      if (!filters.dateYmd) return true
      const at = l.details.feedingAt || l.atIso
      const d = new Date(at)
      if (Number.isNaN(d.getTime())) return false
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return ymd === filters.dateYmd
    })
    .sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}
