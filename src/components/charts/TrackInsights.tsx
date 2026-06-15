import { useMemo } from 'react'
import { Text, View } from 'react-native'
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg'

import { parseSleepDurationMinutes, sleepLogDayKey } from '@/lib/trackUtils'
import type { LogKind, LogRecord } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

function ymdKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeekMonday(today = new Date()) {
  const sod = startOfLocalDay(today)
  const mondayOffset = (sod.getDay() + 6) % 7
  return addDays(sod, -mondayOffset)
}

function formatLabel(key: string) {
  if (key === 'wet') return 'Wet'
  if (key === 'dirty') return 'Dirty'
  if (key === 'mixed') return 'Mixed'
  if (key === 'breast') return 'Breastfeed'
  if (key === 'bottle') return 'Bottle'
  if (key === 'solids') return 'Solids'
  if (key === 'snack') return 'Snack'
  if (key === 'short') return 'Shorter sleep'
  if (key === 'long') return 'Longer sleep'
  if (key === 'unknown') return 'Unknown'
  if (key === 'other') return 'Other'
  return key
}

function diaperMixType(l: LogRecord): 'wet' | 'dirty' | 'mixed' | 'other' {
  if (Object.prototype.hasOwnProperty.call(l.details, 'isTherePee')) {
    const pee = l.details.isTherePee === 'true'
    const poop = l.details.isTherePoop === 'true'
    if (pee && poop) return 'mixed'
    if (pee) return 'wet'
    if (poop) return 'dirty'
    return 'other'
  }
  const dt = (l.details.type ?? 'unknown').toLowerCase()
  if (dt === 'wet' || dt === 'dirty' || dt === 'mixed') return dt
  return 'other'
}

function sleepDurationMinutes(log: LogRecord) {
  const d = log.details
  if (d.sleepDuration != null && d.sleepDuration !== '') {
    return parseSleepDurationMinutes(d.sleepDuration)
  }
  const start = d.sleepStartTime || d.start
  const end = d.sleepEndTime || d.end
  if (!start || !end) return null
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.max(0, (b.getTime() - a.getTime()) / 60000)
}

function sleepBucket(log: LogRecord) {
  const minutes = sleepDurationMinutes(log)
  if (minutes == null || !Number.isFinite(minutes)) return 'unknown' as const
  return minutes < 3 * 60 ? ('short' as const) : ('long' as const)
}

function feedingMixBucket(log: LogRecord): 'breast' | 'bottle' | 'solids' | 'snack' | 'other' {
  const t = (log.details.feedingType ?? '').toLowerCase().trim()
  if (t.startsWith('breast')) return 'breast'
  if (t === 'bottle') return 'bottle'
  if (t === 'solids') return 'solids'
  if (t === 'snack') return 'snack'
  if (t) return 'other'
  return 'other'
}

function feedingLegendColor(key: string): string | undefined {
  switch (key) {
    case 'breast':
      return 'rgba(255, 190, 175, 0.92)'
    case 'bottle':
      return 'rgba(230, 200, 130, 0.95)'
    case 'solids':
      return 'rgba(115, 195, 150, 0.92)'
    case 'snack':
      return 'rgba(180, 170, 220, 0.88)'
    case 'other':
      return 'rgba(160, 170, 195, 0.85)'
    default:
      return undefined
  }
}

function topEntry(counts: Map<string, number>) {
  let best: { key: string; n: number } | null = null
  for (const [k, n] of counts) {
    if (!best || n > best.n) best = { key: k, n }
  }
  return best
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.cardTranslucent,
    padding: Spacing.three,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: t.text,
  },
  headerSub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
  },
  empty: {
    fontSize: 14,
    color: t.textMuted,
    marginTop: Spacing.two,
  },
  card: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: t.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  mixCard: {
    marginBottom: 14,
    padding: 12,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  mixTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
  },
  mixMajority: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
  },
  mixBar: {
    flexDirection: 'row' as const,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden' as const,
    marginTop: 10,
    backgroundColor: t.card2,
  },
  mixLegendRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
  },
  mixLegendKey: {
    fontSize: 13,
    color: t.text,
  },
  mixLegendVal: {
    fontSize: 13,
    color: t.textMuted,
  },
  legendRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 12,
    color: t.textMuted,
  },
})

