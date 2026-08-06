import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'

export type AppLocale = 'en' | 'es'

export const LOCALE_STORAGE_KEY = 'baby-patterns-locale'

export const APP_LOCALES: { code: AppLocale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
]

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'en' || value === 'es'
}

export async function getStoredLocale(): Promise<AppLocale | null> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY)
    return isAppLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export async function storeLocale(locale: AppLocale): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
}

export function detectDeviceLocale(): AppLocale {
  try {
    const code = Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? 'en'
    if (code.startsWith('es')) return 'es'
  } catch {
    /* ignore */
  }
  return 'en'
}

export async function resolveInitialLocale(): Promise<AppLocale> {
  return (await getStoredLocale()) ?? detectDeviceLocale()
}
