import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { DateTimeField } from '@/components/ui/DateTimeField'
import { filterSleepLogs } from '@/lib/sleepLogUtils'
import { logRecordKey } from '@/lib/trackUtils'
import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

import { SleepLogCard } from './SleepLogCard'

type Props = {
  logs: LogRecord[]
  babies: Baby[]
  onEditLog?: (log: LogRecord) => void
  onDeleteLog?: (log: LogRecord) => void
  busyLogId?: string
}

const createStyles = (t: AppPalette) => ({
  wrap: { marginTop: Spacing.four },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.two,
    gap: 8,
  },
  title: { ...heading(18, { weight: '800' }), color: t.text },
  count: { fontSize: 13, fontWeight: '700' as const, color: t.textMuted, flexShrink: 1, textAlign: 'right' as const },
  filters: { gap: 10, marginBottom: Spacing.two },
  clear: { alignSelf: 'flex-start' as const, paddingVertical: 6 },
  clearText: { fontSize: 13, fontWeight: '700' as const, color: t.accentDeep },
  empty: { color: t.textMuted, fontSize: 14, lineHeight: 22, paddingVertical: Spacing.two },
})

export function SleepLogsHistory({ logs, babies, onEditLog, onDeleteLog, busyLogId }: Props) {
  const styles = useThemedStyles(createStyles)
  const [babyId, setBabyId] = useState('')
  const [dateYmd, setDateYmd] = useState('')

  const filtered = useMemo(() => {
    const rows = filterSleepLogs(logs, { babyId, dateYmd }, babies)
    return [...rows].sort((a, b) => {
      const aStart = a.details.sleepStartTime || a.atIso
      const bStart = b.details.sleepStartTime || b.atIso
      return aStart < bStart ? 1 : -1
    })
  }, [logs, babyId, dateYmd, babies])

  const hasFilters = Boolean(babyId || dateYmd)

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.count}>
          {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}
          {hasFilters ? ' matching filters' : ''}
        </Text>
      </View>

      <View style={styles.filters}>
        <DateTimeField
          label="Sleep date"
          mode="date"
          value={dateYmd}
          onChange={setDateYmd}
          placeholder="Filter by date"
        />
        {hasFilters ? (
          <Pressable onPress={() => { setBabyId(''); setDateYmd('') }} style={styles.clear}>
            <Text style={styles.clearText}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      {!filtered.length ? (
        <Text style={styles.empty}>
          {hasFilters ? 'No sleep sessions match these filters.' : 'No sleep logged yet.'}
        </Text>
      ) : (
        filtered.map((log, index) => (
          <SleepLogCard
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
