import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NavIcon } from '@/components/icons/NavIcon'
import { ThemeToggle } from '@/components/nav/ThemeToggle'
import { useNavMenu } from '@/context/NavMenuContext'
import { ACCOUNT_LINKS, getVisibleNavLinks, type NavLink } from '@/lib/navLinks'
import { useApp } from '@/context/AppContext'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

function normalizePath(path: string) {
  const base = path.split('?')[0] || '/'
  return base
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === ''
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavRow({
  link,
  active,
  onPress,
  styles,
  colors,
}: {
  link: NavLink
  active: boolean
  onPress: () => void
  styles: ReturnType<typeof createStyles>
  colors: AppPalette
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.link, active && styles.linkActive, pressed && styles.pressed]}
    >
      <View style={[styles.linkIcon, active && styles.linkIconActive]}>
        <NavIcon name={link.icon} size={17} color={colors.accentDeep} />
      </View>
      <Text style={[styles.linkLabel, active && styles.linkLabelActive]}>{link.label}</Text>
    </Pressable>
  )
}

const createStyles = (t: AppPalette) => ({
  root: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(47, 42, 56, 0.25)',
  },
  panel: {
    width: '86%' as const,
    maxWidth: 280,
    backgroundColor: t.card,
    borderRightWidth: 1,
    borderRightColor: t.stroke,
    paddingHorizontal: 16,
    shadowColor: '#645078',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 4, height: 0 },
    elevation: 8,
  },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.stroke,
    borderRadius: 10,
    backgroundColor: t.card2,
  },
  nav: {
    flex: 1,
  },
  themeRow: {
    marginBottom: 16,
  },
  link: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: HomeRadius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  linkActive: {
    backgroundColor: t.accentSoft,
    borderColor: t.accentLavender,
  },
  linkIcon: {
    width: 32,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 10,
    backgroundColor: t.card2,
  },
  linkIconActive: {
    backgroundColor: t.accentSoft,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
  },
  linkLabelActive: {
    color: t.accentDeep,
  },
  accountSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
  },
  accountTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  accountLink: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: HomeRadius.md,
    marginBottom: 4,
  },
  accountLinkText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function SideNav() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = normalizePath(usePathname())
  const { open, close } = useNavMenu()
  const { user } = useApp()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const visibleLinks = getVisibleNavLinks({ user })

  const onNavigate = (href: string) => {
    close()
    router.push(href as '/')
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={styles.backdrop} onPress={close} />

        <View
          style={[
            styles.panel,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.head}>
            <Text style={styles.title}>Menu</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={close}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <NavIcon name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.themeRow}>
            <ThemeToggle />
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {visibleLinks.map((link) => (
              <NavRow
                key={link.href}
                link={link}
                active={isActive(pathname, link.href)}
                onPress={() => onNavigate(link.href)}
                styles={styles}
                colors={colors}
              />
            ))}

            {user ? (
              <View style={styles.accountSection}>
                <Text style={styles.accountTitle}>Account</Text>
                {ACCOUNT_LINKS.map((link) => (
                  <Pressable
                    key={link.href}
                    accessibilityRole="link"
                    onPress={() => onNavigate(link.href)}
                    style={({ pressed }) => [
                      styles.accountLink,
                      isActive(pathname, link.href) && styles.linkActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountLinkText,
                        isActive(pathname, link.href) && styles.linkLabelActive,
                      ]}
                    >
                      {link.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
