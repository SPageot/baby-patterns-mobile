import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ContentModerationMenu } from '@/components/moderation/ContentModerationMenu'
import { NavIcon } from '@/components/icons/NavIcon'
import { SolutionBubble } from '@/components/solutionBoard/SolutionBubble'
import { EditSolutionModal } from '@/components/solutionBoard/EditSolutionModal'
import { Button } from '@/components/ui/primitives'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { stickyNoteColor } from '@/lib/stickyNoteColors'
import type { SolutionChallengeGroup } from '@/lib/solutionBoardGroups'
import type { SolutionNote, SolutionNoteInput } from '@/schemas/solutionNote'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

function formatNoteDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

type Props = {
  open: boolean
  groups: SolutionChallengeGroup[]
  groupKey: string | null
  onGroupChange: (key: string) => void
  onClose: () => void
  moderationEnabled?: boolean
  editingNoteId?: string | null
  saving?: boolean
  onEdit?: (noteId: string) => void
  onCancelEdit?: () => void
  onSaveEdit?: (noteId: string, input: SolutionNoteInput) => Promise<void>
  onDelete?: (noteId: string) => void
  onAddSolution?: () => void
  canAddSolution?: boolean
}

const createStyles = (t: AppPalette) => ({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47, 42, 56, 0.5)',
  },
  panel: {
    flex: 1,
    maxHeight: '92%' as const,
    backgroundColor: t.card,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    overflow: 'hidden' as const,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  headerMain: {
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card2,
  },
  closeText: {
    fontSize: 22,
    lineHeight: 24,
    color: t.text,
  },
  challengeLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.6,
    color: t.textMuted,
  },
  challenge: {
    fontSize: 18,
    fontWeight: '800' as const,
    lineHeight: 26,
    color: t.text,
  },
  hint: {
    fontSize: 13,
    color: t.textMuted,
  },
  addRow: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    alignItems: 'flex-end' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginBottom: Spacing.two,
  },
  authorMeta: {
    flex: 1,
    flexDirection: 'column' as const,
    gap: 2,
    paddingTop: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#2d2832',
  },
  date: {
    fontSize: 12,
    color: '#6b6570',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    color: '#8a8490',
    marginBottom: 6,
  },
  solution: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2d2832',
    fontWeight: '500' as const,
  },
  cardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 4,
  },
  footerStart: {
    flex: 1,
    alignItems: 'flex-start' as const,
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  actionBtn: {
    width: 34,
    height: 34,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
  },
  nextChallenge: {
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.stroke,
    borderStyle: 'dashed' as const,
    backgroundColor: t.card2,
    padding: Spacing.three,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: Spacing.one,
  },
  prevChallenge: {
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.stroke,
    borderStyle: 'dashed' as const,
    backgroundColor: t.card2,
    padding: Spacing.three,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: Spacing.one,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.6,
    color: t.accentDeep,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 22,
    color: t.text,
    textAlign: 'center' as const,
  },
  nextHint: {
    fontSize: 13,
    color: t.textMuted,
  },
  endOfBoard: {
    paddingVertical: Spacing.two,
    alignItems: 'center' as const,
  },
  endOfBoardText: {
    fontSize: 14,
    color: t.textMuted,
  },
})

