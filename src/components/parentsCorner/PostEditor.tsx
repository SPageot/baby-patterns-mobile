import { useEffect, useMemo, useState } from 'react'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Pressable, Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/primitives'
import type { PostBadge, PostMedia, PostMediaUpload, PostSubmitInput } from '@/schemas/post'
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

type ExistingMediaItem = PostMedia & { markedForRemoval?: boolean }

const EMPTY_MEDIA: PostMedia[] = []

type Props = {
  initialContent?: string
  initialBadge?: PostBadge | null
  initialCustomBadge?: string | null
  initialMedia?: PostMedia[]
  isSiteDeveloper?: boolean
  submitting: boolean
  submitLabel: string
  onSubmit: (input: PostSubmitInput) => Promise<void>
  onCancel?: () => void
}

function assetToUpload(asset: ImagePicker.ImagePickerAsset): PostMediaUpload {
  const ext = asset.uri.split('.').pop() ?? (asset.type === 'video' ? 'mp4' : 'jpg')
  const name = asset.fileName ?? `media-${Date.now()}.${ext}`
  const type = asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')
  return { uri: asset.uri, name, type }
}

const createStyles = (t: AppPalette) => ({
  card: {
    gap: Spacing.two,
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
  mediaList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  mediaItem: {
    width: 88,
    alignItems: 'center' as const,
    gap: 6,
  },
  mediaThumb: {
    width: 88,
    height: 88,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
  },
  mediaRemoved: {
    opacity: 0.45,
  },
  mediaAction: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  actions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  actionsRight: {
    flexDirection: 'row' as const,
    gap: 8,
    marginLeft: 'auto' as const,
  },
})

export function PostEditor({
  initialContent = '',
  initialBadge = null,
  initialCustomBadge = null,
  initialMedia = EMPTY_MEDIA,
  isSiteDeveloper = false,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [content, setContent] = useState(initialContent)
  const [badge, setBadge] = useState<PostBadge | null>(initialBadge)
  const [customBadge, setCustomBadge] = useState(initialCustomBadge?.trim() ?? '')
  const [useCustomBadge, setUseCustomBadge] = useState(Boolean(initialCustomBadge?.trim()))
  const [files, setFiles] = useState<PostMediaUpload[]>([])
  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>(initialMedia)

  const badgeOptions = useMemo(
    () => [
      { value: null as PostBadge | null, label: 'Post' },
      ...getAvailablePostBadges(isSiteDeveloper).map((item) => ({
        value: item.value as PostBadge,
        label: item.label,
      })),
      { value: null as PostBadge | null, label: 'Custom' },
    ],
    [isSiteDeveloper],
  )

  const initialMediaKey = useMemo(
    () => initialMedia.map((item) => item.id).join(','),
    [initialMedia],
  )

  useEffect(() => {
    if (!onCancel) return
    setContent(initialContent)
    setBadge(initialBadge ?? null)
    setCustomBadge(initialCustomBadge?.trim() ?? '')
    setUseCustomBadge(Boolean(initialCustomBadge?.trim()))
    setExistingMedia(initialMedia)
    setFiles([])
  }, [onCancel, initialContent, initialBadge, initialCustomBadge, initialMediaKey, initialMedia])

  const keptExistingCount = existingMedia.filter((item) => !item.markedForRemoval).length
  const totalMediaCount = keptExistingCount + files.length

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const room = Math.max(0, 4 - keptExistingCount - files.length)
    if (room <= 0) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: room > 1,
      selectionLimit: room,
      quality: 0.92,
    })

    if (result.canceled || !result.assets.length) return
    setFiles((prev) => [...prev, ...result.assets.slice(0, room).map(assetToUpload)])
  }

  const handleSubmit = async () => {
    if (!content.trim() && totalMediaCount === 0) return

    const trimmedCustom = normalizeCustomBadgeInput(customBadge)
    const nextCustomBadge = useCustomBadge && isValidCustomBadge(trimmedCustom) ? trimmedCustom : null

    await onSubmit({
      content,
      badge: useCustomBadge ? null : badge,
      customBadge: nextCustomBadge,
      files,
      removeMediaIds: existingMedia.filter((item) => item.markedForRemoval).map((item) => item.id),
    })

    if (!onCancel) {
      setContent('')
      setBadge(null)
      setCustomBadge('')
      setUseCustomBadge(false)
      setFiles([])
      setExistingMedia([])
    }
  }

  return (
    <View style={styles.card}>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Share something with other parents…"
        placeholderTextColor={palette.textMuted}
        multiline
        style={styles.input}
        maxLength={2000}
        editable={!submitting}
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
          editable={!submitting}
        />
      ) : null}

      {(files.length > 0 || existingMedia.length > 0) && (
        <View style={styles.mediaList}>
          {existingMedia.map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              {item.mediaType === 'image' ? (
                <Image
                  source={{ uri: item.url }}
                  style={[styles.mediaThumb, item.markedForRemoval && styles.mediaRemoved]}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.mediaThumb, item.markedForRemoval && styles.mediaRemoved]} />
              )}
              <Pressable
                onPress={() =>
                  setExistingMedia((prev) =>
                    prev.map((row) =>
                      row.id === item.id ? { ...row, markedForRemoval: !row.markedForRemoval } : row,
                    ),
                  )
                }
              >
                <Text style={styles.mediaAction}>{item.markedForRemoval ? 'Undo' : 'Remove'}</Text>
              </Pressable>
            </View>
          ))}
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.mediaItem}>
              <Image source={{ uri: file.uri }} style={styles.mediaThumb} contentFit="cover" />
              <Pressable onPress={() => setFiles((prev) => prev.filter((_, i) => i !== index))}>
                <Text style={styles.mediaAction}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Photo / Video"
          variant="ghost"
          disabled={submitting || totalMediaCount >= 4}
          onPress={() => void pickMedia()}
        />
        <View style={styles.actionsRight}>
          {onCancel ? (
            <Button title="Cancel" variant="secondary" disabled={submitting} onPress={onCancel} />
          ) : null}
          <Button
            title={submitting ? 'Saving…' : submitLabel}
            loading={submitting}
            disabled={submitting || (!content.trim() && totalMediaCount === 0)}
            onPress={() => void handleSubmit()}
          />
        </View>
      </View>
    </View>
  )
}
