import { Pressable, Text, View } from 'react-native'

import { SolutionBubble } from '@/components/solutionBoard/SolutionBubble'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { stickyNoteColor } from '@/lib/stickyNoteColors'
import { uniqueAuthorsFromNotes, type SolutionChallengeGroup } from '@/lib/solutionBoardGroups'
import { Spacing } from '@/constants/theme'

const MAX_AVATARS = 5
const CHALLENGE_PREVIEW_LINES = 3
const CHALLENGE_MORE_CHAR_THRESHOLD = 96

function challengeNeedsMore(text: string): boolean {
  return text.trim().length > CHALLENGE_MORE_CHAR_THRESHOLD
}

type Props = {
  group: SolutionChallengeGroup
  onPress: () => void
  onAddSolution?: () => void
  canAddSolution?: boolean
  hasNew?: boolean
}

export function ChallengeBoardCard({ group, onPress, onAddSolution, canAddSolution = false, hasNew = false }: Props) {
  const color = stickyNoteColor(group.latestNote.colorIndex)
  const authors = uniqueAuthorsFromNotes(group.notes)
  const [primary, ...rest] = authors
  const visibleRest = rest.slice(0, MAX_AVATARS - 1)
  const overflow = Math.max(0, authors.length - MAX_AVATARS)
  const showMore = challengeNeedsMore(group.challenge)

  return (
    <View style={{ width: '88%' as const, maxWidth: 340, alignSelf: 'flex-start' as const, gap: 6 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Challenge: ${group.challenge}. ${group.notes.length} responses.`}
        style={({ pressed }) => ({
          width: '100%' as const,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <SolutionBubble color={color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 0.5,
                color: '#7a7480',
              }}
            >
              CHALLENGE
            </Text>
            {hasNew ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: '#6b4fc0',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.4 }}>NEW</Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={CHALLENGE_PREVIEW_LINES}
            style={{
              fontSize: 16,
              lineHeight: 23,
              color: '#2d2832',
              fontWeight: '600',
              marginBottom: showMore ? 4 : Spacing.two,
            }}
          >
            {group.challenge}
          </Text>
          {showMore ? (
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#6b4fc0',
                marginBottom: Spacing.two,
              }}
            >
              more
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              {primary ? <UserAvatar user={primary} size="md" /> : null}
              {visibleRest.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {visibleRest.map((author, index) => (
                    <View key={author.id} style={{ marginLeft: index === 0 ? 0 : -10 }}>
                      <UserAvatar user={author} size="sm" />
                    </View>
                  ))}
                </View>
              ) : null}
              {overflow > 0 ? (
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b6570' }}>+{overflow}</Text>
              ) : null}
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.55)',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#4a4450' }}>
                {group.notes.length} {group.notes.length === 1 ? 'story' : 'stories'}
              </Text>
            </View>
          </View>
        </SolutionBubble>
      </Pressable>
      {canAddSolution && onAddSolution ? (
        <Pressable
          onPress={onAddSolution}
          accessibilityRole="button"
          accessibilityLabel="Add your solution"
          style={({ pressed }) => ({
            alignSelf: 'flex-end' as const,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: pressed ? 'rgba(124, 92, 196, 0.18)' : 'rgba(124, 92, 196, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(124, 92, 196, 0.35)',
          })}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b4fc0' }}>+ Add your solution</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