function MixBar({
  title,
  counts,
  segmentBg,
  styles,
  defaultSegColor,
}: {
  title: string
  counts: Map<string, number>
  segmentBg?: (key: string) => string | undefined
  styles: ReturnType<typeof createStyles>
  defaultSegColor: string
}) {
  const entries = useMemo(() => {
    return [...counts.entries()]
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
  }, [counts])

  const total = useMemo(() => entries.reduce((s, [, n]) => s + n, 0), [entries])
  const majority = useMemo(() => topEntry(counts), [counts])

  if (total === 0) {
    return (
      <View style={styles.mixCard}>
        <Text style={styles.mixTitle}>{title}</Text>
        <Text style={styles.mixMajority}>No data yet</Text>
      </View>
    )
  }

  return (
    <View style={styles.mixCard}>
      <Text style={styles.mixTitle}>{title}</Text>
      {majority ? (
        <Text style={styles.mixMajority}>
          Majority: <Text style={{ fontWeight: '700' }}>{formatLabel(majority.key)}</Text>
        </Text>
      ) : null}

      <View style={styles.mixBar}>
        {entries.map(([k, n], segIdx) => (
          <View
            key={`${k}-${segIdx}`}
            style={{
              flex: n,
              backgroundColor: segmentBg?.(k) ?? defaultSegColor,
            }}
          />
        ))}
      </View>

      {entries.map(([k, n], rowIdx) => (
        <View key={`${k}-${rowIdx}`} style={styles.mixLegendRow}>
          <Text style={styles.mixLegendKey}>{formatLabel(k)}</Text>
          <Text style={styles.mixLegendVal}>
            {n} ({Math.round((n / total) * 100)}%)
          </Text>
        </View>
      ))}
    </View>
  )
}

