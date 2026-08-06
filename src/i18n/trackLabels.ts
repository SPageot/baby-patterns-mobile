import type { TFunction } from 'i18next'
import type { SleepOption } from '@/lib/sleepLogOptions'

export function tSleepOption(
  t: TFunction,
  category:
    | 'types'
    | 'quality'
    | 'how'
    | 'wakeReasons'
    | 'locations'
    | 'envLight'
    | 'envNoise'
    | 'envTemp'
    | 'preSleep'
    | 'tags'
    | 'moodBefore'
    | 'moodAfter',
  value: string,
  fallback?: string,
): string {
  const v = value.trim()
  if (!v) return ''
  return t(`track.sleepOptions.${category}.${v}`, { defaultValue: fallback ?? v })
}

export function mapSleepOptions(
  t: TFunction,
  category: Parameters<typeof tSleepOption>[1],
  options: SleepOption[],
): SleepOption[] {
  return options.map((o) => ({
    ...o,
    label: tSleepOption(t, category, o.value, o.label),
  }))
}

export function tBehaviorTag(t: TFunction, tag: string): string {
  const trimmed = tag.trim()
  if (!trimmed) return ''
  return t(`track.behaviorForm.tags.${trimmed}`, { defaultValue: trimmed })
}

export function tFeedingType(t: TFunction, type: string): string {
  const key = type.trim().toLowerCase()
  if (!key) return t('track.feedingForm.type')
  return t(`track.feedingForm.${key}`, {
    defaultValue: key.charAt(0).toUpperCase() + key.slice(1),
  })
}

export function tPottyResult(t: TFunction, result: string): string {
  return t(`track.pottyForm.results.${result}`, {
    defaultValue: result.replace(/_/g, ' '),
  })
}

export function tPottyLocation(t: TFunction, location: string): string {
  return t(`track.pottyForm.locations.${location}`, { defaultValue: location })
}
