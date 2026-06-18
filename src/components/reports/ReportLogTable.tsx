import { ScrollView, Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { diaperMixHeadline, diaperMixType, formatDiaperLogStamp } from '@/lib/diaperFeedUtils'
import { feedingTypeLabel, formatFeedingStamp, formatFeedingSummary } from '@/lib/feedingLogUtils'
import {
  filterLogsForKindReport,
  parseSleepInterval,
  type KindReport,
  type ReportRange,
} from '@/lib/reportAnalytics'
import { formatSleepDurationDisplay, formatSleepUtcStamp } from '@/lib/sleepLogUtils'
import type { LogRecord } from '@/types/babyLog'
import { Spacing } from '@/constants/theme'

const LOG_ROW_HEIGHT = 60
const VISIBLE_ROWS = 7

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: Spacing.three,
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
    letterSpacing: 0.4,
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
  count: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 8,
  },
})

function sortNewestFirst(rows: LogRecord[]): LogRecord[] {
  return [...rows].sort((a, b) => {
    const aIso = a.kind === 'sleep' ? a.details.sleepStartTime || a.atIso : a.atIso
    const bIso = b.kind === 'sleep' ? b.details.sleepStartTime || b.atIso : b.atIso
    return aIso < bIso ? 1 : -1
  })
}

type Props = {
  report: KindReport
  logs: LogRecord[]
  rangeDays: ReportRange
}

export function ReportLogTable({ report, logs, rangeDays }: Props) {
  const styles = useThemedStyles(createStyles)

  let rows = sortNewestFirst(filterLogsForKindReport(logs, report.kind, rangeDays))
  if (report.kind === 'sleep') {
    rows = rows.filter((log) => parseSleepInterval(log) != null)
  }

  if (rows.length === 0) return null

  const renderSleepRow = (log: LogRecord) => {
    const startIso = log.details.sleepStartTime?.trim() || ''
    const endIso = log.details.sleepEndTime?.trim() || ''
    const start = startIso ? formatSleepUtcStamp(startIso) : { date: '—', time: '' }
    const end = endIso ? formatSleepUtcStamp(endIso) : { date: '—', time: '' }
    const notes = [log.details.isNap === 'true' ? 'Nap' : '', log.details.sleepMood, log.details.sleepEnvironment]
      .map((v) => v?.trim())
      .filter(Boolean)
      .join(' · ')

    return (
      <View key={log.id} style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.primary}>{start.date}</Text>
          <Text style={styles.secondary}>{start.time}</Text>
        </View>
        <View style={styles.cell}>
          {endIso ? (
            <>
              <Text style={styles.primary}>{end.date}</Text>
              <Text style={styles.secondary}>{end.time}</Text>
            </>
          ) : (
            <Text style={styles.primary}>—</Text>
          )}
        </View>
        <View style={styles.cell}>
          <Text style={styles.primary}>{formatSleepDurationDisplay(log)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.primary}>{log.details.isNap === 'true' ? 'Nap' : 'Night sleep'}</Text>
          {notes ? <Text style={styles.secondary}>{notes}</Text> : null}
        </View>
      </View>
    )
  }

  const renderFeedingRow = (log: LogRecord) => {
    const at = log.details.feedingAt?.trim() || log.atIso
    const { date, time } = formatFeedingStamp(at)
    return (
      <View key={log.id} style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.primary}>{date}</Text>
          <Text style={styles.secondary}>{time}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.primary}>{feedingTypeLabel(log.details.feedingType ?? '')}</Text>
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.primary}>{formatFeedingSummary(log)}</Text>
        </View>
      </View>
    )
  }

  const renderDiaperRow = (log: LogRecord) => {
    const at = log.details.time?.trim() || log.atIso
    const { date, time } = formatDiaperLogStamp(at)
    const mix = diaperMixType(log)
    const headline = diaperMixHeadline(mix)
    const extra = log.details.anythingElseDescription?.trim()
    const details = [headline, extra].filter(Boolean).join(' · ')

    return (
      <View key={log.id} style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.primary}>{date}</Text>
          <Text style={styles.secondary}>{time}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.primary}>{headline}</Text>
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.primary}>{details}</Text>
        </View>
      </View>
    )
  }

  const header =
    report.kind === 'sleep' ? (
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Fell asleep</Text>
        <Text style={styles.headerCell}>Woke up</Text>
        <Text style={styles.headerCell}>Duration</Text>
        <Text style={styles.headerCell}>Type</Text>
      </View>
    ) : report.kind === 'feeding' ? (
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>When</Text>
        <Text style={styles.headerCell}>Type</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Details</Text>
      </View>
    ) : (
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>When</Text>
        <Text style={styles.headerCell}>Change</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Details</Text>
      </View>
    )

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Logged entries</Text>
      <Text style={styles.sub}>
        {report.kind === 'sleep'
          ? 'Every sleep session in this period — same times as on the Sleep track page.'
          : `All ${report.title.toLowerCase()} logs in this period, newest first.`}
      </Text>
      <View style={styles.table}>
        {header}
        <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator>
          {rows.map((log) =>
            report.kind === 'sleep'
              ? renderSleepRow(log)
              : report.kind === 'feeding'
                ? renderFeedingRow(log)
                : renderDiaperRow(log),
          )}
        </ScrollView>
      </View>
      <Text style={styles.count}>{rows.length} entries</Text>
    </View>
  )
}
