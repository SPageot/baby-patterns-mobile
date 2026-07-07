import { useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  value: string
  onChange: (value: string) => void
}

const createStyles = (t: AppPalette) => ({
  wrap: {
    alignItems: 'flex-end' as const,
    marginBottom: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: HomeRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.cardTranslucent,
  },
  field: {
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    paddingHorizontal: Spacing.two,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: t.text,
    paddingVertical: 10,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
})

export function ChallengeBoardSearch({ value, onChange }: Props) {
  const theme = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const open = () => {
    setExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const collapse = () => {
    onChange('')
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <View style={styles.wrap}>
        <Pressable
          style={styles.iconBtn}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel="Search challenges"
        >
          <NavIcon name="search" size={20} color={theme.textMuted} />
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <NavIcon name="search" size={18} color={theme.textMuted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="Search challenges"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          onBlur={() => {
            if (!value.trim()) setExpanded(false)
          }}
        />
        <Pressable
          style={styles.clearBtn}
          onPress={collapse}
          accessibilityRole="button"
          accessibilityLabel="Close search"
        >
          <NavIcon name="close" size={14} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  )
}
