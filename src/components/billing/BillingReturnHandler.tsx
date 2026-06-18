import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import * as Linking from 'expo-linking'

import { useApp } from '@/context/AppContext'
import { completeBillingReturn } from '@/lib/billingReturn'

/** Sync Pro status when returning from Stripe checkout or opening a billing deep link. */
export function BillingReturnHandler() {
  const { authReady, setUser } = useApp()

  useEffect(() => {
    if (!authReady) return

    const handleUrl = (url: string | null) => {
      if (!url) return
      void completeBillingReturn(setUser, { fromUrl: url })
    }

    void Linking.getInitialURL().then(handleUrl)
    const urlSub = Linking.addEventListener('url', ({ url }) => handleUrl(url))

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void completeBillingReturn(setUser)
      }
    }
    const appSub = AppState.addEventListener('change', onAppState)

    return () => {
      urlSub.remove()
      appSub.remove()
    }
  }, [authReady, setUser])

  return null
}
