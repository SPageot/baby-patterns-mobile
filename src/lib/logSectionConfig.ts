import type { LogKind } from '@/types/babyLog'

export type LogSectionMeta = {
  path: string
  title: string
  subtitle: string
  todayUnit: string
  ctaLabel: string
  ctaHint: string
  storageNote?: string
}

export const LOG_SECTION: Record<LogKind, LogSectionMeta> = {
  diaper: {
    path: '/diapers',
    title: 'Diapers',
    subtitle: 'Record wet, bowel movement, and other details for each change.',
    todayUnit: 'changes today',
    ctaLabel: 'Log diaper change',
    ctaHint: 'Tap to record wet, dirty, brand, size, and cream',
    storageNote: 'Synced with your API when configured',
  },
  feeding: {
    path: '/feeding',
    title: 'Feeding',
    subtitle: 'Track breast, bottle, solids, and snacks with timing and optional notes.',
    todayUnit: 'feeds today',
    ctaLabel: 'Log a feed',
    ctaHint: 'Type, time, amount, and duration',
    storageNote: 'Synced with your API when configured',
  },
  sleep: {
    path: '/sleep',
    title: 'Sleep',
    subtitle: 'Capture start and end times, mood, and where baby slept.',
    todayUnit: 'sessions today',
    ctaLabel: 'Log sleep',
    ctaHint: 'Start, end, mood, and environment',
    storageNote: 'Synced with your API when configured',
  },
  potty: {
    path: '/potty',
    title: 'Potty',
    subtitle: 'Log potty training successes, practice sits, and accidents.',
    todayUnit: 'visits today',
    ctaLabel: 'Log potty visit',
    ctaHint: 'Result, time, location, and notes',
    storageNote: 'Synced with your API when configured',
  },
  behavior: {
    path: '/behavior',
    title: 'Behavior Log',
    subtitle: 'Record tantrums, listening challenges, daydreaming, and what helped resolve them.',
    todayUnit: 'logs today',
    ctaLabel: 'Log behavior',
    ctaHint: 'Type, location, date, optional time, notes, and resolution',
    storageNote: 'Synced with your API when configured',
  },
}
