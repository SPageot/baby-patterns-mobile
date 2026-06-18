import { Platform, type TextStyle } from 'react-native'

const ROBOTO = 'Roboto'

function robotoFamilyForWeight(weight: TextStyle['fontWeight'] = '400'): string {
  if (Platform.OS === 'android' || Platform.OS === 'web') return ROBOTO

  const normalized =
    typeof weight === 'string' ? Number.parseInt(weight, 10) : (weight ?? 400)

  if (normalized >= 900) return 'Roboto_900Black'
  if (normalized >= 800) return 'Roboto_800ExtraBold'
  if (normalized >= 700) return 'Roboto_700Bold'
  if (normalized >= 600) return 'Roboto_600SemiBold'
  if (normalized >= 500) return 'Roboto_500Medium'
  if (normalized <= 300) return 'Roboto_300Light'
  return 'Roboto_400Regular'
}

export function appFont(options?: { weight?: TextStyle['fontWeight'] }): TextStyle {
  const weight = options?.weight ?? '400'
  const fontFamily = robotoFamilyForWeight(weight)

  if (Platform.OS === 'ios') {
    return { fontFamily }
  }

  return { fontFamily: ROBOTO, fontWeight: weight }
}

export const svgFontFamily = Platform.select({
  ios: 'Roboto_400Regular',
  android: ROBOTO,
  web: ROBOTO,
  default: ROBOTO,
}) as string

export const FontFamily = {
  sans: ROBOTO,
  serif: ROBOTO,
  rounded: ROBOTO,
  mono: ROBOTO,
} as const

export const bodyText: TextStyle = appFont({ weight: '400' })

/** Roboto page / section heading */
export function heading(
  size: number,
  options?: { lineHeight?: number; weight?: TextStyle['fontWeight'] },
): TextStyle {
  const weight = options?.weight ?? '600'

  return {
    ...appFont({ weight }),
    fontSize: size,
    lineHeight: options?.lineHeight ?? Math.round(size * 1.08),
    letterSpacing: size >= 32 ? -0.9 : size >= 24 ? -0.5 : -0.3,
  }
}
