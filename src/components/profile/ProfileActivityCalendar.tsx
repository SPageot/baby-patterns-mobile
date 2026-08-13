import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import { TourTarget } from '@/components/onboarding/TourTarget'
import type { LogRecord } from '@/types/babyLog'
import type { InjuryEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import {
  addCalendarDays,
  buildDailyCountsMap,
  formatDayLabel,
  formatSleepDurationShort,
  getDailyCounts,
  parseYmd,
  startOfWeekMonday,
  type DailyKindCounts,
  ymdFromDate,
} from '@/lib/trackUtils'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type CalendarView = 'week' | 'month' | 'day'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

type Props = {
  logs: LogRecord[]
  injuries?: InjuryEventDto[]
  pediatricianVisits?: PediatricianVisitDto[]
}

function hasActivity(row: DailyKindCounts): boolean {
  return (
    row.diapers > 0 ||
    row.sleepMinutes > 0 ||
    row.sleep > 0 ||
    row.feeding > 0 ||
    row.potty > 0 ||
    row.injuries > 0 ||
    row.pediatricianVisits > 0
  )
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

function DayMetrics({
  counts,
  compact = false,
  styles,
  colors,
}: {
  counts: DailyKindCounts
  compact?: boolean
  styles: ReturnType<typeof createStyles>
  colors: AppPalette
}) {
  if (!hasActivity(counts)) {
    return compact ? null : <Text style={styles.emptyDay}>No activity</Text>
  }

  return (
    <View style={[styles.metrics, compact && styles.metricsCompact]}>
      {counts.diapers > 0 ? (
        <View style={styles.metric}>
          <NavIcon name="diaper" size={12} color={colors.textMuted} />
          <Text style={styles.metricText}>{counts.diapers}</Text>
        </View>
      ) : null}
      {counts.sleepMinutes > 0 || counts.sleep > 0 ? (
        <View style={styles.metric}>
          <NavIcon name="moon" size={12} color={colors.textMuted} />
          <Text style={styles.metricText}>
            {counts.sleepMinutes > 0
              ? formatSleepDurationShort(counts.sleepMinutes)
              : `${counts.sleep}`}
          </Text>
        </View>
      ) : null}
      {counts.feeding > 0 ? (
        <View style={styles.metric}>
          <NavIcon name="bottle" size={12} color={colors.textMuted} />
          <Text style={styles.metricText}>{counts.feeding}</Text>
        </View>
      ) : null}
      {counts.potty > 0 ? (
        <View style={styles.metric}>
          <NavIcon name="potty" size={12} color={colors.textMuted} />
          <Text style={styles.metricText}>{counts.potty}</Text>
        </View>
      ) : null}
      {counts.injuries > 0 ? (
        <View style={styles.metric}>
          <NavIcon name="health" size={12} color={colors.textMuted} />
          <Text style={styles.metricText}>{counts.injuries}</Text>
        </View>
      ) : null}
      {counts.pediatricianVisits > 0 ? (
        <View style={styles.metric}>
          <NavIcon name="hospital" size={12} color={colors.textMuted} />
          <Text style={styles.metricText}>{counts.pediatricianVisits}</Text>
        </View>
      ) : null}
    </View>
  )
}

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: Spacing.one,
  },
  head: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: t.text,
  },
  sub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  viewBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  viewBtnTextActive: {
    color: t.accentDeep,
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
  navBtnText: {
    fontSize: 22,
    color: t.text,
    lineHeight: 24,
  },
  range: {
    flex: 1,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
    textAlign: 'center' as const,
  },
  todayBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: HomeRadius.pill,
    backgroundColor: t.accentSoft,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  weekHead: {
    flexDirection: 'row' as const,
    marginBottom: 6,
  },
  weekHeadCell: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  weekGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  weekDay: {
    width: '13%' as const,
    minWidth: 44,
    flexGrow: 1,
    padding: 8,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    alignItems: 'center' as const,
  },
  weekDayToday: {
    borderColor: t.accentDeep,
  },
  weekDaySelected: {
    backgroundColor: t.accentSoft,
    borderColor: t.accentDeep,
  },
  weekDayActive: {
    borderColor: t.stroke,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: t.text,
  },
  weekday: {
    fontSize: 10,
    color: t.textMuted,
    marginBottom: 2,
  },
  monthHead: {
    flexDirection: 'row' as const,
    marginBottom: 6,
  },
  monthHeadCell: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  monthGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  monthCell: {
    width: '14.28%' as const,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    borderRadius: 8,
  },
  monthCellOutside: {
    opacity: 0.35,
  },
  monthCellToday: {
    borderWidth: 1,
    borderColor: t.accentDeep,
  },
  monthCellSelected: {
    backgroundColor: t.accentSoft,
  },
  monthCellActive: {
    backgroundColor: t.card2,
  },
  monthDayNum: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.text,
  },
  dayStats: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  dayStat: {
    flexGrow: 1,
    flexBasis: '30%' as const,
    minWidth: 96,
    padding: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    alignItems: 'center' as const,
  },
  dayStatValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: t.text,
    marginTop: 8,
  },
  dayStatLabel: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  dayStatMeta: {
    fontSize: 11,
    color: t.textMuted,
    marginTop: 4,
  },
  dayEmpty: {
    fontSize: 14,
    color: t.textMuted,
    textAlign: 'center' as const,
    paddingVertical: Spacing.three,
  },
  metrics: {
    marginTop: 6,
    gap: 4,
    alignItems: 'center' as const,
  },
  metricsCompact: {
    marginTop: 2,
  },
  metric: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  metricText: {
    fontSize: 10,
    color: t.textMuted,
  },
  emptyDay: {
    fontSize: 11,
    color: t.textMuted,
    marginTop: 4,
  },
})

