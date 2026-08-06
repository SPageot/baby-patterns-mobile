import { Pressable, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import { Button, ErrorText, Input, Label } from '@/components/ui/primitives'
import { LoadingState } from '@/components/ui/Loading'
import { FamilyMemberTagModal } from '@/components/profile/FamilyMemberTagModal'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { useConfirmAction } from '@/context/ConfirmContext'
import { isProUser } from '@/lib/subscription'
import type { FamilyMember, FamilyShareRequest } from '@/schemas/familyMember'
import type { User } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  enabled: boolean
  user: User | null
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.three,
  },
  head: {
    marginBottom: Spacing.two,
  },
  title: {
    ...heading(20, { weight: '700' }),
    color: t.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
  },
  link: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  requestsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 8,
  },
  requestsBlock: {
    marginBottom: Spacing.two,
    gap: 8,
  },
  requestCard: {
    padding: 14,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    gap: 10,
  },
  requestActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  add: {
    marginBottom: Spacing.two,
  },
  searchWrap: {
    gap: 6,
  },
  searchStatus: {
    fontSize: 12,
    color: t.textMuted,
  },
  suggestions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    overflow: 'hidden' as const,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
  },
  suggestionUser: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 2,
  },
  suggestionAdded: {
    fontSize: 12,
    color: t.accentDeep,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  status: {
    fontSize: 14,
    color: t.textMuted,
    marginVertical: Spacing.two,
  },
  empty: {
    padding: Spacing.two,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  emptyText: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 20,
  },
  list: {
    gap: 8,
  },
  itemMain: {
    flex: 1,
    gap: 8,
  },
  itemBabies: {
    gap: 6,
  },
  babyChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  babyChipName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
  babyChipMeta: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  noBabies: {
    fontSize: 12,
    color: t.textMuted,
  },
  item: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    padding: 14,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  itemUser: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 2,
  },
  tag: {
    alignSelf: 'flex-start' as const,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.accentSoft,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: t.text,
  },
  itemActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  },
  requestHint: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  pendingBadge: {
    fontSize: 12,
    color: t.accentDeep,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  removeButton: {
    flexShrink: 0,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(220, 80, 80, 0.35)',
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#c53030',
  },
  pressed: {
    opacity: 0.82,
  },
})

