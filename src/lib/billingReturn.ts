import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Linking from 'expo-linking'

import { bootstrapAuthSession } from '@/api/authTokens'
import { syncBillingSubscription } from '@/api/billingApi'
import { fetchCurrentUser } from '@/api/userApi'
import { getAccessToken, hydrateAuthSession } from '@/lib/authSession'
import type { User } from '@/schemas/user'

const CHECKOUT_PENDING_KEY = 'baby_patterns.billingCheckoutPending'
const WELCOME_PENDING_KEY = 'baby_patterns.billingWelcomePending'

export async function markBillingCheckoutStarted(): Promise<void> {
  await AsyncStorage.setItem(CHECKOUT_PENDING_KEY, '1')
}

export async function clearBillingCheckoutPending(): Promise<void> {
  await AsyncStorage.removeItem(CHECKOUT_PENDING_KEY)
}

function billingParamFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url)
    const raw = parsed.queryParams?.billing
    if (typeof raw === 'string') return raw
    if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  } catch {
    /* ignore malformed URLs */
  }
  return null
}

export function hasBillingSuccessUrl(url: string): boolean {
  return billingParamFromUrl(url) === 'success'
}

/** Restore session after Stripe, sync Pro status, and refresh profile. */
export async function completeBillingReturn(
  setUser: (user: User | null) => void,
  options?: { fromUrl?: string },
): Promise<boolean> {
  const urlSuccess = options?.fromUrl ? hasBillingSuccessUrl(options.fromUrl) : false
  const checkoutPending = (await AsyncStorage.getItem(CHECKOUT_PENDING_KEY)) === '1'

  if (!urlSuccess && !checkoutPending) return false

  if (!getAccessToken()) {
    await hydrateAuthSession()
    const restored = getAccessToken() ? true : await bootstrapAuthSession()
    if (!restored) {
      await clearBillingCheckoutPending()
      return false
    }
  }

  try {
    await syncBillingSubscription()
    const profile = await fetchCurrentUser()
    setUser(profile)
    await clearBillingCheckoutPending()
    if (profile.isPro) {
      await AsyncStorage.setItem(WELCOME_PENDING_KEY, '1')
    }
    return profile.isPro === true
  } catch {
    return false
  }
}

export async function consumeBillingWelcome(): Promise<boolean> {
  const pending = await AsyncStorage.getItem(WELCOME_PENDING_KEY)
  if (pending !== '1') return false
  await AsyncStorage.removeItem(WELCOME_PENDING_KEY)
  return true
}
