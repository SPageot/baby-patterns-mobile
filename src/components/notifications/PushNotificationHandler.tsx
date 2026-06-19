import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'

function routeFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  const url = data?.url
  if (typeof url !== 'string' || !url.trim()) return null
  return url.trim()
}

export function PushNotificationHandler() {
  const router = useRouter()

  useEffect(() => {
    const navigateFromResponse = (response: Notifications.NotificationResponse | null) => {
      const route = routeFromNotificationData(
        response?.notification.request.content.data as Record<string, unknown> | undefined,
      )
      if (route) router.push(route as never)
    }

    const last = Notifications.getLastNotificationResponse()
    if (last) navigateFromResponse(last)

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromResponse(response)
    })

    return () => sub.remove()
  }, [router])

  return null
}
