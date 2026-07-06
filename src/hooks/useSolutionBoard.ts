import { useCallback, useEffect, useState } from 'react'
import {
  createSolutionNote,
  deleteSolutionNote,
  fetchSolutionNotes,
  updateSolutionNote,
} from '@/api/solutionNotesApi'
import { isApiConfigured } from '@/api/config'
import type { SolutionNote, SolutionNoteInput } from '@/schemas/solutionNote'

export function useSolutionBoard(enabled: boolean) {
  const [notes, setNotes] = useState<SolutionNote[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadNotes = useCallback(async () => {
    if (!enabled || !isApiConfigured()) return
    setLoading(true)
    setError(null)
    try {
      const list = await fetchSolutionNotes(1)
      setNotes(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load solution board')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  const addNote = useCallback(async (input: SolutionNoteInput) => {
    setSaving(true)
    setError(null)
    try {
      const note = await createSolutionNote(input)
      setNotes((prev) => [note, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add sticky note')
      throw e
    } finally {
      setSaving(false)
    }
  }, [])

  const saveNoteEdit = useCallback(async (noteId: string, input: SolutionNoteInput) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateSolutionNote(noteId, input)
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)))
      setEditingNoteId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update sticky note')
      throw e
    } finally {
      setSaving(false)
    }
  }, [])

  const removeNote = useCallback(async (noteId: string) => {
    setError(null)
    try {
      await deleteSolutionNote(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      if (editingNoteId === noteId) setEditingNoteId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete sticky note')
    }
  }, [editingNoteId])

  return {
    notes,
    loading,
    saving,
    editingNoteId,
    setEditingNoteId,
    error,
    reload: loadNotes,
    addNote,
    saveNoteEdit,
    removeNote,
  }
}
