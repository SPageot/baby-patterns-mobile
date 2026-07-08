import { Pressable, Text, View } from 'react-native'

import { TrackingMediaThumb } from '@/components/growth/TrackingMediaThumb'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import type { DailyMemory } from '@/schemas/dailyMemory'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type MemoryRow = DailyMemory & { babyName?: string }

type Props = {
  memory: MemoryRow
  showBabyName?: boolean
  deleting?: boolean
  onEdit: (memory: MemoryRow) => void
  onDelete: (id: string) => void
}

const createStyles = (t: AppPalette) => ({
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    overflow: 'hidden' as const,
  },
  body: {
    padding: Spacing.three,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: t.text,
    lineHeight: 24,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
  },
  meta: {
    fontSize: 13,
    color: t.textMuted,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: 4,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  actionDanger: {
    color: t.error,
  },
})

export function DailyMemoryCard({
  memory,
  showBabyName = false,
  deleting,
  onEdit,
  onDelete,
}: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.card}>
      {memory.mediaUrl ? (
        <View>
          <TrackingMediaThumb url={memory.mediaUrl} mediaType={memory.mediaType} />
        </View>
      ) : null}
      <View style={styles.body}>
        {memory.title ? <Text style={styles.title}>{memory.title}</Text> : null}
        <Text style={styles.content}>{memory.content}</Text>
        {showBabyName && memory.babyName ? (
          <Text style={styles.meta}>{memory.babyName}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => onEdit(memory)} disabled={deleting}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() => onDelete(memory.id)}
          disabled={deleting}
        >
          <Text style={[styles.actionText, styles.actionDanger]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  )
}
