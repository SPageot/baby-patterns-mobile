import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { LogToggleRow } from '@/components/track/LogToggleRow'
import { ErrorText, SectionTitle, Subtitle } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
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
})

export function AppearanceSettingsSection() {
  const { t } = useTranslation()
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

  return (
    <View style={styles.section}>
      <SectionTitle>{t('settings.appearance.title')}</SectionTitle>
      <Subtitle style={styles.copy}>{t('settings.appearance.subtitle')}</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

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
