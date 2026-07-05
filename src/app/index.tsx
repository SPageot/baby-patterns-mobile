import { Redirect } from 'expo-router'

import { PageLoadingScreen } from '@/components/ui/Loading'
import { useApp } from '@/context/AppContext'

export default function HomeScreen() {
  const { user, authReady } = useApp()

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (user) {
    return <Redirect href="/profile" />
  }

  return <Redirect href="/login" />
}
