import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { isApiConfigured } from '@/api/config'
import {
  createShopRecommendation,
  deleteShopRecommendation,
  fetchShopCategories,
  fetchShopRecommendationCatalog,
} from '@/api/shopRecommendationsApi'
import { RecommendShopItemModal } from '@/components/recommendationShop/RecommendShopItemModal'
import { ShopGroupCard } from '@/components/recommendationShop/ShopGroupCard'
import { ShopItemCard } from '@/components/recommendationShop/ShopItemCard'
import { Button, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useApp } from '@/context/AppContext'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type {
  CreateShopRecommendationInput,
  ShopRecommendationGroup,
} from '@/schemas/shopRecommendation'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hero: {
    gap: 8,
  },
  back: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  toolbar: {
    gap: 10,
  },
  empty: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  groups: {
    gap: Spacing.two,
  },
  items: {
    gap: Spacing.three,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: t.textMuted,
  },
  status: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
})

export function RecommendationShopScreen() {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const { user, authReady } = useApp()
  const isLoggedIn = Boolean(user?.id)

  const [groups, setGroups] = useState<ShopRecommendationGroup[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reload = async () => {
    const [catalog, cats] = await Promise.all([
      fetchShopRecommendationCatalog(),
      fetchShopCategories().catch(() => [] as string[]),
    ])
    setGroups(catalog.groups)
    setCategories(cats.length ? cats : catalog.groups.map((g) => g.category))
  }

  useEffect(() => {
    if (!authReady || !isApiConfigured()) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        await reload()
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : t('community.recommendationShop.loadFailed', {
                  defaultValue: 'Could not load recommendations',
                }),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authReady, t])

  const activeGroup = useMemo(
    () => groups.find((g) => g.category === activeCategory) ?? null,
    [groups, activeCategory],
  )

  const openRecommendModal = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setModalOpen(true)
  }

  const onSubmit = async (input: CreateShopRecommendationInput) => {
    setSubmitting(true)
    try {
      await createShopRecommendation(input)
      await reload()
      setActiveCategory(input.category)
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteShopRecommendation(id)
      await reload()
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null)
    }
  }

  if (!authReady || loading) {
    return <PageLoadingScreen label={t('common.loading')} />
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.status}>
          {t('community.recommendationShop.apiMissing', {
            defaultValue: 'API is not configured for this build.',
          })}
        </Text>
      </ScrollView>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {activeCategory ? (
            <Pressable style={styles.back} onPress={() => setActiveCategory(null)}>
              <Text style={styles.backText}>
                {t('community.recommendationShop.allGroups', {
                  defaultValue: '← All groups',
                })}
              </Text>
            </Pressable>
          ) : null}
          <Text style={styles.title}>
            {activeCategory
              ? activeCategory
              : t('community.recommendationShop.title', {
                  defaultValue: 'Recommendation Shop',
                })}
          </Text>
          <Text style={styles.subtitle}>
            {activeCategory
              ? t('community.recommendationShop.categorySubtitle', {
                  defaultValue:
                    'Parent-recommended finds in {{category}}. Prices and photos are pulled from the product link when available.',
                  category: activeCategory,
                })
              : t('community.recommendationShop.subtitle', {
                  defaultValue:
                    'Browse parent-recommended baby gear by group. Open a category to see product cards with photos, prices, and purchase links.',
                })}
          </Text>
        </View>

        <View style={styles.toolbar}>
          <Button
            title={t('community.recommendationShop.recommendItem', {
              defaultValue: 'Recommend an item',
            })}
            variant="secondary"
            onPress={openRecommendModal}
          />
        </View>

        {error ? <ErrorText>{error}</ErrorText> : null}

        {activeGroup ? (
          activeGroup.items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('community.recommendationShop.emptyCategory', {
                  defaultValue: 'No items in this group yet. Be the first to recommend one.',
                })}
              </Text>
            </View>
          ) : (
            <View style={styles.items}>
              {activeGroup.items.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  isLoggedIn={isLoggedIn}
                  onLogin={() => router.push('/login')}
                  onReviewChange={() => void reload()}
                  onDelete={onDelete}
                  deleting={deletingId === item.id}
                />
              ))}
            </View>
          )
        ) : groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {t('community.recommendationShop.empty', {
                defaultValue: 'No recommendations yet. Recommend an item to get started.',
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.groups}>
            {groups.map((group) => (
              <ShopGroupCard
                key={group.category}
                category={group.category}
                itemCount={group.itemCount}
                onOpen={() => setActiveCategory(group.category)}
              />
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>
          {t('community.recommendationShop.disclaimer', {
            defaultValue:
              'Links go to third-party stores. Baby Pattern does not sell these products; prices and availability can change.',
          })}
        </Text>
      </ScrollView>

      <RecommendShopItemModal
        open={modalOpen}
        saving={submitting}
        categories={categories}
        defaultCategory={activeCategory}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
      />
    </>
  )
}
