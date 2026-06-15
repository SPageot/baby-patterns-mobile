import type { ReactNode } from 'react'
import type { PressableProps, StyleProp, TextInputProps, ViewProps, ViewStyle } from 'react-native'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { Fonts, Spacing } from '@/constants/theme'

export function Screen({ children, style, ...props }: ViewProps) {
  const t = useHomeTheme()
  return (
    <View style={[{ flex: 1, backgroundColor: t.background, padding: Spacing.three }, style]} {...props}>
      {children}
    </View>
  )
}

export function Eyebrow({ children }: { children: string }) {
  const t = useHomeTheme()
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: HomeRadius.pill,
        borderWidth: 1,
        borderColor: t.accentLavender,
        backgroundColor: t.card,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: Spacing.three,
      }}
    >
      <Text
        style={{
          color: t.accentDeep,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
    </View>
  )
}

export function Title({ children }: { children: ReactNode }) {
  const t = useHomeTheme()
  return (
    <Text
      style={{
        fontFamily: Fonts.serif,
        fontSize: 36,
        lineHeight: 40,
        fontWeight: '600',
        color: t.text,
        letterSpacing: -0.6,
      }}
    >
      {children}
    </Text>
  )
}

export function AccentTitle({ children }: { children: ReactNode }) {
  const t = useHomeTheme()
  return (
    <Text
      style={{
        fontFamily: Fonts.serif,
        fontSize: 36,
        lineHeight: 40,
        fontWeight: '600',
        color: t.accentDeep,
        letterSpacing: -0.6,
        marginBottom: Spacing.two,
      }}
    >
      {children}
    </Text>
  )
}

export function Card({ children, style, ...props }: ViewProps) {
  const t = useHomeTheme()
  return (
    <View
      style={[
        {
          borderRadius: HomeRadius.lg,
          borderWidth: 1,
          borderColor: t.strokeSubtle,
          backgroundColor: t.cardTranslucent,
          padding: Spacing.three,
          marginBottom: Spacing.three,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

type ButtonProps = PressableProps & {
  title: string
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({ title, variant = 'primary', loading, disabled, style, ...props }: ButtonProps) {
  const t = useHomeTheme()
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [
        {
          borderRadius: HomeRadius.pill,
          paddingVertical: 14,
          paddingHorizontal: 22,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        isPrimary && { backgroundColor: t.accent },
        isSecondary && { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.text },
        (state.pressed || disabled) && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? t.onPrimary : t.accentDeep} />
      ) : (
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: isPrimary ? t.onPrimary : t.text,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

export function Input(props: TextInputProps) {
  const t = useHomeTheme()
  return (
    <TextInput
      placeholderTextColor={t.textMuted}
      style={[
        {
          borderWidth: 1,
          borderColor: t.stroke,
          borderRadius: HomeRadius.md,
          backgroundColor: t.card,
          color: t.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          marginTop: 6,
          marginBottom: Spacing.two,
        },
        props.style,
      ]}
      {...props}
    />
  )
}

export function Label({ children }: { children: string }) {
  const t = useHomeTheme()
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '600',
        color: t.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginTop: Spacing.two,
      }}
    >
      {children}
    </Text>
  )
}

export function SectionTitle({ children }: { children: string }) {
  const t = useHomeTheme()
  return (
    <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, marginBottom: 6 }}>{children}</Text>
  )
}

export function Subtitle({ children, style }: { children: ReactNode; style?: object }) {
  const t = useHomeTheme()
  return (
    <Text style={[{ fontSize: 15, lineHeight: 24, color: t.textMuted, marginBottom: Spacing.three }, style]}>
      {children}
    </Text>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  const t = useHomeTheme()
  return <Text style={{ color: t.error, fontSize: 14, marginBottom: Spacing.two }}>{children}</Text>
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.82,
  },
})
