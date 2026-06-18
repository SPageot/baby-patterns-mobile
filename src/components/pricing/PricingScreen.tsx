import { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { NavIcon } from '@/components/icons/NavIcon'
import { Button } from '@/components/ui/primitives'
import { createCheckoutSession } from '@/api/billingApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { markBillingCheckoutStarted } from '@/lib/billingReturn'
import { isProUser } from '@/lib/subscription'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type PlanFeature = {
  text: string
  highlight?: boolean
}

type PricingPlan = {
  id: 'free' | 'pro'
  name: string
  description: string
  icon: 'heart' | 'chart'
  features: PlanFeature[]
  featured?: boolean
}

const PRO_FEATURES: PlanFeature[] = [
  { text: 'Everything in Free', highlight: true },
  { text: 'Family sharing' },
  { text: 'Unlimited history' },
  { text: 'Reports for pediatrician' },
  { text: 'Weekly summaries' },
  { text: 'No ads' },
]

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Everything you need to log daily care and celebrate milestones.',
    icon: 'heart',
    features: [
      { text: 'Sleep tracking' },
      { text: 'Feeding tracking' },
      { text: 'Diaper tracking' },
      { text: 'Growth tracking' },
      { text: 'Parents Corner (Social Feed)' },
      { text: 'Product reviews' },
      { text: 'Milestones' },
      { text: '7-day report history' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Share with family, keep full history, and export reports for your pediatrician.',
    icon: 'chart',
    featured: true,
    features: PRO_FEATURES,
  },
]

type ProBilling = 'monthly' | 'annual'

const PRO_PRICING: Record<ProBilling, { price: string; priceNote: string; savings?: string }> = {
  monthly: { price: '$4.99', priceNote: 'per month' },
  annual: {
    price: '$49.99',
    priceNote: 'per year',
    savings: 'Save about 17% vs monthly',
  },
}

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  hero: {
    marginBottom: Spacing.three,
    alignItems: 'center' as const,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: t.accentDeep,
  },
  title: {
    ...heading(28, { weight: '700', lineHeight: 36 }),
    color: t.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  titleAccent: {
    color: t.accentDeep,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
    marginBottom: Spacing.three,
  },
  grid: {
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  cardFeatured: {
    borderColor: t.accentLavender,
    backgroundColor: t.card,
  },
  ribbon: {
    alignSelf: 'flex-start' as const,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: t.accentDeep,
    backgroundColor: t.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: HomeRadius.pill,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  currentBadge: {
    alignSelf: 'flex-start' as const,
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
    marginBottom: 12,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    marginBottom: 12,
  },
  planName: {
    ...heading(22, { weight: '800' }),
    color: t.text,
    marginBottom: 12,
  },
  billingRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  billingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    alignItems: 'center' as const,
  },
  billingBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  billingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  billingTextActive: {
    color: t.accentDeep,
    fontWeight: '800' as const,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 8,
    marginBottom: 8,
  },
  price: {
    ...heading(32, { weight: '800' }),
    color: t.text,
  },
  priceNote: {
    fontSize: 14,
    color: t.textMuted,
  },
  savings: {
    fontSize: 13,
    color: t.accentDeep,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  feature: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 8,
  },
  featureHighlight: {
    backgroundColor: t.accentSoft,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  check: {
    fontSize: 14,
    color: t.accentDeep,
    fontWeight: '800' as const,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: t.text,
    lineHeight: 20,
  },
  cta: {
    marginTop: Spacing.two,
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 20,
    color: t.textMuted,
    textAlign: 'center' as const,
    marginTop: Spacing.three,
  },
})

function PlanFeatureList({
  features,
  styles,
}: {
  features: PlanFeature[]
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View>
      {features.map((feature) => (
        <View
          key={feature.text}
          style={[styles.feature, feature.highlight && styles.featureHighlight]}
        >
          <Text style={styles.check}>✓</Text>
          <Text style={styles.featureText}>{feature.text}</Text>
        </View>
      ))}
    </View>
  )
}

export function PricingScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const { user } = useApp()
  const loggedIn = Boolean(user?.id)
  const userIsPro = isProUser(user)
  const [proBilling, setProBilling] = useState<ProBilling>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const proPrice = PRO_PRICING[proBilling]

  useEffect(() => {
    if (userIsPro) router.replace('/profile')
  }, [router, userIsPro])

  const onProAction = async () => {
    if (!loggedIn) {
      router.push('/signup')
      return
    }
    if (userIsPro) return

    if (!isApiConfigured()) {
      Alert.alert('API not configured', 'Set EXPO_PUBLIC_API_URL in .env to subscribe.')
      return
    }

    setCheckoutLoading(true)
    try {
      const url = await createCheckoutSession(proBilling)
      await markBillingCheckoutStarted()
      await Linking.openURL(url)
    } catch (err) {
      Alert.alert('Checkout failed', err instanceof Error ? err.message : 'Could not start checkout')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <NavIcon name="star" size={16} color={palette.accentDeep} />
          <Text style={styles.badgeText}>Simple pricing</Text>
        </View>
        <Text style={styles.title}>
          Start free.{'\n'}
          <Text style={styles.titleAccent}>Go Pro when your family needs more.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Track sleep, feeding, diapers, growth, and milestones at no cost. Upgrade to Pro for family sharing,
          unlimited history, pediatrician-ready reports, weekly summaries, and an ad-free experience.
        </Text>
      </View>

      <View style={styles.grid}>
        {PLANS.map((plan) => {
          const isFree = plan.id === 'free'
          const isPro = plan.id === 'pro'
          const isCurrent = (isFree && loggedIn && !userIsPro) || (isPro && userIsPro)

          return (
            <View
              key={plan.id}
              style={[styles.card, plan.featured && styles.cardFeatured]}
            >
              {isPro && proBilling === 'annual' ? (
                <Text style={styles.ribbon}>Best value</Text>
              ) : null}
              {isPro && proBilling === 'monthly' ? (
                <Text style={styles.ribbon}>Most popular</Text>
              ) : null}
              {isCurrent ? <Text style={styles.currentBadge}>Your current plan</Text> : null}

              <View style={styles.planIcon}>
                <NavIcon name={plan.icon} size={22} color={palette.accentDeep} />
              </View>

              <Text style={styles.planName}>{plan.name}</Text>

              {isPro ? (
                <>
                  <View style={styles.billingRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: proBilling === 'monthly' }}
                      onPress={() => setProBilling('monthly')}
                      style={[styles.billingBtn, proBilling === 'monthly' && styles.billingBtnActive]}
                    >
                      <Text style={[styles.billingText, proBilling === 'monthly' && styles.billingTextActive]}>
                        Monthly
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: proBilling === 'annual' }}
                      onPress={() => setProBilling('annual')}
                      style={[styles.billingBtn, proBilling === 'annual' && styles.billingBtnActive]}
                    >
                      <Text style={[styles.billingText, proBilling === 'annual' && styles.billingTextActive]}>
                        Annual
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{proPrice.price}</Text>
                    <Text style={styles.priceNote}>{proPrice.priceNote}</Text>
                  </View>

                  {proPrice.savings ? <Text style={styles.savings}>{proPrice.savings}</Text> : null}
                </>
              ) : (
                <View style={styles.priceRow}>
                  <Text style={styles.price}>$0</Text>
                  <Text style={styles.priceNote}>forever</Text>
                </View>
              )}

              <Text style={styles.description}>{plan.description}</Text>

              <PlanFeatureList features={plan.features} styles={styles} />

              {isFree ? (
                loggedIn ? (
                  <Button title="Current plan" variant="secondary" disabled style={styles.cta} />
                ) : (
                  <Button
                    title="Get started free"
                    variant="ghost"
                    style={styles.cta}
                    onPress={() => router.push('/signup')}
                  />
                )
              ) : loggedIn ? (
                <Button
                  title={
                    userIsPro
                      ? 'Current plan'
                      : checkoutLoading
                        ? 'Redirecting…'
                        : proBilling === 'annual'
                          ? 'Upgrade to Pro Annual'
                          : 'Upgrade to Pro Monthly'
                  }
                  onPress={() => void onProAction()}
                  disabled={userIsPro || checkoutLoading}
                  style={styles.cta}
                />
              ) : (
                <Button title="Sign up to upgrade" style={styles.cta} onPress={() => router.push('/signup')} />
              )}
            </View>
          )
        })}
      </View>

      <Text style={styles.disclaimer}>
        Pro is $4.99/month or $49.99/year. Checkout is powered by Stripe. Free features work today at no cost.
      </Text>
    </ScrollView>
  )
}
