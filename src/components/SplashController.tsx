import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'

import { useApp } from '@/context/AppContext'

void SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash already hidden in dev reload */
})

type Props = {
  fontsReady: boolean
}

export function SplashController({ fontsReady }: Props) {
  const { authReady } = useApp()

  useEffect(() => {
    if (!authReady || !fontsReady) return
    void SplashScreen.hideAsync()
  }, [authReady, fontsReady])

  return null
}
