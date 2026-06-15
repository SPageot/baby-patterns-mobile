import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { SymbolView } from 'expo-symbols'

import type { NavIconName } from '@/lib/navLinks'

type MenuIconName = NavIconName | 'menu' | 'close' | 'sun'

const SF_SYMBOLS: Record<MenuIconName, string> = {
  heart: 'heart.fill',
  users: 'person.2.fill',
  star: 'star.fill',
  diaper: 'drop.fill',
  bottle: 'cup.and.saucer.fill',
  moon: 'moon.fill',
  sun: 'sun.max.fill',
  menu: 'line.3.horizontal',
  close: 'xmark',
}

const EMOJI: Record<MenuIconName, string> = {
  heart: '♥',
  users: '👥',
  star: '★',
  diaper: '💧',
  bottle: '🍼',
  moon: '🌙',
  sun: '☀️',
  menu: '☰',
  close: '✕',
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
