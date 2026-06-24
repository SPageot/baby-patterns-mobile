import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import { TrackingMediaThumb } from '@/components/growth/TrackingMediaThumb'
import { Button } from '@/components/ui/primitives'
import { DAILY_MEMORY_THEME, dailyMemoryPrimaryButtonStyle } from '@/constants/dailyMemoryTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import type { DailyMemory } from '@/schemas/dailyMemory'
import {
  addCalendarDays,
  formatDayLabel,
  parseYmd,
  startOfWeekMonday,
  ymdFromDate,
} from '@/lib/trackUtils'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

type MemoryRow = DailyMemory & { babyName?: string }

type Props = {
  memoriesByDate: Map<string, MemoryRow[]>
  selectedYmd: string
  onSelectDay: (ymd: string) => void
  selectedDayMemories: MemoryRow[]
  showBabyName?: boolean
  onAddMemory: (ymd: string) => void
  onEditMemory: (memory: MemoryRow) => void
  onDeleteMemory: (id: string) => void
  deleting?: boolean
}

function monthGridCells(year: number, month: number): { ymd: string; inMonth: boolean }[] {
  const first = new Date(year, month - 1, 1)
  const gridStart = startOfWeekMonday(first)
  const cells: { ymd: string; inMonth: boolean }[] = []

  for (let i = 0; i < 42; i += 1) {
    const d = addCalendarDays(gridStart, i)
    cells.push({ ymd: ymdFromDate(d), inMonth: d.getMonth() === month - 1 })
  }

  return cells
}

function memoryPreview(memory: MemoryRow): string {
  const text = memory.title?.trim() || memory.content.trim()
  if (text.length <= 40) return text
  return `${text.slice(0, 37)}…`
}

const createStyles = (t: AppPalette) => ({
  layout: { gap: Spacing.three },
  panel: {
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.two,
  },
  toolbar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.two,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.card2,
  },
  navBtnText: { fontSize: 22, lineHeight: 24, color: t.text },
  range: { flex: 1, alignItems: 'center' as const, paddingHorizontal: 8 },
  rangeLabel: { fontSize: 15, fontWeight: '700' as const, color: t.text },
  todayBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: HomeRadius.pill,
    backgroundColor: DAILY_MEMORY_THEME.accentSoft,
  },
  todayText: { fontSize: 12, fontWeight: '700' as const, color: DAILY_MEMORY_THEME.accent },
  monthHead: { flexDirection: 'row' as const, marginBottom: 6 },
  monthHeadCell: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  monthGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
  monthCell: {
    width: '14.28%' as const,
    minHeight: 52,
    padding: 4,
    alignItems: 'flex-start' as const,
    borderRadius: 8,
  },
  monthCellOutside: { opacity: 0.35 },
  monthCellToday: { borderWidth: 1, borderColor: DAILY_MEMORY_THEME.accent },
  monthCellSelected: { backgroundColor: DAILY_MEMORY_THEME.accentSoft },
  monthCellHasMemory: {
    backgroundColor: 'rgba(91, 61, 184, 0.08)',
  },
  monthDayNum: { fontSize: 13, fontWeight: '700' as const, color: t.text },
  cellPreview: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 2,
    marginTop: 2,
    width: '100%' as const,
  },
  cellText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
    color: t.textMuted,
  },
  cellCount: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: DAILY_MEMORY_THEME.accent,
  },
  dayHead: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: Spacing.two,
  },
  dayTitle: { fontSize: 17, fontWeight: '800' as const, color: t.text },
  daySub: { fontSize: 13, color: t.textMuted, marginTop: 4 },
  addBtn: { flexShrink: 0 },
  empty: { alignItems: 'center' as const, paddingVertical: Spacing.three, gap: 8 },
  emptyText: { fontSize: 14, color: t.textMuted, textAlign: 'center' as const, lineHeight: 20 },
  list: { gap: 10 },
  card: {
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    padding: Spacing.two,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' as const, color: t.text, marginBottom: 4 },
  cardContent: { fontSize: 14, lineHeight: 20, color: t.text },
  cardMeta: { fontSize: 12, color: t.textMuted, marginTop: 6 },
  cardActions: { flexDirection: 'row' as const, gap: 10, marginTop: 10 },
  cardBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  cardBtnText: { fontSize: 13, fontWeight: '600' as const, color: t.text },
  cardBtnDanger: { color: t.error },
})

