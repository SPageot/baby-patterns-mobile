import type { Baby } from '../schemas/user'
import type { LogRecord } from '../types/babyLog'
import { formatWhen, isoLocalYmd } from './dateUtils'

export type DiaperMix = 'wet' | 'dirty' | 'mixed' | 'other' | 'plain'

export function diaperMixType(log: LogRecord): DiaperMix {
  const d = log.details
  if (Object.prototype.hasOwnProperty.call(d, 'isTherePee')) {
    const wet = d.isTherePee === 'true'
    const dirty = d.isTherePoop === 'true'
    if (wet && dirty) return 'mixed'
    if (wet) return 'wet'
    if (dirty) return 'dirty'
    if (d.isThereAnythingElse === 'true') return 'other'
    return 'plain'
  }
  const t = (d.type ?? '').toLowerCase()
  if (t === 'wet') return 'wet'
  if (t === 'dirty') return 'dirty'
  if (t === 'mixed') return 'mixed'
  return 'plain'
}

export function diaperMixHeadline(mix: DiaperMix) {
  if (mix === 'wet') return 'Wet diaper'
  if (mix === 'dirty') return 'Bowel movement'
  if (mix === 'mixed') return 'Mixed change'
  if (mix === 'other') return 'Something else'
  return 'Diaper change'
}

export function formatRelativeWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 45_000) return 'Just now'
  const min = Math.floor(diffMs / 60_000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return formatWhen(iso)
}

export function getDiaperContentBadges(details: Record<string, string>): string[] {
  if (!Object.prototype.hasOwnProperty.call(details, 'isTherePee')) {
    const type = (details.type ?? '').trim()
    return type ? [type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()] : ['Change']
  }

  const badges: string[] = []
  if (details.isTherePee === 'true') badges.push('Wet')
  if (details.isTherePoop === 'true') badges.push('Bowel movement')
  if (details.isThereAnythingElse === 'true') {
    badges.push(details.anythingElseDescription?.trim() || 'Other')
  }
  return badges.length ? badges : ['Change']
}

export function formatDiaperContents(details: Record<string, string>): string {
  if (!Object.prototype.hasOwnProperty.call(details, 'isTherePee')) {
    const type = (details.type ?? '').trim()
    return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Change'
  }

  const parts: string[] = []
  if (details.isTherePee === 'true') parts.push('Wet')
  if (details.isTherePoop === 'true') parts.push('Bowel movement')
  if (details.isThereAnythingElse === 'true') {
    if (details.anythingElseDescription?.trim()) {
      parts.push(details.anythingElseDescription.trim())
    } else {
      parts.push('Other')
    }
  }
  return parts.length ? parts.join(' · ') : 'Change'
}

export type DiaperLogMetaItem = {
  label: string
  value: string
}

/** Brand, size, cream, and other product details for a diaper log row. */
export function getDiaperLogMeta(details: Record<string, string>): DiaperLogMetaItem[] {
  const items: DiaperLogMetaItem[] = []

  if (details.diaperBrand?.trim()) {
    items.push({ label: 'Brand', value: details.diaperBrand.trim() })
  }
  if (details.diaperSize?.trim()) {
    items.push({ label: 'Size', value: details.diaperSize.trim() })
  }
  if (details.diaperCreamUsed?.trim()) {
    items.push({ label: 'Cream', value: details.diaperCreamUsed.trim() })
  }
  if (details.isTeething === 'true') {
    items.push({ label: 'Teething', value: 'Yes' })
  }
  if (details.isSick === 'true') {
    items.push({ label: 'Sick', value: 'Yes' })
  }

  return items
}

export function formatDiaperLogStamp(iso: string): { date: string; time: string; ymd: string } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return { date: iso, time: '', ymd: '' }
  }
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    ymd: isoLocalYmd(iso),
  }
}

export function diaperLogMatchesBaby(
  log: LogRecord,
  babyId: string,
  babies: Baby[],
): boolean {
  if (!babyId) return true
  if (log.details.babyId === babyId) return true
  const baby = babies.find((b) => b.id === babyId)
  const name = baby?.fullName?.trim()
  if (!name) return false
  return log.details.babyName?.trim() === name
}

export type DiaperLogFilters = {
  babyId: string
  dateYmd: string
}

export function filterDiaperLogs(
  logs: LogRecord[],
  filters: DiaperLogFilters,
  babies: Baby[],
): LogRecord[] {
  return logs
    .filter((l) => l.kind === 'diaper')
    .filter((l) => diaperLogMatchesBaby(l, filters.babyId, babies))
    .filter((l) => !filters.dateYmd || isoLocalYmd(l.atIso) === filters.dateYmd)
    .sort((a, b) => (a.atIso < b.atIso ? 1 : -1))
}

export function diaperFeedChips(log: LogRecord) {
  const d = log.details
  const chips: string[] = []
  for (const item of getDiaperLogMeta(d)) {
    chips.push(item.label === 'Size' ? `Size ${item.value}` : item.value)
  }
  if (d.isThereAnythingElse === 'true' && d.anythingElseDescription?.trim()) {
    const alreadyShown = chips.some((c) => c === d.anythingElseDescription?.trim())
    if (!alreadyShown) chips.push(d.anythingElseDescription.trim())
  }
  return chips
}
