import { Platform, Text, TextInput, type TextStyle } from 'react-native'

export const FontFamily = {
  sans: Platform.select({
    android: 'sans-serif',
    web: 'var(--font-sans)',
    default: undefined as string | undefined,
  }),
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'var(--font-serif)',
    default: 'serif',
  }),
  rounded: Platform.select({
    ios: 'ui-rounded',
    web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    default: undefined as string | undefined,
  }),
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
    default: 'monospace',
  }),
} as const

export const bodyText: TextStyle = FontFamily.sans ? { fontFamily: FontFamily.sans } : {}

/** Default sans on Android / Expo web; iOS uses system UI font. */
export function installAppTypography(): void {
  if (!FontFamily.sans) return

  type WithDefaults = { defaultProps?: { style?: TextStyle | TextStyle[] } }
  const TextCtor = Text as typeof Text & WithDefaults
  const InputCtor = TextInput as typeof TextInput & WithDefaults

  TextCtor.defaultProps = { ...TextCtor.defaultProps, style: [bodyText] }
  InputCtor.defaultProps = { ...InputCtor.defaultProps, style: [bodyText] }
}

function withSerif(style: TextStyle): TextStyle {
  return FontFamily.serif ? { fontFamily: FontFamily.serif, ...style } : style
}

/** Serif page / section heading (web `.hero__title`, `.logSection__title`, etc.) */
export function heading(
  size: number,
  options?: { lineHeight?: number; weight?: TextStyle['fontWeight'] },
): TextStyle {
  return withSerif({
    fontSize: size,
    lineHeight: options?.lineHeight ?? Math.round(size * 1.08),
    fontWeight: options?.weight ?? '600',
    letterSpacing: size >= 32 ? -0.9 : size >= 24 ? -0.5 : -0.3,
  })
}
