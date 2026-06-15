import { useMemo } from 'react'

import { getAppTheme, type AppPalette } from '@/constants/homeTheme'
import { useThemeMode } from '@/context/ThemeContext'

export function useHomeTheme(): AppPalette {
  const { theme } = useThemeMode()
  return useMemo(() => getAppTheme(theme), [theme])
}
