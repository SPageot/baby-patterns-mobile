import { Link, type Href } from 'expo-router'
import { useState } from 'react'
import { Image } from 'expo-image'
import { Linking, Pressable, Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { Post, PostComment, PostSubmitInput } from '@/schemas/post'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { postBadgeLabel } from '@/lib/postBadges'
import { isSafeHttpUrl } from '@/lib/urlSafety'
import { PostEditor } from '@/components/parentsCorner/PostEditor'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const createStyles = (t: AppPalette) => ({
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: t.text,
  },
  metaRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: t.textMuted,
  },
  badge: {
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: t.accentSoft,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: t.accentDeep,
    textTransform: 'uppercase' as const,
  },
  headerActions: {
    gap: 8,
  },
  headerAction: {
    paddingVertical: 2,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  deleteText: {
    color: '#b42318',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
    marginBottom: 10,
  },
  previews: {
    gap: 8,
    marginBottom: 10,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    padding: 10,
    backgroundColor: t.card2,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.text,
  },
  previewDesc: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
  },
  mediaGrid: {
    gap: 8,
    marginBottom: 10,
  },
  mediaImage: {
    alignSelf: 'stretch' as const,
    height: 220,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  actionTextActive: {
    color: t.accentDeep,
  },
  comments: {
    marginTop: 12,
    gap: 10,
  },
  commentsHint: {
    fontSize: 13,
    color: t.textMuted,
  },
  comment: {
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
    paddingTop: 10,
  },
  commentTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  commentAuthorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexShrink: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: t.text,
  },
  commentLike: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
  },
  commentForm: {
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: t.text,
    backgroundColor: t.card2,
  },
  commentGuest: {
    fontSize: 13,
    lineHeight: 20,
    color: t.textMuted,
    marginTop: 4,
  },
  commentGuestLink: {
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
  editInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: t.text,
    backgroundColor: t.card2,
    textAlignVertical: 'top' as const,
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  editBtn: {
    flex: 1,
  },
})

function AuthorAvatar({ author }: { author: Post['author'] }) {
  return (
    <UserAvatar
      user={{
        id: author.id,
        username: author.username,
        fullName: author.fullName,
        avatarUrl: author.avatarUrl,
        isPro: author.isPro,
        isSiteDeveloper: author.isSiteDeveloper,
      }}
      size="sm"
    />
  )
}

function BadgeChip({ badge, customBadge }: { badge?: Post['badge']; customBadge?: string | null }) {
  const styles = useThemedStyles(createStyles)
  const custom = customBadge?.trim()
  const label = custom || postBadgeLabel(badge)
  if (!label) return null
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  )
}

type Props = {
  post: Post
  comments: PostComment[]
  commentsOpen: boolean
  commentsLoading: boolean
  canEdit: boolean
  canDelete: boolean
  editing?: boolean
  saving?: boolean
  onLike: () => void
  onToggleComments: () => void
  onComment: (content: string) => Promise<void>
  onLikeComment: (commentId: string) => void
  onEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: (input: PostSubmitInput) => Promise<void>
  onDelete: () => void
  isSiteDeveloper?: boolean
  readOnly?: boolean
  requireAuthHref?: Href
}

