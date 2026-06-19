import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Input } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useBrandNames } from '@/hooks/useBrandNames'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

const createStyles = (t: AppPalette) => ({
  suggestions: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    overflow: 'hidden' as const,
    backgroundColor: t.card,
  },
  pickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  pickBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  pressed: {
    opacity: 0.82,
    backgroundColor: t.card2,
  },
})

export function BrandNameInput({
  value,
  onChange,
  disabled,
  placeholder = 'e.g. brand name',
}: Props) {
  const styles = useThemedStyles(createStyles)
  const [open, setOpen] = useState(false)
  const { suggestionsFor } = useBrandNames()

  const suggestions = useMemo(() => {
    if (!open || !value.trim()) return []
    return suggestionsFor(value)
  }, [open, suggestionsFor, value])

  return (
    <View>
      <Input
        value={value}
        onChangeText={(next) => {
          onChange(next)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120)
        }}
        placeholder={placeholder}
        editable={!disabled}
        autoCorrect={false}
        autoCapitalize="words"
      />

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((brand, index) => (
            <Pressable
              key={brand.id}
              onPress={() => {
                onChange(brand.name)
                setOpen(false)
              }}
              style={({ pressed }) => [
                styles.pickBtn,
                index === suggestions.length - 1 && { borderBottomWidth: 0 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.pickBtnText}>{brand.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}
