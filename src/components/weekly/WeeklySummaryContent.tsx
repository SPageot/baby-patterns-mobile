import { useState, type ReactNode } from 'react'
import { Text, View } from 'react-native'

import { GrowthTrendChart } from '@/components/growth/GrowthTrendChart'
import { TrendLineChart } from '@/components/reports/ReportCharts'
import { Button } from '@/components/ui/primitives'
import {
  buildNapTrendBreakdown,
  buildWeeklyTrendBreakdown,
  type WeeklyHighlight,
  type WeeklyNarrativeOutline,
  type WeeklyTrendBreakdown,
} from '@/lib/weeklySummary'
import type { FullReport } from '@/lib/reportAnalytics'
import type { WeekBounds } from '@/lib/weeklySummary'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { bodyText, heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

function ChartCard({
  title,
  subtitle,
  children,
  breakdown,
  styles,
}: {
  title: string
  subtitle: string
  children: ReactNode
  breakdown?: WeeklyTrendBreakdown | null
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSub}>{subtitle}</Text>
      {children}
      {breakdown ? <ChartTrendBreakdown breakdown={breakdown} styles={styles} /> : null}
    </View>
  )
}

function ChartTrendBreakdown({
  breakdown,
  styles,
}: {
  breakdown: WeeklyTrendBreakdown
  styles: ReturnType<typeof createStyles>
}) {
  const extraStats = [
    breakdown.busiestWeekday
      ? { label: 'Busiest weekday', value: breakdown.busiestWeekday }
      : null,
    breakdown.quietestWeekday
      ? { label: 'Quietest weekday', value: breakdown.quietestWeekday }
      : null,
    breakdown.busiestTime
      ? { label: breakdown.busiestTimeLabel, value: breakdown.busiestTime }
      : null,
    breakdown.quietestTime
      ? { label: breakdown.quietestTimeLabel, value: breakdown.quietestTime }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null)

  return (
    <View style={styles.chartBreakdown}>
      <Text style={styles.chartBreakdownSummary}>{breakdown.summaryLine}</Text>

      <View style={styles.statGrid}>
        {breakdown.stats.map((stat) => (
          <View key={stat.label} style={styles.statChip}>
            <Text style={styles.statChipLabel}>{stat.label}</Text>
            <Text style={styles.statChipValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {breakdown.most ? (
        <View style={styles.chartBreakdownStat}>
          <Text style={styles.chartBreakdownLabel}>{breakdown.mostLabel}</Text>
          <Text style={styles.chartBreakdownValue}>{breakdown.most}</Text>
        </View>
      ) : null}
      {breakdown.least ? (
        <View style={styles.chartBreakdownStat}>
          <Text style={styles.chartBreakdownLabel}>{breakdown.leastLabel}</Text>
          <Text style={styles.chartBreakdownValue}>{breakdown.least}</Text>
        </View>
      ) : null}
      {extraStats.map((stat) => (
        <View key={stat.label} style={styles.chartBreakdownStat}>
          <Text style={styles.chartBreakdownLabel}>{stat.label}</Text>
          <Text style={styles.chartBreakdownValue}>{stat.value}</Text>
        </View>
      ))}

      {breakdown.topDays.length > 0 ? (
        <View style={styles.chartBreakdownDaily}>
          <Text style={styles.chartBreakdownDailyTitle}>Top days</Text>
          {breakdown.topDays.map((row) => (
            <View key={`top-${row.label}`} style={styles.chartBreakdownDailyItem}>
              <Text style={styles.chartBreakdownDailyLabel}>{row.label}</Text>
              <Text style={styles.chartBreakdownDailyValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {breakdown.lowDays.length > 0 ? (
        <View style={styles.chartBreakdownDaily}>
          <Text style={styles.chartBreakdownDailyTitle}>Lowest days</Text>
          {breakdown.lowDays.map((row) => (
            <View key={`low-${row.label}`} style={styles.chartBreakdownDailyItem}>
              <Text style={styles.chartBreakdownDailyLabel}>{row.label}</Text>
              <Text style={styles.chartBreakdownDailyValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {breakdown.dailyRows.length > 0 ? (
        <View style={styles.chartBreakdownDaily}>
          <Text style={styles.chartBreakdownDailyTitle}>Day by day</Text>
          {breakdown.dailyRows.map((row) => (
            <View key={row.label} style={styles.chartBreakdownDailyItem}>
              <Text style={styles.chartBreakdownDailyLabel}>{row.label}</Text>
              <Text style={styles.chartBreakdownDailyValue}>{row.displayValue}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const createStyles = (t: AppPalette) => {
  const sectionTitle = {
    ...bodyText,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    color: t.text,
    lineHeight: 24,
  }

  const labelCaps = {
    ...bodyText,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
  }

  return {
  root: {
    flex: 1,
  },
  narrativeSection: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    shadowColor: '#645078',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  narrativeHead: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: 18,
  },
  narrativeTitle: {
    ...heading(22, { weight: '600', lineHeight: 28 }),
    flex: 1,
  },
  narrativeMeta: {
    marginBottom: 4,
  },
  narrativeBabyName: {
    ...heading(26, { weight: '600', lineHeight: 30 }),
    color: t.text,
    marginBottom: 10,
  },
  narrativePeriod: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.accentLavender,
    backgroundColor: t.accentSoft,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    color: t.accentDeep,
    lineHeight: 16,
    overflow: 'hidden' as const,
  },
  narrativeBody: {
    gap: 18,
    marginTop: 4,
  },
  narrativeOutlinePanel: {
    padding: 18,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    gap: 14,
  },
  narrativeIntro: {
    ...bodyText,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
    color: t.textMuted,
  },
  narrativeOutlineHeading: {
    ...bodyText,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
    marginBottom: 2,
  },
  narrativeOutlineList: {
    gap: 0,
  },
  narrativeOutlineItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  narrativeOutlineItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  narrativeOutlineItemFirst: {
    paddingTop: 0,
  },
  narrativeOutlineMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: t.accent,
    borderWidth: 2,
    borderColor: t.accentSoft,
  },
  narrativeOutlineText: {
    ...bodyText,
    flex: 1,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
    color: t.text,
  },
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
    ...sectionTitle,
    marginBottom: Spacing.two,
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
    ...labelCaps,
  },
  highlightValue: {
    ...bodyText,
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    color: t.text,
    marginTop: 6,
    lineHeight: 24,
  },
  highlightDetail: {
    ...bodyText,
    fontSize: 12,
    fontWeight: '400' as const,
    color: t.textMuted,
    marginTop: 4,
    lineHeight: 18,
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
    ...bodyText,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    color: t.text,
    lineHeight: 22,
  },
  chartSub: {
    ...bodyText,
    fontSize: 13,
    fontWeight: '400' as const,
    color: t.textMuted,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 19,
    letterSpacing: 0.1,
  },
  chartEmpty: {
    ...bodyText,
    fontSize: 14,
    fontWeight: '400' as const,
    color: t.textMuted,
    paddingVertical: Spacing.two,
    lineHeight: 21,
  },
  chartBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
    gap: 10,
  },
  chartBreakdownSummary: {
    ...bodyText,
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  statGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: '30%' as const,
    minWidth: 100,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  statChipLabel: {
    ...labelCaps,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  statChipValue: {
    ...bodyText,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    color: t.text,
    lineHeight: 18,
  },
  chartBreakdownStat: {
    gap: 2,
  },
  chartBreakdownLabel: {
    ...labelCaps,
  },
  chartBreakdownValue: {
    ...bodyText,
    fontSize: 14,
    fontWeight: '500' as const,
    color: t.text,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  chartBreakdownDaily: {
    gap: 6,
    marginTop: 4,
  },
  chartBreakdownDailyTitle: {
    ...labelCaps,
  },
  chartBreakdownDailyItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  chartBreakdownDailyLabel: {
    ...bodyText,
    fontSize: 13,
    fontWeight: '400' as const,
    color: t.text,
    flex: 1,
    lineHeight: 19,
  },
  chartBreakdownDailyValue: {
    ...bodyText,
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
    lineHeight: 19,
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
    ...bodyText,
    fontSize: 14,
    fontWeight: '400' as const,
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
    ...bodyText,
    fontSize: 16,
    color: t.accentDeep,
    fontWeight: '600' as const,
  },
  milestoneTitle: {
    ...bodyText,
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    color: t.text,
    lineHeight: 21,
  },
  milestoneMeta: {
    ...bodyText,
    fontSize: 12,
    fontWeight: '400' as const,
    color: t.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  }
}

type Props = {
  report: FullReport
  bounds: WeekBounds
  narrativeOutline: WeeklyNarrativeOutline
  highlights: WeeklyHighlight[]
  babyName: string
  onCopy: () => Promise<void>
}

export function WeeklySummaryContent({
  report,
  bounds,
  narrativeOutline,
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
    report.growth.milestoneCount > 0 ||
    report.health.totalEvents > 0

  const sleepBreakdown = buildWeeklyTrendBreakdown('sleep', report.sleep)
  const napBreakdown =
    report.sleep.napSection && report.sleep.napSection.count > 0
      ? buildNapTrendBreakdown(report.sleep.napSection)
      : null
  const diaperBreakdown = buildWeeklyTrendBreakdown('diaper', report.diapers)
  const feedingBreakdown = buildWeeklyTrendBreakdown('feeding', report.feeding)

  return (
    <View style={styles.root}>
      <View style={styles.narrativeSection}>
        <View style={styles.narrativeHead}>
          <Text style={styles.narrativeTitle}>Your week at a glance</Text>
          <Button
            title={copied ? 'Copied!' : 'Copy summary'}
            variant="secondary"
            onPress={() => void onCopyClick()}
          />
        </View>
        <View style={styles.narrativeBody}>
          <View style={styles.narrativeMeta}>
            {babyName.trim() ? (
              <Text style={styles.narrativeBabyName}>{babyName.trim()}</Text>
            ) : null}
            <Text style={styles.narrativePeriod}>{bounds.label}</Text>
          </View>

          <View style={styles.narrativeOutlinePanel}>
            {narrativeOutline.intro ? (
              <Text style={styles.narrativeIntro}>{narrativeOutline.intro}</Text>
            ) : null}
            <Text style={styles.narrativeOutlineHeading}>This week</Text>
            <View style={styles.narrativeOutlineList}>
              {narrativeOutline.bullets.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.narrativeOutlineItem,
                    index === 0 ? styles.narrativeOutlineItemFirst : null,
                    index === narrativeOutline.bullets.length - 1
                      ? styles.narrativeOutlineItemLast
                      : null,
                  ]}
                >
                  <View style={styles.narrativeOutlineMarker} />
                  <Text style={styles.narrativeOutlineText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
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
            <ChartCard
              title="Sleep"
              subtitle="Total sleep per wake day."
              breakdown={sleepBreakdown}
              styles={styles}
            >
              {report.sleep.totalEvents > 0 ? (
                <TrendLineChart report={report.sleep} size="compact" />
              ) : (
                <Text style={styles.chartEmpty}>No sleep logged this week.</Text>
              )}
            </ChartCard>

            <ChartCard
              title="Naps"
              subtitle="Sessions logged with the nap checkbox."
              breakdown={napBreakdown}
              styles={styles}
            >
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
                  size="compact"
                />
              ) : (
                <Text style={styles.chartEmpty}>No naps saved</Text>
              )}
            </ChartCard>

            <ChartCard
              title="Diapers"
              subtitle="Changes per day."
              breakdown={diaperBreakdown}
              styles={styles}
            >
              {report.diapers.totalEvents > 0 ? (
                <TrendLineChart report={report.diapers} size="compact" />
              ) : (
                <Text style={styles.chartEmpty}>No diapers logged this week.</Text>
              )}
            </ChartCard>

            <ChartCard
              title="Feeding"
              subtitle="Feeds per day."
              breakdown={feedingBreakdown}
              styles={styles}
            >
              {report.feeding.totalEvents > 0 ? (
                <TrendLineChart report={report.feeding} size="compact" />
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

      {report.health.totalEvents > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health this week</Text>
          {report.health.sickness.map((row) => (
            <View key={row.id} style={styles.milestoneItem}>
              <Text style={styles.milestoneCheck}>🩺</Text>
              <View>
                <Text style={styles.milestoneTitle}>{row.sicknessType}</Text>
                <Text style={styles.milestoneMeta}>
                  {new Date(row.startedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {row.symptoms.length > 0 ? ` · ${row.symptoms.join(', ')}` : ''}
                </Text>
              </View>
            </View>
          ))}
          {report.health.injuries.map((row) => (
            <View key={row.id} style={styles.milestoneItem}>
              <Text style={styles.milestoneCheck}>🩹</Text>
              <View>
                <Text style={styles.milestoneTitle}>{row.description}</Text>
                <Text style={styles.milestoneMeta}>
                  {new Date(row.occurredAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {row.bodyPart ? ` · ${row.bodyPart}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

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
