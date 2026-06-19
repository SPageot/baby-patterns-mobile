import { useCallback, useEffect, useState } from 'react'

import {
  getStoredExpoPushEnabled,
  isExpoPushSubscribed,
  isExpoPushSupported,
  subscribeToExpoPush,
  syncExpoPushSubscriptionIfEnabled,
  unsubscribeFromExpoPush,
} from '@/lib/pushNotifications'

export function usePushNotifications(enabled: boolean) {
  const [supported] = useState(isExpoPushSupported)
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void isExpoPushSubscribed().then(setActive)
  }, [])

  useEffect(() => {
    if (!enabled || !supported) return
    void syncExpoPushSubscriptionIfEnabled()
  }, [enabled, supported])

  const enable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await subscribeToExpoPush()
      setActive(true)
    } catch (err) {
      setActive(false)
      setError(err instanceof Error ? err.message : 'Could not enable push notifications.')
      throw err
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await unsubscribeFromExpoPush()
      setActive(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable push notifications.')
      throw err
    } finally {
      setBusy(false)
    }
  }, [])

  const toggle = useCallback(async () => {
    if (active) await disable()
    else await enable()
  }, [active, disable, enable])

  const setEnabled = useCallback(async (next: boolean) => {
    if (next) await enable()
    else await disable()
  }, [disable, enable])

  return {
    supported,
    active,
    busy,
    error,
    enable,
    disable,
    setEnabled,
    toggle,
  }
}
