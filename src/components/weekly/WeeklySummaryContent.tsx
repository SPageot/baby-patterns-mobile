import { useState, type ReactNode } from 'react'
import { Text, View } from 'react-native'

import { GrowthTrendChart } from '@/components/growth/GrowthTrendChart'
import { TrendLineChart } from '@/components/reports/ReportCharts'
import { Button } from '@/components/ui/primitives'
import type { WeeklyHighlight } from '@/lib/weeklySummary'
import type { FullReport } from '@/lib/reportAnalytics'
import type { WeekBounds } from '@/lib/weeklySummary'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

function ChartCard({
  title,
  subtitle,
  children,
  styles,
}: {
  title: string
  subtitle: string
  children: ReactNode
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSub}>{subtitle}</Text>
      {children}
    </View>
  )
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginBottom: Spacing.three,
  },
  sectionHead: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    ...heading(20, { weight: '800' }),
    color: t.text,
    marginBottom: Spacing.two,
  },
  babyName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 4,
  },
  period: {
    fontSize: 13,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: t.text,
    marginBottom: 10,
  },
  highlightGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  highlightCard: {
    flexGrow: 1,
    flexBasis: '45%' as const,
    minWidth: 140,
    padding: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: t.text,
    marginTop: 6,
  },
  highlightDetail: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
  },
  chartGrid: {
    gap: Spacing.two,
  },
  chartCard: {
    padding: Spacing.two,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    marginBottom: Spacing.two,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
  },
  chartSub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  chartEmpty: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
  emptySection: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.four,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 14,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  milestoneItem: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  milestoneCheck: {
    fontSize: 16,
    color: t.accentDeep,
    fontWeight: '800' as const,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  milestoneMeta: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
  },
})

type Props = {
  report: FullReport
  bounds: WeekBounds
  narrative: string[]
  highlights: WeeklyHighlight[]
  babyName: string
  onCopy: () => Promise<void>
}

export function WeeklySummaryContent({
  report,
  bounds,
  narrative,
  highlights,
  babyName,
  onCopy,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const [copied, setCopied] = useState(false)

  const onCopyClick = async () => {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasAnyData =
    report.sleep.totalEvents > 0 ||
    report.diapers.totalEvents > 0 ||
    report.feeding.totalEvents > 0 ||
    report.growth.measurementCount > 0 ||
    report.growth.milestoneCount > 0

  return (
    <View>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Your week at a glance</Text>
          <Button
            title={copied ? 'Shared!' : 'Share summary'}
            variant="secondary"
            onPress={() => void onCopyClick()}
          />
        </View>
        {babyName.trim() ? <Text style={styles.babyName}>{babyName.trim()}</Text> : null}
        <Text style={styles.period}>{bounds.label}</Text>
        {narrative.map((paragraph) => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        <View style={styles.highlightGrid}>
          {highlights.map((item) => (
            <View key={item.id} style={styles.highlightCard}>
              <Text style={styles.highlightLabel}>{item.label}</Text>
              <Text style={styles.highlightValue}>{item.value}</Text>
              {item.detail ? <Text style={styles.highlightDetail}>{item.detail}</Text> : null}
            </View>
          ))}
        </View>
      </View>

      {hasAnyData ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trends this week</Text>
          <View style={styles.chartGrid}>
            <ChartCard title="Sleep" subtitle="Total sleep per wake day." styles={styles}>
              {report.sleep.totalEvents > 0 ? (
                <TrendLineChart report={report.sleep} />
              ) : (
                <Text style={styles.chartEmpty}>No sleep logged this week.</Text>
              )}
            </ChartCard>

            <ChartCard title="Naps" subtitle="Sessions logged with the nap checkbox." styles={styles}>
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
                <Text style={styles.chartEmpty}>No naps saved</Text>
              )}
            </ChartCard>

            <ChartCard title="Diapers" subtitle="Changes per day." styles={styles}>
              {report.diapers.totalEvents > 0 ? (
                <TrendLineChart report={report.diapers} />
              ) : (
                <Text style={styles.chartEmpty}>No diapers logged this week.</Text>
              )}
            </ChartCard>

            <ChartCard title="Feeding" subtitle="Feeds per day." styles={styles}>
              {report.feeding.totalEvents > 0 ? (
                <TrendLineChart report={report.feeding} />
              ) : (
                <Text style={styles.chartEmpty}>No feeding logged this week.</Text>
              )}
            </ChartCard>
          </View>
        </View>
      ) : (
        <View style={styles.emptySection}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>
            Start logging sleep, diapers, or feeding to see charts in next week&apos;s summary.
          </Text>
        </View>
      )}

      {report.growth.milestones.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones this week</Text>
          {report.growth.milestones.map((m) => (
            <View key={m.id} style={styles.milestoneItem}>
              <Text style={styles.milestoneCheck}>✓</Text>
              <View>
                <Text style={styles.milestoneTitle}>{m.title}</Text>
                <Text style={styles.milestoneMeta}>
                  {new Date(m.achievedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {report.growth.weightTrend.length > 1 ? (
        <ChartCard title="Weight this week" subtitle="Measurements logged during this period." styles={styles}>
          <GrowthTrendChart
            measurements={report.growth.measurements}
            metric="weightLbs"
            title="Weight"
            unit="Pounds (lb)"
            color="#7c5cc4"
          />
        </ChartCard>
      ) : null}
    </View>
  )
}
