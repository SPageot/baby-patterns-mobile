import Constants from 'expo-constants'
import { Platform } from 'react-native'

/** Remote push was removed from Expo Go on Android in SDK 53+. */
export function canUseExpoNotifications(): boolean {
  if (Platform.OS === 'web') return false
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return false
  return true
}

export async function loadExpoNotifications() {
  if (!canUseExpoNotifications()) return null
  return import('expo-notifications')
}
