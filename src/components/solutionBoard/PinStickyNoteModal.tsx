import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { StickyNoteComposer } from '@/components/solutionBoard/StickyNoteComposer'
import type { SolutionNoteInput } from '@/schemas/solutionNote'
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
  close: {
    fontSize: 22,
    lineHeight: 24,
    color: t.textMuted,
    paddingHorizontal: 4,
  },
  body: {
    padding: Spacing.three,
  },
})

type Props = {
  open: boolean
  saving?: boolean
  challenge?: string
  onClose: () => void
  onSubmit: (input: SolutionNoteInput) => Promise<void>
}

export function PinStickyNoteModal({ open, saving = false, challenge, onClose, onSubmit }: Props) {
  const styles = useThemedStyles(createStyles)
  const lockedChallenge = challenge?.trim() || undefined
  const title = lockedChallenge ? 'Add your solution' : 'Share a challenge'
  const submitLabel = lockedChallenge ? 'Post solution' : 'Post to board'

  const handleSubmit = async (input: SolutionNoteInput) => {
    await onSubmit(input)
    onClose()
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <StickyNoteComposer
                saving={saving}
                lockedChallenge={lockedChallenge}
                submitLabel={submitLabel}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
