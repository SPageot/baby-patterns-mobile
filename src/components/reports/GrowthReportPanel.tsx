import { ScrollView, Text, View } from 'react-native'

import { GrowthTrendChart } from '@/components/growth/GrowthTrendChart'
import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { GrowthMilestonesReport } from '@/lib/growthReportAnalytics'
import { MILESTONE_CATEGORY_LABELS } from '@/types/growth'
import { Spacing } from '@/constants/theme'

import { ChartCard } from './ReportCharts'

const LOG_ROW_HEIGHT = 60
const VISIBLE_ROWS = 7

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' }
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

function fmtNum(v: string | number | null | undefined, suffix: string) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n} ${suffix}`
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
  note: {
    fontSize: 13,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: Spacing.two,
  },
  tableWrap: {
    marginTop: Spacing.three,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: t.text,
  },
  tableSub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    marginBottom: Spacing.two,
    lineHeight: 18,
  },
  table: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    overflow: 'hidden' as const,
    backgroundColor: t.card,
  },
  headerRow: {
    flexDirection: 'row' as const,
    backgroundColor: t.card2,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
    textTransform: 'uppercase' as const,
  },
  scroll: {
    maxHeight: LOG_ROW_HEIGHT * VISIBLE_ROWS,
  },
  row: {
    flexDirection: 'row' as const,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
    minHeight: LOG_ROW_HEIGHT,
    alignItems: 'center' as const,
  },
  cell: {
    flex: 1,
    paddingRight: 6,
  },
  primary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  secondary: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  milestoneItem: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
  },
  milestoneCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(74, 154, 114, 0.14)',
  },
  milestoneCheckText: {
    color: '#2f7a55',
    fontWeight: '800' as const,
  },
})

type Props = {
  report: GrowthMilestonesReport
}

export function GrowthReportPanel({ report }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const hasData = report.measurementCount > 0 || report.milestoneCount > 0

  const weightColor = palette.mode === 'dark' ? 'rgba(150, 120, 220, 0.95)' : '#7c5cc4'
  const heightColor = palette.mode === 'dark' ? 'rgba(130, 200, 160, 0.95)' : '#4a9a72'
  const headColor = palette.mode === 'dark' ? 'rgba(210, 150, 120, 0.95)' : '#c47a5c'

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <NavIcon name="growth" size={20} color={palette.accentDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Growth & milestones</Text>
          <Text style={styles.sub}>
            {hasData
              ? `${report.measurementCount} measurement${report.measurementCount === 1 ? '' : 's'} · ${report.milestoneCount} milestone${report.milestoneCount === 1 ? '' : 's'} in this period`
              : 'No growth or milestone data in this period yet.'}
          </Text>
        </View>
      </View>

      {!hasData ? (
        <Text style={styles.empty}>
          Log measurements and milestones on the Growth page (web) to see trends here.
        </Text>
      ) : (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Measurements</Text>
              <Text style={styles.statValue}>{report.measurementCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Milestones</Text>
              <Text style={styles.statValue}>{report.milestoneCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Latest weight</Text>
              <Text style={styles.statValue}>{report.latestWeightDisplay}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Latest height</Text>
              <Text style={styles.statValue}>{report.latestHeightDisplay}</Text>
            </View>
          </View>

          {report.weightChangeDisplay ? (
            <Text style={styles.note}>{report.weightChangeDisplay}</Text>
          ) : null}

          <ChartCard title="Weight trend" subtitle="Logged measurements over time (lb).">
            <GrowthTrendChart
              measurements={report.measurements}
              metric="weightLbs"
              title="Weight"
              unit="Pounds (lb)"
              color={weightColor}
            />
          </ChartCard>

          <ChartCard title="Height trend" subtitle="Length / height measurements (in).">
            <GrowthTrendChart
              measurements={report.measurements}
              metric="heightInches"
              title="Height"
              unit="Inches (in)"
              color={heightColor}
            />
          </ChartCard>

          <ChartCard title="Head circumference" subtitle="Head measurements (in).">
            <GrowthTrendChart
              measurements={report.measurements}
              metric="headCircumferenceInches"
              title="Head"
              unit="Inches (in)"
              color={headColor}
            />
          </ChartCard>

          {report.milestoneCount > 0 ? (
            <>
              <Text style={styles.analysisTitle}>Milestones by category</Text>
              <View style={styles.categoryGrid}>
                {(Object.keys(MILESTONE_CATEGORY_LABELS) as Array<keyof typeof MILESTONE_CATEGORY_LABELS>).map(
                  (cat) => (
                    <View key={cat} style={styles.stat}>
                      <Text style={styles.statLabel}>{MILESTONE_CATEGORY_LABELS[cat]}</Text>
                      <Text style={styles.statValue}>{report.categoryCounts[cat]}</Text>
                    </View>
                  ),
                )}
              </View>
            </>
          ) : null}

          {report.measurementCount > 0 ? (
            <View style={styles.tableWrap}>
              <Text style={styles.tableTitle}>Growth measurements</Text>
              <Text style={styles.tableSub}>All measurements in this period, newest first.</Text>
              <View style={styles.table}>
                <View style={styles.headerRow}>
                  <Text style={styles.headerCell}>When</Text>
                  <Text style={styles.headerCell}>Weight</Text>
                  <Text style={styles.headerCell}>Height</Text>
                  <Text style={[styles.headerCell, { flex: 1.2 }]}>Head</Text>
                </View>
                <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator>
                  {report.measurements.map((row) => {
                    const { date, time } = formatWhen(row.recordedAt)
                    return (
                      <View key={row.id} style={styles.row}>
                        <View style={styles.cell}>
                          <Text style={styles.primary}>{date}</Text>
                          <Text style={styles.secondary}>{time}</Text>
                        </View>
                        <Text style={[styles.primary, styles.cell]}>{fmtNum(row.weightLbs, 'lb')}</Text>
                        <Text style={[styles.primary, styles.cell]}>{fmtNum(row.heightInches, 'in')}</Text>
                        <Text style={[styles.primary, styles.cell, { flex: 1.2 }]}>
                          {fmtNum(row.headCircumferenceInches, 'in')}
                        </Text>
                      </View>
                    )
                  })}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {report.milestoneCount > 0 ? (
            <View style={styles.tableWrap}>
              <Text style={styles.tableTitle}>Milestones</Text>
              <Text style={styles.tableSub}>Developmental milestones in this period.</Text>
              <View style={styles.table}>
                <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator>
                  {report.milestones.map((row) => {
                    const { date, time } = formatWhen(row.achievedAt)
                    return (
                      <View key={row.id} style={styles.milestoneItem}>
                        <View style={styles.milestoneCheck}>
                          <Text style={styles.milestoneCheckText}>✓</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.primary}>{row.title}</Text>
                          <Text style={styles.secondary}>
                            {date}
                            {time ? ` · ${time}` : ''} · {MILESTONE_CATEGORY_LABELS[row.category]}
                            {row.notes?.trim() ? ` · ${row.notes.trim()}` : ''}
                          </Text>
                        </View>
                      </View>
                    )
                  })}
                </ScrollView>
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}
