import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { LogToggleRow } from '@/components/track/LogToggleRow'
import { ErrorText, SectionTitle, Subtitle } from '@/components/ui/primitives'
import { updateUser } from '@/api/userApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { isProUser } from '@/lib/subscription'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import type { User } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  user: User
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.one,
  },
  success: {
    color: t.accentDeep,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  link: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  copy: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    color: t.textMuted,
  },
})

export function WeeklySummarySettingsSection({ user }: Props) {
  const router = useRouter()
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { setUser } = useApp()
  const userIsPro = isProUser(user)
  const [enabled, setEnabled] = useState(Boolean(user.weeklySummaryEmailEnabled))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setEnabled(Boolean(user.weeklySummaryEmailEnabled))
  }, [user.weeklySummaryEmailEnabled])

  const onToggle = async (next: boolean) => {
    if (!userIsPro) return
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to save preferences.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updateUser({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        birthdate: user.birthdate,
        fullName: user.fullName,
        location: user.location,
        weeklySummaryEmailEnabled: next,
      })
      setEnabled(Boolean(updated.weeklySummaryEmailEnabled))
      setUser(updated)
      setSuccess(
        next
          ? "Weekly email summaries are enabled. Check your inbox for last week's digest."
          : 'Weekly email summaries turned off.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preference')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.section}>
      <SectionTitle>Weekly summaries</SectionTitle>
      <Subtitle>
        Get a digest of sleep, feeding, diapers, growth, and milestones each week. Included with Baby Patterns Pro.
      </Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {!userIsPro ? (
        <Subtitle>
          <Text style={styles.link} onPress={() => router.push('/pricing')}>
            Upgrade to Pro
          </Text>{' '}
          to enable weekly email summaries.
        </Subtitle>
      ) : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Text style={styles.sub}>
        Sent to {user.email || 'your account email'} every Monday with last week&apos;s highlights. You can also view
        summaries anytime on the{' '}
        <Text style={styles.link} onPress={() => router.push('/weekly-summary')}>
          Weekly summary
        </Text>{' '}
        page.
      </Text>

      <LogToggleRow
        label="Email me weekly summaries"
        value={enabled}
        onChange={(next) => void onToggle(next)}
        accent={palette.accentDeep}
        stroke={palette.stroke}
        disabled={saving || !userIsPro}
      />
      {saving ? <Subtitle>Saving…</Subtitle> : null}
    </View>
  )
}
