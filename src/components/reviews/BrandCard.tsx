import { Text, View } from 'react-native'

import { ProductReviews } from '@/components/reviews/ProductReviews'
import type { Brand } from '@/schemas/review'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  brand: Brand
  isLoggedIn: boolean
  onReviewChange: () => void
}

const createStyles = (t: AppPalette) => ({
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.two,
  },
  name: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: t.text,
    flex: 1,
  },
  count: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
})

export function BrandCard({ brand, isLoggedIn, onReviewChange }: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{brand.name}</Text>
        <Text style={styles.count}>
          {brand.products.length} product{brand.products.length === 1 ? '' : 's'}
        </Text>
      </View>

      {brand.products.map((product) => (
        <ProductReviews
          key={product.id}
          product={product}
          brandName={brand.name}
          isLoggedIn={isLoggedIn}
          onReviewChange={onReviewChange}
        />
      ))}
    </View>
  )
}
