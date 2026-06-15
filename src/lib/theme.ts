export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'baby-patterns-theme'

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark'
}
