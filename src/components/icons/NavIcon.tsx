import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { SymbolView } from 'expo-symbols'

import type { NavIconName } from '@/lib/navLinks'

type MenuIconName = NavIconName | 'menu' | 'close' | 'sun' | 'bell' | 'search' | 'edit' | 'trash'

const SF_SYMBOLS: Record<MenuIconName, string> = {
  heart: 'heart.fill',
  users: 'person.2.fill',
  star: 'star.fill',
  diaper: 'drop.fill',
  bottle: 'cup.and.saucer.fill',
  moon: 'moon.fill',
  potty: 'toilet.fill',
  chart: 'chart.bar.fill',
  growth: 'chart.line.uptrend.xyaxis',
  health: 'cross.case.fill',
  hospital: 'building.2.fill',
  calendar: 'calendar',
  memories: 'photo.stack.fill',
  tag: 'tag.fill',
  sun: 'sun.max.fill',
  menu: 'line.3.horizontal',
  close: 'xmark',
  bell: 'bell.fill',
  search: 'magnifyingglass',
  edit: 'pencil',
  trash: 'trash',
}

const EMOJI: Record<MenuIconName, string> = {
  heart: '♥',
  users: '👥',
  star: '★',
  diaper: '💧',
  bottle: '🍼',
  moon: '🌙',
  potty: '🚽',
  chart: '📊',
  growth: '📈',
  health: '🩺',
  hospital: '🏥',
  calendar: '📅',
  memories: '🖼️',
  tag: '🏷️',
  sun: '☀️',
  menu: '☰',
  close: '✕',
  bell: '🔔',
  search: '🔍',
  edit: '✎',
  trash: '🗑',
}

type Props = {
  name: MenuIconName
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}

export function NavIcon({ name, size = 18, color = '#7c5cc4', style }: Props) {
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.wrap, style]}>
        <SymbolView name={SF_SYMBOLS[name] as never} tintColor={color} size={size} />
      </View>
    )
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.emoji, { color, fontSize: size }]}>{EMOJI[name]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontWeight: '700',
    lineHeight: 20,
  },
})
