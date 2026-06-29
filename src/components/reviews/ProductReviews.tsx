import { useCallback, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { StarRating } from '@/components/reviews/StarRating'
import { Button } from '@/components/ui/primitives'
import { LoadingState } from '@/components/ui/Loading'
import { useConfirmAction } from '@/context/ConfirmContext'
import {
  deleteProductReview,
  fetchProductReviews,
  submitProductReview,
} from '@/api/reviewsApi'
import type { ProductReview, ProductSummary } from '@/schemas/review'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  product: ProductSummary
  brandName: string
  isLoggedIn: boolean
  onReviewChange: () => void
}

function formatReviewDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function displayAuthorName(author: ProductReview['author']): string {
  return author.fullName?.trim() || author.username?.trim() || 'Parent'
}

const createStyles = (t: AppPalette) => ({
  card: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.lg,
    backgroundColor: t.card2,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  head: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 8,
  },
  copy: {
    flex: 1,
  },
  category: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: t.text,
  },
  desc: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  meta: {
    alignItems: 'flex-end' as const,
    gap: 4,
  },
  count: {
    fontSize: 12,
    color: t.textMuted,
    textAlign: 'right' as const,
  },
  toggle: {
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  panel: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
    gap: 10,
  },
  status: {
    fontSize: 13,
    color: t.textMuted,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
    paddingBottom: 10,
    marginBottom: 4,
  },
  reviewHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: t.text,
  },
  reviewDate: {
    fontSize: 11,
    color: t.textMuted,
    marginTop: 2,
  },
  reviewBody: {
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
  },
  deleteText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#b42318',
  },
  empty: {
    fontSize: 13,
    color: t.textMuted,
    lineHeight: 20,
  },
  form: {
    gap: 10,
    marginTop: 6,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: t.text,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: t.text,
    backgroundColor: t.card,
    textAlignVertical: 'top' as const,
  },
  guestText: {
    fontSize: 13,
    color: t.textMuted,
  },
  error: {
    fontSize: 13,
    color: '#b42318',
  },
})

export function ProductReviews({ product, brandName, isLoggedIn, onReviewChange }: Props) {
  const confirm = useConfirmAction()
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [expanded, setExpanded] = useState(false)
  const [reviews, setReviews] = useState<ProductReview[]>([])
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
      const list = await fetchProductReviews(product.id)
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
  }, [product.id])

  useDeferredEffect(() => {
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
      await submitProductReview(product.id, rating, content.trim())
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
      message: 'Delete your review for this product? This cannot be undone.',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setDeletingId(reviewId)
        setError(null)
        try {
          await deleteProductReview(reviewId)
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
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.copy}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}
        </View>
        <View style={styles.meta}>
          <StarRating value={product.averageRating} size="sm" />
          <Text style={styles.count}>
            {product.reviewCount === 0
              ? 'No reviews yet'
              : `${product.averageRating.toFixed(1)} · ${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'}`}
          </Text>
        </View>
      </View>

      <Pressable onPress={() => setExpanded((open) => !open)} style={styles.toggle}>
        <Text style={styles.toggleText}>
          {expanded ? 'Hide reviews' : product.myReviewId ? 'View / edit your review' : 'Read & write reviews'}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          {loading ? (
            <LoadingState label="Loading reviews…" compact />
          ) : (
            <>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHead}>
                    <View>
                      <Text style={styles.reviewAuthor}>{displayAuthorName(review.author)}</Text>
                      <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                    </View>
                    <StarRating value={review.rating} size="sm" />
                  </View>
                  <Text style={styles.reviewBody}>{review.content}</Text>
                  {review.isMine ? (
                    <Pressable onPress={() => onDelete(review.id)} disabled={deletingId === review.id}>
                      <Text style={styles.deleteText}>
                        {deletingId === review.id ? 'Removing…' : 'Remove my review'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}

              {reviews.length === 0 ? (
                <Text style={styles.empty}>
                  Be the first to review {product.name} from {brandName}.
                </Text>
              ) : null}

              {isLoggedIn ? (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>
                    {product.myReviewId ? 'Update your review' : 'Write a review'}
                  </Text>
                  <StarRating value={rating} onChange={setRating} />
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="What did you like or dislike? Fit, comfort, value…"
                    placeholderTextColor={palette.textMuted}
                    multiline
                    style={styles.input}
                    editable={!submitting}
                  />
                  <Button
                    title={submitting ? 'Saving…' : product.myReviewId ? 'Update review' : 'Post review'}
                    loading={submitting}
                    onPress={() => void onSubmit()}
                  />
                </View>
              ) : (
                <Text style={styles.guestText}>Log in to share your experience with other parents.</Text>
              )}
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : null}
    </View>
  )
}
