import { Pressable, ScrollView, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useApp } from '@/context/AppContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { isSubLinkActive, subLinkNeedsLogin, type TabSubLink } from '@/lib/tabNavConfig'

const createStyles = (t: AppPalette) => ({
  wrap: {
    width: '100%' as const,
    maxWidth: 420,
    marginBottom: 10,
  },
  pill: {
    backgroundColor: t.card,
    borderRadius: HomeRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#2f2a38',
    shadowOpacity: t.mode === 'light' ? 0.1 : 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 4,
  },
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    backgroundColor: t.card2,
  },
  btnActive: {
    backgroundColor: t.accentSoft,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  labelActive: {
    color: t.text,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.82,
  },
})

type Props = {
  links: TabSubLink[]
}

export function TabSubNavRow({ links }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useApp()
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  if (!links.length) return null

  const onPressLink = (link: TabSubLink) => {
    if (subLinkNeedsLogin(link, user)) {
      router.push('/login')
      return
    }
    router.push(link.href as '/')
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.row}
        >
          {links.map((link) => {
            const active = isSubLinkActive(pathname, link.href)
            return (
              <Pressable
                key={link.href}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => onPressLink(link)}
                style={({ pressed }) => [styles.btn, active && styles.btnActive, pressed && styles.pressed]}
              >
                <NavIcon name={link.icon} size={12} color={active ? palette.text : palette.textMuted} />
                <Text style={[styles.label, active && styles.labelActive]}>{link.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}
