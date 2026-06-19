import { useCallback, useMemo, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { loadDiaperLogsForBabies } from '@/api/diaperApi'
import { loadFeedingLogsForBabies } from '@/api/feedingApi'
import { loadPottyLogsForBabies } from '@/api/pottyApi'
import { loadGrowthForBabies } from '@/api/growthApi'
import { loadInjuryForBabies } from '@/api/injuryApi'
import { loadPediatricianVisitsForBabies } from '@/api/pediatricianApi'
import { loadMilestonesForBabies } from '@/api/milestoneApi'
import {
  addPostComment,
  deletePost,
  fetchPostComments,
  fetchPostsByUser,
  toggleCommentLike,
  togglePostLike,
  updatePost,
} from '@/api/postsApi'
import { loadSicknessForBabies } from '@/api/sicknessApi'
import { loadSleepLogsForBabies } from '@/api/sleepApi'
import { isApiConfigured } from '@/api/config'
import { fetchCurrentUser, updateUser, uploadUserAvatar, deleteUserAvatar } from '@/api/userApi'
import { prepareAvatarUpload } from '@/lib/avatarUpload'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { isOwnPost } from '@/lib/postUtils'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import { isProUser } from '@/lib/subscription'
import type { Post, PostComment, PostSubmitInput } from '@/schemas/post'
import type { LogRecord } from '@/types/babyLog'
import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import { buildProfileExtendedMonthStats } from '@/lib/profileMonthStats'
import {
  currentMonthLabel,
  formatAvgPerDay,
  formatSleepDurationShort,
  monthAvgPerDay,
  monthCount,
  monthSleepMinutesAvgPerDay,
  monthSleepMinutesTotal,
} from '@/lib/trackUtils'

export function useProfile() {
  const { user, babies, setUser, authReady } = useApp()
  const confirm = useConfirmAction()

  const ownBabies = useMemo(() => babies.filter((b) => !b.isShared), [babies])

  const userId = user?.id ?? ''
  const [locationDraft, setLocationDraft] = useState(user?.location ?? '')
  const [locationUserId, setLocationUserId] = useState(userId)
  if (userId !== locationUserId) {
    setLocationUserId(userId)
    setLocationDraft(user?.location ?? '')
  }

  const [savingLocation, setSavingLocation] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [allLogs, setAllLogs] = useState<LogRecord[]>([])
  const [growthRows, setGrowthRows] = useState<GrowthMeasurementDto[]>([])
  const [milestoneRows, setMilestoneRows] = useState<MilestoneDto[]>([])
  const [sicknessRows, setSicknessRows] = useState<SicknessEventDto[]>([])
  const [injuryRows, setInjuryRows] = useState<InjuryEventDto[]>([])
  const [pediatricianRows, setPediatricianRows] = useState<PediatricianVisitDto[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({})
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({})
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({})
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [savingPostId, setSavingPostId] = useState<string | null>(null)

  useDeferredEffect(() => {
    if (!authReady || !user?.id || !isApiConfigured()) return

    let cancelled = false
    void (async () => {
      try {
        const fresh = await fetchCurrentUser()
        if (!cancelled) {
          setUser(fresh)
          setLocationDraft(fresh.location ?? '')
        }
      } catch {
        /* keep cached user */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authReady, user?.id, setUser])

  const loadStats = useCallback(async () => {
    if (!isApiConfigured() || ownBabies.length === 0) {
      setAllLogs([])
      setGrowthRows([])
      setMilestoneRows([])
      setSicknessRows([])
      setInjuryRows([])
      setPediatricianRows([])
      return
    }

    setStatsLoading(true)
    try {
      const babyRefs = ownBabies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const [diapers, sleep, feeding, potty, growth, milestones, sickness, injuries, pediatricianVisits] =
        await Promise.all([
        loadDiaperLogsForBabies(babyRefs),
        loadSleepLogsForBabies(babyRefs),
        loadFeedingLogsForBabies(babyRefs),
        loadPottyLogsForBabies(babyRefs),
        loadGrowthForBabies(babyRefs),
        loadMilestonesForBabies(babyRefs),
        loadSicknessForBabies(babyRefs),
        loadInjuryForBabies(babyRefs),
        loadPediatricianVisitsForBabies(babyRefs),
      ])
      setAllLogs([...diapers, ...sleep, ...feeding, ...potty])
      setGrowthRows(growth)
      setMilestoneRows(milestones)
      setSicknessRows(sickness)
      setInjuryRows(injuries)
      setPediatricianRows(pediatricianVisits)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not load activity stats')
    } finally {
      setStatsLoading(false)
    }
  }, [ownBabies])

  useDeferredEffect(() => {
    void loadStats()
  }, [loadStats])

  const loadPosts = useCallback(async () => {
    if (!user?.id || !isApiConfigured()) {
      setPosts([])
      return
    }

    setPostsLoading(true)
    try {
      const list = await fetchPostsByUser(user.id, 1)
      setPosts(list)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not load your posts')
    } finally {
      setPostsLoading(false)
    }
  }, [user?.id])

  useDeferredEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const now = new Date()
  const statsYear = now.getFullYear()
  const statsMonth = now.getMonth() + 1

  const monthStats = useMemo(
    () => ({
      diapers: monthCount(allLogs, 'diaper', statsYear, statsMonth),
      sleep: monthCount(allLogs, 'sleep', statsYear, statsMonth),
      feeding: monthCount(allLogs, 'feeding', statsYear, statsMonth),
      potty: monthCount(allLogs, 'potty', statsYear, statsMonth),
    }),
    [allLogs, statsYear, statsMonth],
  )

  const monthAverages = useMemo(
    () => ({
      diapers: monthAvgPerDay(allLogs, 'diaper', statsYear, statsMonth),
      sleep: monthAvgPerDay(allLogs, 'sleep', statsYear, statsMonth),
      feeding: monthAvgPerDay(allLogs, 'feeding', statsYear, statsMonth),
      potty: monthAvgPerDay(allLogs, 'potty', statsYear, statsMonth),
    }),
    [allLogs, statsYear, statsMonth],
  )

  const monthSleepStats = useMemo(
    () => ({
      totalMinutes: monthSleepMinutesTotal(allLogs, statsYear, statsMonth),
      avgMinutesPerDay: monthSleepMinutesAvgPerDay(allLogs, statsYear, statsMonth),
      logCount: monthCount(allLogs, 'sleep', statsYear, statsMonth),
    }),
    [allLogs, statsYear, statsMonth],
  )

  const monthExtendedStats = useMemo(
    () =>
      buildProfileExtendedMonthStats(
        growthRows,
        milestoneRows,
        sicknessRows,
        injuryRows,
        pediatricianRows,
        statsYear,
        statsMonth,
      ),
    [growthRows, milestoneRows, sicknessRows, injuryRows, pediatricianRows, statsYear, statsMonth],
  )

  const saveLocation = useCallback(async () => {
    if (!user?.id || !isApiConfigured()) return
    const location = locationDraft.trim()
    if (!location) {
      setProfileError('Location cannot be empty')
      return
    }

    setSavingLocation(true)
    setProfileError(null)
    try {
      const updated = await updateUser({
        id: user.id,
        location,
        username: user.username,
        email: user.email,
        phone: user.phone,
        birthdate: user.birthdate,
        fullName: user.fullName,
      })
      setUser(updated)
      setLocationDraft(updated.location)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not update location')
    } finally {
      setSavingLocation(false)
    }
  }, [locationDraft, setUser, user])

  const pickAvatar = useCallback(async () => {
    if (!user?.id || !isApiConfigured()) return

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setProfileError('Photo library permission is required to change your profile photo.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.92,
    })

    if (result.canceled || !result.assets[0]) return

    setUploadingAvatar(true)
    setProfileError(null)
    try {
      const prepared = prepareAvatarUpload(result.assets[0])
      const updated = await uploadUserAvatar(user.id, prepared)
      setUser(updated)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not upload photo')
    } finally {
      setUploadingAvatar(false)
    }
  }, [setUser, user])

  const removeAvatar = useCallback(() => {
    if (!user?.id || !isApiConfigured()) return

    confirm({
      title: 'Remove profile photo?',
      message: 'Your profile photo will be removed. You can upload a new one anytime.',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setDeletingAvatar(true)
        setProfileError(null)
        try {
          const updated = await deleteUserAvatar(user.id)
          setUser(updated)
        } catch (e) {
          setProfileError(e instanceof Error ? e.message : 'Could not remove photo')
        } finally {
          setDeletingAvatar(false)
        }
      },
    })
  }, [confirm, setUser, user])

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
        setProfileError(e instanceof Error ? e.message : 'Could not load comments')
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
      if (!user?.id) return
      const post = posts.find((p) => p.id === postId)
      if (post && !isOwnPost(post, user.id)) return
      await deletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (editingPostId === postId) setEditingPostId(null)
    },
    [editingPostId, posts, user?.id],
  )

  const savePostEdit = useCallback(async (postId: string, input: PostSubmitInput) => {
    setSavingPostId(postId)
    setProfileError(null)
    try {
      const updated = await updatePost(postId, input)
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)))
      setEditingPostId(null)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not update post')
      throw e
    } finally {
      setSavingPostId(null)
    }
  }, [])

  const downloadTrackingPdf = useCallback(async () => {
    if (!isApiConfigured()) {
      setProfileError('Set EXPO_PUBLIC_API_URL in .env to export tracking data.')
      return
    }
    if (!isProUser(user)) {
      setProfileError('PDF export requires Pro. Upgrade to download pediatrician-ready reports.')
      return
    }
    if (ownBabies.length === 0) {
      setProfileError('Add a baby before downloading a report.')
      return
    }

    setExportingPdf(true)
    setProfileError(null)
    try {
      const babyRefs = ownBabies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const [diapers, sleep, feeding, potty, growth, milestones, sickness, injuries, pediatricianVisits] =
        await Promise.all([
        loadDiaperLogsForBabies(babyRefs),
        loadSleepLogsForBabies(babyRefs),
        loadFeedingLogsForBabies(babyRefs),
        loadPottyLogsForBabies(babyRefs),
        loadGrowthForBabies(babyRefs),
        loadMilestonesForBabies(babyRefs),
        loadSicknessForBabies(babyRefs),
        loadInjuryForBabies(babyRefs),
        loadPediatricianVisitsForBabies(babyRefs),
      ])
      const logs = [...diapers, ...sleep, ...feeding, ...potty]
      setAllLogs(logs)
      setGrowthRows(growth)
      setMilestoneRows(milestones)
      setSicknessRows(sickness)
      setInjuryRows(injuries)
      setPediatricianRows(pediatricianVisits)

      const parentName = user?.fullName?.trim() || user?.username?.trim() || 'Parent'
      const { downloadTrackingReportPdf } = await import('@/lib/trackingReportPdf')
      await downloadTrackingReportPdf({
        logs,
        measurements: growth,
        milestones,
        sickness,
        injuries,
        pediatricianVisits,
        babies: ownBabies,
        parentName,
      })
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not create PDF report')
    } finally {
      setExportingPdf(false)
    }
  }, [ownBabies, user])

  const isPro = isProUser(user)

  return {
    isPro,
    locationDraft,
    setLocationDraft,
    savingLocation,
    uploadingAvatar,
    deletingAvatar,
    profileError,
    statsLoading,
    exportingPdf,
    babies,
    ownBabies,
    monthStats,
    monthAverages,
    monthSleepStats,
    monthExtendedStats,
    currentMonthLabel,
    formatAvgPerDay,
    formatSleepDurationShort,
    posts,
    postsLoading,
    commentsByPost,
    commentsOpen,
    commentsLoading,
    editingPostId,
    setEditingPostId,
    savingPostId,
    saveLocation,
    pickAvatar,
    removeAvatar,
    likePost,
    likeComment,
    toggleComments,
    submitComment,
    removePost,
    savePostEdit,
    downloadTrackingPdf,
    apiConfigured: isApiConfigured(),
    allLogs,
    injuryRows,
    pediatricianRows,
  }
}
