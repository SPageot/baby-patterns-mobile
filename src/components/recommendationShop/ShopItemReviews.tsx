import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  deleteShopItemReview,
  fetchShopItemReviews,
  submitShopItemReview,
} from '@/api/shopRecommendationsApi'
import { ContentModerationMenu } from '@/components/moderation/ContentModerationMenu'
import { StarRating } from '@/components/recommendationShop/StarRating'
import { Button, ErrorText } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useModeration } from '@/context/ModerationContext'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { ShopRecommendation, ShopRecommendationReview } from '@/schemas/shopRecommendation'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: Spacing.two,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
    paddingTop: Spacing.two,
  },
  summary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  count: {
    fontSize: 13,
    color: t.textMuted,
    flex: 1,
  },
  toggle: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  panel: {
    gap: 12,
  },
  empty: {
    fontSize: 13,
    lineHeight: 20,
    color: t.textMuted,
  },
  review: {
    gap: 6,
    padding: Spacing.two,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  reviewHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  author: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
  },
  date: {
    fontSize: 12,
    color: t.textMuted,
  },
  headEnd: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
  },
  deleteBtn: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.error,
  },
  form: {
    gap: 10,
    paddingTop: 4,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
  },
  input: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    padding: Spacing.two,
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
    backgroundColor: t.card,
    minHeight: 88,
    textAlignVertical: 'top' as const,
  },
  guestText: {
    fontSize: 13,
    lineHeight: 20,
    color: t.textMuted,
  },
  status: {
    fontSize: 13,
    color: t.textMuted,
  },
})

type Props = {
  item: ShopRecommendation
  isLoggedIn: boolean
  onLogin: () => void
  onReviewChange: () => void
}

function formatReviewDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function displayAuthorName(author: ShopRecommendationReview['author']): string {
  return author.fullName?.trim() || author.username?.trim() || 'Parent'
}

export function ShopItemReviews({ item, isLoggedIn, onLogin, onReviewChange }: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const confirm = useConfirmAction()
  const { isBlocked } = useModeration()
  const [expanded, setExpanded] = useState(false)
  const [reviews, setReviews] = useState<ShopRecommendationReview[]>([])
  const visibleReviews = useMemo(
    () => reviews.filter((review) => !isBlocked(review.author.id)),
    [reviews, isBlocked],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchShopItemReviews(item.id)
      setReviews(list)
      const mine = list.find((r) => r.isMine)
      if (mine) {
        setRating(mine.rating)
        setContent(mine.content)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reviews')
    } finally {
      setLoading(false)
    }
  }, [item.id])

  useEffect(() => {
    if (!expanded) return
    void loadReviews()
  }, [expanded, loadReviews])

  const onSubmit = async () => {
    if (!content.trim()) {
      setError('Please write a short review')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitShopItemReview(item.id, rating, content.trim())
      await loadReviews()
      onReviewChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save review')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = (reviewId: string) => {
    confirm({
      title: 'Remove review?',
      message: 'Delete your review for this item? This cannot be undone.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setDeletingId(reviewId)
        setError(null)
        try {
          await deleteShopItemReview(reviewId)
          setContent('')
          setRating(5)
          await loadReviews()
          onReviewChange()
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not delete review')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <StarRating value={item.averageRating} size="sm" label={`${item.averageRating} stars`} />
        <Text style={styles.count}>
          {item.reviewCount === 0
            ? t('community.recommendationShop.noReviews', { defaultValue: 'No reviews yet' })
            : `${item.averageRating.toFixed(1)} · ${item.reviewCount} review${item.reviewCount === 1 ? '' : 's'}`}
        </Text>
      </View>

      <Pressable
        style={styles.toggle}
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
      >
        <Text style={styles.toggleText}>
          {expanded
            ? t('community.recommendationShop.hideReviews', { defaultValue: 'Hide reviews' })
            : item.myReviewId
              ? t('community.recommendationShop.viewEditReview', {
                  defaultValue: 'View / edit your review',
                })
              : t('community.recommendationShop.readWriteReviews', {
                  defaultValue: 'Read & write reviews',
                })}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          {loading ? (
            <Text style={styles.status}>
              {t('community.recommendationShop.loadingReviews', {
                defaultValue: 'Loading reviews…',
              })}
            </Text>
          ) : (
            <>
              {visibleReviews.length > 0 ? (
                visibleReviews.map((review) => (
                  <View key={review.id} style={styles.review}>
                    <View style={styles.reviewHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.author}>{displayAuthorName(review.author)}</Text>
                        <Text style={styles.date}>{formatReviewDate(review.createdAt)}</Text>
                      </View>
                      <View style={styles.headEnd}>
                        {isLoggedIn ? (
                          <ContentModerationMenu
                            contentType="shop_recommendation_review"
                            contentId={review.id}
                            authorId={review.author.id}
                            authorName={displayAuthorName(review.author)}
                            isMine={review.isMine}
                          />
                        ) : null}
                        <StarRating value={review.rating} size="sm" />
                      </View>
                    </View>
                    <Text style={styles.body}>{review.content}</Text>
                    {review.isMine ? (
                      <Pressable
                        style={styles.deleteBtn}
                        disabled={deletingId === review.id}
                        onPress={() => onDelete(review.id)}
                      >
                        <Text style={styles.deleteText}>
                          {deletingId === review.id
                            ? t('community.recommendationShop.removing', {
                                defaultValue: 'Removing…',
                              })
                            : t('community.recommendationShop.removeMyReview', {
                                defaultValue: 'Remove my review',
                              })}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>
                  {t('community.recommendationShop.firstReview', {
                    defaultValue: 'Be the first to review {{name}}.',
                    name: item.name,
                  })}
                </Text>
              )}

              {isLoggedIn ? (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>
                    {t('community.recommendationShop.writeReview', {
                      defaultValue: 'Write a review',
                    })}
                  </Text>
                  <StarRating value={rating} onChange={setRating} label="Your rating" />
                  <TextInput
                    style={styles.input}
                    multiline
                    placeholder="What did you like or dislike? Fit, comfort, value…"
                    placeholderTextColor="#9ca3af"
                    value={content}
                    onChangeText={setContent}
                    editable={!submitting}
                  />
                  <Button
                    title={
                      submitting
                        ? t('logForm.saving')
                        : t('community.recommendationShop.postReview', {
                            defaultValue: 'Post review',
                          })
                    }
                    loading={submitting}
                    disabled={submitting}
                    onPress={() => void onSubmit()}
                  />
                </View>
              ) : (
                <View style={styles.form}>
                  <Text style={styles.guestText}>
                    {t('community.recommendationShop.loginToReview', {
                      defaultValue: 'Log in to share your experience with other parents.',
                    })}
                  </Text>
                  <Button
                    title={t('community.recommendationShop.logInToReview', {
                      defaultValue: 'Log in to review',
                    })}
                    variant="secondary"
                    onPress={onLogin}
                  />
                </View>
              )}
            </>
          )}

          {error ? <ErrorText>{error}</ErrorText> : null}
        </View>
      ) : null}
    </View>
  )
}
