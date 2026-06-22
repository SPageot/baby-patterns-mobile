import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const STORAGE_KEY = 'baby_patterns.auth.v1'

export type AuthSession = {
  accessToken: string
  refreshToken: string
  userId?: string
}

let memorySession: AuthSession | null = null
let hydrated = false

async function readStoredSession(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(STORAGE_KEY)
  }
  return SecureStore.getItemAsync(STORAGE_KEY)
}

async function writeStoredSession(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(STORAGE_KEY, value)
    return
  }
  await SecureStore.setItemAsync(STORAGE_KEY, value)
}

async function removeStoredSession(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(STORAGE_KEY)
    return
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY)
}

export async function hydrateAuthSession(): Promise<AuthSession | null> {
  if (hydrated) return memorySession
  hydrated = true

  try {
    const raw = await readStoredSession()
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    const accessToken = parsed.accessToken?.trim()
    const refreshToken = parsed.refreshToken?.trim()
    if (!accessToken || !refreshToken) return null
    memorySession = {
      accessToken,
      refreshToken,
      userId: parsed.userId?.trim() || undefined,
    }
    return memorySession
  } catch {
    return null
  }
}

export function getAuthSession(): AuthSession | null {
  return memorySession
}

export async function setAuthSession(session: AuthSession): Promise<void> {
  const accessToken = session.accessToken.trim()
  const refreshToken = session.refreshToken.trim()
  if (!accessToken || !refreshToken) return
  memorySession = {
    accessToken,
    refreshToken,
    ...(session.userId?.trim() ? { userId: session.userId.trim() } : {}),
  }
  hydrated = true
  await writeStoredSession(JSON.stringify(memorySession))
}

export async function clearAuthSession(): Promise<void> {
  memorySession = null
  hydrated = true
  try {
    await removeStoredSession()
  } catch {
    /* ignore */
  }
}

export function getAccessToken(): string | null {
  return memorySession?.accessToken ?? null
}

export function getRefreshToken(): string | null {
  return memorySession?.refreshToken ?? null
}

export function getSessionUserId(): string | null {
  return memorySession?.userId ?? null
}
