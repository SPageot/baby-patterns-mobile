import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import { DateTimeField } from '@/components/ui/DateTimeField'
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

type CalendarView = 'day' | 'week' | 'month'

type MemoryRow = DailyMemory & { babyName?: string }

type Props = {
  memoriesByDate: Map<string, MemoryRow[]>
  selectedYmd: string
  onSelectDay: (ymd: string) => void
  onChangeDay?: (ymd: string) => void
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

function formatRangeLabel(startYmd: string, endYmd: string): string {
  const start = parseYmd(startYmd)
  const end = parseYmd(endYmd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startYmd} – ${endYmd}`

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

const createStyles = (t: AppPalette) => ({
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.two,
  },
  viewToggle: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    alignItems: 'center' as const,
  },
  viewBtnActive: {
    borderColor: DAILY_MEMORY_THEME.accent,
    backgroundColor: DAILY_MEMORY_THEME.accentSoft,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  viewBtnTextActive: {
    color: DAILY_MEMORY_THEME.accent,
    fontWeight: '800' as const,
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
  rangeLabel: { fontSize: 14, fontWeight: '700' as const, color: t.text, textAlign: 'center' as const },
  todayBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
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
  weekGrid: { flexDirection: 'row' as const, gap: 6 },
  weekDay: {
    flex: 1,
    minHeight: 72,
    padding: 6,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    alignItems: 'center' as const,
  },
  weekDayToday: { borderColor: DAILY_MEMORY_THEME.accent },
  weekDaySelected: { backgroundColor: DAILY_MEMORY_THEME.accentSoft },
  weekDayHasMemory: { backgroundColor: 'rgba(91, 61, 184, 0.08)' },
  weekday: { fontSize: 10, fontWeight: '700' as const, color: t.textMuted },
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
    textAlign: 'center' as const,
  },
  cellCount: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: DAILY_MEMORY_THEME.accent,
  },
  dayPanel: {
    gap: Spacing.two,
    paddingTop: 4,
  },
  daySummary: {
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    padding: Spacing.three,
    alignItems: 'center' as const,
    gap: 8,
  },
  daySummaryTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: t.text,
    textAlign: 'center' as const,
  },
  daySummarySub: {
    fontSize: 14,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  dayHint: {
    fontSize: 13,
    color: t.textMuted,
    lineHeight: 20,
  },
})

export function DailyMemoryCalendar({
  memoriesByDate,
  selectedYmd,
  onSelectDay,
  onChangeDay,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const todayYmd = ymdFromDate(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [anchor, setAnchor] = useState(() => {
    const selected = parseYmd(selectedYmd)
    return Number.isNaN(selected.getTime()) ? new Date() : new Date(selected.getFullYear(), selected.getMonth(), 1)
  })

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(anchor)
    return Array.from({ length: 7 }, (_, i) => ymdFromDate(addCalendarDays(start, i)))
  }, [anchor])

  const monthCells = useMemo(
    () => monthGridCells(anchor.getFullYear(), anchor.getMonth() + 1),
    [anchor],
  )

  const selectedDayMemories = memoriesByDate.get(selectedYmd) ?? []

  const headerLabel = useMemo(() => {
    if (view === 'week') return formatRangeLabel(weekDays[0], weekDays[6])
    if (view === 'month') {
      return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    return formatDayLabel(selectedYmd, 'long')
  }, [view, weekDays, anchor, selectedYmd])

  const pickDay = (ymd: string, openModal = true) => {
    onChangeDay?.(ymd)
    setAnchor(parseYmd(ymd))
    if (openModal) onSelectDay(ymd)
  }

  const goPrev = () => {
    if (view === 'week') {
      setAnchor((prev) => addCalendarDays(prev, -7))
      return
    }
    if (view === 'month') {
      setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
      return
    }
    const prevYmd = ymdFromDate(addCalendarDays(parseYmd(selectedYmd), -1))
    pickDay(prevYmd, false)
  }

  const goNext = () => {
    if (view === 'week') {
      setAnchor((prev) => addCalendarDays(prev, 7))
      return
    }
    if (view === 'month') {
      setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
      return
    }
    const nextYmd = ymdFromDate(addCalendarDays(parseYmd(selectedYmd), 1))
    pickDay(nextYmd, false)
  }

  const goToday = () => {
    const now = new Date()
    onChangeDay?.(todayYmd)
    if (view === 'week') {
      setAnchor(startOfWeekMonday(now))
    } else if (view === 'month') {
      setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
    } else {
      setAnchor(now)
    }
  }

  const switchView = (next: CalendarView) => {
    setView(next)
    const selected = parseYmd(selectedYmd)
    if (Number.isNaN(selected.getTime())) return
    if (next === 'week') {
      setAnchor(startOfWeekMonday(selected))
    } else if (next === 'month') {
      setAnchor(new Date(selected.getFullYear(), selected.getMonth(), 1))
    } else {
      setAnchor(selected)
    }
  }

  const renderMemoryCell = (ymd: string, compact = false) => {
    const dayMemories = memoriesByDate.get(ymd) ?? []
    if (!dayMemories.length) return null
    const preview = memoryPreview(dayMemories[0])
    return (
      <View style={styles.cellPreview}>
        <NavIcon name="memories" size={compact ? 10 : 12} color={DAILY_MEMORY_THEME.accent} />
        {dayMemories.length > 1 ? (
          <Text style={styles.cellCount}>{dayMemories.length}</Text>
        ) : (
          <Text style={styles.cellText} numberOfLines={compact ? 2 : 3}>
            {preview}
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={styles.panel}>
      <View style={styles.viewToggle}>
        {(['day', 'week', 'month'] as const).map((mode) => {
          const active = view === mode
          return (
            <Pressable
              key={mode}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => switchView(mode)}
              style={[styles.viewBtn, active && styles.viewBtnActive]}
            >
              <Text style={[styles.viewBtnText, active && styles.viewBtnTextActive]}>
                {mode === 'day' ? 'Day' : mode === 'week' ? 'Week' : 'Month'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.toolbar}>
        <Pressable
          style={styles.navBtn}
          onPress={goPrev}
          accessibilityLabel={
            view === 'week' ? 'Previous week' : view === 'month' ? 'Previous month' : 'Previous day'
          }
        >
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <View style={styles.range}>
          <Text style={styles.rangeLabel}>{headerLabel}</Text>
          <Pressable style={styles.todayBtn} onPress={goToday}>
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.navBtn}
          onPress={goNext}
          accessibilityLabel={view === 'week' ? 'Next week' : view === 'month' ? 'Next month' : 'Next day'}
        >
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      {view === 'month' ? (
        <>
          <View style={styles.monthHead}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.monthHeadCell}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthCells.map(({ ymd, inMonth }) => {
              const hasMemory = (memoriesByDate.get(ymd) ?? []).length > 0
              const isToday = ymd === todayYmd
              const isSelected = ymd === selectedYmd
              const dayNum = parseYmd(ymd).getDate()

              return (
                <Pressable
                  key={ymd}
                  onPress={() => pickDay(ymd)}
                  style={[
                    styles.monthCell,
                    !inMonth && styles.monthCellOutside,
                    isToday && styles.monthCellToday,
                    isSelected && styles.monthCellSelected,
                    hasMemory && styles.monthCellHasMemory,
                  ]}
                >
                  <Text style={styles.monthDayNum}>{dayNum}</Text>
                  {renderMemoryCell(ymd, true)}
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      {view === 'week' ? (
        <>
          <View style={styles.monthHead}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.monthHeadCell}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.weekGrid}>
            {weekDays.map((ymd, index) => {
              const hasMemory = (memoriesByDate.get(ymd) ?? []).length > 0
              const isToday = ymd === todayYmd
              const isSelected = ymd === selectedYmd
              const dayNum = parseYmd(ymd).getDate()

              return (
                <Pressable
                  key={ymd}
                  onPress={() => pickDay(ymd)}
                  style={[
                    styles.weekDay,
                    isToday && styles.weekDayToday,
                    isSelected && styles.weekDaySelected,
                    hasMemory && styles.weekDayHasMemory,
                  ]}
                >
                  <Text style={styles.weekday}>{WEEKDAY_LABELS[index]}</Text>
                  <Text style={styles.monthDayNum}>{dayNum}</Text>
                  {renderMemoryCell(ymd)}
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      {view === 'day' ? (
        <View style={styles.dayPanel}>
          <DateTimeField
            label="Choose a day"
            mode="date"
            zone="local"
            value={selectedYmd}
            onChange={(ymd) => pickDay(ymd, false)}
          />
          {selectedDayMemories.length === 0 ? (
            <Button
              title="Add memory"
              onPress={() => onSelectDay(selectedYmd)}
              style={dailyMemoryPrimaryButtonStyle}
            />
          ) : (
            <View style={styles.daySummary}>
              <NavIcon name="memories" size={28} color={DAILY_MEMORY_THEME.accent} />
              <Text style={styles.daySummaryTitle}>{formatDayLabel(selectedYmd, 'long')}</Text>
              <Text style={styles.daySummarySub}>
                {selectedDayMemories.length} memor{selectedDayMemories.length === 1 ? 'y' : 'ies'}
              </Text>
              <Text style={styles.daySummarySub} numberOfLines={3}>
                {memoryPreview(selectedDayMemories[0])}
              </Text>
              <Button
                title="View memories"
                onPress={() => onSelectDay(selectedYmd)}
                style={dailyMemoryPrimaryButtonStyle}
              />
            </View>
          )}
          <Text style={styles.dayHint}>
            Use the arrows above to move day by day, or pick a date from the calendar.
          </Text>
        </View>
      ) : null}
    </View>
  )
}
