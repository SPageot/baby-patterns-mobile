import AsyncStorage from '@react-native-async-storage/async-storage'

export type OnboardingStatus = 'skipped' | 'completed' | 'started'

function normalizeUserId(userId: string): string {
  return userId.trim().toLowerCase()
}

export function onboardingStorageKey(userId: string): string {
  return `baby-patterns-onboarding:${normalizeUserId(userId)}`
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
  const id = normalizeUserId(userId)
  if (!id) return null
  try {
    const key = onboardingStorageKey(id)
    let raw = await AsyncStorage.getItem(key)
    if (!raw) {
      const trimmed = userId.trim()
      const legacyKey = `baby-patterns-onboarding:${trimmed}`
      if (legacyKey !== key) {
        raw = await AsyncStorage.getItem(legacyKey)
        if (raw === 'skipped' || raw === 'completed' || raw === 'started') {
          await AsyncStorage.setItem(key, raw)
          await AsyncStorage.removeItem(legacyKey)
        } else {
          raw = null
        }
      }
    }
    if (raw === 'skipped' || raw === 'completed' || raw === 'started') return raw
  } catch {
    /* ignore */
  }
  return null
}

export async function setOnboardingStatus(userId: string, status: OnboardingStatus): Promise<void> {
  const id = normalizeUserId(userId)
  if (!id) return
  try {
    await AsyncStorage.setItem(onboardingStorageKey(id), status)
  } catch {
    /* ignore */
  }
}

/** True once the user has been offered the tour (started, skipped, or finished). */
export async function hasBeenAskedOnboarding(userId: string): Promise<boolean> {
  return (await getOnboardingStatus(userId)) != null
}
