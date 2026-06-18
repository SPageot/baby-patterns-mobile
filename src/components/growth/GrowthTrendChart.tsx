import { useMemo } from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg'

import type { AppPalette } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { GrowthMeasurementDto } from '@/types/growth'

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: 8,
  },
  empty: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: 8,
  },
  unit: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 6,
  },
})

type Props = {
  measurements: GrowthMeasurementDto[]
  metric: 'weightLbs' | 'heightInches' | 'headCircumferenceInches'
  title: string
  unit: string
  color: string
}

export function GrowthTrendChart({ measurements, metric, title, unit, color }: Props) {
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  const { series, path, areaPath, pts } = useMemo(() => {
    const rows = [...measurements]
      .filter((r) => {
        const v = r[metric]
        if (v == null || v === '') return false
        const n = Number(v)
        return Number.isFinite(n) && n > 0
      })
      .sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : 1))
      .map((r) => {
        const d = new Date(r.recordedAt)
        const label = Number.isNaN(d.getTime())
          ? r.recordedAt.slice(0, 10)
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        return { key: r.id, label, value: Number(r[metric]) }
      })

    if (rows.length === 0) {
      return { series: rows, path: '', areaPath: '', pts: [] as { x: number; y: number; label: string; key: string }[] }
    }

    const max = Math.max(...rows.map((s) => s.value), 1)
    const w = 900
    const h = 220
    const pad = 40
    const innerW = w - pad * 2
    const innerH = h - pad * 2

    const points = rows.map((row, i) => {
      const x = pad + (rows.length <= 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW)
      const y = pad + innerH - (row.value / max) * innerH
      return { x, y, label: row.label, key: row.key }
    })

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = `${line} L ${points[points.length - 1]?.x ?? pad} ${pad + innerH} L ${points[0]?.x ?? pad} ${pad + innerH} Z`

    return { series: rows, path: line, areaPath: area, pts: points }
  }, [measurements, metric])

  if (series.length === 0) {
    return <Text style={styles.empty}>No {title.toLowerCase()} data yet.</Text>
  }

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={200} viewBox="0 0 900 220">
        <Path d={areaPath} fill={color} opacity={0.14} />
        <Path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        {pts.map((p) => (
          <G key={p.key}>
            <Circle cx={p.x} cy={p.y} r={4} fill={color} />
            <SvgText x={p.x} y={206} textAnchor="middle" fontSize={10} fill={colors.textMuted}>
              {p.label}
            </SvgText>
          </G>
        ))}
      </Svg>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  )
}
