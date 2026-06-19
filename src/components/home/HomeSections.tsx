import { useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Image } from 'expo-image'

import { HomeButton } from '@/components/home/HomeButton'
import {
  HOME_HERO,
  homeAbout,
  homeFooterCta,
  homeHighlights,
  homePlanRows,
  homeSitePages,
} from '@/content/home'
import { useApp } from '@/context/AppContext'
import { isProUser } from '@/lib/subscription'
import { HomeRadius } from '@/constants/homeTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { heading } from '@/constants/typography'
import { Spacing } from '@/constants/theme'

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
  const isPro = isProUser(user)
  const router = useRouter()
  const styles = useThemedStyles(createStyles)
  const contentOffset = useRef(0)
  const scrollRef = useRef<ScrollView>(null)

  const scrollToContent = () => {
    scrollRef.current?.scrollTo({ y: contentOffset.current, animated: true })
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
            <Text style={styles.heroBadgeText}>{HOME_HERO.badge}</Text>
          </View>

          <HeroTitleLine styles={styles}>Every moment</HeroTitleLine>
          <HeroTitleLine styles={styles}>tracked.</HeroTitleLine>
          <HeroTitleLine styles={styles} accent>
            Every milestone
          </HeroTitleLine>
          <HeroTitleLine styles={styles} accent>
            remembered.
          </HeroTitleLine>

          <Text style={styles.heroSub}>{HOME_HERO.sub}</Text>

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
            {!isPro ? (
              <Link href="/pricing" asChild>
                <HomeButton title="View pricing" variant="ghost" tone="onDark" style={styles.heroBtn} />
              </Link>
            ) : null}
            <HomeButton
              title="Explore the app"
              variant="ghost"
              tone="onDark"
              onPress={scrollToContent}
              style={styles.heroBtn}
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionPad} onLayout={(e) => { contentOffset.current = e.nativeEvent.layout.y }}>
        <Text style={styles.sectionTitle}>What you can track</Text>
        <Text style={styles.sectionSub}>
          Log daily care and health, then use Reports to see patterns across everything you record.
        </Text>
        <View style={styles.featureGrid}>
          {homeHighlights.map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBody}>{feature.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionPad}>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{homeAbout.title}</Text>
          {homeAbout.paragraphs.map((p) => (
            <Text key={p} style={styles.bodyText}>
              {p}
            </Text>
          ))}
          {homeAbout.bullets.map((b) => (
            <Text key={b} style={styles.bullet}>
              • {b}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.sectionPad}>
        <Text style={styles.sectionTitle}>Explore the app</Text>
        <Text style={styles.sectionSub}>
          Each area is built for a specific job — logging, analyzing, or connecting with other parents.
        </Text>
        <View style={styles.pageGrid}>
          {homeSitePages.map((page) => {
            const needsLogin = page.requiresAccount && !user
            return (
              <View key={page.href} style={styles.pageCard}>
                <Text style={styles.pageTitle}>{page.title}</Text>
                <Text style={styles.pageBody}>{page.body}</Text>
                {needsLogin ? (
                  <Link href="/login" asChild>
                    <Pressable style={styles.pageLink}>
                      <Text style={styles.pageLinkText}>Log in to open</Text>
                    </Pressable>
                  </Link>
                ) : (
                  <Link href={page.href as never} asChild>
                    <Pressable style={styles.pageLink}>
                      <Text style={styles.pageLinkText}>Go to {page.title}</Text>
                    </Pressable>
                  </Link>
                )}
              </View>
            )
          })}
        </View>
      </View>

      <View style={styles.sectionPad}>
        <Text style={styles.sectionTitle}>Free vs Pro</Text>
        <Text style={styles.sectionSub}>
          Core tracking is free forever. Pro adds unlimited history, exports, weekly digests, and family tools.
        </Text>
        <View style={styles.panel}>
          {homePlanRows.map((row) => (
            <View key={row.feature} style={styles.planRow}>
              <Text style={styles.planFeature}>{row.feature}</Text>
              <View style={styles.planValues}>
                <View style={styles.planCell}>
                  <Text style={styles.planLabel}>Free</Text>
                  <Text style={styles.planValue}>{row.free}</Text>
                </View>
                <View style={styles.planCell}>
                  <Text style={styles.planLabel}>Pro</Text>
                  <Text style={styles.planValue}>{row.pro}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.planActions}>
          {!user ? (
            <Link href="/signup" asChild>
              <HomeButton title="Sign up free" style={styles.planBtn} />
            </Link>
          ) : null}
          {!isPro ? (
            <HomeButton
              title="View pricing & upgrade"
              variant="secondary"
              onPress={() => router.push('/pricing')}
              style={styles.planBtn}
            />
          ) : null}
        </View>
      </View>

      {!user ? (
        <View style={styles.sectionPad}>
          <View style={styles.footerCta}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerTitle}>{homeFooterCta.title}</Text>
              <Text style={styles.footerBody}>{homeFooterCta.body}</Text>
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
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    flexShrink: 1,
  },
  heroTitleLine: {
    ...heading(40, { lineHeight: 42 }),
    color: t.heroTitle,
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
  sectionTitle: {
    ...heading(28, { lineHeight: 34 }),
    color: t.text,
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: t.text,
    marginBottom: 6,
  },
  panel: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.xl,
    backgroundColor: t.cardTranslucent,
    padding: Spacing.three,
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
  pageGrid: {
    gap: 10,
  },
  pageCard: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.xl,
    backgroundColor: t.cardTranslucent,
    padding: 16,
    gap: 8,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: t.text,
  },
  pageBody: {
    fontSize: 14,
    lineHeight: 21,
    color: t.textMuted,
  },
  pageLink: {
    alignSelf: 'flex-start' as const,
    marginTop: 4,
  },
  pageLinkText: {
    color: t.accentDeep,
    fontWeight: '700' as const,
    fontSize: 14,
  },
  planRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  planFeature: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 8,
  },
  planValues: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  planCell: {
    flex: 1,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: t.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  planValue: {
    fontSize: 14,
    color: t.text,
  },
  planActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: Spacing.two,
  },
  planBtn: {
    flexGrow: 1,
    minWidth: 140,
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
    ...heading(22),
    color: t.text,
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
