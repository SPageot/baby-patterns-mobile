import { useEffect, useRef } from 'react'
import type { AuthSessionResult } from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

export function getGoogleMobileClientIds() {
  return {
    webClientId: (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '').trim(),
    iosClientId: (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '').trim(),
    androidClientId: (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '').trim(),
  }
}

export function isGoogleSignInConfigured(): boolean {
  const { webClientId, iosClientId, androidClientId } = getGoogleMobileClientIds()
  return Boolean(webClientId || iosClientId || androidClientId)
}

export function idTokenFromAuthResponse(response: AuthSessionResult | null | undefined): string | null {
  if (!response || response.type !== 'success') return null
  const params = response.params as { id_token?: string }
  const authentication = 'authentication' in response ? response.authentication : null
  const fromAuth =
    authentication && typeof authentication === 'object' && 'idToken' in authentication
      ? String((authentication as { idToken?: string | null }).idToken ?? '').trim()
      : ''
  return params.id_token?.trim() || fromAuth || null
}

type GoogleSignInOptions = {
  disabled?: boolean
  onIdToken: (idToken: string) => void | Promise<void>
  onError: (message: string) => void
  onBusyChange?: (busy: boolean) => void
}

/** Hook: Google ID-token request + prompt helper for login/signup screens. */
export function useGoogleSignIn({ disabled, onIdToken, onError, onBusyChange }: GoogleSignInOptions) {
  const configured = isGoogleSignInConfigured()
  const { webClientId, iosClientId, androidClientId } = getGoogleMobileClientIds()
  const handledRef = useRef<string | null>(null)
  const onIdTokenRef = useRef(onIdToken)
  const onErrorRef = useRef(onError)
  onIdTokenRef.current = onIdToken
  onErrorRef.current = onError

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    configured
      ? {
          clientId: webClientId || undefined,
          webClientId: webClientId || undefined,
          iosClientId: iosClientId || undefined,
          androidClientId: androidClientId || undefined,
          selectAccount: true,
        }
      : {
          clientId: 'disabled.apps.googleusercontent.com',
        },
  )

  useEffect(() => {
    if (!configured || !response) return

    if (response.type === 'error') {
      onErrorRef.current(response.error?.message ?? 'Google sign-in failed. Please try again.')
      return
    }
    if (response.type === 'dismiss' || response.type === 'cancel') {
      return
    }

    const idToken = idTokenFromAuthResponse(response)
    if (!idToken) {
      if (response.type === 'success') {
        onErrorRef.current('Google sign-in did not return an ID token.')
      }
      return
    }

    // Avoid double-handling the same success response.
    const key = idToken.slice(0, 24)
    if (handledRef.current === key) return
    handledRef.current = key

    void (async () => {
      onBusyChange?.(true)
      try {
        await onIdTokenRef.current(idToken)
      } catch (e) {
        onErrorRef.current(
          e instanceof Error && e.message.trim()
            ? e.message
            : 'Google sign-in failed. Please try again.',
        )
      } finally {
        onBusyChange?.(false)
      }
    })()
  }, [configured, response, onBusyChange])

  const prompt = async () => {
    if (!configured) {
      onErrorRef.current('Google sign-in is not configured.')
      return
    }
    if (disabled || !request) return
    handledRef.current = null
    try {
      const result = await promptAsync()
      if (result.type === 'dismiss' || result.type === 'cancel') return
      if (result.type === 'error') {
        onErrorRef.current(result.error?.message ?? 'Google sign-in failed. Please try again.')
      }
    } catch (e) {
      onErrorRef.current(
        e instanceof Error && e.message.trim() ? e.message : 'Google sign-in failed. Please try again.',
      )
    }
  }

  return {
    configured,
    ready: configured && Boolean(request),
    prompt,
  }
}
