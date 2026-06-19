import { Pressable, Text, View } from 'react-native'

import { Card } from '@/components/ui/primitives'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import {
  feedingTypeLabel,
  formatFeedingStamp,
  formatFeedingSummary,
} from '@/lib/feedingLogUtils'
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
    color: t.textMuted,
    lineHeight: 20,
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
    fontSize: 14,
    fontWeight: '800' as const,
    color: t.text,
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

export function FeedingLogCard({ log, onEditLog, onDeleteLog, busy = false }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('feeding', palette)
  const styles = useThemedStyles(createStyles)
  const at = log.details.feedingAt || log.atIso
  const { date, time } = formatFeedingStamp(at)
  const babyName = log.details.babyName?.trim()

  return (
    <Card style={styles.logCard}>
      <View style={styles.row}>
        <View style={styles.main}>
          <View style={[styles.typeBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Text style={[styles.typeText, { color: theme.accent }]}>
              {feedingTypeLabel(log.details.feedingType ?? '')}
            </Text>
          </View>
          {babyName ? <Text style={[styles.baby, { color: theme.accent }]}>{babyName}</Text> : null}
          <Text style={styles.detail}>{formatFeedingSummary(log)}</Text>
        </View>
        <View style={styles.aside}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.time}>{time}</Text>
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