export function DailyMemoryCalendar({
  memoriesByDate,
  selectedYmd,
  onSelectDay,
  selectedDayMemories,
  showBabyName = false,
  onAddMemory,
  onEditMemory,
  onDeleteMemory,
  deleting,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const todayYmd = ymdFromDate(new Date())
  const [anchor, setAnchor] = useState(() => {
    const selected = parseYmd(selectedYmd)
    return Number.isNaN(selected.getTime()) ? new Date() : new Date(selected.getFullYear(), selected.getMonth(), 1)
  })

  const monthCells = useMemo(
    () => monthGridCells(anchor.getFullYear(), anchor.getMonth() + 1),
    [anchor],
  )

  const headerLabel = anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const goPrev = () => setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goNext = () => setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const goToday = () => {
    const now = new Date()
    onSelectDay(todayYmd)
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  return (
    <View style={styles.layout}>
      <View style={styles.panel}>
        <View style={styles.toolbar}>
          <Pressable style={styles.navBtn} onPress={goPrev} accessibilityLabel="Previous month">
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <View style={styles.range}>
            <Text style={styles.rangeLabel}>{headerLabel}</Text>
            <Pressable style={styles.todayBtn} onPress={goToday}>
              <Text style={styles.todayText}>Today</Text>
            </Pressable>
          </View>
          <Pressable style={styles.navBtn} onPress={goNext} accessibilityLabel="Next month">
            <Text style={styles.navBtnText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.monthHead}>
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} style={styles.monthHeadCell}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.monthGrid}>
          {monthCells.map(({ ymd, inMonth }) => {
            const dayMemories = memoriesByDate.get(ymd) ?? []
            const hasMemory = dayMemories.length > 0
            const isToday = ymd === todayYmd
            const isSelected = ymd === selectedYmd
            const dayNum = parseYmd(ymd).getDate()
            const preview = hasMemory ? memoryPreview(dayMemories[0]) : ''

            return (
              <Pressable
                key={ymd}
                onPress={() => onSelectDay(ymd)}
                style={[
                  styles.monthCell,
                  !inMonth && styles.monthCellOutside,
                  isToday && styles.monthCellToday,
                  isSelected && styles.monthCellSelected,
                  hasMemory && styles.monthCellHasMemory,
                ]}
              >
                <Text style={styles.monthDayNum}>{dayNum}</Text>
                {hasMemory ? (
                  <View style={styles.cellPreview}>
                    <NavIcon name="heart" size={10} color={DAILY_MEMORY_THEME.accent} />
                    {dayMemories.length > 1 ? (
                      <Text style={styles.cellCount}>{dayMemories.length}</Text>
                    ) : (
                      <Text style={styles.cellText} numberOfLines={2}>
                        {preview}
                      </Text>
                    )}
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.dayHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayTitle}>{formatDayLabel(selectedYmd, 'long')}</Text>
            <Text style={styles.daySub}>
              {selectedDayMemories.length === 0
                ? 'No memories for this day yet.'
                : `${selectedDayMemories.length} memor${selectedDayMemories.length === 1 ? 'y' : 'ies'}`}
            </Text>
          </View>
          <Button
            title="Add memory"
            onPress={() => onAddMemory(selectedYmd)}
            style={[dailyMemoryPrimaryButtonStyle, styles.addBtn]}
          />
        </View>

        {selectedDayMemories.length === 0 ? (
          <View style={styles.empty}>
            <NavIcon name="heart" size={28} color={DAILY_MEMORY_THEME.accent} />
            <Text style={styles.emptyText}>
              Capture a sweet moment — first laugh, new word, or something that made you smile.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {selectedDayMemories.map((memory) => (
              <View key={memory.id} style={styles.card}>
                {memory.title ? <Text style={styles.cardTitle}>{memory.title}</Text> : null}
                {memory.mediaUrl ? (
                  <TrackingMediaThumb
                    url={memory.mediaUrl}
                    mediaType={memory.mediaType}
                  />
                ) : null}
                <Text style={styles.cardContent}>{memory.content}</Text>
                {showBabyName && memory.babyName ? (
                  <Text style={styles.cardMeta}>{memory.babyName}</Text>
                ) : null}
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.cardBtn}
                    onPress={() => onEditMemory(memory)}
                    disabled={deleting}
                  >
                    <Text style={styles.cardBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.cardBtn}
                    onPress={() => onDeleteMemory(memory.id)}
                    disabled={deleting}
                  >
                    <Text style={[styles.cardBtnText, styles.cardBtnDanger]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
