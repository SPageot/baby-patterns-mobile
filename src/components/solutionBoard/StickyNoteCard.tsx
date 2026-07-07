import { Pressable, Text, View } from 'react-native'

import { ContentModerationMenu } from '@/components/moderation/ContentModerationMenu'
import { NavIcon } from '@/components/icons/NavIcon'
import { StickyNoteComposer } from '@/components/solutionBoard/StickyNoteComposer'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { stickyNoteColor } from '@/lib/stickyNoteColors'
import type { SolutionNote, SolutionNoteInput } from '@/schemas/solutionNote'
import { Spacing } from '@/constants/theme'

function formatNoteDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

type Props = {
  note: SolutionNote
  editing?: boolean
  saving?: boolean
  onEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: (input: SolutionNoteInput) => Promise<void>
  onDelete?: () => void
  moderationEnabled?: boolean
}

export function StickyNoteCard({
  note,
  editing = false,
  saving = false,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  moderationEnabled = false,
}: Props) {
  const theme = useHomeTheme()
  const color = stickyNoteColor(note.colorIndex)
  const authorName = note.author.fullName?.trim() || note.author.username || 'Parent'

  if (editing && onSaveEdit && onCancelEdit) {
    return (
      <View
        style={{
          backgroundColor: color.bg,
          borderColor: color.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: Spacing.three,
          marginBottom: Spacing.two,
        }}
      >
        <StickyNoteComposer
          initial={{ challenge: note.challenge, solution: note.solution }}
          saving={saving}
          submitLabel="Save note"
          onSubmit={onSaveEdit}
          onCancel={onCancelEdit}
        />
      </View>
    )
  }

  return (
    <View
      style={{
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1,
        borderRadius: 4,
        padding: Spacing.three,
        marginBottom: Spacing.two,
        transform: [{ rotate: `${note.rotationDeg}deg` }],
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 2, height: 3 },
        elevation: 2,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -6,
          alignSelf: 'center',
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#9a9a9a',
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingTop: 4,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#3d3842' }}>{authorName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {moderationEnabled ? (
            <ContentModerationMenu
              contentType="solution_note"
              contentId={note.id}
              authorId={note.author.id}
              authorName={authorName}
              isMine={note.isMine}
            />
          ) : null}
          <Text style={{ fontSize: 11, color: '#6b6570' }}>{formatNoteDate(note.createdAt)}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#8a8490', marginBottom: 4 }}>
        CHALLENGE
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: '#2d2832', marginBottom: 10 }}>{note.challenge}</Text>
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#8a8490', marginBottom: 4 }}>
        WHAT WORKED
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: '#2d2832', fontWeight: '500' }}>{note.solution}</Text>
      {note.isMine && (onEdit || onDelete) ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 2,
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.08)',
          }}
        >
          {onEdit ? (
            <Pressable
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit"
              style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
            >
              <NavIcon name="edit" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel="Remove"
              style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
            >
              <NavIcon name="trash" size={18} color="#9a5c5c" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
