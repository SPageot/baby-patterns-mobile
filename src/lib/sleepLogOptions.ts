export type SleepOption = { value: string; label: string }

export const SLEEP_TYPES: SleepOption[] = [
  { value: 'nap', label: 'Nap' },
  { value: 'night', label: 'Night sleep' },
  { value: 'mixed', label: 'Mixed' },
]

export const SLEEP_QUALITY: SleepOption[] = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
]

export const HOW_FELL_ASLEEP: SleepOption[] = [
  { value: 'breastfeeding', label: 'Breastfeeding' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'rocked', label: 'Rocked' },
  { value: 'self-soothed', label: 'Self-soothed' },
  { value: 'stroller', label: 'Stroller' },
  { value: 'car', label: 'Car' },
  { value: 'other', label: 'Other' },
]

export const WAKE_UP_REASONS: SleepOption[] = [
  { value: 'diaper', label: 'Diaper' },
  { value: 'hunger', label: 'Hunger' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'noise', label: 'Noise' },
  { value: 'teething', label: 'Teething' },
]

export const SLEEP_LOCATIONS: SleepOption[] = [
  { value: 'crib', label: 'Crib' },
  { value: 'bed', label: 'Bed' },
  { value: 'stroller', label: 'Stroller' },
  { value: 'car', label: 'Car' },
  { value: 'contact', label: 'Contact / held' },
  { value: 'daycare', label: 'Daycare' },
  { value: 'other', label: 'Other' },
]

export const SLEEP_ENV_LIGHT: SleepOption[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'dim', label: 'Dim' },
  { value: 'bright', label: 'Bright' },
]

export const SLEEP_ENV_NOISE: SleepOption[] = [
  { value: 'quiet', label: 'Quiet' },
  { value: 'white_noise', label: 'White noise' },
  { value: 'tv', label: 'TV' },
  { value: 'noisy', label: 'Noisy' },
]

export const SLEEP_ENV_TEMPERATURE: SleepOption[] = [
  { value: 'cold', label: 'Cold' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'warm', label: 'Warm' },
]

export const PRE_SLEEP_ACTIVITIES: SleepOption[] = [
  { value: 'bath', label: 'Bath' },
  { value: 'book', label: 'Book' },
  { value: 'feeding', label: 'Feeding' },
  { value: 'play', label: 'Play' },
  { value: 'screen_time', label: 'Screen time' },
]

export const SLEEP_TAGS: SleepOption[] = [
  { value: 'teething', label: 'Teething' },
  { value: 'travel', label: 'Travel' },
  { value: 'sick', label: 'Sick' },
  { value: 'growth_spurt', label: 'Growth spurt' },
]

/** Tags shown in the form (teething/sick use dedicated toggles). */
export const SLEEP_EXTRA_TAGS: SleepOption[] = SLEEP_TAGS.filter(
  (option) => option.value !== 'teething' && option.value !== 'sick',
)

export const MOOD_BEFORE_SLEEP: SleepOption[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'fussy', label: 'Fussy' },
  { value: 'crying', label: 'Crying' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'sleepy', label: 'Sleepy' },
]

export const MOOD_AFTER_WAKE: SleepOption[] = [
  { value: 'happy', label: 'Happy' },
  { value: 'crying', label: 'Crying' },
  { value: 'groggy', label: 'Groggy' },
  { value: 'calm', label: 'Calm' },
]

export function sleepOptionLabel(options: SleepOption[], value: string): string {
  const v = value.trim()
  if (!v) return ''
  return options.find((o) => o.value === v)?.label ?? v
}

export function sleepTypeLabel(value: string): string {
  return sleepOptionLabel(SLEEP_TYPES, value) || 'Sleep'
}
