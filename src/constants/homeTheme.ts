import type { Theme } from '@/lib/theme'

export type AppPalette = {
  mode: Theme
  background: string
  card: string
  card2: string
  cardTranslucent: string
  stroke: string
  strokeSubtle: string
  text: string
  textMuted: string
  accent: string
  accentDeep: string
  accentSoft: string
  accentLavender: string
  onPrimary: string
  navBackground: string
  error: string
  heroTitle: string
  heroTitleAccent: string
  heroSub: string
  heroBadgeBg: string
  heroBadgeBorder: string
  heroBadgeIconBg: string
  heroBadgeText: string
}

export const AppThemes: Record<Theme, AppPalette> = {
  light: {
    mode: 'light',
    background: '#fdfbf8',
    card: '#ffffff',
    card2: '#faf8f5',
    cardTranslucent: 'rgba(255, 255, 255, 0.75)',
    stroke: 'rgba(120, 100, 130, 0.14)',
    strokeSubtle: 'rgba(120, 100, 130, 0.08)',
    text: '#2f2a38',
    textMuted: '#6b6578',
    accent: '#a889e8',
    accentDeep: '#7c5cc4',
    accentSoft: '#f3eefc',
    accentLavender: '#ddd0f5',
    onPrimary: '#ffffff',
    navBackground: 'rgba(255, 255, 255, 0.92)',
    error: '#b42318',
    heroTitle: '#ffffff',
    heroTitleAccent: '#ddd0f5',
    heroSub: 'rgba(255, 255, 255, 0.88)',
    heroBadgeBg: 'transparent',
    heroBadgeBorder: 'rgba(255, 255, 255, 0.35)',
    heroBadgeIconBg: 'rgba(255, 255, 255, 0.14)',
    heroBadgeText: 'rgba(255, 255, 255, 0.92)',
  },
  dark: {
    mode: 'dark',
    background: '#0a0c10',
    card: '#161b24',
    card2: '#1c2230',
    cardTranslucent: 'rgba(255, 255, 255, 0.04)',
    stroke: 'rgba(255, 255, 255, 0.12)',
    strokeSubtle: 'rgba(255, 255, 255, 0.08)',
    text: 'rgba(255, 255, 255, 0.92)',
    textMuted: 'rgba(255, 255, 255, 0.52)',
    accent: '#a889e8',
    accentDeep: '#c4adf5',
    accentSoft: 'rgba(168, 137, 232, 0.15)',
    accentLavender: 'rgba(168, 137, 232, 0.25)',
    onPrimary: '#ffffff',
    navBackground: 'rgba(11, 11, 13, 0.92)',
    error: 'rgba(255, 200, 200, 0.95)',
    heroTitle: 'rgba(255, 255, 255, 0.9)',
    heroTitleAccent: 'rgba(199, 160, 140, 0.92)',
    heroSub: 'rgba(255, 255, 255, 0.64)',
    heroBadgeBg: 'rgba(255, 255, 255, 0.06)',
    heroBadgeBorder: 'rgba(255, 255, 255, 0.12)',
    heroBadgeIconBg: 'rgba(199, 160, 140, 0.12)',
    heroBadgeText: 'rgba(199, 160, 140, 0.9)',
  },
}

export function getAppTheme(mode: Theme): AppPalette {
  return AppThemes[mode]
}

/** @deprecated use useHomeTheme() */
export const HomeTheme = AppThemes.light

export const HomeRadius = {
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const
