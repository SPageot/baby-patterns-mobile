import { useState } from 'react'
import { Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { Button, ErrorText } from '@/components/ui/primitives'
import {
  PARENT_PROBLEM_CATEGORIES,
  type CreateParentProblemInput,
} from '@/schemas/parentSolutionBoard'
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
  input: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    padding: Spacing.two,
    fontSize: 15,
    color: t.text,
    backgroundColor: t.card,
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
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  chips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: t.card2,
  },
  chipActive: {
    backgroundColor: t.accentSoft,
    borderColor: t.accent,
  },
  chipText: {
    fontSize: 13,
    color: t.text,
  },
  chipTextActive: {
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  checkRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: t.text,
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
  onSubmit: (input: CreateParentProblemInput) => Promise<void>
}

export function PinProblemModal({ open, saving = false, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(PARENT_PROBLEM_CATEGORIES[0].id)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle('')
    setDescription('')
    setCategory(PARENT_PROBLEM_CATEGORIES[0].id)
    setIsAnonymous(false)
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    if (!trimmedTitle || !trimmedDescription) {
      setError(t('community.solutionBoard.formRequired'))
      return
    }
    setError(null)
    try {
      await onSubmit({
        title: trimmedTitle,
        description: trimmedDescription,
        category,
        isAnonymous,
      })
      reset()
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
              <Text style={styles.title}>{t('community.solutionBoard.pinProblem')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={handleClose} hitSlop={8}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <Text style={styles.label}>{t('community.solutionBoard.problemTitle')}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                editable={!saving}
                maxLength={160}
              />
              <Text style={styles.label}>{t('community.solutionBoard.problemDescription')}</Text>
              <TextInput
                style={styles.textarea}
                value={description}
                onChangeText={setDescription}
                editable={!saving}
                multiline
                maxLength={2000}
              />
              <Text style={styles.label}>{t('community.solutionBoard.category')}</Text>
              <View style={styles.chips}>
                {PARENT_PROBLEM_CATEGORIES.map((c) => {
                  const active = category === c.id
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.chip, active ? styles.chipActive : null]}
                      onPress={() => setCategory(c.id)}
                      disabled={saving}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                        {t(`community.solutionBoard.categories.${c.id}`, { defaultValue: c.label })}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              <View style={styles.checkRow}>
                <Text style={styles.checkLabel}>{t('community.solutionBoard.postAnonymously')}</Text>
                <Switch value={isAnonymous} onValueChange={setIsAnonymous} disabled={saving} />
              </View>
              {error ? <ErrorText>{error}</ErrorText> : null}
              <View style={styles.actions}>
                <Button title={t('common.cancel')} variant="secondary" onPress={handleClose} disabled={saving} />
                <Button
                  title={saving ? t('community.parentsCorner.posting') : t('community.solutionBoard.pinToBoard')}
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
