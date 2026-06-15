import { useMemo } from 'react'
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle
}

export function useThemedStyles<T extends NamedStyles<T>>(factory: (theme: AppPalette) => T): T {
  const theme = useHomeTheme()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory is stable per component module
  return useMemo(() => StyleSheet.create(factory(theme)), [theme])
}
