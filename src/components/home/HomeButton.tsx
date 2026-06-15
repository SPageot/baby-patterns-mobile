import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'

type Props = PressableProps & {
  title: string
  variant?: 'primary' | 'secondary' | 'ghost'
  tone?: 'default' | 'onDark'
  style?: StyleProp<ViewStyle>
}

export function HomeButton({ title, variant = 'primary', tone = 'default', style, disabled, ...props }: Props) {
  const t = useHomeTheme()
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'
  const isGhost = variant === 'ghost'
  const onDark = tone === 'onDark'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        {
          borderRadius: HomeRadius.pill,
          paddingVertical: 14,
          paddingHorizontal: 22,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        isPrimary && { backgroundColor: onDark ? 'rgba(199, 160, 140, 0.98)' : t.accent },
        isSecondary && {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: onDark ? 'rgba(255, 255, 255, 0.85)' : t.text,
        },
        isGhost && { backgroundColor: 'transparent' },
        (state.pressed || disabled) && { opacity: 0.82 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: isPrimary
            ? onDark
              ? '#140f10'
              : t.onPrimary
            : isSecondary
              ? onDark
                ? '#ffffff'
                : t.text
              : onDark
                ? 'rgba(255, 255, 255, 0.92)'
                : t.accentDeep,
        }}
      >
        {title}
      </Text>
    </Pressable>
  )
}
