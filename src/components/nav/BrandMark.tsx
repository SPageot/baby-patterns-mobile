import { Image } from 'expo-image'
import { View } from 'react-native'

type Props = {
  size?: number
}

export function BrandMark({ size = 32 }: Props) {
  const radius = size * 0.14

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  )
}
