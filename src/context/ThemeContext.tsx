import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { THEME_STORAGE_KEY, toggleTheme, type Theme } from '@/lib/theme'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleThemeMode: () => void
  ready: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

async function readStoredTheme(): Promise<Theme> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

async function persistTheme(theme: Theme) {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void readStoredTheme().then((stored) => {
      setThemeState(stored)
      setReady(true)
    })
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    void persistTheme(next)
  }, [])

  const toggleThemeMode = useCallback(() => {
    setThemeState((prev) => {
      const next = toggleTheme(prev)
      void persistTheme(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleThemeMode, ready }),
    [theme, setTheme, toggleThemeMode, ready],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider')
  return ctx
}
