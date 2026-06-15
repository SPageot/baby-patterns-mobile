import { Pressable, Text, View } from 'react-native'

import { Card } from '@/components/ui/primitives'
import {
  formatDiaperLogStamp,
  getDiaperContentBadges,
  getDiaperLogMeta,
} from '@/lib/diaperFeedUtils'
import { filterLogsForToday, logRecordKey } from '@/lib/trackUtils'
import type { LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

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
    fontSize: 18,
    fontWeight: '800' as const,
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
  entry: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: Spacing.two,
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
  logCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 8,
  },
  time: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: t.text,
  },
  date: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  baby: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  badges: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  meta: {
    gap: 2,
    marginBottom: 8,
  },
  metaLine: {
    fontSize: 13,
    color: t.textMuted,
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

export function DiaperLogsList({ logs, onEditLog, onDeleteLog, busyLogId }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('diaper', palette)
  const styles = useThemedStyles(createStyles)
  const today = filterLogsForToday(logs, 'diaper')
  const recent = [...today].sort((a, b) => (a.atIso < b.atIso ? 1 : -1))

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Today&apos;s changes</Text>
        <Text style={[styles.count, { color: theme.accent }]}>{recent.length} today</Text>
      </View>

      {!recent.length ? (
        <Text style={styles.empty}>
          No diaper changes logged today—tap the button above to add one.
        </Text>
      ) : (
        recent.map((log, index) => {
          const { date, time } = formatDiaperLogStamp(log.atIso)
          const babyName = log.details.babyName?.trim()
          const badges = getDiaperContentBadges(log.details)
          const meta = getDiaperLogMeta(log.details)
          const isLast = index === recent.length - 1
          const busy = busyLogId === log.id

          return (
            <View key={logRecordKey(log, index)} style={styles.entry}>
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                {!isLast ? <View style={[styles.line, { backgroundColor: theme.accentBorder }]} /> : null}
              </View>

              <Card style={styles.logCard}>
                <View style={styles.cardHead}>
                  <View>
                    <Text style={styles.time}>{time}</Text>
                    <Text style={styles.date}>{date}</Text>
                  </View>
                  {babyName ? <Text style={[styles.baby, { color: theme.accent }]}>{babyName}</Text> : null}
                </View>

                <View style={styles.badges}>
                  {badges.map((label) => (
                    <View
                      key={label}
                      style={[
                        styles.badge,
                        { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: theme.accent }]}>{label}</Text>
                    </View>
                  ))}
                </View>

                {meta.length ? (
                  <View style={styles.meta}>
                    {meta.map((item) => (
                      <Text key={`${item.label}-${item.value}`} style={styles.metaLine}>
                        {item.label}: {item.value}
                      </Text>
                    ))}
                  </View>
                ) : null}

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
                      <Text style={[styles.actionText, styles.deleteText]}>
                        {busy ? 'Deleting…' : 'Delete'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            </View>
          )
        })
      )}
    </View>
  )
}
