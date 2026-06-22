import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Link, router } from 'expo-router'

import { UnauthorizedError, RequestTimeoutError } from '@/api/client'
import { isApiConfigured } from '@/api/config'
import { completeMfaLogin } from '@/api/mfaApi'
import { loginUser, MfaRequiredError } from '@/api/userApi'
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
import { useApp } from '@/context/AppContext'
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { normalizeLoginCredentials, validateLogin, INVALID_LOGIN_CREDENTIALS_MESSAGE } from '@/schemas/user'

const createStyles = (t: AppPalette) => ({
  flex: {
    flex: 1,
  },
  link: {
    marginTop: 8,
    textAlign: 'center' as const,
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.accentDeep,
  },
  modeRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    alignItems: 'center' as const,
  },
  modeBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  modeLabelActive: {
    color: t.accentDeep,
  },
})

type MfaMode = 'totp' | 'recovery'

export default function LoginScreen() {
  const { setUser, loadBabiesForCurrentUser } = useApp()
  const styles = useThemedStyles(createStyles)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [pendingUsername, setPendingUsername] = useState('')
  const [mfaMode, setMfaMode] = useState<MfaMode>('totp')
  const [mfaCode, setMfaCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const finishLogin = async (user: Awaited<ReturnType<typeof loginUser>>) => {
    setUser(user)
    await loadBabiesForCurrentUser()
    router.replace('/profile')
  }

  const onSubmit = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    const credentials = normalizeLoginCredentials({ username, password })
    const issues = validateLogin(credentials)
    if (issues.length) {
      setError(issues[0]?.message ?? 'Check your credentials')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const user = await loginUser(credentials)
      await finishLogin(user)
    } catch (e) {
      if (e instanceof MfaRequiredError) {
        setMfaChallengeToken(e.challengeToken)
        setPendingUsername(credentials.username.trim())
        setError(null)
        return
      }
      if (e instanceof RequestTimeoutError) {
        setError(e.message)
      } else {
        setError(e instanceof UnauthorizedError ? e.message : INVALID_LOGIN_CREDENTIALS_MESSAGE)
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmitMfa = async () => {
    if (!mfaChallengeToken) return
    setLoading(true)
    setError(null)
    try {
      const user = await completeMfaLogin({
        challengeToken: mfaChallengeToken,
        code: mfaMode === 'totp' ? mfaCode : undefined,
        recoveryCode: mfaMode === 'recovery' ? recoveryCode : undefined,
        fallbackUsername: pendingUsername,
      })
      await finishLogin(user)
    } catch (e) {
      setError(e instanceof UnauthorizedError ? e.message : 'Invalid authenticator or recovery code.')
    } finally {
      setLoading(false)
    }
  }

  const mfaStep = Boolean(mfaChallengeToken)

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthBrandMark />
          <Eyebrow>Welcome back</Eyebrow>
          <Title>Baby </Title>
          <AccentTitle>Patterns</AccentTitle>
          <Subtitle>{mfaStep ? 'Verify your sign-in.' : 'Sign in to continue tracking.'}</Subtitle>

          <Card>
            {error ? <ErrorText>{error}</ErrorText> : null}

            {mfaStep ? (
              <>
                <View style={styles.modeRow}>
                  <Pressable
                    style={[styles.modeBtn, mfaMode === 'totp' && styles.modeBtnActive]}
                    onPress={() => setMfaMode('totp')}
                  >
                    <Text style={[styles.modeLabel, mfaMode === 'totp' && styles.modeLabelActive]}>
                      Authenticator
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeBtn, mfaMode === 'recovery' && styles.modeBtnActive]}
                    onPress={() => setMfaMode('recovery')}
                  >
                    <Text style={[styles.modeLabel, mfaMode === 'recovery' && styles.modeLabelActive]}>
                      Recovery code
                    </Text>
                  </Pressable>
                </View>

                {mfaMode === 'totp' ? (
                  <>
                    <Label>6-digit code</Label>
                    <Input
                      keyboardType="number-pad"
                      value={mfaCode}
                      onChangeText={(v) => setMfaCode(v.replace(/\D/g, ''))}
                      maxLength={8}
                    />
                  </>
                ) : (
                  <>
                    <Label>Recovery code</Label>
                    <Input
                      keyboardType="number-pad"
                      value={recoveryCode}
                      onChangeText={(v) => setRecoveryCode(v.replace(/\D/g, ''))}
                      maxLength={12}
                    />
                  </>
                )}

                <Button
                  title={loading ? 'Verifying…' : 'Continue'}
                  loading={loading}
                  onPress={() => void onSubmitMfa()}
                />
                <Pressable
                  onPress={() => {
                    setMfaChallengeToken(null)
                    setMfaCode('')
                    setRecoveryCode('')
                    setError(null)
                  }}
                >
                  <Text style={styles.link}>Back to password</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Label>Username</Label>
                <Input
                  autoCapitalize="none"
                  autoComplete="username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your username"
                />

                <Label>Password</Label>
                <Input
                  secureTextEntry
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                />

                <Button title={loading ? 'Signing in…' : 'Log in'} loading={loading} onPress={() => void onSubmit()} />
              </>
            )}
          </Card>

          {!mfaStep ? (
            <>
              <Pressable onPress={() => router.push('/forgot-password' as never)}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>

              <Link href="/signup" asChild>
                <Text style={styles.link}>Create an account</Text>
              </Link>
            </>
          ) : null}
          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
