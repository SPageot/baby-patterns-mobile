import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { NavIcon } from '@/components/icons/NavIcon'
import { TourScrollView } from '@/components/onboarding/TourScrollView'
import { TourTarget } from '@/components/onboarding/TourTarget'
import { LoadingSpinner } from '@/components/ui/Loading'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import type { LogKind } from '@/types/babyLog'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { emitTourAction } from '@/lib/onboardingActions'

type Props = {
  kind: LogKind
  todayCount: number
  countLoading?: boolean
  onLogClick: () => void
  logFormOpen?: boolean
  alerts?: ReactNode
  panelToolbar?: ReactNode
  insights?: ReactNode
  recent: ReactNode
  children?: ReactNode
}

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  hero: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  heroMain: {
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  note: {
    marginTop: 6,
    fontSize: 12,
    color: t.textMuted,
    fontWeight: '600' as const,
  },
  stat: {
    alignItems: 'center' as const,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
  },
  statN: {
    fontSize: 24,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  alerts: {
    marginBottom: Spacing.two,
  },
  cta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    padding: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.card,
    borderWidth: 1,
  },
  ctaText: {
    flex: 1,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: t.text,
  },
  ctaHint: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  ctaArrow: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  panels: {
    gap: Spacing.two,
  },
  panel: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.cardTranslucent,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
})

export function TrackLogSection({
  kind,
  todayCount,
  countLoading = false,
  onLogClick,
  logFormOpen = false,
  alerts,
  panelToolbar,
  insights,
  recent,
  children,
}: Props) {
  const { t } = useTranslation()
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const theme = getTrackThemeFromPalette(kind, palette)
  const title = t(`track.${kind}.title`)
  const subtitle = t(`track.${kind}.subtitle`)
  const todayUnit = t(`track.${kind}.todayUnit`)
  const ctaLabel = t(`track.${kind}.ctaLabel`)
  const ctaHint = t(`track.${kind}.ctaHint`)
  const storageNote = t(`track.${kind}.storageNote`)

  return (
    <TourScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TourTarget id={`page-${kind}-content`}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <NavIcon name={theme.icon} size={22} color={theme.accent} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {storageNote ? <Text style={styles.note}>{storageNote}</Text> : null}
            </View>
          </View>

          <View style={[styles.stat, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            {countLoading ? (
              <LoadingSpinner size="sm" label={t('track.loadingCount')} />
            ) : (
              <Text style={[styles.statN, { color: theme.accent }]}>{todayCount}</Text>
            )}
            <Text style={styles.statLabel}>{todayUnit}</Text>
          </View>
        </View>
      </TourTarget>

      {alerts ? <View style={styles.alerts}>{alerts}</View> : null}

      {!logFormOpen ? (
        <TourTarget id={`log-cta-${kind}`}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              emitTourAction(`click:log-cta-${kind}`)
              onLogClick()
            }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.ctaIcon, { borderColor: theme.accentBorder }]}>
              <NavIcon name={theme.icon} size={20} color={theme.accent} />
            </View>
            <View style={styles.ctaText}>
              <Text style={styles.ctaLabel}>{ctaLabel}</Text>
              <Text style={styles.ctaHint}>{ctaHint}</Text>
            </View>
            <Text style={[styles.ctaArrow, { color: theme.accent }]}>→</Text>
          </Pressable>
        </TourTarget>
      ) : null}

      <View style={styles.panels}>
        {panelToolbar}
        {insights}
        <View style={styles.panel}>{recent}</View>
      </View>

      {children}
    </TourScrollView>
  )
}
