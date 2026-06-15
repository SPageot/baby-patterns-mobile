import { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import { Button, ErrorText, Input, Label } from '@/components/ui/primitives'
import { isApiConfigured } from '@/api/config'
import { deleteUser } from '@/api/userApi'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  onClose: () => void
  userId: string
  username: string
  onDeleted: () => void | Promise<void>
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
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
    marginBottom: 8,
  },
  text: {
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
})

export function DeleteAccountModal({ open, onClose, userId, username, onDeleted }: Props) {
  const styles = useThemedStyles(createStyles)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmed = Boolean(username) && confirmText.trim() === username

  const resetForm = () => {
    setConfirmText('')
    setError(null)
    setDeleting(false)
  }

  const handleClose = () => {
    if (deleting) return
    resetForm()
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmed || deleting) return

    setError(null)
    setDeleting(true)
    try {
      if (!isApiConfigured()) {
        throw new Error('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      }
      await deleteUser(userId)
      await onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.card}>
            <Text style={styles.title}>Delete account</Text>
            <Text style={styles.lead}>
              This permanently deletes your account, babies, and logs. This cannot be undone.
            </Text>
            <Text style={styles.text}>
              Type your username <Text style={{ fontWeight: '700' }}>{username}</Text> to confirm.
            </Text>

            {error ? <ErrorText>{error}</ErrorText> : null}

            <Label>Username</Label>
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmText}
              onChangeText={setConfirmText}
              editable={!deleting}
              placeholder={username}
            />

            <View style={styles.actions}>
              <Button title="Cancel" variant="secondary" disabled={deleting} onPress={handleClose} />
              <Button
                title={deleting ? 'Deleting…' : 'Delete my account'}
                variant="ghost"
                disabled={!confirmed || deleting}
                onPress={() => void handleDelete()}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
