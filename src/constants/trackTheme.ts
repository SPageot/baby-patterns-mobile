import type { AppPalette } from '@/constants/homeTheme'
import { getAppTheme } from '@/constants/homeTheme'
import type { Theme } from '@/lib/theme'
import type { LogKind } from '@/types/babyLog'

const TrackAccents = {
  light: {
    diaper: {
      accent: '#a67c68',
      accentSoft: 'rgba(166, 124, 104, 0.12)',
      accentBorder: 'rgba(166, 124, 104, 0.28)',
      icon: 'diaper' as const,
    },
    feeding: {
      accent: '#4a9a72',
      accentSoft: 'rgba(74, 154, 114, 0.12)',
      accentBorder: 'rgba(74, 154, 114, 0.28)',
      icon: 'bottle' as const,
    },
    sleep: {
      accent: '#5a7fd4',
      accentSoft: 'rgba(90, 127, 212, 0.12)',
      accentBorder: 'rgba(90, 127, 212, 0.28)',
      icon: 'moon' as const,
    },
    potty: {
      accent: '#6b8f71',
      accentSoft: 'rgba(107, 143, 113, 0.12)',
      accentBorder: 'rgba(107, 143, 113, 0.28)',
      icon: 'potty' as const,
    },
  },
  dark: {
    diaper: {
      accent: 'rgba(199, 160, 140, 0.95)',
      accentSoft: 'rgba(199, 160, 140, 0.14)',
      accentBorder: 'rgba(199, 160, 140, 0.28)',
      icon: 'diaper' as const,
    },
    feeding: {
      accent: 'rgba(130, 200, 160, 0.95)',
      accentSoft: 'rgba(120, 195, 150, 0.14)',
      accentBorder: 'rgba(120, 195, 150, 0.28)',
      icon: 'bottle' as const,
    },
    sleep: {
      accent: 'rgba(130, 175, 255, 0.9)',
      accentSoft: 'rgba(120, 160, 255, 0.12)',
      accentBorder: 'rgba(120, 160, 255, 0.28)',
      icon: 'moon' as const,
    },
    potty: {
      accent: 'rgba(140, 190, 150, 0.95)',
      accentSoft: 'rgba(140, 190, 150, 0.14)',
      accentBorder: 'rgba(140, 190, 150, 0.28)',
      icon: 'potty' as const,
    },
  },
} as const

export function getTrackTheme(kind: LogKind, mode: Theme = 'light') {
  const home = getAppTheme(mode)
  return {
    ...home,
    ...TrackAccents[mode][kind],
  }
}

export function getTrackThemeFromPalette(kind: LogKind, palette: AppPalette) {
  return {
    ...palette,
    ...TrackAccents[palette.mode][kind],
  }
}

/** @deprecated use getTrackTheme('diaper', mode) */
export const trackColors = getTrackTheme('diaper', 'light')
