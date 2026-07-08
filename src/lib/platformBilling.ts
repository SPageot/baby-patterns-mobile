import { Platform } from 'react-native'

/**
 * Google Play and the App Store require native billing for digital subscriptions
 * sold inside the app. Stripe checkout in a WebView/browser is not allowed on
 * Android (and iOS) store builds.
 *
 * When false, the app may still honour Pro entitlements from the user's account
 * (e.g. subscribed on web) but must not initiate external checkout.
 */
export function supportsInAppSubscriptionPurchase(): boolean {
  return Platform.OS === 'web'
}

export function subscriptionPurchaseBlockedMessage(): string {
  if (Platform.OS === 'android') {
    return 'Pro subscriptions cannot be purchased inside the Android app yet. Sign in if you already have Pro, or subscribe on the Baby Pattern website from a browser.'
  }
  if (Platform.OS === 'ios') {
    return 'Pro subscriptions cannot be purchased inside the iOS app yet. Sign in if you already have Pro, or subscribe on the Baby Pattern website from a browser.'
  }
  return ''
}

export function subscriptionPurchaseBlockedTitle(): string {
  return 'Subscribe on the web'
}