export function FamilyMembersSection({ enabled, user }: Props) {
  const router = useRouter()
  const family = useFamilyMembers(enabled)
  const confirm = useConfirmAction()
  const userIsPro = isProUser(user)
  const styles = useThemedStyles(createStyles)
  const [tagModal, setTagModal] = useState<
    { mode: 'accept' | 'edit'; member: FamilyMember } | null
  >(null)

  useFocusEffect(
    useCallback(() => {
      void family.loadAll()
    }, [family.loadAll]),
  )

  const onRemoveMember = (memberUserId: string, displayName: string) => {
    const name = displayName.trim() || 'this person'
    confirm({
      title: 'Remove family member?',
      message: `Remove ${name} from family & friends? You will both lose access to each other's babies.`,
      confirmLabel: 'Remove',
      onConfirm: () => family.removeMember(memberUserId),
    })
  }

  const onCancelInvite = (requestId: string, displayName: string) => {
    const name = displayName.trim() || 'this person'
    confirm({
      title: 'Cancel invite?',
      message: `Cancel your invite to ${name}?`,
      confirmLabel: 'Cancel invite',
      onConfirm: () => family.cancelOutgoingRequest(requestId),
    })
  }

  const onAccept = async (request: FamilyShareRequest) => {
    const member = await family.acceptRequest(request.id)
    setTagModal({ mode: 'accept', member })
  }

  const memberLabel = (member: FamilyMember) => member.fullName?.trim() || member.username

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Family & friends</Text>
        <Text style={styles.subtitle}>
          Send an invite by username. When they accept, you&apos;ll both appear on each other&apos;s
          profile and can track each other&apos;s babies. After accepting, you can tag who they are
          (Doctor, Babysitter, Teacher, and more). You can remove anyone or cancel a pending invite at
          any time.
        </Text>
      </View>

      {family.error ? <ErrorText>{family.error}</ErrorText> : null}

      {!userIsPro ? (
        <Text style={styles.subtitle}>
          Family sharing is included with Baby Pattern Pro.{' '}
          <Text style={styles.link} onPress={() => router.push('/pricing')}>
            Upgrade to Pro
          </Text>{' '}
          to send invites. You can still accept invites and manage existing connections.
        </Text>
      ) : null}

      {family.incomingRequests.length > 0 ? (
        <View style={styles.requestsBlock}>
          <Text style={styles.requestsTitle}>Invites for you</Text>
          {family.incomingRequests.map((request) => {
            const label = request.requesterFullName?.trim() || request.requesterUsername
            const busy = family.respondingRequestId === request.id
            return (
              <View key={request.id} style={styles.requestCard}>
                <View>
                  <Text style={styles.itemName}>{label}</Text>
                  <Text style={styles.itemUser}>@{request.requesterUsername}</Text>
                  <Text style={styles.requestHint}>wants to share family tracking</Text>
                </View>
                <View style={styles.requestActions}>
                  <Button
                    title={busy ? 'Accepting…' : 'Accept'}
                    disabled={!enabled || busy || family.adding}
                    onPress={() => void onAccept(request)}
                  />
                  <Button
                    title="Decline"
                    variant="ghost"
                    disabled={!enabled || busy || family.adding}
                    onPress={() => void family.declineRequest(request.id)}
                  />
                </View>
              </View>
            )
          })}
        </View>
      ) : null}

      <View style={styles.add}>
        <Label>Invite by username</Label>
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search usernames…"
            value={family.searchQuery}
            onChangeText={family.setSearchQuery}
            editable={enabled && !family.adding && userIsPro}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {family.searching ? <Text style={styles.searchStatus}>Searching…</Text> : null}
        </View>

        {family.suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {family.suggestions.map((user) => {
              const pending = family.isConnectedOrPending(user.id, user.username)
              const label = user.fullName?.trim() || user.username
              const outgoing = family.outgoingRequests.some((r) => r.recipientUserId === user.id)
              return (
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  disabled={pending || family.adding || !userIsPro}
                  onPress={() => void family.sendRequest(user.username)}
                  style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                >
                  <Text style={styles.suggestionName}>{label}</Text>
                  <Text style={styles.suggestionUser}>@{user.username}</Text>
                  {pending ? (
                    <Text style={styles.suggestionAdded}>
                      {outgoing ? 'Invite sent' : 'Connected or pending'}
                    </Text>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      {family.outgoingRequests.length > 0 ? (
        <View style={styles.requestsBlock}>
          <Text style={styles.requestsTitle}>Pending invites you sent</Text>
          {family.outgoingRequests.map((request) => {
            const label = request.recipientFullName?.trim() || request.recipientUsername
            const busy = family.respondingRequestId === request.id
            return (
              <View key={request.id} style={styles.item}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{label}</Text>
                  <Text style={styles.itemUser}>@{request.recipientUsername}</Text>
                  <Text style={styles.pendingBadge}>Awaiting acceptance</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!enabled || busy || family.adding}
                  onPress={() => onCancelInvite(request.id, label)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    (pressed || busy) && styles.pressed,
                  ]}
                >
                  <Text style={styles.removeButtonText}>
                    {busy ? 'Cancelling…' : 'Cancel invite'}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      ) : null}

      {family.loading ? (
        <LoadingState label="Loading family members…" compact />
      ) : family.members.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No family connections yet. Send an invite and wait for them to accept.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {family.members.map((member) => {
            const label = member.fullName?.trim() || member.username
            const removing = family.removingMemberUserId === member.memberUserId
            return (
              <View key={member.id} style={styles.item}>
                <View style={styles.itemMain}>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemName}>{label}</Text>
                    <Text style={styles.itemUser}>@{member.username}</Text>
                    {member.relationshipTag ? (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{member.relationshipTag}</Text>
                      </View>
                    ) : null}
                  </View>
                  {member.babies.length > 0 ? (
                    <View style={styles.itemBabies}>
                      {member.babies.map((baby) => (
                        <View key={baby.id} style={styles.babyChip}>
                          <Text style={styles.babyChipName}>{baby.fullName}</Text>
                          {baby.birthdate ? (
                            <Text style={styles.babyChipMeta}>Born {baby.birthdate}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noBabies}>No babies on their account yet.</Text>
                  )}
                  <View style={styles.itemActions}>
                    <Button
                      title={member.relationshipTag ? 'Edit tag' : 'Add tag'}
                      variant="ghost"
                      disabled={!enabled || removing || family.adding}
                      onPress={() => setTagModal({ mode: 'edit', member })}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={!enabled || removing || family.adding}
                      onPress={() => onRemoveMember(member.memberUserId, label)}
                      style={({ pressed }) => [
                        styles.removeButton,
                        (pressed || removing) && styles.pressed,
                      ]}
                    >
                      <Text style={styles.removeButtonText}>
                        {removing ? 'Removing…' : 'Remove'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}

      <FamilyMemberTagModal
        open={tagModal != null}
        mode={tagModal?.mode ?? 'edit'}
        memberName={tagModal ? memberLabel(tagModal.member) : ''}
        initialTag={tagModal?.member.relationshipTag ?? null}
        onClose={() => setTagModal(null)}
        onSave={async (tag) => {
          if (!tagModal) return
          await family.updateMemberTag(tagModal.member.memberUserId, tag)
        }}
      />
    </View>
  )
}
