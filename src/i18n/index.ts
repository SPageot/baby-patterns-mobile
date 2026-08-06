import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import es from './locales/es.json'
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
          es: { translation: es },
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
  })()

  return initPromise
}

export async function setAppLocale(locale: AppLocale) {
  await storeLocale(locale)
  await i18n.changeLanguage(locale)
}

export function getAppLocale(): AppLocale {
  const lng = i18n.language?.split('-')[0]
  return lng === 'es' ? 'es' : 'en'
}

export function getDateLocale(): string {
  return getAppLocale() === 'es' ? 'es' : 'en-US'
}

export default i18n
