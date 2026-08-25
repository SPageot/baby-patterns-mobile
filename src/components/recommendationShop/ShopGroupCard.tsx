import { Pressable, Text, View } from 'react-native'

import { NavIcon } from '@/components/icons/NavIcon'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { shopCategoryIcon } from '@/lib/shopCategoryIcon'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
  },
  meta: {
    fontSize: 13,
    color: t.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: t.textMuted,
  },
})

type Props = {
  category: string
  itemCount: number
  onOpen: () => void
}

export function ShopGroupCard({ category, itemCount, onOpen }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const icon = shopCategoryIcon(category)

  return (
    <Pressable
      style={styles.card}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${category}, ${itemCount} items`}
    >
      <View style={styles.iconWrap}>
        <NavIcon name={icon} size={20} color={palette.accentDeep} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{category}</Text>
        <Text style={styles.meta}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  )
}
