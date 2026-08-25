import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { Button, ErrorText } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { CreateShopRecommendationInput } from '@/schemas/shopRecommendation'
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
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: t.textMuted,
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
    minHeight: 88,
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
  actions: {
    gap: 10,
    marginTop: 4,
  },
})

type Props = {
  open: boolean
  saving?: boolean
  categories: string[]
  defaultCategory?: string | null
  onClose: () => void
  onSubmit: (input: CreateShopRecommendationInput) => Promise<void>
}

export function RecommendShopItemModal({
  open,
  saving = false,
  categories,
  defaultCategory,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const categoryOptions = categories.length ? categories : ['Other']
  const initialCategory =
    (defaultCategory && categoryOptions.includes(defaultCategory)
      ? defaultCategory
      : categoryOptions[0]) ?? 'Other'

  const [category, setCategory] = useState(initialCategory)
  const [name, setName] = useState('')
  const [purchaseUrl, setPurchaseUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCategory(initialCategory)
    setName('')
    setPurchaseUrl('')
    setNotes('')
    setError(null)
  }, [open, initialCategory])

  const handleClose = () => {
    if (saving) return
    onClose()
  }

  const handleSubmit = async () => {
    const url = purchaseUrl.trim()
    if (!url) {
      setError(
        t('community.recommendationShop.linkRequired', {
          defaultValue: 'A purchase link is required.',
        }),
      )
      return
    }
    setError(null)
    try {
      await onSubmit({
        category,
        name: name.trim(),
        purchaseUrl: url,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('community.recommendationShop.saveFailed', {
              defaultValue: 'Could not save recommendation',
            }),
      )
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {t('community.recommendationShop.recommendItem', {
                  defaultValue: 'Recommend an item',
                })}
              </Text>
              <Pressable onPress={handleClose} hitSlop={8} disabled={saving}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              <Text style={styles.hint}>
                {t('community.recommendationShop.formHint', {
                  defaultValue:
                    'Paste a product link — we’ll try to fetch the photo and price automatically.',
                })}
              </Text>

              <Text style={styles.label}>
                {t('community.recommendationShop.group', { defaultValue: 'Group' })}
              </Text>
              <View style={styles.chips}>
                {categoryOptions.map((c) => {
                  const active = category === c
                  return (
                    <Pressable
                      key={c}
                      style={[styles.chip, active ? styles.chipActive : null]}
                      disabled={saving}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                        {c}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Text style={styles.label}>
                {t('community.recommendationShop.itemName', { defaultValue: 'Item name' })}
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Optional — we’ll use the page title if blank"
                placeholderTextColor="#9ca3af"
                maxLength={200}
                editable={!saving}
              />

              <Text style={styles.label}>
                {t('community.recommendationShop.purchaseLink', {
                  defaultValue: 'Purchase link',
                })}
              </Text>
              <TextInput
                style={styles.input}
                value={purchaseUrl}
                onChangeText={setPurchaseUrl}
                placeholder="https://"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!saving}
              />

              <Text style={styles.label}>
                {t('community.recommendationShop.whyLike', {
                  defaultValue: 'Why you like it (optional)',
                })}
              </Text>
              <TextInput
                style={styles.textarea}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
                editable={!saving}
              />

              {error ? <ErrorText>{error}</ErrorText> : null}

              <View style={styles.actions}>
                <Button
                  title={
                    saving
                      ? t('logForm.saving')
                      : t('community.recommendationShop.addToShop', {
                          defaultValue: 'Add to shop',
                        })
                  }
                  loading={saving}
                  disabled={saving}
                  onPress={() => void handleSubmit()}
                />
                <Button
                  title={t('common.cancel', { defaultValue: 'Cancel' })}
                  variant="secondary"
                  disabled={saving}
                  onPress={handleClose}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
