import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AccountMenu } from '@/components/nav/AccountMenu'
import { BrandMark } from '@/components/nav/BrandMark'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { Button } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useApp } from '@/context/AppContext'
import type { AppPalette } from '@/constants/homeTheme'
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
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  const displayName = user?.fullName?.trim() || user?.username?.trim() || ''

  return (
    <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
      <AccountMenu open={accountMenuOpen} onClose={() => setAccountMenuOpen(false)} />
      <View style={styles.inner}>
        <View style={styles.start}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Baby Patterns home"
            onPress={() => router.push(user ? '/profile' : '/login')}
            style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
          >
            <BrandMark size={32} />
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
                onPress={() => setAccountMenuOpen(true)}
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
            <View style={styles.guestActions}>
              <Link href="/login" asChild>
                <Button title="Sign in" variant="ghost" />
              </Link>
              <Link href="/signup" asChild>
                <Button title="Sign up" />
              </Link>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
