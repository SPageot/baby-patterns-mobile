/** Canonical production site — used for app store listings and in-app legal links. */
export const PUBLIC_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || 'https://baby-pattern.com'

export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || `${PUBLIC_SITE_URL}/privacy`

export const TERMS_OF_SERVICE_URL =
  process.env.EXPO_PUBLIC_TERMS_URL?.trim() || `${PUBLIC_SITE_URL}/terms`
