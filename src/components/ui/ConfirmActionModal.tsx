import { Modal, Pressable, Text, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
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
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 10,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={busy ? () => {} : onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="secondary" onPress={onClose} disabled={busy} />
            <Button
              title={busy ? 'Working…' : confirmLabel}
              variant={destructive ? 'ghost' : 'primary'}
              onPress={onConfirm}
              disabled={busy}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
