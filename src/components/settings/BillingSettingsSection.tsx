import { useEffect, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import {
  cancelBillingSubscription,
  fetchBillingStatus,
  type BillingStatus,
} from '@/api/billingApi'
import { fetchCurrentUser } from '@/api/userApi'
import { isApiConfigured } from '@/api/config'
import { Button, ErrorText, SectionTitle, Subtitle } from '@/components/ui/primitives'
import { isPaidProUser, isProUser, isSiteDeveloper } from '@/lib/subscription'
import {
  subscriptionPurchaseBlockedMessage,
  subscriptionPurchaseBlockedTitle,
  supportsInAppSubscriptionPurchase,
} from '@/lib/platformBilling'
import { useConfirmAction } from '@/context/ConfirmContext'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import type { User } from '@/schemas/user'

type Props = {
  user: User
  onUserUpdated: (user: User) => void
}

function formatPeriodEnd(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const createStyles = (t: AppPalette) => ({
  success: {
    color: t.accentDeep,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  actions: {
    marginTop: Spacing.two,
  },
})

export function BillingSettingsSection({ user, onUserUpdated }: Props) {
  const confirm = useConfirmAction()
  const router = useRouter()
  const styles = useThemedStyles(createStyles)
  const [downgradeLoading, setDowngradeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const hasProAccess = isProUser(user)
  const isPaidPro = isPaidProUser(user)
  const isSiteDev = isSiteDeveloper(user)
  const periodEndLabel = formatPeriodEnd(
    billingStatus?.proCurrentPeriodEnd ?? user.proCurrentPeriodEnd,
  )
  const cancelScheduled = Boolean(billingStatus?.cancelAtPeriodEnd)
  const canPurchaseInApp = supportsInAppSubscriptionPurchase()

  useEffect(() => {
    if (!isPaidPro || !isApiConfigured()) {
      setBillingStatus(null)
      return
    }

    let cancelled = false
    void fetchBillingStatus()
      .then((status) => {
        if (!cancelled) setBillingStatus(status)
      })
      .catch(() => {
        if (!cancelled) setBillingStatus(null)
      })

    return () => {
      cancelled = true
    }
  }, [isPaidPro, user.id, user.subscriptionStatus, user.proCurrentPeriodEnd])

  const onDowngrade = () => {
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to manage billing.')
      return
    }

    const message = periodEndLabel
      ? `You will keep Pro until ${periodEndLabel}, then Stripe will stop charging you.`
      : 'Your Pro access will continue until the end of the current billing period, then Stripe will stop charging you.'

    confirm({
      title: 'Downgrade to Free?',
      message,
      confirmLabel: 'Downgrade',
      destructive: false,
      onConfirm: () => runDowngrade(),
    })
  }

  const runDowngrade = async () => {
    setDowngradeLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const status = await cancelBillingSubscription()
      setBillingStatus(status)
      const profile = await fetchCurrentUser()
      onUserUpdated(profile)
      const endLabel = formatPeriodEnd(status.proCurrentPeriodEnd)
      setSuccess(
        endLabel
          ? `Your subscription will end on ${endLabel}. You will not be charged again.`
          : 'Your subscription will not renew. Stripe payments have been stopped.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not downgrade subscription')
    } finally {
      setDowngradeLoading(false)
    }
  }

  return (
    <View>
      <SectionTitle>Subscription</SectionTitle>
      <Subtitle>
        {isSiteDev
          ? 'You are a site developer with complimentary Pro access.'
          : isPaidPro
          ? cancelScheduled
            ? periodEndLabel
              ? `Your Pro plan is active until ${periodEndLabel}, then you will return to the Free plan.`
              : 'Your Pro plan will end at the close of this billing period.'
            : 'You have Baby Pattern Pro. Downgrade to stop future charges.'
          : hasProAccess
            ? 'You have Pro access on this account.'
            : 'You are on the Free plan.'}
      </Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.actions}>
        {isSiteDev ? null : isPaidPro ? (
          !cancelScheduled ? (
            <Button
              title={downgradeLoading ? 'Processing…' : 'Downgrade to Free'}
              variant="ghost"
              disabled={downgradeLoading}
              onPress={onDowngrade}
            />
          ) : null
        ) : (
          canPurchaseInApp ? (
            <Button title="Upgrade to Pro" onPress={() => router.push('/pricing')} />
          ) : (
            <Button
              title="How to get Pro"
              variant="ghost"
              onPress={() =>
                Alert.alert(subscriptionPurchaseBlockedTitle(), subscriptionPurchaseBlockedMessage())
              }
            />
          )
        )}
      </View>
    </View>
  )
}
