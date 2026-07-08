import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import type { NotificationResponse } from 'expo-notifications'

import { canUseExpoNotifications, loadExpoNotifications } from '@/lib/expoNotifications'

function routeFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  const url = data?.url
  if (typeof url !== 'string' || !url.trim()) return null
  return url.trim()
}

export function PushNotificationHandler() {
  const router = useRouter()

  useEffect(() => {
    if (!canUseExpoNotifications()) return

    let sub: { remove: () => void } | undefined

    void (async () => {
      const Notifications = await loadExpoNotifications()
      if (!Notifications) return

      const navigateFromResponse = (response: NotificationResponse | null) => {
        const route = routeFromNotificationData(
          response?.notification.request.content.data as Record<string, unknown> | undefined,
        )
        if (route) router.push(route as never)
      }

      const last = Notifications.getLastNotificationResponse()
      if (last) navigateFromResponse(last)

      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        navigateFromResponse(response)
      })
    })()

    return () => sub?.remove()
  }, [router])

  return null
}
