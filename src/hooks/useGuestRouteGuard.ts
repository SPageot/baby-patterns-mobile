import { useEffect } from 'react'
import { usePathname, useRouter } from 'expo-router'

import { useApp } from '@/context/AppContext'
import { GUEST_ENTRY_PATH, isGuestAllowedPath } from '@/lib/guestRoutes'

export function useGuestRouteGuard() {
  const { user, authReady } = useApp()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!authReady || user) return
    if (isGuestAllowedPath(pathname)) return
    router.replace(GUEST_ENTRY_PATH)
  }, [authReady, user, pathname, router])
}
