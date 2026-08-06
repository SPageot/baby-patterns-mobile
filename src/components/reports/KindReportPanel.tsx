import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { KindReport, ReportRange } from '@/lib/reportAnalytics'
import type { LogRecord } from '@/types/babyLog'
import { Spacing } from '@/constants/theme'

import { NapReportSection } from './NapReportSection'
import { RankList } from './RankList'
import { ChartCard, HourlyBarChart, TrendLineChart, WeekdayBarChart } from './ReportCharts'
import { ReportLogTable } from './ReportLogTable'

const KIND_ICON = {
  diaper: 'diaper' as const,
  feeding: 'bottle' as const,
  sleep: 'moon' as const,
  potty: 'potty' as const,
  behavior: 'tag' as const,
}

const createStyles = (t: AppPalette) => ({
  panel: {
    marginTop: Spacing.two,
  },
  header: {
    flexDirection: 'row' as const,
    gap: 12,
    alignItems: 'flex-start' as const,
    marginBottom: Spacing.two,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  title: {
    ...heading(22, { weight: '700' }),
    color: t.text,
  },
  sub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    lineHeight: 18,
    flex: 1,
  },
  empty: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
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
  report: KindReport
  logs: LogRecord[]
  rangeDays: ReportRange
}

export function KindReportPanel({ report, logs, rangeDays }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()
  const hasData = report.totalEvents > 0
  const dayUnit = report.kind === 'sleep' ? 'total sleep' : 'changes'
  const bestHourTitle =
    report.kind === 'sleep'
      ? 'Longest sleep sessions (fall-asleep time)'
      : `Busiest times (${report.kind === 'feeding' ? 'feeds' : 'changes'})`
  const worstHourTitle =
    report.kind === 'sleep'
      ? 'Shortest sleep sessions (fall-asleep time)'
      : `Quietest times (${report.kind === 'feeding' ? 'feeds' : 'changes'})`

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <NavIcon name={KIND_ICON[report.kind]} size={20} color={palette.accentDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.sub}>
            {hasData
              ? report.kind === 'sleep'
                ? `${report.totalEvents} sessions (sleepStartTime → sleepEndTime only) across ${report.daysTracked} wake days · ${report.avgDisplay}`
                : `${report.totalEvents} logs across ${report.daysTracked} days · ${report.avgDisplay}`
              : t('reports.noLogs')}
          </Text>
        </View>
      </View>

      {!hasData ? (
        <Text style={styles.empty}>{t('reports.noLogs')}</Text>
      ) : (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('reports.totalLogs')}</Text>
              <Text style={styles.statValue}>{report.totalEvents}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('reports.activeDays')}</Text>
              <Text style={styles.statValue}>{report.daysTracked}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('reports.dailyAverage')}</Text>
              <Text style={styles.statValue}>{report.avgDisplay}</Text>
            </View>
          </View>

          <ChartCard
            title="Daily trend"
            subtitle={
              report.kind === 'sleep'
                ? 'Total sleep per wake day (end time). Each session uses only its start and end timestamps.'
                : `${report.title} logged per day.`
            }
          >
            <TrendLineChart report={report} />
          </ChartCard>

          <ChartCard
            title={report.kind === 'sleep' ? 'Fall-asleep times' : 'Time of day'}
            subtitle={
              report.kind === 'sleep'
                ? 'All sleep sessions — full length credited to fall-asleep time only (UTC).'
                : `When ${report.title.toLowerCase()} typically happens across the day.`
            }
          >
            <HourlyBarChart report={report} />
          </ChartCard>

          <ChartCard title="Weekday averages" subtitle="Average per weekday (days with at least one log).">
            <WeekdayBarChart report={report} />
          </ChartCard>

          {report.kind === 'sleep' && report.napSection ? <NapReportSection nap={report.napSection} /> : null}

          <Text style={styles.analysisTitle}>Detailed analysis</Text>
          <RankList
            title={`Days with the most ${dayUnit}`}
            rows={report.bestDays}
            emptyText="Not enough daily data yet."
            tone="best"
          />
          <RankList
            title={`Days with the least ${dayUnit}`}
            rows={report.worstDays}
            emptyText="Not enough daily data yet."
            tone="worst"
          />
          <RankList title={bestHourTitle} rows={report.bestHours} emptyText="Not enough hourly data yet." tone="best" />
          <RankList
            title={worstHourTitle}
            rows={report.worstHours}
            emptyText="Not enough hourly data yet."
            tone="worst"
          />

          <ReportLogTable report={report} logs={logs} rangeDays={rangeDays} />
        </>
      )}
    </View>
  )
}