export function ProfileActivityCalendar({
  logs,
  injuries = [],
  pediatricianVisits = [],
}: Props) {
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const todayYmd = ymdFromDate(new Date())
  const dailyMap = useMemo(
    () => buildDailyCountsMap(logs, injuries, pediatricianVisits),
    [logs, injuries, pediatricianVisits],
  )

  const [view, setView] = useState<CalendarView>('week')
  const [anchor, setAnchor] = useState(() => startOfWeekMonday(new Date()))
  const [selectedYmd, setSelectedYmd] = useState(todayYmd)

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(anchor)
    return Array.from({ length: 7 }, (_, i) => ymdFromDate(addCalendarDays(start, i)))
  }, [anchor])

  const monthYear = anchor.getFullYear()
  const monthIndex = anchor.getMonth() + 1
  const monthCells = useMemo(
    () => monthGridCells(monthYear, monthIndex),
    [monthYear, monthIndex],
  )

  const selectedCounts = getDailyCounts(dailyMap, selectedYmd)

  const headerLabel = useMemo(() => {
    if (view === 'week') return formatRangeLabel(weekDays[0], weekDays[6])
    if (view === 'month') {
      return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    return formatDayLabel(selectedYmd, 'long')
  }, [view, weekDays, anchor, selectedYmd])

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
    setSelectedYmd(prevYmd)
    setAnchor(parseYmd(prevYmd))
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
    setSelectedYmd(nextYmd)
    setAnchor(parseYmd(nextYmd))
  }

  const goToday = () => {
    const now = new Date()
    setSelectedYmd(todayYmd)
    if (view === 'week') {
      setAnchor(startOfWeekMonday(now))
    } else if (view === 'month') {
      setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
    } else {
      setAnchor(now)
    }
  }

  const selectDay = (ymd: string) => {
    setSelectedYmd(ymd)
    setAnchor(parseYmd(ymd))
  }

  const switchView = (next: CalendarView) => {
    setView(next)
    const selected = parseYmd(selectedYmd)
    if (next === 'week') {
      setAnchor(startOfWeekMonday(selected))
    } else if (next === 'month') {
      setAnchor(new Date(selected.getFullYear(), selected.getMonth(), 1))
    } else {
      setAnchor(selected)
    }
  }

  return (
    <TourTarget id="profile-activity-calendar">
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Activity calendar</Text>
        <Text style={styles.sub}>
          Sleep, naps, diapers, feeding, potty, injuries, and pediatrician visits across all your babies
        </Text>
      </View>

      <View style={styles.viewToggle}>
        {(['week', 'month', 'day'] as const).map((mode) => {
          const active = view === mode
          return (
            <Pressable
              key={mode}
              onPress={() => switchView(mode)}
              style={[styles.viewBtn, active && styles.viewBtnActive]}
            >
              <Text style={[styles.viewBtnText, active && styles.viewBtnTextActive]}>
                {mode === 'week' ? 'Week' : mode === 'month' ? 'Month' : 'Day'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.toolbar}>
        <Pressable onPress={goPrev} style={styles.navBtn} accessibilityLabel="Previous">
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <View style={styles.range}>
          <Text style={styles.rangeLabel}>{headerLabel}</Text>
          <Pressable onPress={goToday} style={styles.todayBtn}>
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>
        <Pressable onPress={goNext} style={styles.navBtn} accessibilityLabel="Next">
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      {view === 'week' ? (
        <View>
          <View style={styles.weekHead}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekHeadCell}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.weekGrid}>
            {weekDays.map((ymd, index) => {
              const counts = getDailyCounts(dailyMap, ymd)
              const isToday = ymd === todayYmd
              const isSelected = ymd === selectedYmd
              const dayNum = parseYmd(ymd).getDate()
              return (
                <Pressable
                  key={ymd}
                  onPress={() => {
                    selectDay(ymd)
                    setView('day')
                  }}
                  style={[
                    styles.weekDay,
                    isToday && styles.weekDayToday,
                    isSelected && styles.weekDaySelected,
                    hasActivity(counts) && styles.weekDayActive,
                  ]}
                >
                  <Text style={styles.weekday}>{WEEKDAY_LABELS[index]}</Text>
                  <Text style={styles.dayNum}>{dayNum}</Text>
                  <DayMetrics counts={counts} styles={styles} colors={colors} />
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}

      {view === 'month' ? (
        <View>
          <View style={styles.monthHead}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.monthHeadCell}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthCells.map(({ ymd, inMonth }) => {
              const counts = getDailyCounts(dailyMap, ymd)
              const isToday = ymd === todayYmd
              const isSelected = ymd === selectedYmd
              const dayNum = parseYmd(ymd).getDate()
              return (
                <Pressable
                  key={ymd}
                  onPress={() => {
                    selectDay(ymd)
                    setView('day')
                  }}
                  style={[
                    styles.monthCell,
                    !inMonth && styles.monthCellOutside,
                    isToday && styles.monthCellToday,
                    isSelected && styles.monthCellSelected,
                    hasActivity(counts) && styles.monthCellActive,
                  ]}
                >
                  <Text style={styles.monthDayNum}>{dayNum}</Text>
                  <DayMetrics counts={counts} compact styles={styles} colors={colors} />
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}

      {view === 'day' ? (
        <View>
          <View style={styles.dayStats}>
            <View style={styles.dayStat}>
              <NavIcon name="diaper" size={18} color={colors.text} />
              <Text style={styles.dayStatValue}>{selectedCounts.diapers}</Text>
              <Text style={styles.dayStatLabel}>Diaper changes</Text>
            </View>
            <View style={styles.dayStat}>
              <NavIcon name="moon" size={18} color={colors.text} />
              <Text style={styles.dayStatValue}>
                {formatSleepDurationShort(selectedCounts.sleepMinutes)}
              </Text>
              <Text style={styles.dayStatLabel}>Total sleep</Text>
              {selectedCounts.sleep > 0 ? (
                <Text style={styles.dayStatMeta}>
                  {selectedCounts.sleep} log{selectedCounts.sleep === 1 ? '' : 's'}
                </Text>
              ) : null}
            </View>
            <View style={styles.dayStat}>
              <NavIcon name="bottle" size={18} color={colors.text} />
              <Text style={styles.dayStatValue}>{selectedCounts.feeding}</Text>
              <Text style={styles.dayStatLabel}>Feedings</Text>
            </View>
            <View style={styles.dayStat}>
              <NavIcon name="potty" size={18} color={colors.text} />
              <Text style={styles.dayStatValue}>{selectedCounts.potty}</Text>
              <Text style={styles.dayStatLabel}>Potty</Text>
            </View>
            <View style={styles.dayStat}>
              <NavIcon name="health" size={18} color={colors.text} />
              <Text style={styles.dayStatValue}>{selectedCounts.injuries}</Text>
              <Text style={styles.dayStatLabel}>Injuries</Text>
            </View>
            <View style={styles.dayStat}>
              <NavIcon name="hospital" size={18} color={colors.text} />
              <Text style={styles.dayStatValue}>{selectedCounts.pediatricianVisits}</Text>
              <Text style={styles.dayStatLabel}>Pediatrician</Text>
            </View>
          </View>

          {!hasActivity(selectedCounts) ? (
            <Text style={styles.dayEmpty}>No tracking logged for this day.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
    </TourTarget>
  )
}
