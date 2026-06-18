import { Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { FullReport } from '@/lib/reportAnalytics'
import { Spacing } from '@/constants/theme'

import { ChartCard, TrendLineChart } from './ReportCharts'
import { GrowthTrendChart } from '@/components/growth/GrowthTrendChart'

type SummaryCard = {
  id: string
  title: string
  icon: 'moon' | 'diaper' | 'bottle' | 'growth' | 'health'
  tone: 'sleep' | 'nap' | 'diaper' | 'feeding' | 'growth' | 'milestone' | 'health'
  total: string
  sub: string
  avg: string
  best?: string
  avgLabel?: string
}

function buildSummaryCards(report: FullReport): SummaryCard[] {
  const { sleep, diapers, feeding, growth, health } = report
  const nap = sleep.napSection

  return [
    {
      id: 'sleep',
      title: 'Sleep',
      icon: 'moon',
      tone: 'sleep',
      total: sleep.totalEvents > 0 ? `${sleep.totalEvents} sessions` : 'No sleep yet',
      sub: sleep.totalEvents > 0 ? `${sleep.daysTracked} active days` : 'Log sleep to see trends',
      avg: sleep.avgDisplay,
      best: sleep.bestDays[0] ? `${sleep.bestDays[0].label} · ${sleep.bestDays[0].displayValue}` : undefined,
    },
    {
      id: 'nap',
      title: 'Naps',
      icon: 'moon',
      tone: 'nap',
      total: nap && nap.count > 0 ? `${nap.count} naps` : 'no naps saved',
      sub:
        nap && nap.count > 0 ? `${nap.daysTracked} days with naps` : 'Check “This was a nap” when logging',
      avg: nap && nap.count > 0 ? nap.avgDisplay : '—',
      best: nap?.bestHours[0] ? `${nap.bestHours[0].label} · ${nap.bestHours[0].displayValue}` : undefined,
    },
    {
      id: 'diaper',
      title: 'Diapers',
      icon: 'diaper',
      tone: 'diaper',
      total: diapers.totalEvents > 0 ? `${diapers.totalEvents} changes` : 'No diapers yet',
      sub: diapers.totalEvents > 0 ? `${diapers.daysTracked} active days` : 'Log diapers to see trends',
      avg: diapers.avgDisplay,
      best: diapers.bestDays[0] ? `${diapers.bestDays[0].label} · ${diapers.bestDays[0].displayValue}` : undefined,
    },
    {
      id: 'feeding',
      title: 'Feeding',
      icon: 'bottle',
      tone: 'feeding',
      total: feeding.totalEvents > 0 ? `${feeding.totalEvents} feeds` : 'No feeds yet',
      sub: feeding.totalEvents > 0 ? `${feeding.daysTracked} active days` : 'Log feeding to see trends',
      avg: feeding.avgDisplay,
      best: feeding.bestDays[0] ? `${feeding.bestDays[0].label} · ${feeding.bestDays[0].displayValue}` : undefined,
    },
    {
      id: 'growth',
      title: 'Growth',
      icon: 'growth',
      tone: 'growth',
      total:
        growth.measurementCount > 0
          ? `${growth.measurementCount} measurement${growth.measurementCount === 1 ? '' : 's'}`
          : 'No measurements yet',
      sub:
        growth.measurementCount > 0
          ? `Latest ${growth.latestWeightDisplay} · ${growth.latestHeightDisplay}`
          : 'Log weight and height on the Growth page',
      avg: growth.latestHeadDisplay,
      avgLabel: 'Latest head',
      best: growth.weightChangeDisplay ?? undefined,
    },
    {
      id: 'milestones',
      title: 'Milestones',
      icon: 'growth',
      tone: 'milestone',
      total:
        growth.milestoneCount > 0
          ? `${growth.milestoneCount} milestone${growth.milestoneCount === 1 ? '' : 's'}`
          : 'No milestones yet',
      sub:
        growth.milestoneCount > 0
          ? 'Developmental firsts in this period'
          : 'Log smiles, rolling, first words, and more',
      avg: '—',
      avgLabel: 'Categories',
    },
    {
      id: 'health',
      title: 'Health',
      icon: 'health',
      tone: 'health',
      total:
        health.totalEvents > 0
          ? `${health.sicknessCount} sickness · ${health.injuryCount} injur${health.injuryCount === 1 ? 'y' : 'ies'}`
          : 'No health events yet',
      sub:
        health.totalEvents > 0
          ? `${health.withDoctorCount} with doctor care · ${health.withMedicationCount} with medication`
          : 'Log sickness and injuries on the Health page',
      avg:
        health.ongoingSicknessCount + health.ongoingInjuryCount > 0
          ? String(health.ongoingSicknessCount + health.ongoingInjuryCount)
          : '—',
      avgLabel: 'Ongoing',
    },
  ]
}

const toneBorder = (tone: SummaryCard['tone'], t: AppPalette) => {
  if (tone === 'sleep') return t.mode === 'dark' ? 'rgba(130, 175, 255, 0.35)' : 'rgba(90, 127, 212, 0.3)'
  if (tone === 'nap') return t.mode === 'dark' ? 'rgba(170, 150, 230, 0.35)' : 'rgba(124, 92, 196, 0.25)'
  if (tone === 'diaper') return t.mode === 'dark' ? 'rgba(199, 160, 140, 0.35)' : 'rgba(166, 124, 104, 0.3)'
  if (tone === 'growth') return t.mode === 'dark' ? 'rgba(150, 120, 220, 0.35)' : 'rgba(124, 92, 196, 0.25)'
  if (tone === 'milestone') return t.mode === 'dark' ? 'rgba(130, 200, 160, 0.35)' : 'rgba(74, 154, 114, 0.3)'
  if (tone === 'health') return t.mode === 'dark' ? 'rgba(220, 130, 150, 0.35)' : 'rgba(196, 92, 122, 0.28)'
  return t.mode === 'dark' ? 'rgba(130, 200, 160, 0.35)' : 'rgba(74, 154, 114, 0.3)'
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.two,
  },
  title: {
    ...heading(20, { weight: '700' }),
    color: t.text,
  },
  sub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    marginBottom: Spacing.two,
    lineHeight: 18,
  },
  empty: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 22,
  },
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: 'row' as const,
    gap: 12,
    padding: Spacing.two,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    backgroundColor: t.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 6,
  },
  chartEmpty: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
})

