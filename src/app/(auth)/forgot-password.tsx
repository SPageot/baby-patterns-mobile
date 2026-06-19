import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import { Link, router } from 'expo-router'

import { requestPasswordReset } from '@/api/passwordResetApi'
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

export default function ForgotPasswordScreen() {
  const styles = useThemedStyles(createStyles)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter the email address for your account.')
      return
    }

    setLoading(true)
    try {
      const message = await requestPasswordReset(trimmed)
      setSuccess(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Eyebrow>Account help</Eyebrow>
          <Title>Forgot </Title>
          <AccentTitle>password</AccentTitle>
          <Subtitle>Enter your account email and we&apos;ll send you a reset link.</Subtitle>

          <Card>
            {error ? <ErrorText>{error}</ErrorText> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            {!success ? (
              <>
                <Label>Email</Label>
                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                />
                <Button
                  title={loading ? 'Sending…' : 'Send reset link'}
                  loading={loading}
                  onPress={() => void onSubmit()}
                />
              </>
            ) : null}
          </Card>

          <Link href="/login" asChild>
            <Text style={styles.link}>Back to log in</Text>
          </Link>
          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
