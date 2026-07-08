import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

import type { SolutionChallengeGroup } from '@/lib/solutionBoardGroups'
import {
  groupHasUnseenNotes,
  markChallengeGroupSeen,
  parseSolutionBoardSeenState,
  serializeSolutionBoardSeenState,
  solutionBoardSeenStorageKey,
  type SolutionBoardSeenState,
} from '@/lib/solutionBoardSeen'

export function useSolutionBoardSeen() {
  const [seen, setSeen] = useState<SolutionBoardSeenState>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(solutionBoardSeenStorageKey())
      .then((raw) => setSeen(parseSolutionBoardSeenState(raw)))
      .finally(() => setReady(true))
  }, [])

  const markSeen = useCallback((group: SolutionChallengeGroup) => {
    setSeen((prev) => {
      const next = markChallengeGroupSeen(group, prev)
      void AsyncStorage.setItem(solutionBoardSeenStorageKey(), serializeSolutionBoardSeenState(next))
      return next
    })
  }, [])

  const hasUnseen = useCallback(
    (group: SolutionChallengeGroup) => groupHasUnseenNotes(group, seen),
    [seen],
  )

  return { ready, markSeen, hasUnseen }
}
