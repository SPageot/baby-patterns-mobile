import { useRef } from 'react'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { Image } from 'expo-image'
import { SymbolView } from 'expo-symbols'

import { HomeButton } from '@/components/home/HomeButton'
import { homeFeatures, homeStats, homeTestimonial } from '@/content/home'
import { useApp } from '@/context/AppContext'
import { HomeRadius } from '@/constants/homeTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Fonts, Spacing } from '@/constants/theme'

function FeatureIcon({
  name,
  emoji,
  styles,
  palette,
}: {
  name: (typeof homeFeatures)[number]['icon']
  emoji: string
  styles: ReturnType<typeof createStyles>
  palette: AppPalette
}) {
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.featureIcon}>
        <SymbolView name={name} tintColor={palette.accentDeep} size={20} />
      </View>
    )
  }

  return (
    <View style={styles.featureIcon}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
    </View>
  )
}

function HeroTitleLine({
  children,
  accent = false,
  styles,
}: {
  children: string
  accent?: boolean
  styles: ReturnType<typeof createStyles>
}) {
  return <Text style={[styles.heroTitleLine, accent && styles.heroTitleAccent]}>{children}</Text>
}

export function HomeSections() {
  const { user } = useApp()
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const featuresOffset = useRef(0)
  const scrollRef = useRef<ScrollView>(null)

  const scrollToFeatures = () => {
    scrollRef.current?.scrollTo({ y: featuresOffset.current, animated: true })
  }

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/hero-baby.png')}
          style={styles.heroImage}
          contentFit="cover"
          contentPosition="right center"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.heroInner}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeIcon}>
              <Text style={styles.heroBadgeEmoji}>👶</Text>
            </View>
            <Text style={styles.heroBadgeText}>Track today, treasure tomorrow</Text>
          </View>

          <HeroTitleLine styles={styles}>Every moment</HeroTitleLine>
          <HeroTitleLine styles={styles}>tracked.</HeroTitleLine>
          <HeroTitleLine styles={styles} accent>
            Every milestone
          </HeroTitleLine>
          <HeroTitleLine styles={styles} accent>
            remembered.
          </HeroTitleLine>

          <Text style={styles.heroSub}>
            The simple, beautiful way to track diaper changes, sleep, and more. All in one place.
          </Text>

          <View style={styles.heroCta}>
            {!user ? (
              <>
                <Link href="/signup" asChild>
                  <HomeButton title="Sign up – It's free" tone="onDark" style={styles.heroBtn} />
                </Link>
                <Link href="/login" asChild>
                  <HomeButton title="Log in" variant="secondary" tone="onDark" style={styles.heroBtn} />
                </Link>
              </>
            ) : null}
            <HomeButton title="Explore features" variant="ghost" tone="onDark" onPress={scrollToFeatures} style={styles.heroBtn} />
          </View>
        </View>
      </View>

      <View style={styles.sectionPad} onLayout={(e) => { featuresOffset.current = e.nativeEvent.layout.y }}>
        <View style={styles.featureGrid}>
          {homeFeatures.map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <FeatureIcon name={feature.icon} emoji={feature.emoji} styles={styles} palette={palette} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBody}>{feature.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionPad}>
        <View style={styles.valueCopy}>
          <Text style={styles.sectionTitle}>Simple to use. Powerful for parents.</Text>
          <Text style={styles.valueBody}>
            Baby Patterns helps you stay organized, reduce guesswork, and give your baby the best care every day.
          </Text>

          <View style={styles.statsGrid}>
            {homeStats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.testimonialCard}>
          <Text style={styles.stars}>★★★★★</Text>
          <Text style={styles.quote}>{homeTestimonial.quote}</Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar} />
            <View>
              <Text style={styles.authorName}>{homeTestimonial.author}</Text>
              <Text style={styles.authorMeta}>{homeTestimonial.meta}</Text>
            </View>
          </View>
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>

      {!user ? (
        <View style={styles.sectionPad}>
          <View style={styles.footerCta}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerTitle}>Start tracking today</Text>
              <Text style={styles.footerBody}>
                Join thousands of parents who trust Baby Patterns every day.
              </Text>
            </View>
            <View style={styles.footerActions}>
              <Link href="/signup" asChild>
                <HomeButton title="Sign up" style={styles.footerBtn} />
              </Link>
              <Link href="/login" asChild>
                <HomeButton title="Log in" variant="secondary" style={styles.footerBtn} />
              </Link>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  )
}

const serif = Fonts.serif ?? 'serif'

const createStyles = (t: AppPalette) => ({
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  hero: {
    position: 'relative' as const,
    minHeight: 420,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    overflow: 'hidden' as const,
    justifyContent: 'flex-end' as const,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroInner: {
    position: 'relative' as const,
    zIndex: 1,
    paddingHorizontal: Spacing.three,
  },
  heroBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 10,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.heroBadgeBorder,
    backgroundColor: t.heroBadgeBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: Spacing.three,
  },
  heroBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.heroBadgeIconBg,
  },
  heroBadgeEmoji: {
    fontSize: 12,
  },
  heroBadgeText: {
    color: t.heroBadgeText,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  heroTitleLine: {
    fontFamily: serif,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: t.heroTitle,
    fontWeight: '600' as const,
  },
  heroTitleAccent: {
    color: t.heroTitleAccent,
  },
  heroSub: {
    marginTop: Spacing.two,
    fontSize: 15,
    lineHeight: 24,
    color: t.heroSub,
    maxWidth: 520,
  },
  heroCta: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: Spacing.three,
  },
  heroBtn: {
    flexGrow: 1,
    minWidth: 140,
  },
  sectionPad: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  featureGrid: {
    gap: 10,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.xl,
    backgroundColor: t.cardTranslucent,
    padding: 12,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: 18,
    backgroundColor: t.card2,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.accentLavender,
    backgroundColor: t.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: t.text,
    marginBottom: 3,
  },
  featureBody: {
    fontSize: 12.5,
    lineHeight: 18,
    color: t.textMuted,
  },
  valueCopy: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.xl,
    backgroundColor: t.cardTranslucent,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: t.text,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  valueBody: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    minWidth: 96,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: 18,
    backgroundColor: t.card2,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900' as const,
    letterSpacing: -0.3,
    color: t.accentDeep,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  testimonialCard: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.xl,
    backgroundColor: t.cardTranslucent,
    padding: 22,
  },
  stars: {
    color: t.accentDeep,
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: '900' as const,
    marginBottom: 10,
  },
  quote: {
    fontSize: 14.5,
    lineHeight: 24,
    color: t.text,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.accentSoft,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: t.text,
  },
  authorMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  dots: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: HomeRadius.pill,
    backgroundColor: t.stroke,
  },
  dotActive: {
    backgroundColor: t.accentDeep,
  },
  footerCta: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.xl,
    backgroundColor: t.cardTranslucent,
    padding: 22,
    gap: 16,
  },
  footerCopy: {
    gap: 4,
  },
  footerTitle: {
    fontFamily: serif,
    fontSize: 22,
    letterSpacing: -0.3,
    color: t.text,
    fontWeight: '600' as const,
  },
  footerBody: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
  },
  footerActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  footerBtn: {
    flexGrow: 1,
    minWidth: 120,
  },
})
