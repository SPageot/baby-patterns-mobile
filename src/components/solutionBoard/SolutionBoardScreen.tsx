import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'

import { PinStickyNoteModal } from '@/components/solutionBoard/PinStickyNoteModal'
import { StickyNoteCard } from '@/components/solutionBoard/StickyNoteCard'
import { Button, Eyebrow, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { NavIcon } from '@/components/icons/NavIcon'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useSolutionBoard } from '@/hooks/useSolutionBoard'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: '#ebe3d6',
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
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: Spacing.two,
  },
  noteCol: {
    width: '48%' as const,
  },
})

export function SolutionBoardScreen() {
  const theme = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { user, authReady } = useApp()
  const confirm = useConfirmAction()
  const isLoggedIn = Boolean(user?.id)
  const board = useSolutionBoard(authReady && isApiConfigured())
  const [pinOpen, setPinOpen] = useState(false)

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
          Sticky notes from parents — real challenges and what actually worked. Sign in to pin your own.
        </Text>
      </View>

      {isLoggedIn ? (
        <View style={styles.pinRow}>
          <Button title="Pin your note" onPress={() => setPinOpen(true)} />
          <PinStickyNoteModal
            open={pinOpen}
            saving={board.saving}
            onClose={() => setPinOpen(false)}
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

      {board.notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>The board is empty</Text>
          <Text style={styles.emptyBody}>
            {isLoggedIn
              ? 'Be the first to pin a note — someone else is probably facing the same challenge.'
              : 'Check back soon, or sign up and share what worked for you.'}
          </Text>
        </View>
      ) : (
        <View style={styles.board}>
          {board.notes.map((note) => (
            <View key={note.id} style={styles.noteCol}>
              <StickyNoteCard
                note={note}
                editing={board.editingNoteId === note.id}
                saving={board.saving}
                onEdit={note.isMine ? () => board.setEditingNoteId(note.id) : undefined}
                onCancelEdit={() => board.setEditingNoteId(null)}
                onSaveEdit={(input) => board.saveNoteEdit(note.id, input)}
                onDelete={
                  note.isMine
                    ? () => {
                        confirm({
                          title: 'Remove sticky note?',
                          message: 'This note will be taken off the board.',
                          onConfirm: () => board.removeNote(note.id),
                        })
                      }
                    : undefined
                }
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}
