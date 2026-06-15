import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import { Link, router } from 'expo-router'

import { acceptLegalPolicies } from '@/api/authApi'
import { createBaby } from '@/api/babyApi'
import { isApiConfigured } from '@/api/config'
import { createUser, deleteUser } from '@/api/userApi'
import { LegalAcceptance } from '@/components/legal/LegalAcceptance'
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
import { useApp } from '@/context/AppContext'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import {
  normalizeBabySignup,
  normalizeUserSignup,
  validateBabySignup,
  validateUserSignupStep1,
  validateUserSignupStep2,
  type BabySignup,
  type UserSignup,
} from '@/schemas/user'
import { LEGAL_POLICY_VERSION } from '@/lib/legalContent'

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
})

export default function SignupScreen() {
  const { setUser, selectBaby } = useApp()
  const styles = useThemedStyles(createStyles)
  const [step, setStep] = useState<'user' | 'baby'>('user')
  const [userDraft, setUserDraft] = useState<UserSignup | null>(null)
  const [userId, setUserId] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [location, setLocation] = useState('')

  const [babyName, setBabyName] = useState('')
  const [babyBirthdate, setBabyBirthdate] = useState('')
  const [locationBorn, setLocationBorn] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [legalError, setLegalError] = useState<string | null>(null)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [loading, setLoading] = useState(false)

  const submitUser = async () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
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
    const issues = [...validateUserSignupStep1(draft), ...validateUserSignupStep2(draft)]
    if (issues.length) {
      setError(issues[0]?.message ?? 'Fix the form')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const user = await createUser(draft)
      setUserDraft(draft)
      setUserId(user.id)
      setUser(user)
      setStep('baby')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const submitBaby = async () => {
    if (!userId) return

    if (!acceptedLegal) {
      setLegalError('You must agree to the Terms of Use and Privacy Policy to continue.')
      return
    }

    const baby: BabySignup = normalizeBabySignup({
      userId,
      fullName: babyName,
      age: null,
      birthdate: babyBirthdate,
      locationBorn,
      currentLocation,
      weight: null,
      height: null,
    })
    const issues = validateBabySignup(baby)
    if (issues.length) {
      setError(issues[0]?.message ?? 'Fix baby details')
      return
    }

    setLoading(true)
    setError(null)
    setLegalError(null)
    try {
      await acceptLegalPolicies({
        acceptTerms: true,
        acceptPrivacy: true,
        policyVersion: LEGAL_POLICY_VERSION,
      })
      const created = await createBaby(baby)
      if (created.id) selectBaby(created)
      router.replace('/')
    } catch (e) {
      if (userId) {
        try {
          await deleteUser(userId)
        } catch {
          /* ignore rollback failure */
        }
      }
      setError(e instanceof Error ? e.message : 'Could not add baby')
      setStep('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Eyebrow>{step === 'user' ? 'Get started' : 'Baby profile'}</Eyebrow>
          {step === 'user' ? (
            <>
              <Title>Create </Title>
              <AccentTitle>account</AccentTitle>
            </>
          ) : (
            <Title>Add your baby</Title>
          )}
          <Subtitle>
            {step === 'user'
              ? 'Parent account first, then your baby profile.'
              : `Almost done${userDraft?.fullName ? `, ${userDraft.fullName.split(' ')[0]}` : ''}.`}
          </Subtitle>

          <Card>
            {error ? <ErrorText>{error}</ErrorText> : null}

            {step === 'user' ? (
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
                <Label>Birthdate (YYYY-MM-DD)</Label>
                <Input placeholder="2000-01-15" value={birthdate} onChangeText={setBirthdate} />
                <Label>Location</Label>
                <Input value={location} onChangeText={setLocation} />
                <Button title="Continue" loading={loading} onPress={() => void submitUser()} />
              </>
            ) : (
              <>
                <Label>Baby full name</Label>
                <Input value={babyName} onChangeText={setBabyName} />
                <Label>Birthdate (YYYY-MM-DD)</Label>
                <Input placeholder="2024-06-01" value={babyBirthdate} onChangeText={setBabyBirthdate} />
                <Label>Location born</Label>
                <Input value={locationBorn} onChangeText={setLocationBorn} />
                <Label>Current location</Label>
                <Input value={currentLocation} onChangeText={setCurrentLocation} />
                <LegalAcceptance
                  value={acceptedLegal}
                  onChange={(next) => {
                    setAcceptedLegal(next)
                    if (next) setLegalError(null)
                  }}
                  disabled={loading}
                  error={legalError}
                />
                <Button title="Finish sign up" loading={loading} onPress={() => void submitBaby()} />
              </>
            )}
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

