import { Pressable, Text, View } from 'react-native'

import { Card } from '@/components/ui/primitives'
import {
  formatBehaviorLogStamp,
  getBehaviorContentBadges,
  getBehaviorLogMeta,
} from '@/lib/behaviorLogUtils'
import type { LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Props = {
  log: LogRecord
  onEditLog?: (log: LogRecord) => void
  onDeleteLog?: (log: LogRecord) => void
  busy?: boolean
}

const createStyles = (t: AppPalette) => ({
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

export function BehaviorLogCard({ log, onEditLog, onDeleteLog, busy = false }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('behavior', palette)
  const styles = useThemedStyles(createStyles)
  const { date, time } = formatBehaviorLogStamp(
    log.details.occurredOn || '',
    log.details.occurredTime,
  )
  const babyName = log.details.babyName?.trim()
  const badges = getBehaviorContentBadges(log.details)
  const meta = getBehaviorLogMeta(log.details)

  return (
    <Card style={styles.logCard}>
      <View style={styles.cardHead}>
        <View>
          {time ? <Text style={styles.time}>{time}</Text> : null}
          <Text style={styles.date}>{date}</Text>
        </View>
        {babyName ? <Text style={[styles.baby, { color: theme.accent }]}>{babyName}</Text> : null}
      </View>

      <View style={styles.badges}>
        {badges.map((label) => (
          <View
            key={label}
            style={[styles.badge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}
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
            <Text style={[styles.actionText, styles.deleteText]}>{busy ? 'Deleting…' : 'Delete'}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  )
}
