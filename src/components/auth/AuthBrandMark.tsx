import { View } from 'react-native'

import { BrandMark } from '@/components/nav/BrandMark'

export function AuthBrandMark() {
  return (
    <View style={{ alignSelf: 'center', marginBottom: 20 }}>
      <BrandMark size={56} />
    </View>
  )
}
