import { useState, useMemo, useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'

import { ChallengeBoardCard } from '@/components/solutionBoard/ChallengeBoardCard'
import { ChallengeBoardSearch } from '@/components/solutionBoard/ChallengeBoardSearch'
import { ChallengeResponseStackModal } from '@/components/solutionBoard/ChallengeResponseStackModal'
import { PinStickyNoteModal } from '@/components/solutionBoard/PinStickyNoteModal'
import { Button, Eyebrow, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { NavIcon } from '@/components/icons/NavIcon'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useModeration } from '@/context/ModerationContext'
import { useSolutionBoard } from '@/hooks/useSolutionBoard'
import { useSolutionBoardSeen } from '@/hooks/useSolutionBoardSeen'
import { groupSolutionNotesByChallenge, filterChallengeGroupsByQuery } from '@/lib/solutionBoardGroups'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: '#eef2f9',
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.two,
  },
  hero: {
    marginBottom: Spacing.three,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    marginBottom: 10,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  pinRow: {
    marginBottom: Spacing.three,
  },
  joinBar: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: 'rgba(255,255,255,0.65)',
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  joinText: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  joinActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  status: {
    color: t.textMuted,
    fontSize: 14,
    paddingVertical: Spacing.two,
  },
  empty: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.cardTranslucent,
    padding: Spacing.four,
    alignItems: 'center' as const,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  board: {
    gap: Spacing.two,
    alignItems: 'flex-start' as const,
  },
})

export function SolutionBoardScreen() {
  const theme = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { user, authReady } = useApp()
  const confirm = useConfirmAction()
  const { isBlocked } = useModeration()
  const isLoggedIn = Boolean(user?.id)
  const board = useSolutionBoard(authReady && isApiConfigured())
  const seen = useSolutionBoardSeen()
  const [pinOpen, setPinOpen] = useState(false)
  const [addSolutionChallenge, setAddSolutionChallenge] = useState<string | null>(null)
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const visibleNotes = useMemo(
    () => board.notes.filter((note) => !isBlocked(note.author.id)),
    [board.notes, isBlocked],
  )
  const challengeGroups = useMemo(
    () => groupSolutionNotesByChallenge(visibleNotes),
    [visibleNotes],
  )
  const filteredGroups = useMemo(
    () => filterChallengeGroupsByQuery(challengeGroups, searchQuery),
    [challengeGroups, searchQuery],
  )
  const openGroup = challengeGroups.find((group) => group.key === openGroupKey) ?? null

  const openAddSolution = (challenge: string) => {
    setAddSolutionChallenge(challenge)
  }

  const closeAddSolution = () => {
    setAddSolutionChallenge(null)
  }

  useEffect(() => {
    if (!openGroup || !seen.ready) return
    seen.markSeen(openGroup)
  }, [openGroup, seen.ready, seen.markSeen, openGroup?.notes.map((note) => note.id).join('|')])

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.status}>Set EXPO_PUBLIC_API_URL in .env to use the Solution Board.</Text>
      </ScrollView>
    )
  }

  if (board.loading) {
    return <PageLoadingScreen label="Loading board…" />
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <NavIcon name="star" size={24} color={theme.accent} />
        </View>
        <Eyebrow>Community board</Eyebrow>
        <Text style={styles.title}>Solution Board</Text>
        <Text style={styles.subtitle}>
          Real challenges from parents — tap a bubble to scroll through what worked for each family. Sign in to share your own.
        </Text>
      </View>

      {isLoggedIn ? (
        <View style={styles.pinRow}>
          <Button title="Share a challenge" onPress={() => setPinOpen(true)} />
          <PinStickyNoteModal
            open={pinOpen}
            saving={board.saving}
            onClose={() => setPinOpen(false)}
            onSubmit={board.addNote}
          />
          <PinStickyNoteModal
            open={Boolean(addSolutionChallenge)}
            challenge={addSolutionChallenge ?? undefined}
            saving={board.saving}
            onClose={closeAddSolution}
            onSubmit={board.addNote}
          />
        </View>
      ) : (
        <View style={styles.joinBar}>
          <Text style={styles.joinText}>Log in to share a challenge and the solution that helped your family.</Text>
          <View style={styles.joinActions}>
            <Link href="/signup" asChild>
              <Button title="Sign up to post" />
            </Link>
            <Link href="/login" asChild>
              <Button title="Log in" variant="secondary" />
            </Link>
          </View>
        </View>
      )}

      {board.error ? <ErrorText>{board.error}</ErrorText> : null}

      {visibleNotes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>The board is empty</Text>
          <Text style={styles.emptyBody}>
            {isLoggedIn
              ? 'Be the first to share a challenge — someone else is probably facing the same thing.'
              : 'Check back soon, or sign up and share what worked for you.'}
          </Text>
        </View>
      ) : (
        <>
          <ChallengeBoardSearch value={searchQuery} onChange={setSearchQuery} />
          {filteredGroups.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No matching challenges</Text>
              <Text style={styles.emptyBody}>Try a different search term.</Text>
            </View>
          ) : (
            <View style={styles.board}>
              {filteredGroups.map((group) => (
                <ChallengeBoardCard
                  key={group.key}
                  group={group}
                  onPress={() => setOpenGroupKey(group.key)}
                  canAddSolution={isLoggedIn}
                  onAddSolution={() => openAddSolution(group.challenge)}
                  hasNew={seen.ready && seen.hasUnseen(group)}
                />
              ))}
            </View>
          )}
        </>
      )}

      <ChallengeResponseStackModal
        open={Boolean(openGroupKey)}
        groups={challengeGroups}
        groupKey={openGroupKey}
        onGroupChange={setOpenGroupKey}
        onClose={() => {
          setOpenGroupKey(null)
          board.setEditingNoteId(null)
        }}
        moderationEnabled={isLoggedIn}
        editingNoteId={board.editingNoteId}
        saving={board.saving}
        onEdit={(noteId) => board.setEditingNoteId(noteId)}
        onCancelEdit={() => board.setEditingNoteId(null)}
        onSaveEdit={board.saveNoteEdit}
        onDelete={(noteId) => {
          confirm({
            title: 'Remove this story?',
            message: 'It will be taken off the board.',
            onConfirm: async () => {
              await board.removeNote(noteId)
              if (openGroup && openGroup.notes.length <= 1) {
                setOpenGroupKey(null)
              }
            },
          })
        }}
        canAddSolution={isLoggedIn}
        onAddSolution={openGroup ? () => openAddSolution(openGroup.challenge) : undefined}
      />
    </ScrollView>
  )
}
