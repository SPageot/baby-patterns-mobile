import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NavIcon } from '@/components/icons/NavIcon'
import { AccountMenu } from '@/components/nav/AccountMenu'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { HomeButton } from '@/components/home/HomeButton'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useApp } from '@/context/AppContext'
import { useNavMenu } from '@/context/NavMenuContext'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
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
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.stroke,
    borderRadius: 12,
    backgroundColor: t.card,
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
    flexShrink: 1,
    justifyContent: 'flex-end' as const,
  },
  userChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    maxWidth: 140,
    flexShrink: 1,
  },
  userName: {
    flexShrink: 1,
    color: t.textMuted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  loginLink: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
  },
  loginText: {
    color: t.textMuted,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  signupBtn: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function Navbar() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { open, toggle, close } = useNavMenu()
  const { user } = useApp()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  const displayName = user?.fullName?.trim() || user?.username?.trim() || ''

  const openAccountMenu = () => {
    close()
    setAccountMenuOpen(true)
  }

  return (
    <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
      <AccountMenu open={accountMenuOpen} onClose={() => setAccountMenuOpen(false)} />
      <View style={styles.inner}>
        <View style={styles.start}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close menu' : 'Open menu'}
            onPress={toggle}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
          >
            <NavIcon name={open ? 'close' : 'menu'} size={20} color={colors.text} />
          </Pressable>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Baby Patterns home"
            onPress={() => router.push(user ? '/profile' : '/')}
            style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
          >
            <Text style={styles.brandName}>Baby Patterns</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {user ? (
            <>
              <NotificationsMenu enabled={Boolean(user.id)} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={displayName ? `Account menu for ${displayName}` : 'Account menu'}
                onPress={openAccountMenu}
                style={({ pressed }) => [styles.userChip, pressed && styles.pressed]}
              >
                <UserAvatar user={user} size="sm" />
                {displayName ? (
                  <Text style={styles.userName} numberOfLines={1}>
                    {displayName}
                  </Text>
                ) : null}
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/login')}
                style={({ pressed }) => [styles.loginLink, pressed && styles.pressed]}
              >
                <Text style={styles.loginText}>Log in</Text>
              </Pressable>
              <HomeButton title="Sign up" onPress={() => router.push('/signup')} style={styles.signupBtn} />
            </>
          )}
        </View>
      </View>
    </View>
  )
}
