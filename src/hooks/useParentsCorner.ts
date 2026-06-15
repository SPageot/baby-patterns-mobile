import { useCallback, useState } from 'react'

import {
  addPostComment,
  createPost,
  deletePost,
  fetchPostComments,
  fetchPosts,
  toggleCommentLike,
  togglePostLike,
  updatePost,
} from '@/api/postsApi'
import { isApiConfigured } from '@/api/config'
import type { Post, PostComment, PostSubmitInput } from '@/schemas/post'
import { isOwnPost } from '@/lib/postUtils'
import { useDeferredEffect } from '@/lib/scheduleEffect'

export function useParentsCorner(enabled: boolean, currentUserId?: string) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [savingPostId, setSavingPostId] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({})
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({})
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({})

  const loadPosts = useCallback(async () => {
    if (!enabled || !isApiConfigured()) return
    setLoading(true)
    setError(null)
    try {
      const list = await fetchPosts(1)
      setPosts(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load posts')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useDeferredEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const publishPost = useCallback(async (input: PostSubmitInput) => {
    setPosting(true)
    setError(null)
    try {
      const post = await createPost(input)
      setPosts((prev) => [post, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish post')
      throw e
    } finally {
      setPosting(false)
    }
  }, [])

  const savePostEdit = useCallback(async (postId: string, input: PostSubmitInput) => {
    setSavingPostId(postId)
    setError(null)
    try {
      const updated = await updatePost(postId, input)
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)))
      setEditingPostId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update post')
      throw e
    } finally {
      setSavingPostId(null)
    }
  }, [])

  const likePost = useCallback(async (postId: string) => {
    const result = await togglePostLike(postId)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likedByMe: result.liked, likeCount: result.likeCount } : p,
      ),
    )
  }, [])

  const likeComment = useCallback(async (postId: string, commentId: string) => {
    const result = await toggleCommentLike(commentId)
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map((comment) =>
        comment.id === commentId
          ? { ...comment, likedByMe: result.liked, likeCount: result.likeCount }
          : comment,
      ),
    }))
  }, [])

  const toggleComments = useCallback(
    async (postId: string) => {
      const open = !commentsOpen[postId]
      setCommentsOpen((prev) => ({ ...prev, [postId]: open }))
      if (!open || commentsByPost[postId]) return

      setCommentsLoading((prev) => ({ ...prev, [postId]: true }))
      try {
        const comments = await fetchPostComments(postId)
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load comments')
      } finally {
        setCommentsLoading((prev) => ({ ...prev, [postId]: false }))
      }
    },
    [commentsByPost, commentsOpen],
  )

  const submitComment = useCallback(async (postId: string, content: string) => {
    const comment = await addPostComment(postId, content)
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), comment],
    }))
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)),
    )
    setCommentsOpen((prev) => ({ ...prev, [postId]: true }))
  }, [])

  const removePost = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId)
      if (post && !isOwnPost(post, currentUserId)) return
      await deletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (editingPostId === postId) setEditingPostId(null)
    },
    [currentUserId, editingPostId, posts],
  )

  const canManagePost = useCallback(
    (post: Post) => isOwnPost(post, currentUserId),
    [currentUserId],
  )

  return {
    posts,
    loading,
    posting,
    savingPostId,
    editingPostId,
    setEditingPostId,
    error,
    commentsByPost,
    commentsOpen,
    commentsLoading,
    loadPosts,
    publishPost,
    savePostEdit,
    likePost,
    likeComment,
    toggleComments,
    submitComment,
    removePost,
    canManagePost,
  }
}
