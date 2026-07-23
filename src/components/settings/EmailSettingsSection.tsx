import { useEffect, useState } from 'react'
import { Text } from 'react-native'

import { requestEmailChange } from '@/api/settingsApi'
import { fetchCurrentUser } from '@/api/userApi'
import { isApiConfigured } from '@/api/config'
import {
  Button,
  ErrorText,
  Input,
  Label,
  SectionTitle,
  Subtitle,
} from '@/components/ui/primitives'
import { useApp } from '@/context/AppContext'
import type { User } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const createStyles = (t: AppPalette) => ({
  success: {
    color: t.accentDeep,
    fontSize: 14,
    marginBottom: Spacing.two,
    lineHeight: 20,
  },
})

type Props = {
  user: User
}

export function EmailSettingsSection({ user }: Props) {
  const { setUser } = useApp()
  const styles = useThemedStyles(createStyles)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isApiConfigured()) return
    void fetchCurrentUser()
      .then((fresh) => {
        if (fresh) setUser(fresh)
      })
      .catch(() => {
        /* keep cached user */
      })
  }, [setUser])

  const pendingEmail = user.pendingEmail?.trim() || ''

  const onSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    const trimmed = newEmail.trim()
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    if (trimmed.toLowerCase() === (user.email ?? '').trim().toLowerCase()) {
      setError('New email must be different from your current email.')
      return
    }
    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }

    setSaving(true)
    try {
      const result = await requestEmailChange({ newEmail: trimmed, currentPassword })
      setCurrentPassword('')
      setNewEmail('')
      setSuccess(result.message)
      setUser({
        ...user,
        pendingEmail: result.pendingEmail ?? trimmed.toLowerCase(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start email change')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionTitle>Change email</SectionTitle>
      <Subtitle>
        We will send a confirmation link to your new address. Your email stays the same until you
        confirm. Open the link in this app or in a browser.
      </Subtitle>

      {pendingEmail ? (
        <Text style={styles.success}>
          Confirmation pending for {pendingEmail}. Check that inbox (and junk/spam).
        </Text>
      ) : null}

      {error ? <ErrorText>{error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Label>Current email</Label>
      <Input value={user.email?.trim() || ''} editable={false} selectTextOnFocus={false} />

      <Label>New email</Label>
      <Input
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={newEmail}
        onChangeText={setNewEmail}
        editable={!saving}
      />

      <Label>Current password</Label>
      <Input
        secureTextEntry
        autoComplete="password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        editable={!saving}
      />

      <Button
        title={saving ? 'Sending…' : 'Send confirmation email'}
        disabled={saving}
        onPress={() => void onSubmit()}
      />
    </>
  )
}
