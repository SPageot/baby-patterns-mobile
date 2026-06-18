import { ScrollView, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import {
  formatInjuryCareSummary,
  formatInjuryRowSummary,
  formatSicknessCareSummary,
  healthSummaryLines,
  type HealthEventsReport,
} from '@/lib/healthReportAnalytics'
import { formatHealthDuration } from '@/types/health'
import { Spacing } from '@/constants/theme'

const LOG_ROW_HEIGHT = 72
const VISIBLE_ROWS = 6
const HEALTH_COLOR = '#c45c7a'

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' }
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

const createStyles = (t: AppPalette) => ({
  panel: { marginTop: Spacing.two },
  header: { flexDirection: 'row' as const, gap: 12, marginBottom: Spacing.two },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(196, 92, 122, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196, 92, 122, 0.22)',
  },
  title: { ...heading(20, { weight: '700' }), color: t.text },
  sub: { fontSize: 13, lineHeight: 20, color: t.textMuted, marginTop: 4 },
  empty: { color: t.textMuted, lineHeight: 22 },
  stats: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: Spacing.two },
  stat: {
    flexGrow: 1,
    flexBasis: '45%' as const,
    padding: 12,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  statLabel: { fontSize: 11, fontWeight: '700' as const, color: t.textMuted, textTransform: 'uppercase' as const },
  statValue: { fontSize: 18, fontWeight: '800' as const, color: t.text, marginTop: 4 },
  note: { fontSize: 13, lineHeight: 20, color: t.textMuted, marginBottom: Spacing.two },
  tableWrap: { marginTop: Spacing.two },
  tableTitle: { ...heading(16, { weight: '700' }), color: t.text, marginBottom: 4 },
  tableSub: { fontSize: 12, color: t.textMuted, marginBottom: 10 },
  table: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.lg,
    overflow: 'hidden' as const,
    backgroundColor: t.card2,
  },
  row: {
    minHeight: LOG_ROW_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  rowTitle: { fontWeight: '700' as const, color: t.text, marginBottom: 4 },
  rowMeta: { fontSize: 12, color: t.textMuted, lineHeight: 18 },
  scroll: { maxHeight: LOG_ROW_HEIGHT * VISIBLE_ROWS },
})

type Props = {
  report: HealthEventsReport
}

export function HealthReportPanel({ report }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const hasData = report.totalEvents > 0
  const summaryLines = healthSummaryLines(report)

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <NavIcon name="health" size={20} color={HEALTH_COLOR} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Health events</Text>
          <Text style={styles.sub}>
            {hasData
              ? `${report.sicknessCount} sickness · ${report.injuryCount} injur${report.injuryCount === 1 ? 'y' : 'ies'} in this period`
              : 'No sickness or injury data in this period yet.'}
          </Text>
        </View>
      </View>

      {!hasData ? (
        <Text style={styles.empty}>
          Log sickness and injuries on the Health page to see them in reports and PDF exports.
        </Text>
      ) : (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Sickness</Text>
              <Text style={styles.statValue}>{report.sicknessCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Injuries</Text>
              <Text style={styles.statValue}>{report.injuryCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Ongoing</Text>
              <Text style={styles.statValue}>{report.ongoingSicknessCount + report.ongoingInjuryCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Doctor care</Text>
              <Text style={styles.statValue}>{report.withDoctorCount}</Text>
            </View>
          </View>

          {summaryLines.map((line) => (
            <Text key={line} style={styles.note}>
              {line}
            </Text>
          ))}

          {report.sicknessCount > 0 ? (
            <View style={styles.tableWrap}>
              <Text style={styles.tableTitle}>Sickness logs</Text>
              <Text style={styles.tableSub}>Newest first.</Text>
              <View style={styles.table}>
                <ScrollView style={styles.scroll} nestedScrollEnabled>
                  {report.sickness.map((row) => {
                    const { date, time } = formatWhen(row.startedAt)
                    return (
                      <View key={row.id} style={styles.row}>
                        <Text style={styles.rowTitle}>{row.sicknessType}</Text>
                        <Text style={styles.rowMeta}>
                          {date} {time} · {formatHealthDuration(row.startedAt, row.endedAt)}
                          {row.temperatureF ? ` · ${row.temperatureF}°F` : ''}
                        </Text>
                        {row.symptoms.length > 0 ? (
                          <Text style={styles.rowMeta}>Symptoms: {row.symptoms.join(', ')}</Text>
                        ) : null}
                        <Text style={styles.rowMeta}>Care: {formatSicknessCareSummary(row)}</Text>
                      </View>
                    )
                  })}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {report.injuryCount > 0 ? (
            <View style={styles.tableWrap}>
              <Text style={styles.tableTitle}>Injuries</Text>
              <Text style={styles.tableSub}>Newest first.</Text>
              <View style={styles.table}>
                <ScrollView style={styles.scroll} nestedScrollEnabled>
                  {report.injuries.map((row) => {
                    const { date, time } = formatWhen(row.occurredAt)
                    return (
                      <View key={row.id} style={styles.row}>
                        <Text style={styles.rowTitle}>{row.description}</Text>
                        <Text style={styles.rowMeta}>
                          {date} {time} · {formatInjuryRowSummary(row)}
                        </Text>
                        <Text style={styles.rowMeta}>Care: {formatInjuryCareSummary(row)}</Text>
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
