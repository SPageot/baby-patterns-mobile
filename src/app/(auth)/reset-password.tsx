import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native'
import { Link, router, useLocalSearchParams } from 'expo-router'

import { resetPassword, validatePasswordResetToken } from '@/api/passwordResetApi'
import { isApiConfigured } from '@/api/config'
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks'
import {
  AccentTitle,
  Button,
  Card,
  ErrorText,
  Eyebrow,
  Input,
  Label,
  Screen,
  Subtitle,
  Title,
} from '@/components/ui/primitives'
import { AuthBrandMark } from '@/components/auth/AuthBrandMark'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

const createStyles = (t: AppPalette) => ({
  flex: { flex: 1 },
  success: {
    color: t.accentDeep,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  link: {
    marginTop: 8,
    textAlign: 'center' as const,
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.accentDeep,
  },
})

export default function ResetPasswordScreen() {
  const styles = useThemedStyles(createStyles)
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>()
  const token = (Array.isArray(tokenParam) ? tokenParam[0] : tokenParam)?.trim() ?? ''

  const [checking, setChecking] = useState(Boolean(token))
  const [tokenValid, setTokenValid] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return

    if (!isApiConfigured()) {
      setChecking(false)
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    void validatePasswordResetToken(token)
      .then((valid) => {
        setTokenValid(valid)
        if (!valid) {
          setError('This reset link is invalid or has expired.')
        }
      })
      .finally(() => setChecking(false))
  }, [token])

  const onSubmit = async () => {
    if (!token || !tokenValid) return

    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Title>Invalid reset link</Title>
          <Subtitle>
            Password reset links are only available from the email we send you. Request a new link if
            yours expired.
          </Subtitle>
          <Pressable onPress={() => router.push('/forgot-password' as never)}>
            <Text style={styles.link}>Request a reset link</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthBrandMark />
          <Eyebrow>Account help</Eyebrow>
          <Title>Reset </Title>
          <AccentTitle>password</AccentTitle>
          <Subtitle>Choose a new password for your account.</Subtitle>

          <Card>
            {checking ? <Subtitle>Checking your reset link…</Subtitle> : null}
            {error ? <ErrorText>{error}</ErrorText> : null}
            {success ? (
              <Text style={styles.success}>
                Your password has been updated. You can log in with your new password now.
              </Text>
            ) : null}

            {!checking && success ? (
              <Button title="Go to log in" onPress={() => router.replace('/login')} />
            ) : null}

            {!checking && !success && tokenValid ? (
              <>
                <Label>New password</Label>
                <Input
                  secureTextEntry
                  autoComplete="new-password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Label>Confirm new password</Label>
                <Input
                  secureTextEntry
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Button
                  title={loading ? 'Updating…' : 'Update password'}
                  loading={loading}
                  onPress={() => void onSubmit()}
                />
              </>
            ) : null}

            {!checking && !success && !tokenValid ? (
              <Pressable onPress={() => router.push('/forgot-password' as never)}>
                <Text style={styles.link}>Request a new reset link</Text>
              </Pressable>
            ) : null}
          </Card>

          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