export function PostCard({
  post,
  comments,
  commentsOpen,
  commentsLoading,
  canEdit,
  canDelete,
  editing = false,
  saving = false,
  onLike,
  onToggleComments,
  onComment,
  onLikeComment,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  isSiteDeveloper: viewerIsSiteDeveloper = false,
  readOnly = false,
  requireAuthHref = '/signup',
}: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const displayName = post.author.fullName?.trim() || post.author.username || 'Parent'

  const handleComment = async () => {
    if (readOnly) return
    const text = commentText.trim()
    if (!text) return
    setSubmitting(true)
    try {
      await onComment(text)
      setCommentText('')
    } finally {
      setSubmitting(false)
    }
  }

  if (editing && onSaveEdit && onCancelEdit) {
    return (
      <View style={styles.card}>
        <PostEditor
          initialContent={post.content}
          initialBadge={post.badge}
          initialCustomBadge={post.customBadge}
          initialMedia={post.media}
          isSiteDeveloper={viewerIsSiteDeveloper || Boolean(post.author.isSiteDeveloper)}
          submitting={saving}
          submitLabel="Save changes"
          onSubmit={onSaveEdit}
          onCancel={onCancelEdit}
        />
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AuthorAvatar author={post.author} />
        <View style={styles.meta}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>
              {formatWhen(post.createdAt)}
              {post.updatedAt ? ' · edited' : ''}
            </Text>
            {post.badge || post.customBadge ? (
              <BadgeChip badge={post.badge} customBadge={post.customBadge} />
            ) : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          {canEdit && onEdit ? (
            <Pressable onPress={onEdit} style={styles.headerAction}>
              <Text style={styles.headerActionText}>Edit</Text>
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable onPress={onDelete} style={styles.headerAction}>
              <Text style={[styles.headerActionText, styles.deleteText]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {post.linkPreviews.length > 0 ? (
        <View style={styles.previews}>
          {post.linkPreviews
            .filter((preview) => isSafeHttpUrl(preview.url))
            .map((preview) => (
            <Pressable
              key={preview.id || preview.url}
              onPress={() => {
                if (isSafeHttpUrl(preview.url)) {
                  void Linking.openURL(preview.url)
                }
              }}
              style={styles.previewCard}
            >
              <Text style={styles.previewTitle} numberOfLines={2}>
                {preview.title || preview.url}
              </Text>
              {preview.description ? (
                <Text style={styles.previewDesc} numberOfLines={2}>
                  {preview.description}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {post.media.length > 0 ? (
        <View style={styles.mediaGrid}>
          {post.media.map((item) =>
            item.mediaType === 'image' ? (
              <Image key={item.id} source={{ uri: item.url }} style={styles.mediaImage} contentFit="cover" />
            ) : null,
          )}
        </View>
      ) : null}

      <View style={styles.actions}>
        {readOnly ? (
          <Link href={requireAuthHref} asChild>
            <Pressable style={styles.actionBtn}>
              <Text style={styles.actionText}>♥ {post.likeCount}</Text>
            </Pressable>
          </Link>
        ) : (
          <Pressable onPress={() => void onLike()} style={styles.actionBtn}>
            <Text style={[styles.actionText, post.likedByMe && styles.actionTextActive]}>
              ♥ {post.likeCount}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onToggleComments} style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 {post.commentCount}</Text>
        </Pressable>
      </View>

      {commentsOpen ? (
        <View style={styles.comments}>
          {commentsLoading ? <Text style={styles.commentsHint}>Loading comments…</Text> : null}
          {!commentsLoading && comments.length === 0 ? (
            <Text style={styles.commentsHint}>No comments yet. Start the conversation.</Text>
          ) : null}
          {comments.map((comment) => {
            const commentName = comment.author.fullName?.trim() || comment.author.username || 'Parent'
            return (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentTop}>
                  <View style={styles.commentAuthorRow}>
                    <AuthorAvatar author={comment.author} />
                    <Text style={styles.commentAuthor}>{commentName}</Text>
                  </View>
                  {readOnly ? (
                    <Link href={requireAuthHref} asChild>
                      <Pressable>
                        <Text style={styles.commentLike}>♥ {comment.likeCount}</Text>
                      </Pressable>
                    </Link>
                  ) : (
                    <Pressable onPress={() => onLikeComment(comment.id)}>
                      <Text style={[styles.commentLike, comment.likedByMe && styles.actionTextActive]}>
                        ♥ {comment.likeCount}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.commentBody}>{comment.content}</Text>
              </View>
            )
          })}
          {readOnly ? (
            <Text style={styles.commentGuest}>
              <Link href={requireAuthHref}>
                <Text style={styles.commentGuestLink}>Sign up</Text>
              </Link>
              {' '}to reply and join the conversation.
            </Text>
          ) : (
            <View style={styles.commentForm}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment…"
                placeholderTextColor={palette.textMuted}
                style={styles.commentInput}
                maxLength={500}
              />
              <Button
                title="Reply"
                variant="secondary"
                disabled={submitting || !commentText.trim()}
                loading={submitting}
                onPress={() => void handleComment()}
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  )
}
