import { useCallback, useMemo, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { loadDiaperLogsForBabies } from '@/api/diaperApi'
import { loadFeedingLogsForBabies } from '@/api/feedingApi'
import { loadSleepLogsForBabies } from '@/api/sleepApi'
import { isApiConfigured } from '@/api/config'
import { fetchCurrentUser, updateUser, uploadUserAvatar, deleteUserAvatar } from '@/api/userApi'
import { prepareAvatarUpload } from '@/lib/avatarUpload'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import { useApp } from '@/context/AppContext'
import type { LogRecord } from '@/types/babyLog'
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
  const [allLogs, setAllLogs] = useState<LogRecord[]>([])

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
    if (!isApiConfigured() || babies.length === 0) {
      setAllLogs([])
      return
    }

    setStatsLoading(true)
    try {
      const babyRefs = babies.map((b) => ({ id: b.id, fullName: b.fullName }))
      const [diapers, sleep, feeding] = await Promise.all([
        loadDiaperLogsForBabies(babyRefs),
        loadSleepLogsForBabies(babyRefs),
        loadFeedingLogsForBabies(babyRefs),
      ])
      setAllLogs([...diapers, ...sleep, ...feeding])
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not load activity stats')
    } finally {
      setStatsLoading(false)
    }
  }, [babies])

  useDeferredEffect(() => {
    void loadStats()
  }, [loadStats])

  const now = new Date()
  const statsYear = now.getFullYear()
  const statsMonth = now.getMonth() + 1

  const monthStats = useMemo(
    () => ({
      diapers: monthCount(allLogs, 'diaper', statsYear, statsMonth),
      sleep: monthCount(allLogs, 'sleep', statsYear, statsMonth),
      feeding: monthCount(allLogs, 'feeding', statsYear, statsMonth),
    }),
    [allLogs, statsYear, statsMonth],
  )

  const monthAverages = useMemo(
    () => ({
      diapers: monthAvgPerDay(allLogs, 'diaper', statsYear, statsMonth),
      sleep: monthAvgPerDay(allLogs, 'sleep', statsYear, statsMonth),
      feeding: monthAvgPerDay(allLogs, 'feeding', statsYear, statsMonth),
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

  const removeAvatar = useCallback(async () => {
    if (!user?.id || !isApiConfigured()) return

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
  }, [setUser, user])

  return {
    locationDraft,
    setLocationDraft,
    savingLocation,
    uploadingAvatar,
    deletingAvatar,
    profileError,
    statsLoading,
    babies,
    monthStats,
    monthAverages,
    monthSleepStats,
    currentMonthLabel,
    formatAvgPerDay,
    formatSleepDurationShort,
    saveLocation,
    pickAvatar,
    removeAvatar,
    apiConfigured: isApiConfigured(),
  }
}
