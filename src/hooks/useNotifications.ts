import { useCallback, useRef, useState } from 'react'

import {
  clearAllNotifications,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notificationsApi'
import { isApiConfigured } from '@/api/config'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import type { AppNotification } from '@/schemas/notification'

const POLL_MS = 45_000

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [open, setOpen] = useState(false)
  const loadInFlight = useRef(false)
  const pollInFlight = useRef(false)

  const refreshCount = useCallback(async () => {
    if (!enabled || !isApiConfigured() || pollInFlight.current) return
    pollInFlight.current = true
    try {
      const count = await fetchUnreadNotificationCount()
      setUnreadCount(count)
    } catch {
      /* ignore polling errors */
    } finally {
      pollInFlight.current = false
    }
  }, [enabled])

  const loadNotifications = useCallback(async () => {
    if (!enabled || !isApiConfigured() || loadInFlight.current) return
    loadInFlight.current = true
    setLoading(true)
    try {
      const list = await fetchNotifications(1)
      setItems(list)
      const count = await fetchUnreadNotificationCount()
      setUnreadCount(count)
    } catch {
      /* ignore load errors */
    } finally {
      loadInFlight.current = false
      setLoading(false)
    }
  }, [enabled])

  useDeferredEffect(() => {
    if (!enabled) return
    void refreshCount()

    const timer = setInterval(() => {
      void refreshCount()
    }, POLL_MS)

    return () => clearInterval(timer)
  }, [enabled, refreshCount])

  useDeferredEffect(() => {
    if (!open) return
    void loadNotifications()
  }, [open, loadNotifications])

  const markRead = useCallback(async (notificationId: string) => {
    await markNotificationRead(notificationId)
    setItems((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    )
    setUnreadCount((count) => Math.max(0, count - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(async () => {
    setClearing(true)
    try {
      await clearAllNotifications()
      setItems([])
      setUnreadCount(0)
    } finally {
      setClearing(false)
    }
  }, [])

  return {
    items,
    unreadCount,
    loading,
    clearing,
    open,
    setOpen,
    loadNotifications,
    refreshCount,
    markRead,
    markAllRead,
    clearAll,
  }
}
