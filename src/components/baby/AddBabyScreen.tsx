import { useCallback, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { createBaby } from '@/api/babyApi'
import { RequestTimeoutError } from '@/api/client'
import { isApiConfigured } from '@/api/config'
import { HomeButton } from '@/components/home/HomeButton'
import {
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
import {
  normalizeBabySignup,
  validateBabySignup,
  type BabySignup,
  type ValidationIssue,
} from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'

const REQUEST_TIMEOUT_MS = 20_000

function errorMessage(e: unknown): string {
  if (e instanceof RequestTimeoutError) {
    return 'Saving your baby is taking too long. Please try again.'
  }
  return e instanceof Error ? e.message : 'Something went wrong'
}

const createStyles = (t: AppPalette) => ({
  flex: {
    flex: 1,
  },
  gate: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    gap: 12,
  },
  gateTitle: {
    ...heading(24, { weight: '700' }),
    color: t.text,
  },
  gateText: {
    fontSize: 15,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
})

export function AddBabyScreen() {
  const router = useRouter()
  const { user, authReady, selectBaby, loadBabiesForCurrentUser } = useApp()
  const styles = useThemedStyles(createStyles)

  const [babyName, setBabyName] = useState('')
  const [babyBirthdate, setBabyBirthdate] = useState('')
  const [locationBorn, setLocationBorn] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ValidationIssue[]>([])
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)

  const resetForm = useCallback(() => {
    setBabyName('')
    setBabyBirthdate('')
    setLocationBorn('')
    setCurrentLocation('')
    setError(null)
    setFieldErrors([])
  }, [])

  const onSubmit = useCallback(
    async (raw: Omit<BabySignup, 'userId'>) => {
      const userId = user?.id?.trim()
      if (!userId || inFlight.current) return

      const data = normalizeBabySignup({ ...raw, userId })
      const issues = validateBabySignup(data)
      if (issues.length) {
        setFieldErrors(issues)
        setError('Please fix the highlighted fields.')
        return
      }
      if (!isApiConfigured()) {
        setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
        return
      }

      inFlight.current = true
      setSubmitting(true)
      setError(null)
      setFieldErrors([])

      try {
        const baby = await createBaby(data, { timeoutMs: REQUEST_TIMEOUT_MS })
        if (!baby.id?.trim()) {
          throw new Error('Baby was created but the server did not return a baby id.')
        }
        const list = await loadBabiesForCurrentUser()
        const saved =
          list.find((b) => b.id === baby.id) ??
          list.find(
            (b) =>
              b.fullName?.trim().toLowerCase() === baby.fullName.trim().toLowerCase() &&
              b.birthdate === baby.birthdate,
          ) ??
          baby
        selectBaby(saved)
        resetForm()
        router.replace('/profile')
      } catch (e) {
        setError(errorMessage(e))
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    },
    [user?.id, selectBaby, resetForm, loadBabiesForCurrentUser, router],
  )

  const submit = () => {
    void onSubmit({
      fullName: babyName,
      age: null,
      birthdate: babyBirthdate,
      locationBorn,
      currentLocation,
      weight: null,
      height: null,
    })
  }

  if (!authReady) {
    return (
      <Screen>
        <Subtitle>Loading…</Subtitle>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>Add a baby</Text>
          <Text style={styles.gateText}>Log in to add a baby profile.</Text>
          <HomeButton title="Log in" onPress={() => router.push('/login')} />
        </View>
      </Screen>
    )
  }

  const firstFieldError = fieldErrors[0]?.message

  return (
    <Screen style={{ paddingTop: 0 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Eyebrow>Family</Eyebrow>
          <Title>Add a baby</Title>
          <Subtitle>Tell us about your little one.</Subtitle>

          <Card>
            {error || firstFieldError ? <ErrorText>{error ?? firstFieldError}</ErrorText> : null}

            <Label>Baby full name</Label>
            <Input value={babyName} onChangeText={setBabyName} editable={!submitting} />

            <Label>Birthdate (YYYY-MM-DD)</Label>
            <Input placeholder="2024-06-01" value={babyBirthdate} onChangeText={setBabyBirthdate} editable={!submitting} />

            <Label>Location born</Label>
            <Input value={locationBorn} onChangeText={setLocationBorn} editable={!submitting} />

            <Label>Current location</Label>
            <Input value={currentLocation} onChangeText={setCurrentLocation} editable={!submitting} />

            <Button title={submitting ? 'Saving…' : 'Add baby'} loading={submitting} onPress={submit} />
            <Button title="Cancel" variant="secondary" disabled={submitting} onPress={() => router.back()} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
