import { Alert, ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'

import { PostCard } from '@/components/parentsCorner/PostCard'
import { PostComposer } from '@/components/parentsCorner/PostComposer'
import { Eyebrow, ErrorText } from '@/components/ui/primitives'
import { NavIcon } from '@/components/icons/NavIcon'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
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
  guestContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    justifyContent: 'center' as const,
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
  guestActions: {
    flexDirection: 'row' as const,
    gap: 16,
    marginTop: Spacing.three,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.textMuted,
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
  const corner = useParentsCorner(Boolean(user?.id), user?.id)

  if (!authReady) {
    return <Text style={styles.status}>Loading…</Text>
  }

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.guestContent}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <NavIcon name="users" size={22} color={palette.accentDeep} />
          </View>
          <Eyebrow>Community</Eyebrow>
          <Text style={styles.title}>Parents Corner</Text>
          <Text style={styles.subtitle}>
            Share photos, ask questions, and learn from parents on the same journey.
          </Text>
          <View style={styles.guestActions}>
            <Link href="/login" style={styles.loginLink}>
              Log in to join
            </Link>
            <Link href="/signup" style={styles.signupLink}>
              Create account
            </Link>
          </View>
        </View>
      </ScrollView>
    )
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
        <Eyebrow>Live feed</Eyebrow>
        <Text style={styles.title}>Parents Corner</Text>
        <Text style={styles.subtitle}>
          Your community timeline — post updates, react, and join the conversation.
        </Text>
      </View>

      <PostComposer
        posting={corner.posting}
        isSiteDeveloper={isSiteDeveloper(user)}
        onPublish={corner.publishPost}
      />

      {corner.error ? <ErrorText>{corner.error}</ErrorText> : null}
      {corner.loading ? <Text style={styles.status}>Loading posts…</Text> : null}

      {!corner.loading && corner.posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyBody}>Be the first to share a moment or ask the community a question.</Text>
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
          onLike={() => void corner.likePost(post.id)}
          onToggleComments={() => void corner.toggleComments(post.id)}
          onComment={(content) => corner.submitComment(post.id, content)}
          onLikeComment={(commentId) => void corner.likeComment(post.id, commentId)}
          onEdit={() => corner.setEditingPostId(post.id)}
          onCancelEdit={() => corner.setEditingPostId(null)}
          onSaveEdit={(input) => corner.savePostEdit(post.id, input)}
          onDelete={() => {
            Alert.alert('Delete post?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => void corner.removePost(post.id),
              },
            ])
          }}
          isSiteDeveloper={isSiteDeveloper(user)}
        />
      ))}
    </ScrollView>
  )
}
