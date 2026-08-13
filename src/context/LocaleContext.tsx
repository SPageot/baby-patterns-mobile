import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { initI18n, setAppLocale, getAppLocale } from '@/i18n'
import i18n from '@/i18n'
import type { AppLocale } from '@/i18n/localePreference'

type LocaleContextValue = {
  locale: AppLocale
  ready: boolean
  setLocale: (locale: AppLocale) => Promise<void>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [locale, setLocaleState] = useState<AppLocale>('en')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await initI18n()
      if (!cancelled) {
        setLocaleState(getAppLocale())
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      if (lng === 'en') setLocaleState('en')
    }
    i18n.on('languageChanged', onLanguageChanged)
    return () => {
      i18n.off('languageChanged', onLanguageChanged)
    }
  }, [])

  const setLocale = useCallback(async (next: AppLocale) => {
    await setAppLocale(next)
    setLocaleState(next)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      ready,
      setLocale,
    }),
    [locale, ready, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}
