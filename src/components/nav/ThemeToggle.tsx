import { Pressable, StyleSheet } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemeMode } from '@/context/ThemeContext'
import { HomeRadius } from '@/constants/homeTheme'

export function ThemeToggle() {
  const { theme, toggleThemeMode } = useThemeMode()
  const colors = useHomeTheme()
  const isDark = theme === 'dark'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onPress={toggleThemeMode}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor: colors.stroke,
          backgroundColor: colors.card2,
        },
        pressed && styles.pressed,
      ]}
    >
      <NavIcon name={isDark ? 'sun' : 'moon'} size={18} color={colors.text} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: HomeRadius.md,
  },
  pressed: {
    opacity: 0.82,
  },
})
