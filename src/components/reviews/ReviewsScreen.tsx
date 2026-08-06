import { useMemo, useState } from 'react'
import { Link } from 'expo-router'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { AddBrandProductPanel } from '@/components/reviews/AddBrandProductPanel'
import { BrandCard } from '@/components/reviews/BrandCard'
import { Button, ErrorText, Eyebrow } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { NavIcon } from '@/components/icons/NavIcon'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useReviews } from '@/hooks/useReviews'
import { filterBrandsByQuery } from '@/lib/filterBrands'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
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
  },
  hero: {
    marginBottom: Spacing.three,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    marginBottom: 10,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  status: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
  gate: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  gateText: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 22,
  },
  search: {
    marginBottom: Spacing.three,
    gap: 8,
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.text,
  },
  searchField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: t.text,
    paddingVertical: 12,
  },
  clear: {
    fontSize: 22,
    color: t.textMuted,
    paddingLeft: 8,
  },
  searchMeta: {
    fontSize: 12,
    color: t.textMuted,
  },
  guestFooter: {
    marginTop: Spacing.three,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  guestText: {
    fontSize: 14,
    color: t.textMuted,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
})

export function ReviewsScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()
  const { user, authReady } = useApp()
  const reviews = useReviews(authReady)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBrands = useMemo(
    () => filterBrandsByQuery(reviews.brands, searchQuery),
    [reviews.brands, searchQuery],
  )

  if (!authReady || reviews.loading) {
    return <PageLoadingScreen label={t('common.loading')} />
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <NavIcon name="star" size={22} color={palette.accentDeep} />
        </View>
        <Eyebrow>{t('nav.groups.community')}</Eyebrow>
        <Text style={styles.title}>{t('community.reviews.title')}</Text>
        <Text style={styles.subtitle}>Find products you use and read what other parents think.</Text>
      </View>

      {!isApiConfigured() ? (
        <ErrorText>Set EXPO_PUBLIC_API_URL in .env to browse and post reviews.</ErrorText>
      ) : reviews.error ? (
        <View style={styles.gate}>
          <ErrorText>{reviews.error}</ErrorText>
          <Button title="Try again" variant="secondary" onPress={() => void reviews.reload()} />
        </View>
      ) : (
        <>
          <AddBrandProductPanel
            brands={reviews.brands}
            isLoggedIn={Boolean(user)}
            onAdded={() => void reviews.reload()}
          />

          {reviews.brands.length === 0 ? (
            <View style={styles.gate}>
              <Text style={styles.gateText}>{t('community.reviews.noReviews')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.search}>
                <Text style={styles.searchLabel}>Search brands or products</Text>
                <View style={styles.searchField}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="e.g. Pampers, bottles, wipes…"
                    placeholderTextColor={palette.textMuted}
                    style={styles.searchInput}
                    autoCorrect={false}
                  />
                  {searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                      <Text style={styles.clear}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.searchMeta}>
                  {filteredBrands.length} of {reviews.brands.length} brands
                  {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
                </Text>
              </View>

              {filteredBrands.length === 0 ? (
                <View style={styles.gate}>
                  <Text style={styles.gateText}>No brands or products match your search.</Text>
                  <Button title="Clear search" variant="secondary" onPress={() => setSearchQuery('')} />
                </View>
              ) : (
                filteredBrands.map((brand) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    isLoggedIn={Boolean(user)}
                    onReviewChange={() => void reviews.reload()}
                  />
                ))
              )}
            </>
          )}
        </>
      )}

      {!user ? (
        <View style={styles.guestFooter}>
          <Text style={styles.guestText}>Log in to write reviews and add brands.</Text>
          <Link href="/login" style={styles.loginLink}>
            Log in
          </Link>
        </View>
      ) : null}
    </ScrollView>
  )
}
