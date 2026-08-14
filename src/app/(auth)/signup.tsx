import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import { Link, router } from 'expo-router'

import { acceptLegalPolicies } from '@/api/authApi'
import { UnauthorizedError, RequestTimeoutError } from '@/api/client'
import { isApiConfigured } from '@/api/config'
import { createUser, deleteUser, loginWithGoogle, MfaRequiredError } from '@/api/userApi'
import { completeMfaLogin } from '@/api/mfaApi'
import { LegalAcceptance } from '@/components/legal/LegalAcceptance'
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks'
import { DateTimeField } from '@/components/ui/DateTimeField'
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
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { useGoogleSignIn } from '@/lib/googleAuth'
import {
  EARLIEST_BIRTHDATE_YMD,
  MIN_USER_AGE_YEARS,
  latestUserBirthdateYmd,
  normalizeUserSignup,
  validateUserSignup,
} from '@/schemas/user'
import { APP_AUDIENCE_NOTE } from '@/lib/healthDisclaimer'
import { LEGAL_POLICY_VERSION } from '@/lib/legalContent'
import { parseYmd } from '@/lib/trackUtils'

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
  hint: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: t.textMuted,
  },
  audienceNote: {
    marginTop: 4,
    marginBottom: Spacing.two,
    fontSize: 12,
    lineHeight: 18,
    color: t.textMuted,
  },
  divider: {
    marginVertical: 14,
    textAlign: 'center' as const,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
  },
})

type MfaMode = 'totp' | 'recovery'

export default function SignupScreen() {
  const { setUser, loadBabiesForCurrentUser } = useApp()
  const styles = useThemedStyles(createStyles)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [location, setLocation] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [legalError, setLegalError] = useState<string | null>(null)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null)
  const [mfaMode, setMfaMode] = useState<MfaMode>('totp')
  const [mfaCode, setMfaCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const birthdateBounds = useMemo(
    () => ({
      minimumDate: parseYmd(EARLIEST_BIRTHDATE_YMD),
      maximumDate: parseYmd(latestUserBirthdateYmd()),
    }),
    [],
  )

  const finishGoogle = async (user: Awaited<ReturnType<typeof loginWithGoogle>>) => {
    setUser(user)
    await loadBabiesForCurrentUser({ force: true })
    router.replace('/profile')
  }

  const { configured: googleConfigured, ready: googleReady, prompt: promptGoogle } = useGoogleSignIn({
    disabled: loading,
    onBusyChange: setLoading,
    onError: setError,
    onIdToken: async (idToken) => {
      if (!isApiConfigured()) {
        setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
        return
      }
      setError(null)
      try {
        const user = await loginWithGoogle(idToken)
        await finishGoogle(user)
      } catch (e) {
        if (e instanceof MfaRequiredError) {
          setMfaChallengeToken(e.challengeToken)
          setError(null)
          return
        }
        if (e instanceof RequestTimeoutError) {
          setError(e.message)
        } else {
          setError(e instanceof UnauthorizedError ? e.message : 'Google sign-in failed. Please try again.')
        }
      }
    },
  })

  const submitUser = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    if (!acceptedLegal) {
      setLegalError('You must agree to the Terms of Use and Privacy Policy to continue.')
      return
    }

    const draft = normalizeUserSignup({
      username,
      password,
      email,
      phone,
      birthdate,
      fullName,
      location,
    })
    const issues = validateUserSignup(draft)
    if (issues.length) {
      setError(issues[0]?.message ?? 'Fix the form')
      return
    }

    setLoading(true)
    setError(null)
    setLegalError(null)
    let createdUserId: string | null = null
    try {
      const user = await createUser(draft)
      createdUserId = user.id
      await acceptLegalPolicies({
        acceptTerms: true,
        acceptPrivacy: true,
        policyVersion: LEGAL_POLICY_VERSION,
      })
      setUser(user)
      router.replace('/profile')
    } catch (e) {
      if (createdUserId) {
        try {
          await deleteUser(createdUserId)
        } catch {
          /* ignore rollback failure */
        }
        setUser(null)
      }
      setError(e instanceof Error ? e.message : 'Signup failed')
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
      })
      await finishGoogle(user)
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
          <Eyebrow>Get started</Eyebrow>
          <Title>Create </Title>
          <AccentTitle>account</AccentTitle>
          <Subtitle>
            {mfaStep
              ? 'Verify your sign-in.'
              : 'Create your account to start tracking. You can add a baby profile anytime.'}
          </Subtitle>
          {!mfaStep ? <Text style={styles.audienceNote}>{APP_AUDIENCE_NOTE}</Text> : null}

          <Card>
            {error ? <ErrorText>{error}</ErrorText> : null}

            {mfaStep ? (
              <>
                <Label>Verification method</Label>
                <Button
                  title={mfaMode === 'totp' ? 'Using authenticator' : 'Switch to authenticator'}
                  variant="secondary"
                  onPress={() => setMfaMode('totp')}
                />
                <Button
                  title={mfaMode === 'recovery' ? 'Using recovery code' : 'Switch to recovery code'}
                  variant="secondary"
                  onPress={() => setMfaMode('recovery')}
                />
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
                <Button
                  title="Back to sign up"
                  variant="secondary"
                  disabled={loading}
                  onPress={() => {
                    setMfaChallengeToken(null)
                    setMfaCode('')
                    setRecoveryCode('')
                    setError(null)
                  }}
                />
              </>
            ) : (
              <>
                <Label>Username</Label>
                <Input autoCapitalize="none" value={username} onChangeText={setUsername} />
                <Label>Email</Label>
                <Input
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <Label>Password</Label>
                <Input secureTextEntry value={password} onChangeText={setPassword} />
                <Label>Phone</Label>
                <Input keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                <Label>Full name</Label>
                <Input value={fullName} onChangeText={setFullName} />
                <DateTimeField
                  label="Your birthdate"
                  mode="date"
                  zone="local"
                  value={birthdate}
                  onChange={setBirthdate}
                  placeholder="Select your birthdate"
                  minimumDate={birthdateBounds.minimumDate}
                  maximumDate={birthdateBounds.maximumDate}
                />
                <Text style={styles.hint}>
                  You must be at least {MIN_USER_AGE_YEARS} years old to create an account.
                </Text>
                <Label>Location</Label>
                <Input value={location} onChangeText={setLocation} />
                <LegalAcceptance
                  value={acceptedLegal}
                  onChange={(next) => {
                    setAcceptedLegal(next)
                    if (next) setLegalError(null)
                  }}
                  disabled={loading}
                  error={legalError}
                />
                <Button title="Create account" loading={loading} onPress={() => void submitUser()} />

                {googleConfigured ? (
                  <>
                    <Text style={styles.divider}>or</Text>
                    <Button
                      title={loading ? 'Continuing…' : 'Continue with Google'}
                      loading={loading || !googleReady}
                      onPress={() => void promptGoogle()}
                    />
                  </>
                ) : null}
              </>
            )}
          </Card>

          {!mfaStep ? (
            <Link href="/login" asChild>
              <Text style={styles.link}>Already have an account?</Text>
            </Link>
          ) : null}
          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
