import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { SolutionNoteInput } from '@/schemas/solutionNote'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  wrap: {
    gap: Spacing.two,
  },
  field: {
    gap: 6,
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
    lineHeight: 22,
    color: t.text,
    backgroundColor: t.card,
    minHeight: 88,
    textAlignVertical: 'top' as const,
  },
  lockedChallenge: {
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
    fontWeight: '600' as const,
    padding: Spacing.two,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 8,
    marginTop: 4,
  },
})

type Props = {
  saving?: boolean
  initial?: SolutionNoteInput
  lockedChallenge?: string
  submitLabel?: string
  onSubmit: (input: SolutionNoteInput) => Promise<void>
  onCancel?: () => void
}

export function StickyNoteComposer({
  saving = false,
  initial,
  lockedChallenge,
  submitLabel = 'Pin to board',
  onSubmit,
  onCancel,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const [challenge, setChallenge] = useState(initial?.challenge ?? lockedChallenge ?? '')
  const [solution, setSolution] = useState(initial?.solution ?? '')
  const challengeValue = lockedChallenge?.trim() || challenge

  const handleSubmit = async () => {
    if (!challengeValue.trim() || !solution.trim()) return
    await onSubmit({ challenge: challengeValue, solution })
    if (!initial) {
      if (!lockedChallenge) setChallenge('')
      setSolution('')
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Text style={styles.label}>The challenge</Text>
        {lockedChallenge ? (
          <Text style={styles.lockedChallenge}>{lockedChallenge}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={challenge}
            onChangeText={setChallenge}
            placeholder="What was hard?"
            placeholderTextColor="#9a94a0"
            multiline
            maxLength={500}
          />
        )}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>What worked</Text>
        <TextInput
          style={[styles.input, { minHeight: 110 }]}
          value={solution}
          onChangeText={setSolution}
          placeholder="Share what helped."
          placeholderTextColor="#9a94a0"
          multiline
          maxLength={2000}
        />
      </View>
      <View style={styles.actions}>
        {onCancel ? (
          <Button title="Cancel" variant="ghost" onPress={onCancel} disabled={saving} />
        ) : null}
        <Button
          title={saving ? 'Saving…' : submitLabel}
          onPress={() => void handleSubmit()}
          disabled={saving || !challengeValue.trim() || !solution.trim()}
        />
      </View>
    </View>
  )
}
