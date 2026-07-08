import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/primitives'
import { ErrorText } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import {
  CONTENT_REPORT_REASON_LABELS,
  CONTENT_REPORT_REASONS,
  type ContentReportReason,
  type ModerationContentType,
} from '@/schemas/moderation'

const createStyles = (t: AppPalette) => ({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(47, 42, 56, 0.45)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.two,
  },
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  panel: {
    maxHeight: '90%' as const,
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
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
  },
  reasonRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  reasonChipActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.text,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: t.text,
    backgroundColor: t.card2,
    textAlignVertical: 'top' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
  },
})

type Props = {
  open: boolean
  contentType: ModerationContentType
  contentId: string
  onClose: () => void
  onSubmit: (
    contentType: ModerationContentType,
    contentId: string,
    reason: ContentReportReason,
    details?: string,
  ) => Promise<void>
}

export function ReportContentModal({ open, contentType, contentId, onClose, onSubmit }: Props) {
  const styles = useThemedStyles(createStyles)
  const [reason, setReason] = useState<ContentReportReason>('inappropriate')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reset = () => {
    setReason('inappropriate')
    setDetails('')
    setError(null)
    setDone(false)
    setSubmitting(false)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(contentType, contentId, reason, details.trim() || undefined)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close" />
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>{done ? 'Report submitted' : 'Report content'}</Text>
              <Pressable onPress={handleClose} disabled={submitting}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.body}>
                {done ? (
                  <Text style={styles.lead}>
                    Thanks — we received your report. Blocked users are hidden from your feed immediately.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.lead}>
                      Tell us what is wrong. Reports are reviewed by our team.
                    </Text>
                    <View style={styles.reasonRow}>
                      {CONTENT_REPORT_REASONS.map((item) => (
                        <Pressable
                          key={item}
                          onPress={() => setReason(item)}
                          style={[styles.reasonChip, reason === item && styles.reasonChipActive]}
                        >
                          <Text style={styles.reasonText}>{CONTENT_REPORT_REASON_LABELS[item]}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      value={details}
                      onChangeText={setDetails}
                      placeholder="Optional details (max 1000 characters)"
                      placeholderTextColor="#8a8490"
                      style={styles.input}
                      multiline
                      maxLength={1000}
                      editable={!submitting}
                    />
                    {error ? <ErrorText>{error}</ErrorText> : null}
                  </>
                )}
              </View>
            </ScrollView>
            {!done ? (
              <View style={styles.actions}>
                <Button title="Cancel" variant="secondary" onPress={handleClose} disabled={submitting} />
                <Button title="Submit report" onPress={() => void handleSubmit()} loading={submitting} />
              </View>
            ) : (
              <View style={styles.actions}>
                <Button title="Done" onPress={handleClose} />
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
