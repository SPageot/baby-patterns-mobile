import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppMenu, AppMenuButton } from '@/components/nav/AppMenu'
import { BrandMark } from '@/components/nav/BrandMark'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { Button } from '@/components/ui/primitives'
import { useApp } from '@/context/AppContext'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  nav: {
    backgroundColor: t.navBackground,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
    paddingBottom: 12,
    paddingHorizontal: Spacing.three,
  },
  inner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  start: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flexShrink: 1,
    minWidth: 0,
  },
  brand: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flexShrink: 1,
  },
  brandName: {
    ...heading(16, { lineHeight: 20, weight: '700' }),
    color: t.text,
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexShrink: 0,
    justifyContent: 'flex-end' as const,
  },
  guestActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function Navbar() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useApp()
  const styles = useThemedStyles(createStyles)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <View style={styles.inner}>
        <View style={styles.start}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Baby Pattern home"
            onPress={() => router.push(user ? '/profile' : '/login')}
            style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
          >
            <BrandMark size={32} />
            <Text style={styles.brandName}>Baby Pattern</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {user ? <NotificationsMenu enabled={Boolean(user.id)} /> : null}
          {user ? null : (
            <View style={styles.guestActions}>
              <Link href="/login" asChild>
                <Button title="Sign in" variant="ghost" />
              </Link>
              <Link href="/signup" asChild>
                <Button title="Sign up" />
              </Link>
            </View>
          )}
          <AppMenuButton onPress={() => setMenuOpen(true)} />
        </View>
      </View>
    </View>
  )
}
