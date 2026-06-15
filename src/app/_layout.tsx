import { Stack, useSegments } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import { SplashController } from '@/components/SplashController'
import { Navbar } from '@/components/nav/Navbar'
import { SideNav } from '@/components/nav/SideNav'
import { AppProvider } from '@/context/AppContext'
import { NavMenuProvider } from '@/context/NavMenuContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'

function AppShell() {
  const segments = useSegments() as string[]
  const root = segments[0] ?? ''
  const isAuth = root === '(auth)'
  const isLegal = root === 'terms' || root === 'privacy'
  const showShellNav = !isAuth && !isLegal
  const colors = useHomeTheme()

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showShellNav ? <Navbar /> : null}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={isAuth ? ['top', 'bottom'] : ['bottom']}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </SafeAreaView>
      {showShellNav ? <SideNav /> : null}
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <SplashController />
          <NavMenuProvider>
            <AppShell />
          </NavMenuProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
