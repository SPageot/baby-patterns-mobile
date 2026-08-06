import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { updateUser } from '@/api/userApi'
import { isApiConfigured } from '@/api/config'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import { ErrorText, SectionTitle, Subtitle } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useApp } from '@/context/AppContext'
import { useLocale } from '@/context/LocaleContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { APP_LOCALES, type AppLocale } from '@/i18n/localePreference'
import {
  getStoredMenuGroupsDefault,
  storeMenuGroupsDefault,
  type MenuGroupsDefault,
} from '@/lib/menuGroupsPreference'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.one,
  },
  success: {
    color: t.accentDeep,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  copy: {
    marginBottom: Spacing.two,
  },
  field: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
    marginBottom: 4,
  },
  fieldSub: {
    fontSize: 13,
    color: t.textMuted,
    marginBottom: 10,
    lineHeight: 18,
  },
  localeRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  localeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    alignItems: 'center' as const,
  },
  localeBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  localeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  localeLabelActive: {
    color: t.accentDeep,
  },
})

export function AppearanceSettingsSection() {
  const { t } = useTranslation()
  const { user, setUser } = useApp()
  const { locale, setLocale } = useLocale()
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [preference, setPreference] = useState<MenuGroupsDefault>('collapsed')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const stored = await getStoredMenuGroupsDefault()
        if (!cancelled) {
          setPreference(stored)
          setReady(true)
        }
      } catch {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const expandByDefault = preference === 'expanded'

  const onToggle = async (next: boolean) => {
    const value: MenuGroupsDefault = next ? 'expanded' : 'collapsed'
    setError(null)
    setSuccess(null)
    try {
      await storeMenuGroupsDefault(value)
      setPreference(value)
      setSuccess(next ? t('settings.appearance.menuExpandedOn') : t('settings.appearance.menuExpandedOff'))
    } catch {
      setError(t('settings.appearance.saveError'))
    }
  }

  const onLanguageChange = async (next: AppLocale) => {
    if (next === locale) return
    setError(null)
    setSuccess(null)
    try {
      await setLocale(next)

      if (user?.id && isApiConfigured()) {
        const updated = await updateUser({
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          birthdate: user.birthdate,
          fullName: user.fullName,
          location: user.location,
          weeklySummaryEmailEnabled: Boolean(user.weeklySummaryEmailEnabled),
          preferredLocale: next,
        })
        setUser(updated)
      }

      setSuccess(t('settings.appearance.languageSaved'))
    } catch {
      setError(t('settings.appearance.saveError'))
    }
  }

  return (
    <View style={styles.section}>
      <SectionTitle>{t('settings.appearance.title')}</SectionTitle>
      <Subtitle style={styles.copy}>{t('settings.appearance.subtitle')}</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t('settings.appearance.language')}</Text>
        <Text style={styles.fieldSub}>{t('settings.appearance.languageSub')}</Text>
        <View style={styles.localeRow}>
          {APP_LOCALES.map((item) => {
            const active = locale === item.code
            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.nativeLabel}
                onPress={() => void onLanguageChange(item.code)}
                style={[styles.localeBtn, active && styles.localeBtnActive]}
              >
                <Text style={[styles.localeLabel, active && styles.localeLabelActive]}>
                  {item.nativeLabel}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <LogToggleRow
        label={t('settings.appearance.expandGroups')}
        value={expandByDefault}
        onChange={(next) => void onToggle(next)}
        accent={palette.accentDeep}
        stroke={palette.stroke}
        disabled={!ready}
      />
    </View>
  )
}
