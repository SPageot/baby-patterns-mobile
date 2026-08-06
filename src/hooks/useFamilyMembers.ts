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
import { useApp } from '@/context/AppContext'

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

  const loadAll = useCallback(async () => {
    if (!enabled || !isApiConfigured()) return
    setLoading(true)
    setError(null)
    try {
      const [memberList, incoming, outgoing] = await Promise.all([
        fetchFamilyMembers(),
        fetchIncomingFamilyRequests(),
        fetchOutgoingFamilyRequests(),
      ])
      setMembers(memberList)
      setIncomingRequests(incoming)
      setOutgoingRequests(outgoing)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load family sharing')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useDeferredEffect(() => {
    void loadAll()
  }, [loadAll])

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
        await loadBabiesForCurrentUser()
        return member
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not accept invite')
        throw e
      } finally {
        setRespondingRequestId(null)
      }
    },
    [loadBabiesForCurrentUser],
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
        await loadBabiesForCurrentUser()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not remove family member')
        throw e
      } finally {
        setRemovingMemberUserId(null)
      }
    },
    [loadBabiesForCurrentUser],
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
