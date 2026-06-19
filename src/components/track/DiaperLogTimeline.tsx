import { Text, View } from 'react-native'

import { DiaperLogCard } from '@/components/track/DiaperLogCard'
import { logRecordKey } from '@/lib/trackUtils'
import type { LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  logs: LogRecord[]
  emptyMessage?: string
  onEditLog?: (log: LogRecord) => void
  onDeleteLog?: (log: LogRecord) => void
  busyLogId?: string
}

const createStyles = (t: AppPalette) => ({
  empty: {
    color: t.textMuted,
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: Spacing.two,
  },
  entry: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: Spacing.three,
  },
  rail: {
    width: 16,
    alignItems: 'center' as const,
    paddingTop: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: t.card,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
  },
})

export function DiaperLogTimeline({
  logs,
  emptyMessage = 'No diaper changes to show.',
  onEditLog,
  onDeleteLog,
  busyLogId,
}: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('diaper', palette)
  const styles = useThemedStyles(createStyles)

  if (!logs.length) {
    return <Text style={styles.empty}>{emptyMessage}</Text>
  }

  return (
    <>
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1
        const busy = busyLogId === log.id

        return (
          <View key={logRecordKey(log, index)} style={styles.entry}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: theme.accent }]} />
              {!isLast ? <View style={[styles.line, { backgroundColor: theme.accentBorder }]} /> : null}
            </View>
            <DiaperLogCard
              log={log}
              onEditLog={onEditLog}
              onDeleteLog={onDeleteLog}
              busy={busy}
            />
          </View>
        )
      })}
    </>
  )
}
