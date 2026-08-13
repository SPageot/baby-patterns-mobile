import { useCallback, useEffect, useState } from 'react'
import {
  addParentSolution,
  createParentProblem,
  deleteParentProblem,
  deleteParentSolution,
  fetchParentProblem,
  fetchParentProblems,
  toggleProblemMeToo,
  toggleSolutionUpvote,
} from '@/api/parentSolutionBoardApi'
import { isApiConfigured } from '@/api/config'
import type { CreateParentProblemInput, ParentProblem } from '@/schemas/parentSolutionBoard'

export function useParentSolutionBoard(enabled: boolean, category: string) {
  const [problems, setProblems] = useState<ParentProblem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDetail, setActiveDetail] = useState<ParentProblem | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProblems = useCallback(async () => {
    if (!enabled || !isApiConfigured()) return
    setLoading(true)
    setError(null)
    try {
      const list = await fetchParentProblems(category, 1)
      setProblems(list)
      setActiveId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the board')
    } finally {
      setLoading(false)
    }
  }, [enabled, category])

  useEffect(() => {
    void loadProblems()
  }, [loadProblems])

  useEffect(() => {
    if (!enabled || !activeId || !isApiConfigured()) {
      setActiveDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    void fetchParentProblem(activeId)
      .then((detail) => {
        if (!cancelled) setActiveDetail(detail)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load this problem')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, activeId])

  const goNext = useCallback(() => {
    if (problems.length === 0) return
    const idx = problems.findIndex((p) => p.id === activeId)
    const next = problems[(idx + 1 + problems.length) % problems.length]
    if (next) setActiveId(next.id)
  }, [problems, activeId])

  const goPrev = useCallback(() => {
    if (problems.length === 0) return
    const idx = problems.findIndex((p) => p.id === activeId)
    const prev = problems[(idx - 1 + problems.length) % problems.length]
    if (prev) setActiveId(prev.id)
  }, [problems, activeId])

  const pinProblem = useCallback(
    async (input: CreateParentProblemInput) => {
      setSaving(true)
      setError(null)
      try {
        const created = await createParentProblem(input)
        setProblems((prev) => [created, ...prev])
        setActiveId(created.id)
        setActiveDetail(created)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not pin that problem')
        throw e
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const pinSolution = useCallback(
    async (body: string) => {
      if (!activeId) return
      setSaving(true)
      setError(null)
      try {
        await addParentSolution(activeId, body)
        const detail = await fetchParentProblem(activeId)
        setActiveDetail(detail)
        setProblems((prev) =>
          prev.map((p) =>
            p.id === activeId
              ? { ...p, solutionCount: detail.solutionCount, isTrending: detail.isTrending }
              : p,
          ),
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not pin that solution')
        throw e
      } finally {
        setSaving(false)
      }
    },
    [activeId],
  )

  const meToo = useCallback(async () => {
    if (!activeId) return
    try {
      const result = await toggleProblemMeToo(activeId)
      setActiveDetail((prev) =>
        prev ? { ...prev, meTooByMe: result.meToo, meTooCount: result.meTooCount } : prev,
      )
      setProblems((prev) =>
        prev.map((p) =>
          p.id === activeId
            ? { ...p, meTooByMe: result.meToo, meTooCount: result.meTooCount }
            : p,
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update Me too')
    }
  }, [activeId])

  const upvote = useCallback(
    async (solutionId: string) => {
      try {
        await toggleSolutionUpvote(solutionId)
        if (!activeId) return
        const detail = await fetchParentProblem(activeId)
        setActiveDetail(detail)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not update upvote')
      }
    },
    [activeId],
  )

  const removeProblem = useCallback(async (problemId: string) => {
    try {
      await deleteParentProblem(problemId)
      setProblems((prev) => {
        const next = prev.filter((p) => p.id !== problemId)
        setActiveId((cur) => (cur === problemId ? next[0]?.id ?? null : cur))
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove problem')
    }
  }, [])

  const removeSolution = useCallback(
    async (solutionId: string) => {
      try {
        await deleteParentSolution(solutionId)
        if (!activeId) return
        const detail = await fetchParentProblem(activeId)
        setActiveDetail(detail)
        setProblems((prev) =>
          prev.map((p) => (p.id === activeId ? { ...p, solutionCount: detail.solutionCount } : p)),
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not remove solution')
      }
    },
    [activeId],
  )

  return {
    problems,
    activeId,
    setActiveId,
    activeDetail,
    loading,
    detailLoading,
    saving,
    error,
    reload: loadProblems,
    goNext,
    goPrev,
    pinProblem,
    pinSolution,
    meToo,
    upvote,
    removeProblem,
    removeSolution,
  }
}
