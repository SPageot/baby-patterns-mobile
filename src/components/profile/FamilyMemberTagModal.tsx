import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import {
  FAMILY_RELATIONSHIP_PRESETS,
  FAMILY_RELATIONSHIP_TAG_MAX_LENGTH,
} from '@/schemas/familyMember'

type Props = {
  open: boolean
  memberName: string
  initialTag?: string | null
  mode: 'accept' | 'edit'
  onClose: () => void
  onSave: (tag: string | null) => Promise<void>
}

const createStyles = (t: AppPalette) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(47, 42, 56, 0.35)',
    justifyContent: 'center' as const,
    padding: Spacing.three,
  },
  card: {
    maxHeight: '88%' as const,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card,
    padding: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  chips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
  customLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: t.textMuted,
    marginBottom: 6,
  },
  customInput: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: t.text,
    backgroundColor: t.card2,
    marginBottom: Spacing.two,
  },
  error: {
    fontSize: 13,
    color: '#c53030',
    marginBottom: Spacing.two,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
})

export function FamilyMemberTagModal({
  open,
  memberName,
  initialTag = null,
  mode,
  onClose,
  onSave,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const [selected, setSelected] = useState<string | null>(initialTag)
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const tag = initialTag?.trim() || null
    const isPreset = tag != null && (FAMILY_RELATIONSHIP_PRESETS as readonly string[]).includes(tag)
    setSelected(isPreset ? tag : tag ? '__custom__' : null)
    setCustom(isPreset || !tag ? '' : tag)
    setError(null)
    setSaving(false)
  }, [open, initialTag])

  const resolvedTag = useMemo(() => {
    if (selected === '__custom__') {
      const value = custom.trim()
      return value || null
    }
    return selected
  }, [custom, selected])

  const title = mode === 'accept' ? 'Who is this person?' : 'Edit relationship tag'
  const lead =
    mode === 'accept'
      ? `Invite accepted. Tag ${memberName} so you can tell connections apart — or skip for now.`
      : `Choose how you know ${memberName}.`

  const handleSave = async () => {
    if (selected === '__custom__' && !custom.trim()) {
      setError('Enter a custom tag, or pick a common one.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(resolvedTag)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save tag')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={saving ? () => {} : onClose}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{lead}</Text>
          <ScrollView>
            <View style={styles.chips}>
              {FAMILY_RELATIONSHIP_PRESETS.map((tag) => {
                const active = selected === tag
                return (
                  <Pressable
                    key={tag}
                    accessibilityRole="button"
                    disabled={saving}
                    onPress={() => {
                      setSelected(tag)
                      setCustom('')
                      setError(null)
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={styles.chipText}>{tag}</Text>
                  </Pressable>
                )
              })}
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => {
                  setSelected('__custom__')
                  setError(null)
                }}
                style={[styles.chip, selected === '__custom__' && styles.chipActive]}
              >
                <Text style={styles.chipText}>Custom</Text>
              </Pressable>
            </View>

            {selected === '__custom__' ? (
              <>
                <Text style={styles.customLabel}>Your tag</Text>
                <TextInput
                  style={styles.customInput}
                  value={custom}
                  maxLength={FAMILY_RELATIONSHIP_TAG_MAX_LENGTH}
                  placeholder="e.g. Coach, Neighbor…"
                  editable={!saving}
                  onChangeText={setCustom}
                  autoFocus
                />
              </>
            ) : null}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            {mode === 'accept' ? (
              <Button title="Skip for now" variant="ghost" disabled={saving} onPress={onClose} />
            ) : (
              <Button
                title="Clear tag"
                variant="ghost"
                disabled={saving}
                onPress={() => {
                  void (async () => {
                    setSaving(true)
                    setError(null)
                    try {
                      await onSave(null)
                      onClose()
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Could not clear tag')
                    } finally {
                      setSaving(false)
                    }
                  })()
                }}
              />
            )}
            <Button
              title={saving ? 'Saving…' : mode === 'accept' ? 'Save tag' : 'Update tag'}
              disabled={saving}
              onPress={() => void handleSave()}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
