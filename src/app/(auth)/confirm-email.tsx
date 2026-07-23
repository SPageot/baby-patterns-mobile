import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native'
import { Link, router, useLocalSearchParams } from 'expo-router'

import { confirmEmailChange, validateEmailChangeToken } from '@/api/settingsApi'
import { fetchCurrentUser } from '@/api/userApi'
import { isApiConfigured } from '@/api/config'
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks'
import {
  AccentTitle,
  Button,
  Card,
  ErrorText,
  Eyebrow,
  Screen,
  Subtitle,
  Title,
} from '@/components/ui/primitives'
import { AuthBrandMark } from '@/components/auth/AuthBrandMark'
import { useApp } from '@/context/AppContext'
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

export default function ConfirmEmailScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>()
  const token = (Array.isArray(tokenParam) ? tokenParam[0] : tokenParam)?.trim() ?? ''
  const { user, setUser } = useApp()
  const styles = useThemedStyles(createStyles)

  const [checking, setChecking] = useState(Boolean(token))
  const [tokenValid, setTokenValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setChecking(false)
      setTokenValid(false)
      setError('This confirmation link is invalid or has expired.')
      return
    }

    if (!isApiConfigured()) {
      setChecking(false)
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    setChecking(true)
    void validateEmailChangeToken(token)
      .then((valid) => {
        setTokenValid(valid)
        if (!valid) {
          setError('This confirmation link is invalid or has expired.')
        }
      })
      .finally(() => setChecking(false))
  }, [token])

  const onConfirm = async () => {
    if (!token || !tokenValid) return
    setError(null)
    setSubmitting(true)
    try {
      await confirmEmailChange(token)
      setSuccess(true)
      if (user) {
        try {
          const refreshed = await fetchCurrentUser()
          if (refreshed) setUser(refreshed)
        } catch {
          const pending = user.pendingEmail?.trim()
          setUser({
            ...user,
            email: pending || user.email,
            pendingEmail: undefined,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm email.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthBrandMark />
          <Eyebrow>Account</Eyebrow>
          <Title>Confirm email</Title>
          <AccentTitle>Verify your new address</AccentTitle>

          <Card>
            {checking ? (
              <Subtitle>Checking link…</Subtitle>
            ) : success ? (
              <>
                <Text style={styles.success}>
                  Your email has been updated. You can use your new address for account emails going
                  forward.
                </Text>
                <Button title="Back to settings" onPress={() => router.replace('/settings?tab=email')} />
              </>
            ) : (
              <>
                <Subtitle>
                  {tokenValid
                    ? 'Confirm to finish changing the email on your Baby Pattern account.'
                    : 'This confirmation link is invalid or has expired. Request a new one from Settings.'}
                </Subtitle>
                {error ? <ErrorText>{error}</ErrorText> : null}
                {tokenValid ? (
                  <Button
                    title={submitting ? 'Confirming…' : 'Confirm new email'}
                    disabled={submitting}
                    onPress={() => void onConfirm()}
                  />
                ) : (
                  <Button title="Go to settings" variant="secondary" onPress={() => router.replace('/settings?tab=email')} />
                )}
              </>
            )}
          </Card>

          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </Link>
          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
