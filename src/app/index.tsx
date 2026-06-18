import { Redirect } from 'expo-router'
import { View } from 'react-native'

import { HomeSections } from '@/components/home/HomeSections'
import { useApp } from '@/context/AppContext'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

const createStyles = (t: AppPalette) => ({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
})

export default function HomeScreen() {
  const { user, authReady } = useApp()
  const styles = useThemedStyles(createStyles)

  if (authReady && user) {
    return <Redirect href="/profile" />
  }

  return (
    <View style={styles.container}>
      <HomeSections />
    </View>
  )
}
