import { useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { MultiBabyDraft } from '@/lib/multiBabyLogFlow'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { bodyText } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props<T> = {
  drafts: MultiBabyDraft<T>[]
  saving?: boolean
  onBack: () => void
  onSaveAll: () => void
  renderSummary: (draft: MultiBabyDraft<T>) => string
  renderFields: (draft: MultiBabyDraft<T>) => ReactNode
}

const createStyles = (t: AppPalette) => ({
  intro: {
    ...bodyText,
    fontSize: 14,
    lineHeight: 21,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  list: {
    gap: 10,
    marginBottom: Spacing.three,
  },
  card: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.lg,
    backgroundColor: t.card2,
    overflow: 'hidden' as const,
  },
  cardOpen: {
    borderColor: t.accentLavender,
  },
  head: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  headText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
  },
  summary: {
    ...bodyText,
    fontSize: 13,
    lineHeight: 18,
    color: t.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
})

export function MultiBabyLogReview<T>({
  drafts,
  saving,
  onBack,
  onSaveAll,
  renderSummary,
  renderFields,
}: Props<T>) {
  const styles = useThemedStyles(createStyles)
  const [expandedBabyId, setExpandedBabyId] = useState(drafts[0]?.babyId ?? '')

  return (
    <View>
      <Text style={styles.intro}>
        Review each baby&apos;s log below. Tap a card to edit details before saving.
      </Text>

      <View style={styles.list}>
        {drafts.map((draft) => {
          const expanded = expandedBabyId === draft.babyId
          return (
            <View key={draft.babyId} style={[styles.card, expanded && styles.cardOpen]}>
              <Pressable
                onPress={() => setExpandedBabyId(expanded ? '' : draft.babyId)}
                style={styles.head}
              >
                <View style={styles.headText}>
                  <Text style={styles.name}>{draft.babyName}</Text>
                  <Text style={styles.summary}>{renderSummary(draft)}</Text>
                </View>
                <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
              </Pressable>
              {expanded ? <View style={styles.body}>{renderFields(draft)}</View> : null}
            </View>
          )
        })}
      </View>

      <View style={styles.actions}>
        <Button title="Back" variant="secondary" onPress={onBack} disabled={saving} style={styles.actionBtn} />
        <Button
          title={saving ? 'Saving…' : `Save ${drafts.length} logs`}
          loading={saving}
          onPress={onSaveAll}
          style={styles.actionBtn}
        />
      </View>
    </View>
  )
}
