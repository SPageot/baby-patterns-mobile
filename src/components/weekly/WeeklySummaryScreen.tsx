import { useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import { WeeklySummaryContent } from '@/components/weekly/WeeklySummaryContent'
import { Button, ErrorText, Eyebrow } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { useApp } from '@/context/AppContext'
import { useWeeklySummary } from '@/hooks/useWeeklySummary'
import { isProUser } from '@/lib/subscription'
import type { WeekSelection } from '@/lib/weeklySummary'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const WEEK_OPTIONS: { value: WeekSelection; label: string }[] = [
  { value: 'last', label: 'Last week' },
  { value: 'this', label: 'This week' },
]

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
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: t.accentDeep,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  weekRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  weekBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  weekBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  weekLabelActive: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  babyRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  babyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  babyChipActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  babyChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  babyChipTextActive: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  linksRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  status: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
  gate: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.five,
    gap: 12,
  },
  gateIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  gateTitle: {
    ...heading(24, { weight: '700' }),
    color: t.text,
    textAlign: 'center' as const,
  },
  gateText: {
    fontSize: 15,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  gateActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 8,
  },
})

export function WeeklySummaryScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const { user, authReady } = useApp()
  const summary = useWeeklySummary()
  const userIsPro = isProUser(user)

  if (!authReady) {
    return <PageLoadingScreen label="Loading weekly summary…" />
  }

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <NavIcon name="calendar" size={24} color={palette.accentDeep} />
          </View>
          <Text style={styles.gateTitle}>Weekly summaries</Text>
          <Text style={styles.gateText}>
            Log in to see a digest of your baby&apos;s sleep, feeding, diapers, growth, and milestones for each week.
          </Text>
          <View style={styles.gateActions}>
            <Button title="Log in" onPress={() => router.push('/login')} />
            <Button title="Sign up" variant="secondary" onPress={() => router.push('/signup')} />
          </View>
        </View>
      </ScrollView>
    )
  }

  if (!summary.hasBaby) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <NavIcon name="calendar" size={24} color={palette.accentDeep} />
          </View>
          <Text style={styles.gateTitle}>Weekly summaries</Text>
          <Text style={styles.gateText}>
            Add a baby profile to unlock your weekly digest of patterns and milestones.
          </Text>
          <Button title="Add a baby" onPress={() => router.push('/add-baby')} />
        </View>
      </ScrollView>
    )
  }

  if (!userIsPro) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <NavIcon name="calendar" size={24} color={palette.accentDeep} />
          </View>
          <Text style={styles.gateTitle}>Weekly summaries are a Pro feature</Text>
          <Text style={styles.gateText}>
            Upgrade to Baby Patterns Pro for in-app weekly digests, email summaries, and unlimited report history.
          </Text>
          <Button title="View Pro plans" onPress={() => router.push('/pricing')} />
        </View>
      </ScrollView>
    )
  }

  if (summary.loading) {
    return <PageLoadingScreen label="Loading tracking data…" />
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <NavIcon name="calendar" size={16} color={palette.accentDeep} />
          <Text style={styles.badgeText}>Weekly summary</Text>
        </View>
        <Eyebrow>Digest</Eyebrow>
        <Text style={styles.title}>Your week in review</Text>
        <Text style={styles.subtitle}>
          A readable digest of sleep, naps, diapers, feeding, growth, and milestones — perfect for catching up with
          your partner or pediatrician.
        </Text>

        <View style={styles.weekRow}>
          {WEEK_OPTIONS.map((option) => {
            const active = summary.weekSelection === option.value
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => summary.setWeekSelection(option.value)}
                style={[styles.weekBtn, active && styles.weekBtnActive]}
              >
                <Text style={[styles.weekLabel, active && styles.weekLabelActive]}>{option.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {summary.ownBabies.length > 1 ? (
          <View style={styles.babyRow}>
            {summary.ownBabies.map((baby) => {
              const active = baby.id === summary.selectedBabyId
              return (
                <Pressable
                  key={baby.id}
                  onPress={() => summary.setSelectedBabyId(baby.id)}
                  style={[styles.babyChip, active && styles.babyChipActive]}
                >
                  <Text style={[styles.babyChipText, active && styles.babyChipTextActive]}>
                    {baby.fullName?.trim() || 'Baby'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}

        <View style={styles.linksRow}>
          <Button title="Full reports" variant="secondary" onPress={() => router.push('/reports')} />
          <Button
            title="Email settings"
            variant="ghost"
            onPress={() => router.push('/settings?tab=weekly-summary')}
          />
        </View>
      </View>

      {summary.error ? <ErrorText>{summary.error}</ErrorText> : null}

      <WeeklySummaryContent
        report={summary.report}
        bounds={summary.bounds}
        narrativeOutline={summary.narrativeOutline}
        highlights={summary.highlights}
        babyName={summary.selectedBaby?.fullName ?? ''}
        onCopy={summary.copySummary}
      />
    </ScrollView>
  )
}
