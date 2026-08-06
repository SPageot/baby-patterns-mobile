import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { LogToggleRow } from '@/components/track/LogToggleRow'
import { useApp } from '@/context/AppContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { ErrorText, SectionTitle, Subtitle } from '@/components/ui/primitives'

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

export function PushNotificationSettingsSection() {
  const { t } = useTranslation()
  const { user } = useApp()
  const push = usePushNotifications(Boolean(user))
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [success, setSuccess] = useState<string | null>(null)

  const onToggle = async (next: boolean) => {
    setSuccess(null)
    try {
      await push.setEnabled(next)
      setSuccess(next ? t('settings.notifications.successOn') : t('settings.notifications.successOff'))
    } catch {
      /* error shown by hook */
    }
  }

  return (
    <View style={styles.section}>
      <SectionTitle>{t('settings.notifications.title')}</SectionTitle>
      <Subtitle style={styles.copy}>{t('settings.notifications.subtitle')}</Subtitle>

      {!push.supported ? (
        <Subtitle>{t('settings.notifications.unsupported')}</Subtitle>
      ) : null}

      {push.error ? <ErrorText>{push.error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <LogToggleRow
        label={t('settings.notifications.alerts')}
        value={push.active}
        onChange={(next) => void onToggle(next)}
        accent={palette.accentDeep}
        stroke={palette.stroke}
        disabled={push.busy || !push.supported}
      />
      {push.busy ? <Subtitle>{t('track.fields.saving')}</Subtitle> : null}
    </View>
  )
}
