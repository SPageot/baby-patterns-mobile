import { Stack, useSegments } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import { LegalAcceptModal } from '@/components/auth/LegalAcceptModal'
import { PushNotificationHandler } from '@/components/notifications/PushNotificationHandler'
import { SplashController } from '@/components/SplashController'
import { useAppFonts } from '@/hooks/useAppFonts'
import { BillingReturnHandler } from '@/components/billing/BillingReturnHandler'
import { ConfirmEmailLinkHandler } from '@/components/auth/ConfirmEmailLinkHandler'
import { BottomTabNav } from '@/components/nav/BottomTabNav'
import { Navbar } from '@/components/nav/Navbar'
import { AppProvider, useApp } from '@/context/AppContext'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { LocaleProvider, useLocale } from '@/context/LocaleContext'
import { ModerationProvider } from '@/context/ModerationContext'
import { TabNavProvider, useTabNav } from '@/context/TabNavContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { useGuestRouteGuard } from '@/hooks/useGuestRouteGuard'
import { useHomeTheme } from '@/hooks/useHomeTheme'

function AppShell() {
  const segments = useSegments() as string[]
  const root = segments[0] ?? ''
  const isAuth = root === '(auth)'
  const isLegal = root === 'terms' || root === 'privacy'
  const showShellNav = !isAuth && !isLegal
  const { user } = useApp()
  const colors = useHomeTheme()
  const { bottomInset } = useTabNav()
  const showTabNav = showShellNav && Boolean(user)

  useGuestRouteGuard()

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showShellNav ? <Navbar /> : null}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={isAuth ? ['top', 'bottom'] : ['top']}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
              paddingBottom: showTabNav ? bottomInset : 0,
            },
          }}
        />
      </SafeAreaView>
      {showTabNav ? <BottomTabNav /> : null}
    </View>
  )
}

function AppShellWithTabs() {
  return (
    <TabNavProvider>
      <AppShell />
    </TabNavProvider>
  )
}

function RootWithLocale({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready } = useLocale()

  if (!ready) {
    return null
  }

  return (
    <AppProvider>
      <ModerationProvider>
        <ConfirmProvider>
          <SplashController fontsReady={fontsLoaded} />
          <BillingReturnHandler />
          <ConfirmEmailLinkHandler />
          <PushNotificationHandler />
          <LegalAcceptModal />
          <AppShellWithTabs />
        </ConfirmProvider>
      </ModerationProvider>
    </AppProvider>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts()

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <RootWithLocale fontsLoaded={fontsLoaded} />
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
