import { Text, View } from 'react-native'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { DayRank, HourRank } from '@/lib/reportAnalytics'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  wrap: {
    padding: Spacing.two,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    marginBottom: Spacing.two,
  },
  wrapBest: {
    borderColor: t.mode === 'dark' ? 'rgba(130, 200, 160, 0.35)' : 'rgba(74, 154, 114, 0.35)',
  },
  wrapWorst: {
    borderColor: t.mode === 'dark' ? 'rgba(220, 140, 140, 0.35)' : 'rgba(180, 90, 90, 0.35)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 8,
  },
  empty: {
    fontSize: 13,
    color: t.textMuted,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
  },
  pos: {
    width: 22,
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: t.text,
  },
  value: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
})

type Props = {
  title: string
  rows: DayRank[] | HourRank[]
  emptyText: string
  tone: 'best' | 'worst'
}

export function RankList({ title, rows, emptyText, tone }: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={[styles.wrap, tone === 'best' ? styles.wrapBest : styles.wrapWorst]}>
      <Text style={styles.title}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        rows.map((row, index) => (
          <View key={'date' in row ? row.date : row.id ?? `${row.hour}-${row.label}`} style={styles.row}>
            <Text style={styles.pos}>{index + 1}</Text>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.displayValue}</Text>
          </View>
        ))
      )}
    </View>
  )
}
