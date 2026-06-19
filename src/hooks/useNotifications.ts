import { useCallback, useRef, useState } from 'react'

import {
  clearAllNotifications,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotification,
} from '@/api/notificationsApi'
import { isApiConfigured } from '@/api/config'
import { subscribeLiveEvent } from '@/lib/liveHub'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import type { AppNotification } from '@/schemas/notification'

type NotificationsUpdatedPayload = {
  unreadCount?: number
  notifications?: unknown[]
}

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [open, setOpen] = useState(false)
  const loadInFlight = useRef(false)
  const openRef = useRef(open)

  openRef.current = open

  const refreshCount = useCallback(async () => {
    if (!enabled || !isApiConfigured()) return
    try {
      const count = await fetchUnreadNotificationCount()
      setUnreadCount(count)
    } catch {
      /* ignore refresh errors */
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

    return subscribeLiveEvent('notificationsUpdated', (payload) => {
      const data = payload as NotificationsUpdatedPayload
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount)
      }

      if (!openRef.current || !Array.isArray(data.notifications) || data.notifications.length === 0) {
        return
      }

      const incoming = data.notifications
        .map(normalizeNotification)
        .filter((item): item is AppNotification => item != null)

      if (incoming.length === 0) return

      setItems((prev) => {
        const existing = new Set(prev.map((item) => item.id))
        const fresh = incoming.filter((item) => !existing.has(item.id))
        return fresh.length > 0 ? [...fresh, ...prev] : prev
      })
    })
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
