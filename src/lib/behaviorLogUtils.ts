import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { isoLocalYmd } from '@/lib/trackUtils'

export const BEHAVIOR_TAG_PRESETS = [
  'Tantrum',
  'Yelling',
  'Not listening',
  'Daydreaming',
  'Hitting',
  'Aggression',
  'Whining',
] as const

export const DEFAULT_BEHAVIOR_TAG = BEHAVIOR_TAG_PRESETS[0]

const TAG_SEP = '|'
const CUSTOM_TAG_MAX = 40

export function isBehaviorPreset(tag: string): boolean {
  return (BEHAVIOR_TAG_PRESETS as readonly string[]).includes(tag.trim())
}

export function sanitizeCustomBehaviorTag(raw: string): string {
  return raw
    .replaceAll('|', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CUSTOM_TAG_MAX)
}

export function customTagsFromSelection(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of tags) {
    const t = tag.trim()
    if (!t || isBehaviorPreset(t) || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

export function parseBehaviorTags(raw: string | null | undefined): string[] {
  const s = (raw ?? '').trim()
  if (!s) return []
  return s
    .split(TAG_SEP)
    .map((t) => t.trim())
    .filter(Boolean)
}

export function formatBehaviorTags(tags: string[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of tags) {
    const t = tag.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out.join(TAG_SEP)
}

export function toggleBehaviorTag(tags: string[], tag: string): string[] {
  const t = tag.trim()
  if (!t) return tags
  if (tags.includes(t)) {
    if (tags.length <= 1) return tags
    return tags.filter((x) => x !== t)
  }
  return [...tags, t]
}

export function addCustomBehaviorTag(
  selected: string[],
  customOptions: string[],
  raw: string,
): { selected: string[]; customOptions: string[]; error?: string } {
  const tag = sanitizeCustomBehaviorTag(raw)
  if (!tag) {
    return { selected, customOptions, error: 'Enter a custom tag.' }
  }
  if (isBehaviorPreset(tag) || customOptions.includes(tag) || selected.includes(tag)) {
    return {
      selected: selected.includes(tag) ? selected : [...selected, tag],
      customOptions: customOptions.includes(tag) || isBehaviorPreset(tag)
        ? customOptions
        : [...customOptions, tag],
    }
  }
  return {
    selected: [...selected, tag],
    customOptions: [...customOptions, tag],
  }
}

export function todayLocalYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatBehaviorLogStamp(
  occurredOn: string,
  occurredTime?: string | null,
): { date: string; time: string } {
  const on = occurredOn.trim()
  if (!on) return { date: '', time: '' }
  const timePart = occurredTime?.trim()
  const parsed = new Date(timePart ? `${on}T${timePart}` : `${on}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return { date: on, time: timePart || '' }
  }
  return {
    date: parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: timePart
      ? parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : '',
  }
}

export function getBehaviorContentBadges(details: Record<string, string>): string[] {
  return parseBehaviorTags(details.behaviorTag)
}

export function getBehaviorLogMeta(details: Record<string, string>): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = []
  const location = details.location?.trim()
  if (location) items.push({ label: 'Where', value: location })
  const resolution = details.resolution?.trim()
  if (resolution) items.push({ label: 'Resolution', value: resolution })
  const notes = details.notes?.trim()
  if (notes) items.push({ label: 'Notes', value: notes })
  return items
}

export function filterBehaviorLogs(
  logs: LogRecord[],
  filters: { babyId?: string; dateYmd?: string },
  babies: Baby[],
): LogRecord[] {
  const rows = logs.filter((l) => l.kind === 'behavior')
  return rows.filter((log) => {
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
      const day = log.details.occurredOn?.trim() || isoLocalYmd(log.atIso)
      if (day !== filters.dateYmd) return false
    }
    return true
  })
}
