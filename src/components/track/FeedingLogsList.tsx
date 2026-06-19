import { Text, View } from 'react-native'

import { filterLogsForToday, logRecordKey } from '@/lib/trackUtils'
import type { LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

import { FeedingLogCard } from './FeedingLogCard'

type Props = {
  logs: LogRecord[]
  onEditLog?: (log: LogRecord) => void
  onDeleteLog?: (log: LogRecord) => void
  busyLogId?: string
}

const createStyles = (t: AppPalette) => ({
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.two,
  },
  title: {
    ...heading(18, { weight: '800' }),
    color: t.text,
  },
  count: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  empty: {
    color: t.textMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: Spacing.two,
  },
})

export function FeedingLogsList({ logs, onEditLog, onDeleteLog, busyLogId }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('feeding', palette)
  const styles = useThemedStyles(createStyles)
  const today = filterLogsForToday(logs, 'feeding')
  const recent = [...today].sort((a, b) => (a.atIso < b.atIso ? 1 : -1))

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Today&apos;s feeds</Text>
        <Text style={[styles.count, { color: theme.accent }]}>{recent.length} today</Text>
      </View>

      {!recent.length ? (
        <Text style={styles.empty}>No feeds logged today—tap the button above to add one.</Text>
      ) : (
        recent.map((log, index) => (
          <FeedingLogCard
            key={logRecordKey(log, index)}
            log={log}
            onEditLog={onEditLog}
            onDeleteLog={onDeleteLog}
            busy={busyLogId === log.id}
          />
        ))
      )}
    </View>
  )
}