function WeekdayChart({
  series,
  focusKind,
  colors,
  styles,
}: {
  series: { key: string; diaper: number; feeding: number; sleep: number }[]
  focusKind?: LogKind
  colors: AppPalette
  styles: ReturnType<typeof createStyles>
}) {
  const w = 360
  const h = 200
  const padL = 28
  const padR = 12
  const padT = 12
  const padB = 32

  const innerW = w - padL - padR
  const innerH = h - padT - padB

  const maxY = useMemo(() => {
    let m = 1
    for (const s of series) {
      if (focusKind === 'diaper') m = Math.max(m, s.diaper)
      else if (focusKind === 'feeding') m = Math.max(m, s.feeding)
      else if (focusKind === 'sleep') m = Math.max(m, s.sleep)
      else m = Math.max(m, s.diaper, s.feeding, s.sleep)
    }
    return m
  }, [series, focusKind])

  const tickCount = 4
  const ticks = useMemo(() => {
    return Array.from({ length: tickCount + 1 }).map((_, i) => Math.round((maxY * (tickCount - i)) / tickCount))
  }, [maxY])

  const groupW = innerW / 7
  const innerGroup = groupW * 0.82
  const barCount = focusKind ? 1 : 3
  const barGap = focusKind ? 0 : innerGroup * 0.068
  const barW = focusKind ? innerGroup * 0.55 : (innerGroup - 2 * barGap) / barCount

  const barColors = {
    diaper: colors.mode === 'dark' ? 'rgba(199, 160, 140, 0.95)' : '#a67c68',
    feeding: colors.mode === 'dark' ? 'rgba(130, 200, 160, 0.95)' : '#4a9a72',
    sleep: colors.mode === 'dark' ? 'rgba(130, 175, 255, 0.9)' : '#5a7fd4',
  }

  return (
    <View>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        {ticks.map((t, tickIdx) => {
          const y = padT + innerH * (1 - t / maxY)
          return (
            <G key={`tick-${tickIdx}-${t}`}>
              <Line x1={padL} x2={w - padR} y1={y} y2={y} stroke={colors.strokeSubtle} />
              <SvgText x="6" y={y + 4} fontSize="10" fill={colors.textMuted}>
                {t}
              </SvgText>
            </G>
          )
        })}

        {series.map((s, i) => {
          const xBase = padL + i * groupW + (groupW - innerGroup) / 2
          const barX = focusKind ? xBase + (innerGroup - barW) / 2 : xBase
          const xDiaper = barX
          const xFeed = focusKind ? barX : xBase + barW + barGap
          const xSleep = focusKind ? barX : xBase + 2 * barW + 2 * barGap

          const hDiaper = (s.diaper / maxY) * innerH
          const hFeed = (s.feeding / maxY) * innerH
          const hSleep = (s.sleep / maxY) * innerH

          const baseY = padT + innerH
          const labelX = xBase + innerGroup / 2

          return (
            <G key={s.key}>
              <SvgText x={labelX} y={h - 8} textAnchor="middle" fontSize="11" fill={colors.textMuted}>
                {WEEKDAY_SHORT[i]}
              </SvgText>

              {(!focusKind || focusKind === 'diaper') && (
                <Rect x={xDiaper} y={baseY - hDiaper} width={barW} height={hDiaper} rx={6} fill={barColors.diaper} />
              )}
              {(!focusKind || focusKind === 'feeding') && (
                <Rect x={xFeed} y={baseY - hFeed} width={barW} height={hFeed} rx={6} fill={barColors.feeding} />
              )}
              {(!focusKind || focusKind === 'sleep') && (
                <Rect x={xSleep} y={baseY - hSleep} width={barW} height={hSleep} rx={6} fill={barColors.sleep} />
              )}
            </G>
          )
        })}
      </Svg>

      <View style={styles.legendRow}>
        {(!focusKind || focusKind === 'diaper') && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: barColors.diaper }]} />
            <Text style={styles.legendLabel}>Diapers</Text>
          </View>
        )}
        {(!focusKind || focusKind === 'feeding') && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: barColors.feeding }]} />
            <Text style={styles.legendLabel}>Feeding</Text>
          </View>
        )}
        {(!focusKind || focusKind === 'sleep') && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: barColors.sleep }]} />
            <Text style={styles.legendLabel}>Sleep</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export function TrackInsights({ logs, kind }: { logs: LogRecord[]; kind?: LogKind }) {
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  const { series, diaperMix, feedingMix, sleepMix, weekLabel, hasAny } = useMemo(() => {
    const monday = startOfWeekMonday(new Date())
    const dayStarts = Array.from({ length: 7 }).map((_, i) => addDays(monday, i))
    const keys = dayStarts.map((d) => ymdKey(d))

    const perDay = keys.map((k) => ({ key: k, diaper: 0, feeding: 0, sleep: 0 }))

    const diaper = new Map<string, number>([
      ['wet', 0],
      ['dirty', 0],
      ['mixed', 0],
      ['other', 0],
    ])
    const feeding = new Map<string, number>([
      ['breast', 0],
      ['bottle', 0],
      ['solids', 0],
      ['snack', 0],
      ['other', 0],
    ])
    const sleep = new Map<string, number>([
      ['short', 0],
      ['long', 0],
      ['unknown', 0],
    ])

    for (const l of logs) {
      if (l.kind === 'sleep') {
        const k = sleepLogDayKey(l)
        if (!k) continue
        const idx = keys.indexOf(k)
        if (idx === -1) continue
        perDay[idx].sleep += 1
        const b = sleepBucket(l)
        sleep.set(b, (sleep.get(b) ?? 0) + 1)
        continue
      }

      const t = new Date(l.atIso)
      if (Number.isNaN(t.getTime())) continue
      const k = ymdKey(t)
      const idx = keys.indexOf(k)
      if (idx === -1) continue

      if (l.kind === 'feeding') {
        perDay[idx].feeding += 1
        const fb = feedingMixBucket(l)
        feeding.set(fb, (feeding.get(fb) ?? 0) + 1)
        continue
      }

      if (l.kind === 'diaper') {
        perDay[idx].diaper += 1
        const m = diaperMixType(l)
        diaper.set(m, (diaper.get(m) ?? 0) + 1)
      }
    }

    const hasAnyData = logs.length > 0
    const label = `${dayStarts[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${dayStarts[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

    return {
      series: perDay,
      diaperMix: diaper,
      feedingMix: feeding,
      sleepMix: sleep,
      weekLabel: label,
      hasAny: hasAnyData,
    }
  }, [logs])

  const focusSubtitle =
    kind === 'diaper'
      ? 'Diaper changes logged each day this week.'
      : kind === 'feeding'
        ? 'Feeds logged each day this week.'
        : kind === 'sleep'
          ? 'Sleep sessions logged each day this week.'
          : 'Diaper changes, feeds, and sleep sessions logged each day this week.'

  return (
    <View style={styles.section}>
      <Text style={styles.headerTitle}>This week</Text>
      <Text style={styles.headerSub}>{weekLabel} · local time</Text>

      {!hasAny ? (
        <Text style={styles.empty}>Add a few logs to see charts.</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity by weekday</Text>
            <Text style={styles.cardSub}>{focusSubtitle}</Text>
            <WeekdayChart series={series} focusKind={kind} colors={colors} styles={styles} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Majority mix</Text>
            <Text style={styles.cardSub}>What your logs look like in aggregate (this week).</Text>

            {(!kind || kind === 'diaper') && (
              <MixBar
                title="Diaper types"
                counts={diaperMix}
                styles={styles}
                defaultSegColor={colors.accentLavender}
              />
            )}
            {(!kind || kind === 'feeding') && (
              <MixBar
                title="Feed types"
                counts={feedingMix}
                segmentBg={feedingLegendColor}
                styles={styles}
                defaultSegColor={colors.accentLavender}
              />
            )}
            {(!kind || kind === 'sleep') && (
              <MixBar title="Sleep length" counts={sleepMix} styles={styles} defaultSegColor={colors.accentLavender} />
            )}
          </View>
        </>
      )}
    </View>
  )
}
