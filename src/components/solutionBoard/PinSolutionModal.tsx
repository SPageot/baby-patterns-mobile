import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { Button, ErrorText } from '@/components/ui/primitives'
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
    gap: Spacing.two,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: t.textMuted,
  },
  textarea: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    padding: Spacing.two,
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
    backgroundColor: t.card,
    minHeight: 120,
    textAlignVertical: 'top' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    marginTop: 4,
  },
})

type Props = {
  open: boolean
  saving?: boolean
  onClose: () => void
  onSubmit: (body: string) => Promise<void>
}

export function PinSolutionModal({ open, saving = false, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setBody('')
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    const trimmed = body.trim()
    if (!trimmed) {
      setError(t('community.solutionBoard.formRequired'))
      return
    }
    setError(null)
    try {
      await onSubmit(trimmed)
      setBody('')
      onClose()
    } catch {
      /* board error */
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={handleClose}
          />
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('community.solutionBoard.pinSolution')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={handleClose} hitSlop={8}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <Text style={styles.label}>{t('community.solutionBoard.solutionBody')}</Text>
              <TextInput
                style={styles.textarea}
                value={body}
                onChangeText={setBody}
                editable={!saving}
                multiline
                maxLength={2000}
                placeholder={t('community.solutionBoard.solutionPlaceholder')}
              />
              {error ? <ErrorText>{error}</ErrorText> : null}
              <View style={styles.actions}>
                <Button title={t('common.cancel')} variant="secondary" onPress={handleClose} disabled={saving} />
                <Button
                  title={saving ? t('community.parentsCorner.posting') : t('community.solutionBoard.postSolution')}
                  onPress={() => void handleSubmit()}
                  loading={saving}
                  disabled={saving}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
