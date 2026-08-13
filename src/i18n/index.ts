import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import { resolveInitialLocale, storeLocale, type AppLocale } from './localePreference'

let initPromise: Promise<void> | null = null

export function initI18n(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const initial = await resolveInitialLocale()
    if (!i18n.isInitialized) {
      await i18n.use(initReactI18next).init({
        resources: {
          en: { translation: en },
        },
        lng: initial,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        returnNull: false,
        compatibilityJSON: 'v4',
      })
    } else {
      await i18n.changeLanguage(initial)
    }
    await storeLocale('en')
  })()

  return initPromise
}

export async function setAppLocale(locale: AppLocale) {
  await storeLocale(locale)
  await i18n.changeLanguage(locale)
}

export function getAppLocale(): AppLocale {
  return 'en'
}

export function getDateLocale(): string {
  return 'en-US'
}

export default i18n
