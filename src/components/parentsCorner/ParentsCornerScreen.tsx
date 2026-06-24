import { ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'

import { PostCard } from '@/components/parentsCorner/PostCard'
import { PostComposer } from '@/components/parentsCorner/PostComposer'
import { Button, Eyebrow, ErrorText } from '@/components/ui/primitives'
import { NavIcon } from '@/components/icons/NavIcon'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useParentsCorner } from '@/hooks/useParentsCorner'
import { isSiteDeveloper } from '@/lib/subscription'
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
    paddingBottom: Spacing.five,
    paddingTop: Spacing.two,
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
  joinBar: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.accentSoft,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  joinText: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  joinActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  status: {
    color: t.textMuted,
    fontSize: 14,
    paddingVertical: Spacing.two,
  },
  empty: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    alignItems: 'center' as const,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: t.text,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
})

export function ParentsCornerScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { user, authReady } = useApp()
  const confirm = useConfirmAction()
  const isLoggedIn = Boolean(user?.id)
  const corner = useParentsCorner(authReady && isApiConfigured(), user?.id)

  if (!authReady) {
    return <Text style={styles.status}>Loading…</Text>
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Eyebrow>Community</Eyebrow>
          <Text style={styles.title}>Parents Corner</Text>
        </View>
        <ErrorText>Set EXPO_PUBLIC_API_URL in .env to use Parents Corner.</ErrorText>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <NavIcon name="users" size={22} color={palette.accentDeep} />
        </View>
        <Eyebrow>{isLoggedIn ? 'Live feed' : 'Community'}</Eyebrow>
        <Text style={styles.title}>Parents Corner</Text>
        <Text style={styles.subtitle}>
          {isLoggedIn
            ? 'Your community timeline — post updates, react, and join the conversation.'
            : 'Browse posts from other parents. Sign up to share photos, ask questions, and join the conversation.'}
        </Text>
      </View>

      {isLoggedIn ? (
        <PostComposer
          posting={corner.posting}
          isSiteDeveloper={isSiteDeveloper(user)}
          onPublish={corner.publishPost}
        />
      ) : (
        <View style={styles.joinBar}>
          <Text style={styles.joinText}>
            Create a free account to post, comment, and react in Parents Corner.
          </Text>
          <View style={styles.joinActions}>
            <Link href="/signup" asChild>
              <Button title="Sign up to post" />
            </Link>
            <Link href="/login" asChild>
              <Button title="Log in" variant="secondary" />
            </Link>
          </View>
        </View>
      )}

      {corner.error ? <ErrorText>{corner.error}</ErrorText> : null}
      {corner.loading ? <Text style={styles.status}>Loading posts…</Text> : null}

      {!corner.loading && corner.posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyBody}>
            {isLoggedIn
              ? 'Be the first to share a moment or ask the community a question.'
              : 'Check back soon — or sign up and be the first to post.'}
          </Text>
        </View>
      ) : null}

      {corner.posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          comments={corner.commentsByPost[post.id] ?? []}
          commentsOpen={Boolean(corner.commentsOpen[post.id])}
          commentsLoading={Boolean(corner.commentsLoading[post.id])}
          canEdit={corner.canManagePost(post)}
          canDelete={corner.canManagePost(post)}
          editing={corner.editingPostId === post.id}
          saving={corner.savingPostId === post.id}
          readOnly={!isLoggedIn}
          requireAuthHref="/signup"
          onLike={() => void corner.likePost(post.id)}
          onToggleComments={() => void corner.toggleComments(post.id)}
          onComment={(content) => corner.submitComment(post.id, content)}
          onLikeComment={(commentId) => void corner.likeComment(post.id, commentId)}
          onEdit={() => corner.setEditingPostId(post.id)}
          onCancelEdit={() => corner.setEditingPostId(null)}
          onSaveEdit={(input) => corner.savePostEdit(post.id, input)}
          onDelete={() => {
            confirm({
              title: 'Delete post?',
              message: 'This post and its comments will be removed. This cannot be undone.',
              onConfirm: () => corner.removePost(post.id),
            })
          }}
          isSiteDeveloper={isSiteDeveloper(user)}
        />
      ))}
    </ScrollView>
  )
}
