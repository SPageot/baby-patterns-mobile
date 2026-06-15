import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'

import { useApp } from '@/context/AppContext'

void SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash already hidden in dev reload */
})

export function SplashController() {
  const { authReady } = useApp()

  useEffect(() => {
    if (!authReady) return
    void SplashScreen.hideAsync()
  }, [authReady])

  return null
}
