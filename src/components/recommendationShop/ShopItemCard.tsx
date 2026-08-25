import { useState } from 'react'
import { Image } from 'expo-image'
import { Linking, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { ShopItemReviews } from '@/components/recommendationShop/ShopItemReviews'
import { Button } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { ShopRecommendation } from '@/schemas/shopRecommendation'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  card: {
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    overflow: 'hidden' as const,
  },
  media: {
    width: '100%' as const,
    height: 180,
    backgroundColor: t.card2,
  },
  image: {
    width: '100%' as const,
    height: '100%' as const,
  },
  priceBadge: {
    position: 'absolute' as const,
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  body: {
    padding: Spacing.three,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700' as const,
    color: t.text,
  },
  priceInline: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  store: {
    fontSize: 13,
    color: t.textMuted,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
  },
  poster: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  posterFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  posterFallbackText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
  posterCopy: {
    flex: 1,
    gap: 1,
  },
  posterLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: t.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  posterName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  posterUser: {
    fontWeight: '400' as const,
    color: t.textMuted,
  },
  actions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
})

type Props = {
  item: ShopRecommendation
  isLoggedIn: boolean
  onLogin: () => void
  onReviewChange: () => void
  onDelete?: (id: string) => void
  deleting?: boolean
}

function displayName(item: ShopRecommendation): string {
  const author = item.submittedBy
  if (!author) return 'Baby Pattern'
  return author.fullName?.trim() || author.username?.trim() || 'Parent'
}

export function ShopItemCard({
  item,
  isLoggedIn,
  onLogin,
  onReviewChange,
  onDelete,
  deleting,
}: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(item.imageUrl) && !imgFailed
  const author = item.submittedBy
  const host =
    item.siteName ||
    (() => {
      try {
        return new URL(item.purchaseUrl).hostname.replace(/^www\./, '')
      } catch {
        return 'Store'
      }
    })()

  return (
    <View style={styles.card}>
      {showImage ? (
        <View style={styles.media}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImgFailed(true)}
          />
          {item.price ? (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{item.price}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{item.name}</Text>
          {!showImage && item.price ? <Text style={styles.priceInline}>{item.price}</Text> : null}
        </View>
        <Text style={styles.store}>{host}</Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        <View style={styles.poster}>
          {author ? (
            <UserAvatar user={author} size="sm" />
          ) : (
            <View style={styles.posterFallback}>
              <Text style={styles.posterFallbackText}>BP</Text>
            </View>
          )}
          <View style={styles.posterCopy}>
            <Text style={styles.posterLabel}>
              {t('community.recommendationShop.recommendedBy', {
                defaultValue: 'Recommended by',
              })}
            </Text>
            <Text style={styles.posterName}>
              {displayName(item)}
              {author?.username ? (
                <Text style={styles.posterUser}> @{author.username}</Text>
              ) : null}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('community.recommendationShop.viewProduct', {
              defaultValue: 'View product',
            })}
            onPress={() => void Linking.openURL(item.purchaseUrl)}
          />
          {item.isMine && onDelete ? (
            <Button
              title={
                deleting
                  ? t('community.recommendationShop.removing', { defaultValue: 'Removing…' })
                  : t('community.recommendationShop.remove', { defaultValue: 'Remove' })
              }
              variant="ghost"
              disabled={deleting}
              onPress={() => onDelete(item.id)}
            />
          ) : null}
        </View>

        <ShopItemReviews
          item={item}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
          onReviewChange={onReviewChange}
        />
      </View>
    </View>
  )
}
