import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { StickyNoteComposer } from '@/components/solutionBoard/StickyNoteComposer'
import type { SolutionNote, SolutionNoteInput } from '@/schemas/solutionNote'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(47, 42, 56, 0.45)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  panel: {
    maxHeight: '92%' as const,
    backgroundColor: t.card,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    overflow: 'hidden' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: t.text,
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
  close: {
    fontSize: 22,
    lineHeight: 24,
    color: t.text,
  },
  body: {
    padding: Spacing.three,
  },
})

type Props = {
  open: boolean
  note: SolutionNote | null
  saving?: boolean
  onClose: () => void
  onSave: (noteId: string, input: SolutionNoteInput) => Promise<void>
}

export function EditSolutionModal({ open, note, saving = false, onClose, onSave }: Props) {
  const styles = useThemedStyles(createStyles)

  if (!note) return null

  const handleSubmit = async (input: SolutionNoteInput) => {
    await onSave(note.id, input)
    onClose()
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit your solution</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={8}
              >
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <StickyNoteComposer
                initial={{ challenge: note.challenge, solution: note.solution }}
                lockedChallenge={note.challenge}
                saving={saving}
                submitLabel="Save"
                onSubmit={handleSubmit}
              />
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
