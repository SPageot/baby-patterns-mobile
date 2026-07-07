import type { ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

type BubbleColor = {
  bg: string
  border: string
  shadow: string
}

type Props = {
  color: BubbleColor
  children: ReactNode
  style?: StyleProp<ViewStyle>
  tailStyle?: 'left' | 'center'
}

export function SolutionBubble({ color, children, style, tailStyle = 'left' }: Props) {
  const tailLeft = tailStyle === 'center' ? '50%' : 22

  return (
    <View style={[{ width: '100%' as const, position: 'relative' as const, paddingBottom: 10 }, style]}>
      <View
        style={{
          backgroundColor: color.bg,
          borderColor: color.border,
          borderWidth: 1,
          borderRadius: 22,
          borderBottomLeftRadius: tailStyle === 'left' ? 8 : 22,
          borderBottomRightRadius: tailStyle === 'center' ? 8 : 22,
          padding: 16,
          shadowColor: color.shadow,
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        {children}
      </View>
      <View
        style={{
          position: 'absolute' as const,
          left: tailStyle === 'center' ? '50%' : tailLeft,
          marginLeft: tailStyle === 'center' ? -7 : 0,
          bottom: 2,
          width: 14,
          height: 14,
          backgroundColor: color.bg,
          borderLeftWidth: 1,
          borderBottomWidth: 1,
          borderColor: color.border,
          transform: [{ rotate: '45deg' }],
          borderBottomLeftRadius: 2,
        }}
      />
    </View>
  )
}

export type { BubbleColor }
