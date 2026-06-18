import { Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { KindReport, NapReportSection as NapReportData } from '@/lib/reportAnalytics'
import { Spacing } from '@/constants/theme'

import { RankList } from './RankList'
import { ChartCard, HourlyBarChart, TrendLineChart, WeekdayBarChart } from './ReportCharts'

const NAP_EMPTY = 'no naps saved'

function napToChartReport(nap: NapReportData): KindReport {
  return {
    kind: 'sleep',
    title: 'Naps',
    totalEvents: nap.count,
    daysTracked: nap.daysTracked,
    avgPerDay: nap.avgPerDay,
    avgDisplay: nap.avgDisplay,
    bestDays: nap.bestDays,
    worstDays: nap.worstDays,
    bestHours: nap.bestHours,
    worstHours: nap.worstHours,
    dailyTrend: nap.dailyTrend,
    hourlyDistribution: nap.hourlyDistribution,
    weekdayAverages: nap.weekdayAverages,
    unit: 'minutes',
  }
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.three,
    padding: Spacing.two,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.mode === 'dark' ? 'rgba(150, 170, 230, 0.35)' : 'rgba(90, 127, 212, 0.25)',
    backgroundColor: t.cardTranslucent,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: t.text,
  },
  sub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  stat: {
    flex: 1,
    minWidth: 96,
    padding: 12,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: t.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: 4,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
})

type Props = {
  nap: NapReportData
}

export function NapReportSection({ nap }: Props) {
  const styles = useThemedStyles(createStyles)
  const chartReport = napToChartReport(nap)
  const hasNaps = nap.count > 0

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Naps</Text>
      <Text style={styles.sub}>
        {hasNaps
          ? `${nap.count} nap${nap.count === 1 ? '' : 's'} logged with the nap checkbox · ${nap.avgDisplay}`
          : 'Mark sleep as a nap in the sleep form to see nap trends here.'}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Naps logged</Text>
          <Text style={styles.statValue}>{hasNaps ? nap.count : '—'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Days with naps</Text>
          <Text style={styles.statValue}>{hasNaps ? nap.daysTracked : '—'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg nap / day</Text>
          <Text style={styles.statValue}>{hasNaps ? nap.avgDisplay : '—'}</Text>
        </View>
      </View>

      <ChartCard title="Nap trend" subtitle="Total nap sleep per wake day (nap checkbox only).">
        <TrendLineChart report={chartReport} emptyMessage={NAP_EMPTY} />
      </ChartCard>

      <ChartCard title="Nap fall-asleep times" subtitle="When logged naps typically start (UTC).">
        <HourlyBarChart report={chartReport} emptyMessage={NAP_EMPTY} />
      </ChartCard>

      <ChartCard title="Nap weekday averages" subtitle="Average nap sleep per weekday.">
        <WeekdayBarChart report={chartReport} emptyMessage={NAP_EMPTY} />
      </ChartCard>

      <Text style={styles.analysisTitle}>Nap analysis</Text>
      <RankList title="Days with the most nap sleep" rows={nap.bestDays} emptyText={NAP_EMPTY} tone="best" />
      <RankList title="Days with the least nap sleep" rows={nap.worstDays} emptyText={NAP_EMPTY} tone="worst" />
      <RankList title="Longest naps (fall-asleep time)" rows={nap.bestHours} emptyText={NAP_EMPTY} tone="best" />
      <RankList title="Shortest naps (fall-asleep time)" rows={nap.worstHours} emptyText={NAP_EMPTY} tone="worst" />
    </View>
  )
}