function SolutionCard({
  note,
  styles,
  moderationEnabled,
  onEdit,
  onDelete,
}: {
  note: SolutionNote
  styles: ReturnType<typeof createStyles>
  moderationEnabled: boolean
  onEdit?: (noteId: string) => void
  onDelete?: (noteId: string) => void
}) {
  const theme = useHomeTheme()
  const color = stickyNoteColor(note.colorIndex)
  const authorName = note.author.fullName?.trim() || note.author.username || 'Parent'

  return (
    <SolutionBubble color={color} tailStyle="left">
      <View style={styles.cardTop}>
        <UserAvatar user={note.author} size="md" />
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.date}>{formatNoteDate(note.createdAt)}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.sectionLabel}>WHAT WORKED</Text>
        <Text style={styles.solution}>{note.solution}</Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerStart}>
          {moderationEnabled ? (
            <ContentModerationMenu
              contentType="solution_note"
              contentId={note.id}
              authorId={note.author.id}
              authorName={authorName}
              isMine={note.isMine}
            />
          ) : null}
        </View>
        <View style={styles.actionRow}>
          {note.isMine && onEdit ? (
            <Pressable
              style={styles.actionBtn}
              onPress={() => onEdit(note.id)}
              accessibilityRole="button"
              accessibilityLabel="Edit"
            >
              <NavIcon name="edit" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
          {note.isMine && onDelete ? (
            <Pressable
              style={styles.actionBtn}
              onPress={() => onDelete(note.id)}
              accessibilityRole="button"
              accessibilityLabel="Remove"
            >
              <NavIcon name="trash" size={18} color="#9a5c5c" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </SolutionBubble>
  )
}

export function ChallengeResponseStackModal({
  open,
  groups,
  groupKey,
  onGroupChange,
  onClose,
  moderationEnabled = false,
  editingNoteId = null,
  saving = false,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onAddSolution,
  canAddSolution = false,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const scrollRef = useRef<ScrollView>(null)
  const userScrolledRef = useRef(false)
  const navigatingRef = useRef(false)
  const programmaticScrollRef = useRef(false)
  const navigateDirectionRef = useRef<'start' | 'end'>('start')
  const [prevSectionHeight, setPrevSectionHeight] = useState(0)

  const group = groups.find((item) => item.key === groupKey) ?? null
  const groupIndex = groupKey ? groups.findIndex((item) => item.key === groupKey) : -1
  const prevGroup = groupIndex > 0 ? groups[groupIndex - 1] : null
  const nextGroup = groupIndex >= 0 && groupIndex < groups.length - 1 ? groups[groupIndex + 1] : null
  const notes = group?.notes ?? []
  const editingNote = editingNoteId
    ? groups.flatMap((item) => item.notes).find((note) => note.id === editingNoteId) ?? null
    : null

  useEffect(() => {
    if (!prevGroup) setPrevSectionHeight(0)
  }, [groupKey, prevGroup])

  useEffect(() => {
    if (!open) {
      userScrolledRef.current = false
      navigatingRef.current = false
      return
    }
    userScrolledRef.current = false
    navigatingRef.current = false
    programmaticScrollRef.current = true
    requestAnimationFrame(() => {
      if (navigateDirectionRef.current === 'end') {
        scrollRef.current?.scrollToEnd({ animated: false })
      } else if (prevGroup && prevSectionHeight > 0) {
        scrollRef.current?.scrollTo({ y: prevSectionHeight, animated: false })
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: false })
      }
      navigateDirectionRef.current = 'start'
      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 120)
    })
  }, [open, groupKey, prevGroup, prevSectionHeight])

  const advanceToPrevious = useCallback(() => {
    if (!prevGroup || navigatingRef.current) return
    navigatingRef.current = true
    navigateDirectionRef.current = 'end'
    onGroupChange(prevGroup.key)
  }, [prevGroup, onGroupChange])

  const advanceToNext = useCallback(() => {
    if (!nextGroup || navigatingRef.current) return
    navigatingRef.current = true
    navigateDirectionRef.current = 'start'
    onGroupChange(nextGroup.key)
  }, [nextGroup, onGroupChange])

  const checkScrollNavigation = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!userScrolledRef.current) return
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
      const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 24
      const atTop = contentOffset.y <= 24
      if (atBottom && nextGroup) {
        advanceToNext()
      } else if (atTop && prevGroup) {
        advanceToPrevious()
      }
    },
    [advanceToNext, advanceToPrevious, nextGroup, prevGroup],
  )

  if (!group) return null

  return (
    <>
      <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerMain}>
                  <Text style={styles.challengeLabel}>CHALLENGE</Text>
                  <Text style={styles.challenge}>{group.challenge}</Text>
                  <Text style={styles.hint}>
                    Latest story first — scroll through {notes.length}{' '}
                    {notes.length === 1 ? 'story' : 'stories'}
                    {prevGroup || nextGroup ? ' — scroll up or down for more challenges' : ''}
                  </Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>
            </View>

            {canAddSolution && onAddSolution ? (
              <View style={styles.addRow}>
                <Button title="Add your solution" onPress={onAddSolution} />
              </View>
            ) : null}

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              onScroll={(event) => {
                if (!programmaticScrollRef.current) {
                  userScrolledRef.current = true
                }
              }}
              scrollEventThrottle={16}
              onScrollEndDrag={checkScrollNavigation}
              onMomentumScrollEnd={checkScrollNavigation}
            >
              {prevGroup ? (
                <View
                  onLayout={(event) => {
                    const height = event.nativeEvent.layout.height
                    if (height > 0 && Math.abs(height - prevSectionHeight) > 1) {
                      setPrevSectionHeight(height)
                    }
                  }}
                >
                  <Pressable
                    style={styles.prevChallenge}
                    onPress={advanceToPrevious}
                    accessibilityRole="button"
                    accessibilityLabel={`Previous challenge: ${prevGroup.challenge}`}
                  >
                    <Text style={styles.nextLabel}>PREVIOUS CHALLENGE</Text>
                    <Text style={styles.nextTitle}>{prevGroup.challenge}</Text>
                    <Text style={styles.nextHint}>Scroll here or tap to go back</Text>
                  </Pressable>
                </View>
              ) : null}

              {notes.map((note) => (
                <SolutionCard
                  key={note.id}
                  note={note}
                  styles={styles}
                  moderationEnabled={moderationEnabled}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}

              {nextGroup ? (
                <Pressable
                  style={styles.nextChallenge}
                  onPress={advanceToNext}
                  accessibilityRole="button"
                  accessibilityLabel={`Next challenge: ${nextGroup.challenge}`}
                >
                  <Text style={styles.nextLabel}>NEXT CHALLENGE</Text>
                  <Text style={styles.nextTitle}>{nextGroup.challenge}</Text>
                  <Text style={styles.nextHint}>Scroll here or tap to continue</Text>
                </Pressable>
              ) : (
                <View style={styles.endOfBoard}>
                  <Text style={styles.endOfBoardText}>You&apos;ve seen all challenges</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>

      <EditSolutionModal
        open={Boolean(editingNoteId && editingNote)}
        note={editingNote}
        saving={saving}
        onClose={onCancelEdit ?? (() => {})}
        onSave={onSaveEdit ?? (async () => {})}
      />
    </>
  )
}
