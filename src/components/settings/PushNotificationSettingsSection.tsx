import { useState } from 'react'
import { Text, View } from 'react-native'

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
  const { user } = useApp()
  const push = usePushNotifications(Boolean(user))
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [success, setSuccess] = useState<string | null>(null)

  const onToggle = async (next: boolean) => {
    setSuccess(null)
    try {
      await push.setEnabled(next)
      setSuccess(
        next
          ? 'Notification alerts are on for this device.'
          : 'Notification alerts are off for this device.',
      )
    } catch {
      /* error shown by hook */
    }
  }

  return (
    <View style={styles.section}>
      <SectionTitle>Notifications</SectionTitle>
      <Subtitle style={styles.copy}>
        Get alerts on this phone when someone mentions you, likes your post, or logs family tracking
        activity.
      </Subtitle>

      {!push.supported ? (
        <Subtitle>Push notifications require a physical iOS or Android device.</Subtitle>
      ) : null}

      {push.error ? <ErrorText>{push.error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <LogToggleRow
        label="Notification alerts"
        value={push.active}
        onChange={(next) => void onToggle(next)}
        accent={palette.accentDeep}
        stroke={palette.stroke}
        disabled={push.busy || !push.supported}
      />
      {push.busy ? <Subtitle>Saving…</Subtitle> : null}
    </View>
  )
}
