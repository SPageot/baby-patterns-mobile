import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { logoutUser } from '@/api/authApi'
import { fetchAccessibleBabies } from '@/api/babyApi'
import { setSessionExpiredHandler } from '@/api/client'
import { isApiConfigured } from '@/api/config'
import { fetchCurrentUser } from '@/api/userApi'
import { syncAppStore } from '@/lib/appStore'
import { hydrateAvatarCache } from '@/lib/avatarCache'
import { clearAuthSession, getAccessToken, hydrateAuthSession } from '@/lib/authSession'
import type { Baby, User } from '@/schemas/user'

type AppContextValue = {
  user: User | null
  babies: Baby[]
  selectedBabyId: string
  selectedBaby: Baby | null
  hasBaby: boolean
  authReady: boolean
  setUser: (user: User | null) => void
  selectBaby: (baby: Baby) => void
  addBaby: (baby: Baby) => void
  logout: () => Promise<void>
  loadBabiesForCurrentUser: () => Promise<Baby[]>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [babies, setBabiesState] = useState<Baby[]>([])
  const [selectedBabyId, setSelectedBabyId] = useState('')
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void clearAuthSession().then(() => {
        setUserState(null)
        setBabiesState([])
        setSelectedBabyId('')
      })
    })
    return () => setSessionExpiredHandler(null)
  }, [])

  useEffect(() => {
    syncAppStore({ user, babies, selectedBabyId })
  }, [user, babies, selectedBabyId])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await hydrateAuthSession()
      if (!isApiConfigured() || !getAccessToken()) {
        if (!cancelled) setAuthReady(true)
        return
      }

      try {
        const profile = await fetchCurrentUser()
        if (cancelled) return
        await hydrateAvatarCache(profile.id)
        setUserState(profile)

        const list = await fetchAccessibleBabies()
        if (cancelled) return
        setBabiesState(list)
        setSelectedBabyId((current) => {
          const match = list.find((b) => b.id === current) ?? list[0]
          return match?.id ?? ''
        })
      } catch {
        if (!cancelled) await clearAuthSession()
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const setUser = useCallback((next: User | null) => {
    setUserState(next)
    if (!next) {
      setBabiesState([])
      setSelectedBabyId('')
    }
  }, [])

  const selectBaby = useCallback((baby: Baby) => {
    if (!baby.id?.trim()) return
    setSelectedBabyId(baby.id)
    setBabiesState((prev) => (prev.some((b) => b.id === baby.id) ? prev : [...prev, baby]))
  }, [])

  const addBaby = useCallback((baby: Baby) => {
    const id = baby.id?.trim()
    if (!id) return
    setBabiesState((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      if (index < 0) return [...prev, baby]
      const next = [...prev]
      next[index] = { ...next[index], ...baby, id }
      return next
    })
    setSelectedBabyId(id)
  }, [])

  const loadBabiesForCurrentUser = useCallback(async (): Promise<Baby[]> => {
    if (!user?.id?.trim() || !isApiConfigured()) {
      setBabiesState([])
      setSelectedBabyId('')
      return []
    }
    const list = await fetchAccessibleBabies()
    setBabiesState(list)
    setSelectedBabyId((current) => {
      const match = list.find((b) => b.id === current) ?? list[0]
      return match?.id ?? ''
    })
    return list
  }, [user?.id])

  const logout = useCallback(async () => {
    await logoutUser()
    setUserState(null)
    setBabiesState([])
    setSelectedBabyId('')
  }, [])

  const selectedBaby = useMemo(
    () => babies.find((b) => b.id === selectedBabyId) ?? null,
    [babies, selectedBabyId],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      babies,
      selectedBabyId,
      selectedBaby,
      hasBaby: Boolean(selectedBabyId.trim()),
      authReady,
      setUser,
      selectBaby,
      addBaby,
      logout,
      loadBabiesForCurrentUser,
    }),
    [
      user,
      babies,
      selectedBabyId,
      selectedBaby,
      authReady,
      setUser,
      selectBaby,
      addBaby,
      logout,
      loadBabiesForCurrentUser,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
