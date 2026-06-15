import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type NavMenuContextValue = {
  open: boolean
  toggle: () => void
  close: () => void
}

const NavMenuContext = createContext<NavMenuContextValue | null>(null)

export function NavMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((value) => !value), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close])

  return <NavMenuContext.Provider value={value}>{children}</NavMenuContext.Provider>
}

export function useNavMenu() {
  const context = useContext(NavMenuContext)
  if (!context) {
    throw new Error('useNavMenu must be used within NavMenuProvider')
  }
  return context
}
