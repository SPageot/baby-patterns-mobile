import { Alert, Pressable, Text, View } from 'react-native'

import { Button, ErrorText, Input, Label } from '@/components/ui/primitives'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  enabled: boolean
}

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.three,
  },
  head: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
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
  item: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
  pressed: {
    opacity: 0.82,
  },
})

export function FamilyMembersSection({ enabled }: Props) {
  const family = useFamilyMembers(enabled)
  const styles = useThemedStyles(createStyles)

  const onRemoveMember = (memberUserId: string, displayName: string) => {
    const name = displayName.trim() || 'this person'
    Alert.alert(
      'Remove family member',
      `Remove ${name} from family & friends? They will lose access to your babies.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void family.removeMember(memberUserId),
        },
      ],
    )
  }

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Family & friends</Text>
        <Text style={styles.subtitle}>
          People you add can view and log diapers, feeding, and sleep for your babies.
        </Text>
      </View>

      {family.error ? <ErrorText>{family.error}</ErrorText> : null}

      <View style={styles.add}>
        <Label>Add by username</Label>
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search usernames…"
            value={family.searchQuery}
            onChangeText={family.setSearchQuery}
            editable={enabled && !family.adding}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {family.searching ? <Text style={styles.searchStatus}>Searching…</Text> : null}
        </View>

        {family.suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {family.suggestions.map((user) => {
              const alreadyAdded = family.members.some((m) => m.memberUserId === user.id)
              const label = user.fullName?.trim() || user.username
              return (
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  disabled={alreadyAdded || family.adding}
                  onPress={() => void family.addMember(user.username)}
                  style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                >
                  <Text style={styles.suggestionName}>{label}</Text>
                  <Text style={styles.suggestionUser}>@{user.username}</Text>
                  {alreadyAdded ? <Text style={styles.suggestionAdded}>Added</Text> : null}
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      {family.loading ? (
        <Text style={styles.status}>Loading family members…</Text>
      ) : family.members.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No family members yet. Search for someone by username to share your tracking data.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {family.members.map((member) => {
            const label = member.fullName?.trim() || member.username
            const removing = family.removingMemberUserId === member.memberUserId
            return (
              <View key={member.id} style={styles.item}>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemName}>{label}</Text>
                  <Text style={styles.itemUser}>@{member.username}</Text>
                </View>
                <Button
                  title={removing ? 'Removing…' : 'Remove'}
                  variant="ghost"
                  disabled={!enabled || removing || family.adding}
                  onPress={() => onRemoveMember(member.memberUserId, label)}
                />
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
