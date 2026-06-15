import { useCallback, useState } from 'react'

import {
  addFamilyMember,
  fetchFamilyMembers,
  removeFamilyMember,
} from '@/api/familyMembersApi'
import { isApiConfigured } from '@/api/config'
import type { FamilyMember } from '@/schemas/familyMember'
import type { UserSearchResult } from '@/api/userApi'
import { searchUsers } from '@/api/userApi'
import { useDeferredEffect } from '@/lib/scheduleEffect'

export function useFamilyMembers(enabled: boolean) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removingMemberUserId, setRemovingMemberUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const loadMembers = useCallback(async () => {
    if (!enabled || !isApiConfigured()) return
    setLoading(true)
    setError(null)
    try {
      setMembers(await fetchFamilyMembers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load family members')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useDeferredEffect(() => {
    void loadMembers()
  }, [loadMembers])

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

  const addMember = useCallback(async (username: string) => {
    setAdding(true)
    setError(null)
    try {
      const member = await addFamilyMember(username)
      setMembers((prev) => {
        if (prev.some((m) => m.memberUserId === member.memberUserId)) return prev
        return [member, ...prev]
      })
      setSearchQuery('')
      setSuggestions([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add family member')
      throw e
    } finally {
      setAdding(false)
    }
  }, [])

  const removeMember = useCallback(async (memberUserId: string) => {
    const id = memberUserId.trim()
    if (!id) return

    setRemovingMemberUserId(id)
    setError(null)
    try {
      await removeFamilyMember(id)
      setMembers((prev) => prev.filter((m) => m.memberUserId !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove family member')
      throw e
    } finally {
      setRemovingMemberUserId(null)
    }
  }, [])

  return {
    members,
    loading,
    adding,
    removingMemberUserId,
    error,
    searchQuery,
    setSearchQuery,
    suggestions,
    searching,
    loadMembers,
    addMember,
    removeMember,
  }
}
