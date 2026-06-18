import { useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { PostBadge, PostSubmitInput } from '@/schemas/post'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import {
  CUSTOM_BADGE_MAX_LENGTH,
  getAvailablePostBadges,
  isValidCustomBadge,
  normalizeCustomBadgeInput,
} from '@/lib/postBadges'

type Props = {
  posting: boolean
  isSiteDeveloper?: boolean
  onPublish: (input: PostSubmitInput) => Promise<void>
}

const createStyles = (t: AppPalette) => ({
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  label: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: t.text,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
    backgroundColor: t.card2,
    textAlignVertical: 'top' as const,
  },
  badgeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  badgeChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: t.card2,
  },
  badgeChipActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.textMuted,
  },
  badgeTextActive: {
    color: t.accentDeep,
  },
  customInput: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: t.text,
    backgroundColor: t.card2,
  },
})

export function PostComposer({ posting, isSiteDeveloper = false, onPublish }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [content, setContent] = useState('')
  const [badge, setBadge] = useState<PostBadge | null>(null)
  const [customBadge, setCustomBadge] = useState('')
  const [useCustomBadge, setUseCustomBadge] = useState(false)

  const badgeOptions = useMemo(
    () => [{ value: null as PostBadge | null, label: 'Post' }, ...getAvailablePostBadges(isSiteDeveloper).map((item) => ({ value: item.value as PostBadge | null, label: item.label })), { value: null as PostBadge | null, label: 'Custom' }],
    [isSiteDeveloper],
  )

  const onSubmit = async () => {
    const text = content.trim()
    if (!text) return
    const trimmedCustom = normalizeCustomBadgeInput(customBadge)
    const nextCustomBadge = useCustomBadge && isValidCustomBadge(trimmedCustom) ? trimmedCustom : null

    await onPublish({
      content: text,
      badge: useCustomBadge ? null : badge,
      customBadge: nextCustomBadge,
      removeMediaIds: [],
    })
    setContent('')
    setBadge(null)
    setCustomBadge('')
    setUseCustomBadge(false)
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Share with the community</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What's on your mind?"
        placeholderTextColor={palette.textMuted}
        multiline
        style={styles.input}
        maxLength={2000}
      />

      <View style={styles.badgeRow}>
        {badgeOptions.map((item) => {
          const isCustomOption = item.label === 'Custom'
          const active = isCustomOption ? useCustomBadge : !useCustomBadge && badge === item.value
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                if (isCustomOption) {
                  setUseCustomBadge(true)
                  setBadge(null)
                  return
                }
                setUseCustomBadge(false)
                setCustomBadge('')
                setBadge(item.value)
              }}
              style={[styles.badgeChip, active && styles.badgeChipActive]}
            >
              <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>

      {useCustomBadge ? (
        <TextInput
          value={customBadge}
          onChangeText={(value) => setCustomBadge(normalizeCustomBadgeInput(value))}
          placeholder="Custom badge (e.g. Sleep win)"
          placeholderTextColor={palette.textMuted}
          style={styles.customInput}
          maxLength={CUSTOM_BADGE_MAX_LENGTH}
        />
      ) : null}

      <Button
        title={posting ? 'Posting…' : 'Post'}
        loading={posting}
        disabled={!content.trim()}
        onPress={() => void onSubmit()}
      />
    </View>
  )
}
