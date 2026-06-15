import { useState } from 'react'
import { Image } from 'expo-image'
import { Linking, Pressable, Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { Post, PostComment, PostSubmitInput } from '@/schemas/post'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

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

function AuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const styles = useThemedStyles(createStyles)
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  )
}

function BadgeChip({ badge }: { badge: NonNullable<Post['badge']> }) {
  const styles = useThemedStyles(createStyles)
  const label = badge === 'advice' ? 'Advice' : 'Recommendation'
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
}: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [commentText, setCommentText] = useState('')
  const [editContent, setEditContent] = useState(post.content)
  const [submitting, setSubmitting] = useState(false)
  const displayName = post.author.fullName?.trim() || post.author.username || 'Parent'

  const handleComment = async () => {
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
        <TextInput
          value={editContent}
          onChangeText={setEditContent}
          multiline
          style={styles.editInput}
          maxLength={2000}
        />
        <View style={styles.editActions}>
          <Button title="Cancel" variant="secondary" onPress={onCancelEdit} style={styles.editBtn} />
          <Button
            title={saving ? 'Saving…' : 'Save'}
            loading={saving}
            disabled={!editContent.trim()}
            onPress={() =>
              void onSaveEdit({
                content: editContent.trim(),
                badge: post.badge,
                removeMediaIds: [],
              })
            }
            style={styles.editBtn}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AuthorAvatar name={displayName} avatarUrl={post.author.avatarUrl} />
        <View style={styles.meta}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>
              {formatWhen(post.createdAt)}
              {post.updatedAt ? ' · edited' : ''}
            </Text>
            {post.badge ? <BadgeChip badge={post.badge} /> : null}
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
          {post.linkPreviews.map((preview) => (
            <Pressable
              key={preview.id || preview.url}
              onPress={() => void Linking.openURL(preview.url)}
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
        <Pressable onPress={() => void onLike()} style={styles.actionBtn}>
          <Text style={[styles.actionText, post.likedByMe && styles.actionTextActive]}>
            ♥ {post.likeCount}
          </Text>
        </Pressable>
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
                  <Text style={styles.commentAuthor}>{commentName}</Text>
                  <Pressable onPress={() => onLikeComment(comment.id)}>
                    <Text style={[styles.commentLike, comment.likedByMe && styles.actionTextActive]}>
                      ♥ {comment.likeCount}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.commentBody}>{comment.content}</Text>
              </View>
            )
          })}
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
        </View>
      ) : null}
    </View>
  )
}
