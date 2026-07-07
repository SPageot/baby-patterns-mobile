import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import { Link, router } from 'expo-router'

import { acceptLegalPolicies } from '@/api/authApi'
import { isApiConfigured } from '@/api/config'
import { createUser, deleteUser } from '@/api/userApi'
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
import {
  EARLIEST_BIRTHDATE_YMD,
  MIN_USER_AGE_YEARS,
  latestUserBirthdateYmd,
  normalizeUserSignup,
  validateUserSignup,
} from '@/schemas/user'
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
})

export default function SignupScreen() {
  const { setUser } = useApp()
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

  const birthdateBounds = useMemo(
    () => ({
      minimumDate: parseYmd(EARLIEST_BIRTHDATE_YMD),
      maximumDate: parseYmd(latestUserBirthdateYmd()),
    }),
    [],
  )

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

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthBrandMark />
          <Eyebrow>Get started</Eyebrow>
          <Title>Create </Title>
          <AccentTitle>account</AccentTitle>
          <Subtitle>Create your account to start tracking. You can add a baby profile anytime.</Subtitle>

          <Card>
            {error ? <ErrorText>{error}</ErrorText> : null}

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
          </Card>

          <Link href="/login" asChild>
            <Text style={styles.link}>Already have an account?</Text>
          </Link>
          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
