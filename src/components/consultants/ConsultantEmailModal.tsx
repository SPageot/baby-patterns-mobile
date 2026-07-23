import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import { useApp } from '@/context/AppContext'
import {
  CONSULTANT_PDF_OPTIONS,
  type ConsultantPdfAttachment,
} from '@/lib/consultantEmailPdf'
import { sendConsultantEmailWithAttachment } from '@/lib/sendConsultantEmail'
import { isProUser } from '@/lib/subscription'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  email: string
  consultantName: string
  onClose: () => void
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
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  options: {
    gap: 8,
    marginBottom: Spacing.two,
  },
  option: {
    flexDirection: 'row' as const,
    gap: 12,
    alignItems: 'flex-start' as const,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  optionSelected: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: t.stroke,
    marginTop: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  radioSelected: {
    borderColor: t.accentDeep,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: t.accentDeep,
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: t.textMuted,
  },
  error: {
    fontSize: 14,
    color: '#b42318',
    marginBottom: Spacing.two,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 10,
  },
})

export function ConsultantEmailModal({ open, email, consultantName, onClose }: Props) {
  const { user, babies } = useApp()
  const styles = useThemedStyles(createStyles)
  const [attachment, setAttachment] = useState<ConsultantPdfAttachment>('none')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isPro = isProUser(user)

  const onContinue = async () => {
    setBusy(true)
    setError(null)
    try {
      await sendConsultantEmailWithAttachment({
        email,
        consultantName,
        attachment,
        ctx: { user, babies },
      })
      onClose()
      setAttachment('none')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not prepare email')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={busy ? () => {} : onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Email {consultantName}</Text>
          <Text style={styles.intro}>Would you like to attach a tracking PDF for {email}?</Text>

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={styles.options}>
            {CONSULTANT_PDF_OPTIONS.map((option) => {
              const reportsLocked = option.value === 'reports' && !isPro
              const pdfNeedsLogin = option.value !== 'none' && !user
              const disabled = busy || reportsLocked || pdfNeedsLogin
              const selected = attachment === option.value
              return (
                <Pressable
                  key={option.value}
                  disabled={disabled}
                  onPress={() => setAttachment(option.value)}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    disabled && styles.optionDisabled,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionBody}>
                    <Text style={styles.optionLabel}>
                      {option.label}
                      {reportsLocked ? ' (Pro)' : ''}
                    </Text>
                    <Text style={styles.optionDesc}>
                      {pdfNeedsLogin
                        ? 'Log in to attach tracking PDFs.'
                        : reportsLocked
                          ? 'Upgrade to Pro to attach the full reports PDF.'
                          : option.description}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.note}>
            {attachment === 'none'
              ? 'We’ll open your email app with a message ready to send.'
              : 'We’ll prepare the PDF, then open the share sheet so you can send it with Mail or Gmail (attachment included).'}
          </Text>

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
            <Button
              title={busy ? 'Preparing…' : attachment === 'none' ? 'Open email' : 'Prepare PDF & email'}
              variant="primary"
              onPress={() => void onContinue()}
              disabled={busy}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
