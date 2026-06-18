import { ScrollView, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'

import { HomeButton } from '@/components/home/HomeButton'
import { NavIcon } from '@/components/icons/NavIcon'
import { Eyebrow } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.two,
  },
  hero: {
    marginBottom: Spacing.three,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  title: {
    ...heading(30, { weight: '700' }),
    color: t.text,
    marginBottom: 10,
  },
  titleAccent: {
    color: t.accentDeep,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
    marginBottom: 16,
  },
  pills: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  pill: {
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  grid: {
    gap: 12,
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: t.text,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: 6,
  },
  callout: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: t.text,
    marginBottom: 6,
  },
  calloutBody: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
  },
  cta: {
    alignItems: 'center' as const,
    gap: 10,
    paddingTop: Spacing.two,
  },
  ctaText: {
    fontSize: 14,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  link: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
})

function ReasonCard({
  icon,
  title,
  bullets,
  styles,
  palette,
}: {
  icon: 'diaper' | 'moon'
  title: string
  bullets: string[]
  styles: ReturnType<typeof createStyles>
  palette: AppPalette
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <NavIcon name={icon} size={22} color={palette.accentDeep} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      {bullets.map((bullet) => (
        <Text key={bullet} style={styles.bullet}>
          • {bullet}
        </Text>
      ))}
    </View>
  )
}

export function WhyTrackScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <NavIcon name="heart" size={16} color={palette.accentDeep} />
          <Text style={styles.badgeText}>Why tracking matters</Text>
        </View>
        <Eyebrow>Guide</Eyebrow>
        <Text style={styles.title}>
          Track diapers and sleep.{'\n'}
          <Text style={styles.titleAccent}>Feel confident—faster.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Patterns remove guesswork. A few quick logs help you spot what’s normal for your baby, catch
          changes early, and share clear info with caregivers or a pediatrician.
        </Text>
        <View style={styles.pills}>
          {['Less guesswork', 'Spot patterns', 'Share with caregivers'].map((pill) => (
            <Text key={pill} style={styles.pill}>
              {pill}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.grid}>
        <ReasonCard
          icon="diaper"
          title="Diaper changes"
          bullets={[
            'Know what’s typical for your baby day-to-day.',
            'Notice constipation/diarrhea trends sooner.',
            'Track wet diapers to support hydration awareness.',
          ]}
          styles={styles}
          palette={palette}
        />
        <ReasonCard
          icon="moon"
          title="Sleep"
          bullets={[
            'Understand nap + night sleep totals over time.',
            'Spot overtired patterns and adjust routines.',
            'Share bedtime details with partners/caregivers.',
          ]}
          styles={styles}
          palette={palette}
        />
      </View>

      <View style={styles.callout}>
        <Text style={styles.calloutTitle}>A simple rule</Text>
        <Text style={styles.calloutBody}>
          If you can’t answer “when was the last…” in 3 seconds, logging pays off.
        </Text>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>Ready to start logging?</Text>
        <HomeButton title="Create free account" onPress={() => router.push('/signup')} />
        <Link href="/login">
          <Text style={styles.link}>Log in</Text>
        </Link>
      </View>
    </ScrollView>
  )
}
