import type { ViewStyle } from 'react-native'

export const DAILY_MEMORY_THEME = {
  accent: '#5b3db8',
  accentStrong: '#4f3499',
  accentDark: '#3d2789',
  accentSoft: '#ede8f8',
  accentBorder: 'rgba(67, 45, 133, 0.35)',
  label: '#2d1f5c',
} as const

export const dailyMemoryPrimaryButtonStyle: ViewStyle = {
  backgroundColor: DAILY_MEMORY_THEME.accentStrong,
  borderWidth: 1,
  borderColor: DAILY_MEMORY_THEME.accentDark,
}
