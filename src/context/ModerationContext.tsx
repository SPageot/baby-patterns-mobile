import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  blockUser as blockUserApi,
  fetchBlockedUserIds,
  reportContent as reportContentApi,
} from '@/api/moderationApi'
import { useApp } from '@/context/AppContext'
import type { ContentReportReason, ModerationContentType } from '@/schemas/moderation'

type ModerationContextValue = {
  ready: boolean
  blockedUserIds: ReadonlySet<string>
  isBlocked: (userId: string) => boolean
  blockUser: (userId: string) => Promise<void>
  reportContent: (
    contentType: ModerationContentType,
    contentId: string,
    reason: ContentReportReason,
    details?: string,
  ) => Promise<void>
}

const ModerationContext = createContext<ModerationContextValue | null>(null)

export function ModerationProvider({ children }: { children: ReactNode }) {
  const { user } = useApp()
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!user?.id) {
      setBlockedUserIds(new Set())
      setReady(true)
      return () => {
        cancelled = true
      }
    }

    setReady(false)
    void (async () => {
      try {
        const ids = await fetchBlockedUserIds()
        if (!cancelled) {
          setBlockedUserIds(new Set(ids))
        }
      } catch {
        if (!cancelled) {
          setBlockedUserIds(new Set())
        }
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const isBlocked = useCallback(
    (userId: string) => Boolean(userId) && blockedUserIds.has(userId),
    [blockedUserIds],
  )

  const blockUser = useCallback(async (userId: string) => {
    if (!userId) return
    await blockUserApi(userId)
    setBlockedUserIds((prev) => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
  }, [])

  const reportContent = useCallback(
    async (
      contentType: ModerationContentType,
      contentId: string,
      reason: ContentReportReason,
      details?: string,
    ) => {
      await reportContentApi(contentType, contentId, reason, details)
    },
    [],
  )

  const value = useMemo(
    () => ({
      ready,
      blockedUserIds,
      isBlocked,
      blockUser,
      reportContent,
    }),
    [ready, blockedUserIds, isBlocked, blockUser, reportContent],
  )

  return <ModerationContext.Provider value={value}>{children}</ModerationContext.Provider>
}

export function useModeration(): ModerationContextValue {
  const ctx = useContext(ModerationContext)
  if (!ctx) {
    throw new Error('useModeration must be used within ModerationProvider')
  }
  return ctx
}