type Props = {
  report: FullReport
}

export function ReportsOverview({ report }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const cards = buildSummaryCards(report)
  const hasAnyData =
    report.sleep.totalEvents > 0 ||
    report.diapers.totalEvents > 0 ||
    report.feeding.totalEvents > 0 ||
    report.growth.measurementCount > 0 ||
    report.growth.milestoneCount > 0 ||
    report.health.totalEvents > 0

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Overview</Text>
      <Text style={styles.sub}>
        Snapshot across sleep, naps, diapers, feeding, growth, milestones, and health. Open a tab above for full charts and log tables.
      </Text>

      {!hasAnyData ? (
        <Text style={styles.empty}>Start logging sleep, diapers, feeding, growth, milestones, or health events to unlock your overview.</Text>
      ) : (
        <>
          <View style={styles.cards}>
            {cards.map((card) => (
              <View
                key={card.id}
                style={[styles.card, { borderColor: toneBorder(card.tone, palette) }]}
              >
                <View style={styles.iconWrap}>
                  <NavIcon name={card.icon} size={18} color={palette.accentDeep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardTotal}>{card.total}</Text>
                  <Text style={styles.cardSub}>{card.sub}</Text>
                  <Text style={styles.cardMeta}>
                    {card.avgLabel ?? 'Daily avg'} {card.avg}
                  </Text>
                  {card.best ? (
                    <Text style={styles.cardMeta}>
                      {card.id === 'growth' ? 'Trend' : 'Top day'} {card.best}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <ChartCard title="Sleep trend" subtitle="Total sleep per wake day.">
            {report.sleep.totalEvents > 0 ? (
              <TrendLineChart report={report.sleep} />
            ) : (
              <Text style={styles.chartEmpty}>No sleep logged in this period.</Text>
            )}
          </ChartCard>

          <ChartCard title="Nap trend" subtitle="Nap checkbox sessions only.">
            {report.sleep.napSection && report.sleep.napSection.count > 0 ? (
              <TrendLineChart
                report={{
                  ...report.sleep,
                  totalEvents: report.sleep.napSection.count,
                  dailyTrend: report.sleep.napSection.dailyTrend,
                  hourlyDistribution: report.sleep.napSection.hourlyDistribution,
                  weekdayAverages: report.sleep.napSection.weekdayAverages,
                  bestDays: report.sleep.napSection.bestDays,
                  worstDays: report.sleep.napSection.worstDays,
                  bestHours: report.sleep.napSection.bestHours,
                  worstHours: report.sleep.napSection.worstHours,
                  daysTracked: report.sleep.napSection.daysTracked,
                  avgPerDay: report.sleep.napSection.avgPerDay,
                  avgDisplay: report.sleep.napSection.avgDisplay,
                }}
              />
            ) : (
              <Text style={styles.chartEmpty}>no naps saved</Text>
            )}
          </ChartCard>

          <ChartCard title="Diaper trend" subtitle="Changes logged per day.">
            {report.diapers.totalEvents > 0 ? (
              <TrendLineChart report={report.diapers} />
            ) : (
              <Text style={styles.chartEmpty}>No diapers logged in this period.</Text>
            )}
          </ChartCard>

          <ChartCard title="Feeding trend" subtitle="Feeds logged per day.">
            {report.feeding.totalEvents > 0 ? (
              <TrendLineChart report={report.feeding} />
            ) : (
              <Text style={styles.chartEmpty}>No feeding logged in this period.</Text>
            )}
          </ChartCard>

          <ChartCard title="Weight trend" subtitle="Growth measurements (lb).">
            {report.growth.weightTrend.length > 0 ? (
              <GrowthTrendChart
                measurements={report.growth.measurements}
                metric="weightLbs"
                title="Weight"
                unit="Pounds (lb)"
                color={palette.mode === 'dark' ? 'rgba(150, 120, 220, 0.95)' : '#7c5cc4'}
              />
            ) : (
              <Text style={styles.chartEmpty}>No growth measurements in this period.</Text>
            )}
          </ChartCard>
        </>
      )}
    </View>
  )
}
