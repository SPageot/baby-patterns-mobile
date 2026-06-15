import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native'
import { Link, router } from 'expo-router'

import { UnauthorizedError } from '@/api/client'
import { isApiConfigured } from '@/api/config'
import { loginUser } from '@/api/userApi'
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
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { normalizeLoginCredentials, validateLogin } from '@/schemas/user'

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

export default function LoginScreen() {
  const { setUser, loadBabiesForCurrentUser } = useApp()
  const styles = useThemedStyles(createStyles)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      setUser(user)
      await loadBabiesForCurrentUser()
      router.replace('/')
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        setError(e.message)
      } else {
        setError(e instanceof Error ? e.message : 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Eyebrow>Welcome back</Eyebrow>
          <Title>Baby </Title>
          <AccentTitle>Patterns</AccentTitle>
          <Subtitle>Sign in to continue tracking.</Subtitle>

          <Card>
            {error ? <ErrorText>{error}</ErrorText> : null}

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
          </Card>

          <Link href="/signup" asChild>
            <Text style={styles.link}>Create an account</Text>
          </Link>
          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

