import { useMemo, type ReactNode } from 'react'
import { Text, View } from 'react-native'
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { KindReport } from '@/lib/reportAnalytics'
import { Spacing } from '@/constants/theme'

import { reportKindColor } from './reportChartColors'

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: 8,
  },
  empty: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
})

type Props = {
  report: KindReport
  title?: string
  emptyMessage?: string
}

export function ReportsChartEmpty({ message }: { message: string }) {
  const styles = useThemedStyles(createStyles)
  return <Text style={styles.empty}>{message}</Text>
}

export function TrendLineChart({ report, emptyMessage }: Props) {
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const color = reportKindColor(report.kind, colors)

  const { path, areaPath, maxY, ticks, points } = useMemo(() => {
    const w = 900
    const h = 220
    const padL = 40
    const padR = 12
    const padT = 16
    const padB = 36
    const innerW = w - padL - padR
    const innerH = h - padT - padB
    const series = report.dailyTrend
    const max = Math.max(1, ...series.map((row) => row.value))

    const pts = series.map((row, i) => {
      const x = padL + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW)
      const y = padT + innerH - (row.value / max) * innerH
      return { x, y, ...row }
    })

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = `${line} L ${pts[pts.length - 1]?.x ?? padL} ${padT + innerH} L ${pts[0]?.x ?? padL} ${padT + innerH} Z`

    const tickCount = 4
    const tickValues = Array.from({ length: tickCount + 1 }).map((_, i) =>
      Math.round((max * (tickCount - i)) / tickCount),
    )

    return { path: line, areaPath: area, maxY: max, ticks: tickValues, points: pts }
  }, [report.dailyTrend])

  const labelStep = Math.max(1, Math.floor(report.dailyTrend.length / 6))

  if (emptyMessage && report.totalEvents === 0) {
    return <ReportsChartEmpty message={emptyMessage} />
  }

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={200} viewBox="0 0 900 220">
        {ticks.map((tick, i) => {
          const y = 16 + (220 - 52) * (1 - tick / maxY)
          return (
            <G key={`tick-${i}`}>
              <Line x1={40} x2={888} y1={y} y2={y} stroke={colors.strokeSubtle} />
              <SvgText x={6} y={y + 4} fontSize={11} fill={colors.textMuted}>
                {tick}
              </SvgText>
            </G>
          )
        })}
        <Path d={areaPath} fill={color} opacity={0.14} />
        <Path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        {points.map((point, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <SvgText
              key={point.key}
              x={point.x}
              y={206}
              textAnchor="middle"
              fontSize={10}
              fill={colors.textMuted}
            >
              {point.label}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  )
}

export function HourlyBarChart({ report, emptyMessage }: Props) {
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const color = reportKindColor(report.kind, colors)

  const bars = useMemo(() => {
    const w = 900
    const h = 220
    const padL = 34
    const padT = 16
    const innerW = w - 46
    const innerH = h - 56
    const max = Math.max(1, ...report.hourlyDistribution.map((row) => row.value))
    const barW = innerW / 24 - 2

    return report.hourlyDistribution.map((row, i) => {
      const height = (row.value / max) * innerH
      const x = padL + i * (innerW / 24) + 1
      const y = padT + innerH - height
      return { ...row, x, y, height, barW }
    })
  }, [report.hourlyDistribution])

  if (emptyMessage && report.totalEvents === 0) {
    return <ReportsChartEmpty message={emptyMessage} />
  }

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={200} viewBox="0 0 900 220">
        {bars.map((bar) => (
          <G key={bar.hour}>
            <Rect x={bar.x} y={bar.y} width={bar.barW} height={bar.height} rx={4} fill={color} />
            {bar.hour % 3 === 0 ? (
              <SvgText
                x={bar.x + bar.barW / 2}
                y={206}
                textAnchor="middle"
                fontSize={10}
                fill={colors.textMuted}
              >
                {bar.label}
              </SvgText>
            ) : null}
          </G>
        ))}
      </Svg>
    </View>
  )
}

export function WeekdayBarChart({ report, emptyMessage }: Props) {
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const color = reportKindColor(report.kind, colors)

  const ordered = useMemo(() => {
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0]
    return mondayFirst.map((weekday) => report.weekdayAverages[weekday])
  }, [report.weekdayAverages])

  const max = Math.max(1, ...ordered.map((row) => row.value))
  const w = 900
  const h = 220
  const padL = 34
  const padT = 16
  const innerW = w - 46
  const innerH = h - 56
  const barW = innerW / 7 - 8

  if (emptyMessage && report.totalEvents === 0) {
    return <ReportsChartEmpty message={emptyMessage} />
  }

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={200} viewBox={`0 0 ${w} ${h}`}>
        {ordered.map((row, i) => {
          const height = (row.value / max) * innerH
          const x = padL + i * (innerW / 7) + 4
          const y = padT + innerH - height
          return (
            <G key={row.weekday}>
              <Rect x={x} y={y} width={barW} height={height} rx={8} fill={color} />
              <SvgText x={x + barW / 2} y={h - 12} textAnchor="middle" fontSize={12} fill={colors.textMuted}>
                {row.label}
              </SvgText>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const colors = useHomeTheme()
  const cardStyles = useThemedStyles((t: AppPalette) => ({
    card: {
      marginTop: Spacing.two,
      padding: Spacing.two,
      borderRadius: HomeRadius.lg,
      borderWidth: 1,
      borderColor: t.strokeSubtle,
      backgroundColor: t.card,
    },
    title: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: t.text,
    },
    sub: {
      fontSize: 13,
      color: t.textMuted,
      marginTop: 4,
      marginBottom: 4,
      lineHeight: 18,
    },
  }))

  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      <Text style={cardStyles.sub}>{subtitle}</Text>
      {children}
    </View>
  )
}
