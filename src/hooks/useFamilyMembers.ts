import { useCallback, useState } from 'react'

import {
  acceptFamilyShareRequest,
  cancelFamilyShareRequest,
  declineFamilyShareRequest,
  fetchFamilyMembers,
  fetchIncomingFamilyRequests,
  fetchOutgoingFamilyRequests,
  removeFamilyMember,
  sendFamilyShareRequest,
  updateFamilyMemberTag,
} from '@/api/familyMembersApi'
import { isApiConfigured } from '@/api/config'
import type { FamilyMember, FamilyShareRequest } from '@/schemas/familyMember'
import type { UserSearchResult } from '@/api/userApi'
import { searchUsers } from '@/api/userApi'
import { useDeferredEffect } from '@/lib/scheduleEffect'
import {
  cacheFirstLoad,
  FAMILY_TTL_MS,
  familyCacheKey,
  invalidateCachedData,
  peekCachedData,
} from '@/lib/dataCache'
import { useApp } from '@/context/AppContext'

type FamilyCachePayload = {
  members: FamilyMember[]
  incoming: FamilyShareRequest[]
  outgoing: FamilyShareRequest[]
}

export function useFamilyMembers(enabled: boolean) {
  const { loadBabiesForCurrentUser } = useApp()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FamilyShareRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FamilyShareRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null)
  const [removingMemberUserId, setRemovingMemberUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const applyFamilyCache = useCallback((data: FamilyCachePayload) => {
    setMembers(data.members)
    setIncomingRequests(data.incoming)
    setOutgoingRequests(data.outgoing)
  }, [])

  const loadAll = useCallback(
    async (options?: { showLoading?: boolean; forceNetwork?: boolean }) => {
      if (!enabled || !isApiConfigured()) return

      const key = familyCacheKey()
      if (options?.forceNetwork) {
        invalidateCachedData(key)
      }

      const showLoading = options?.showLoading ?? true
      setError(null)

      try {
        await cacheFirstLoad({
          key,
          ttlMs: FAMILY_TTL_MS,
          showLoading,
          setLoading,
          apply: applyFamilyCache,
          fetcher: async () => {
            const [memberList, incoming, outgoing] = await Promise.all([
              fetchFamilyMembers(),
              fetchIncomingFamilyRequests(),
              fetchOutgoingFamilyRequests(),
            ])
            return { members: memberList, incoming, outgoing }
          },
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load family sharing')
      }
    },
    [enabled, applyFamilyCache],
  )

  useDeferredEffect(() => {
    if (!enabled || !isApiConfigured()) return

    const cached = peekCachedData<FamilyCachePayload>(familyCacheKey())
    if (cached) applyFamilyCache(cached.data)
    void loadAll({ showLoading: !cached })
  }, [enabled, loadAll, applyFamilyCache])

  useDeferredEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        setSearching(true)
        try {
          const results = await searchUsers(query, 8)
          if (!cancelled) setSuggestions(results)
        } catch {
          if (!cancelled) setSuggestions([])
        } finally {
          if (!cancelled) setSearching(false)
        }
      })()
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  const isConnectedOrPending = useCallback(
    (userId: string, username: string) => {
      const normalized = username.trim().toLowerCase()
      if (members.some((m) => m.memberUserId === userId)) return true
      if (
        incomingRequests.some(
          (r) => r.requesterUserId === userId || r.requesterUsername.toLowerCase() === normalized,
        )
      ) {
        return true
      }
      if (
        outgoingRequests.some(
          (r) => r.recipientUserId === userId || r.recipientUsername.toLowerCase() === normalized,
        )
      ) {
        return true
      }
      return false
    },
    [members, incomingRequests, outgoingRequests],
  )

  const sendRequest = useCallback(async (username: string) => {
    setAdding(true)
    setError(null)
    try {
      const request = await sendFamilyShareRequest(username)
      setOutgoingRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev
        return [request, ...prev]
      })
      setSearchQuery('')
      setSuggestions([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send invite')
      throw e
    } finally {
      setAdding(false)
    }
  }, [])

  const acceptRequest = useCallback(
    async (requestId: string, relationshipTag?: string | null) => {
      setRespondingRequestId(requestId)
      setError(null)
      try {
        const member = await acceptFamilyShareRequest(requestId, relationshipTag)
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId))
        setMembers((prev) => {
          if (prev.some((m) => m.memberUserId === member.memberUserId)) {
            return prev.map((m) => (m.memberUserId === member.memberUserId ? member : m))
          }
          return [member, ...prev]
        })
        await loadBabiesForCurrentUser({ force: true })
        invalidateCachedData(familyCacheKey())
        await loadAll({ showLoading: false, forceNetwork: true })
        return member
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not accept invite')
        throw e
      } finally {
        setRespondingRequestId(null)
      }
    },
    [loadBabiesForCurrentUser, loadAll],
  )

  const updateMemberTag = useCallback(async (memberUserId: string, relationshipTag: string | null) => {
    setError(null)
    try {
      const member = await updateFamilyMemberTag(memberUserId, relationshipTag)
      setMembers((prev) =>
        prev.map((m) => (m.memberUserId === member.memberUserId ? member : m)),
      )
      return member
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update tag')
      throw e
    }
  }, [])

  const declineRequest = useCallback(async (requestId: string) => {
    setRespondingRequestId(requestId)
    setError(null)
    try {
      await declineFamilyShareRequest(requestId)
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not decline invite')
      throw e
    } finally {
      setRespondingRequestId(null)
    }
  }, [])

  const cancelOutgoingRequest = useCallback(async (requestId: string) => {
    setRespondingRequestId(requestId)
    setError(null)
    try {
      await cancelFamilyShareRequest(requestId)
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel invite')
      throw e
    } finally {
      setRespondingRequestId(null)
    }
  }, [])

  const removeMember = useCallback(
    async (memberUserId: string) => {
      const id = memberUserId.trim()
      if (!id) return

      setRemovingMemberUserId(id)
      setError(null)
      try {
        await removeFamilyMember(id)
        setMembers((prev) => prev.filter((m) => m.memberUserId !== id))
        await loadBabiesForCurrentUser({ force: true })
        invalidateCachedData(familyCacheKey())
        await loadAll({ showLoading: false, forceNetwork: true })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not remove family member')
        throw e
      } finally {
        setRemovingMemberUserId(null)
      }
    },
    [loadBabiesForCurrentUser, loadAll],
  )

  return {
    members,
    incomingRequests,
    outgoingRequests,
    loading,
    adding,
    respondingRequestId,
    removingMemberUserId,
    error,
    searchQuery,
    setSearchQuery,
    suggestions,
    searching,
    loadAll,
    isConnectedOrPending,
    sendRequest,
    acceptRequest,
    updateMemberTag,
    declineRequest,
    cancelOutgoingRequest,
    removeMember,
  }
}
