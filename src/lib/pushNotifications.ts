import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { registerExpoPushToken, unregisterExpoPushToken } from '@/api/pushApi'

const PUSH_ENABLED_KEY = 'bp.expoPushEnabled'
const PUSH_TOKEN_KEY = 'bp.expoPushToken'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function isExpoPushSupported(): boolean {
  return Device.isDevice
}

export async function getStoredExpoPushEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PUSH_ENABLED_KEY)) === '1'
  } catch {
    return false
  }
}

async function setStoredExpoPushEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) await AsyncStorage.setItem(PUSH_ENABLED_KEY, '1')
    else await AsyncStorage.removeItem(PUSH_ENABLED_KEY)
  } catch {
    /* ignore */
  }
}

async function getStoredExpoPushToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY)
    return token?.trim() || null
  } catch {
    return null
  }
}

async function setStoredExpoPushToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
    else await AsyncStorage.removeItem(PUSH_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

function getExpoProjectId(): string | undefined {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  return typeof projectId === 'string' && projectId.trim() ? projectId.trim() : undefined
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Baby Patterns',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7c5cbf',
  })
}

export async function subscribeToExpoPush(): Promise<string> {
  if (!isExpoPushSupported()) {
    throw new Error('Push notifications require a physical device.')
  }

  const permission = await Notifications.getPermissionsAsync()
  let finalStatus = permission.status
  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    finalStatus = requested.status
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission was denied.')
  }

  await ensureAndroidChannel()

  const projectId = getExpoProjectId()
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync()

  const token = tokenResponse.data.trim()
  if (!token) {
    throw new Error('Could not get a push token for this device.')
  }

  await registerExpoPushToken(token)
  await setStoredExpoPushEnabled(true)
  await setStoredExpoPushToken(token)
  return token
}

export async function unsubscribeFromExpoPush(): Promise<void> {
  const token = await getStoredExpoPushToken()
  if (token) {
    try {
      await unregisterExpoPushToken(token)
    } catch {
      /* ignore unregister errors */
    }
  }

  await setStoredExpoPushEnabled(false)
  await setStoredExpoPushToken(null)
}

export async function syncExpoPushSubscriptionIfEnabled(): Promise<void> {
  if (!isExpoPushSupported() || !(await getStoredExpoPushEnabled())) return

  const permission = await Notifications.getPermissionsAsync()
  if (permission.status !== 'granted') return

  try {
    await subscribeToExpoPush()
  } catch {
    /* ignore background sync errors */
  }
}

export async function isExpoPushSubscribed(): Promise<boolean> {
  if (!isExpoPushSupported()) return false

  const permission = await Notifications.getPermissionsAsync()
  if (permission.status !== 'granted') return false

  return getStoredExpoPushEnabled()
}
