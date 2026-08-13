import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NavIcon } from '@/components/icons/NavIcon'
import { TourTarget } from '@/components/onboarding/TourTarget'
import { useApp } from '@/context/AppContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { navGroupI18nKey, navLinkI18nKey } from '@/i18n/navKeys'
import {
  ACCOUNT_LINKS,
  getHamburgerMenuSections,
  type NavGroupId,
} from '@/lib/navLinks'
import {
  getStoredMenuGroupsDefault,
  menuGroupsExpandedMap,
} from '@/lib/menuGroupsPreference'
import { isTourRunning } from '@/lib/onboardingSession'
import { userPlanLabel } from '@/lib/subscription'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  onClose: () => void
}

const createStyles = (t: AppPalette) => ({
  screen: {
    flex: 1,
    backgroundColor: t.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...heading(22, { weight: '800' }),
    color: t.text,
  },
  headerMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.stroke,
    borderRadius: 12,
    backgroundColor: t.card,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: 4,
  },
  section: {
    gap: 4,
  },
  sectionToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 10,
    marginTop: Spacing.two,
    marginBottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
  },
  sectionChevron: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  item: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: t.text,
  },
  itemDanger: {
    color: t.error,
  },
  divider: {
    height: 1,
    backgroundColor: t.strokeSubtle,
    marginVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.82,
    backgroundColor: t.card2,
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
})

export function AppMenuButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('nav.openMenu')}
      onPress={onPress}
      style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
    >
      <NavIcon name="menu" size={20} color={colors.text} />
    </Pressable>
  )
}

export function AppMenu({ open, onClose }: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, logout } = useApp()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [expanded, setExpanded] = useState<Partial<Record<NavGroupId, boolean>>>({})

  const sections = getHamburgerMenuSections({ user })
  const displayName = user?.fullName?.trim() || user?.username?.trim() || ''
  const planLabel = user ? userPlanLabel(user) : ''

  useEffect(() => {
    if (!open) {
      setExpanded({})
      return
    }
    let cancelled = false
    void (async () => {
      if (isTourRunning()) {
        if (cancelled) return
        setExpanded(
          Object.fromEntries(sections.map((section) => [section.id, true])) as Partial<
            Record<NavGroupId, boolean>
          >,
        )
        return
      }
      const preference = await getStoredMenuGroupsDefault()
      if (cancelled) return
      setExpanded(
        menuGroupsExpandedMap(
          sections.map((section) => section.id),
          preference,
        ),
      )
    })()
    return () => {
      cancelled = true
    }
    // Seed only when the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sections read at open time
  }, [open])

  const toggleSection = (id: NavGroupId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const navigate = (href: string) => {
    onClose()
    router.push(href as '/')
  }

  const onLogout = () => {
    onClose()
    void logout().finally(() => router.replace('/'))
  }

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('nav.menuTitle')}</Text>
            {user && displayName ? (
              <Text style={styles.headerMeta} numberOfLines={1}>
                {displayName}
                {planLabel ? ` · ${planLabel}` : ''}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.closeMenu')}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <NavIcon name="close" size={18} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.five }]}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, index) => {
            const isOpen = Boolean(expanded[section.id])
            const sectionLabel = t(navGroupI18nKey(section.id))
            return (
              <View key={section.id} style={styles.section}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={`${sectionLabel}, ${isOpen ? 'expanded' : 'collapsed'}`}
                  onPress={() => toggleSection(section.id)}
                  style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
                >
                  <Text style={styles.sectionLabel}>{sectionLabel}</Text>
                  <Text style={styles.sectionChevron}>{isOpen ? '▾' : '▸'}</Text>
                </Pressable>
                {isOpen
                  ? section.links.map((link) => {
                      const tourId = `nav-link-${link.href.replace(/^\//, '').replace(/\//g, '-') || 'home'}`
                      return (
                        <TourTarget key={link.href} id={tourId}>
                          <Pressable
                            accessibilityRole="menuitem"
                            onPress={() => navigate(link.href)}
                            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                          >
                            <NavIcon name={link.icon} size={18} color={colors.accentDeep} />
                            <Text style={styles.itemText}>
                              {t(navLinkI18nKey(link.href), { defaultValue: link.label })}
                            </Text>
                          </Pressable>
                        </TourTarget>
                      )
                    })
                  : null}
              </View>
            )
          })}

          <View style={styles.divider} />
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => navigate('/feedback')}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <NavIcon name="edit" size={18} color={colors.accentDeep} />
            <Text style={styles.itemText}>{t('nav.links.feedback')}</Text>
          </Pressable>

          {user ? (
            <>
              <View style={styles.divider} />
              {ACCOUNT_LINKS.filter((link) => link.href === '/add-baby').map((link) => (
                <TourTarget key={link.href} id="add-baby-btn">
                  <Pressable
                    accessibilityRole="menuitem"
                    onPress={() => navigate(link.href)}
                    style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                  >
                    <NavIcon name="heart" size={18} color={colors.accentDeep} />
                    <Text style={styles.itemText}>{t('common.addBaby')}</Text>
                  </Pressable>
                </TourTarget>
              ))}
              <Pressable
                accessibilityRole="menuitem"
                onPress={onLogout}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <NavIcon name="heart" size={18} color={colors.error} />
                <Text style={[styles.itemText, styles.itemDanger]}>{t('common.logOut')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.divider} />
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => navigate('/login')}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <Text style={styles.itemText}>{t('common.logIn')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => navigate('/signup')}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <Text style={styles.itemText}>{t('common.signUp')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}
