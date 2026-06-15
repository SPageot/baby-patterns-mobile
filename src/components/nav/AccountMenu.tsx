import { Modal, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useApp } from '@/context/AppContext'
import { ACCOUNT_LINKS } from '@/lib/navLinks'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Props = {
  open: boolean
  onClose: () => void
}

const createStyles = (t: AppPalette) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute' as const,
    right: 12,
    minWidth: 200,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card,
    paddingVertical: 8,
    shadowColor: '#645078',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  name: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.textMuted,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
    marginBottom: 4,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
  },
  itemDanger: {
    color: t.error,
  },
  pressed: {
    opacity: 0.82,
    backgroundColor: t.card2,
  },
})

export function AccountMenu({ open, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, logout } = useApp()
  const styles = useThemedStyles(createStyles)

  if (!user) return null

  const displayName = user.fullName?.trim() || user.username?.trim() || ''

  const navigate = (href: string) => {
    onClose()
    router.push(href as '/')
  }

  const onLogout = () => {
    onClose()
    void logout().finally(() => router.replace('/'))
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, { top: insets.top + 56 }]}>
          {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
          {ACCOUNT_LINKS.map((link) => (
            <Pressable
              key={link.href}
              accessibilityRole="menuitem"
              onPress={() => navigate(link.href)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Text style={styles.itemText}>{link.label}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="menuitem"
            onPress={onLogout}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Text style={[styles.itemText, styles.itemDanger]}>Log out</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}
