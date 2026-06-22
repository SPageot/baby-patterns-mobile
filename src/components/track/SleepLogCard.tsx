import { Pressable, Text, View } from 'react-native'

import { Card } from '@/components/ui/primitives'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { formatSleepDurationDisplay, formatSleepUtcStamp } from '@/lib/sleepLogUtils'
import type { LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  log: LogRecord
  onEditLog?: (log: LogRecord) => void
  onDeleteLog?: (log: LogRecord) => void
  busy?: boolean
}

const createStyles = (t: AppPalette) => ({
  logCard: {
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 8,
  },
  main: {
    flex: 1,
    gap: 6,
  },
  typeBadge: {
    alignSelf: 'flex-start' as const,
    borderWidth: 1,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '800' as const,
  },
  baby: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  detail: {
    fontSize: 13,
    color: t.text,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  meta: {
    fontSize: 12,
    color: t.textMuted,
    lineHeight: 18,
  },
  aside: {
    alignItems: 'flex-end' as const,
  },
  date: {
    fontSize: 12,
    color: t.textMuted,
    textAlign: 'right' as const,
  },
  time: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: 2,
    textAlign: 'right' as const,
  },
  utc: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: t.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  deleteText: {
    color: '#b42318',
  },
  pressed: {
    opacity: 0.7,
  },
})

export function SleepLogCard({ log, onEditLog, onDeleteLog, busy = false }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('sleep', palette)
  const styles = useThemedStyles(createStyles)
  const startIso = log.details.sleepStartTime || log.details.start || log.atIso
  const endIso = log.details.sleepEndTime || log.details.end || ''
  const { date, time: startTime } = formatSleepUtcStamp(startIso)
  const endTime = endIso ? formatSleepUtcStamp(endIso).time : ''
  const babyName = log.details.babyName?.trim()

  return (
    <Card style={styles.logCard}>
      <View style={styles.row}>
        <View style={styles.main}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <View style={[styles.typeBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Text style={[styles.typeText, { color: theme.accent }]}>Sleep</Text>
            </View>
            {log.details.isNap === 'true' ? (
              <View style={[styles.typeBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                <Text style={[styles.typeText, { color: theme.accent }]}>Nap</Text>
              </View>
            ) : null}
          </View>
          {babyName ? <Text style={[styles.baby, { color: theme.accent }]}>{babyName}</Text> : null}
          <Text style={styles.detail}>
            {formatSleepDurationDisplay(log)}
            {log.details.sleepMood?.trim() ? ` · ${log.details.sleepMood.trim()}` : ''}
          </Text>
          <Text style={styles.meta}>{log.details.sleepEnvironment?.trim() || '—'}</Text>
        </View>
        <View style={styles.aside}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.time}>
            {startTime}
            {endIso ? ` – ${endTime}` : ' · In progress'}
          </Text>
          <Text style={styles.utc}>UTC</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onEditLog ? (
          <Pressable
            onPress={() => onEditLog(log)}
            disabled={busy}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
        ) : null}
        {onDeleteLog ? (
          <Pressable
            onPress={() => onDeleteLog(log)}
            disabled={busy}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          >
            <Text style={[styles.actionText, styles.deleteText]}>{busy ? 'Deleting…' : 'Delete'}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  )
}
