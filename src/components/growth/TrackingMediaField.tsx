import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Linking, Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { Button, Label } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import {
  isAllowedTrackingMediaAsset,
  prepareTrackingMediaUpload,
  type TrackingMediaUploadPayload,
} from '@/lib/trackingMediaUpload'
import type { TrackingMediaType } from '@/types/growth'
import { Spacing } from '@/constants/theme'

type Props = {
  picked: TrackingMediaUploadPayload | null
  existingUrl?: string | null
  existingType?: TrackingMediaType | null
  removeExisting: boolean
  onPick: (payload: TrackingMediaUploadPayload | null) => void
  onRemoveExisting: () => void
  accentColor: string
  accentBorder: string
  accentSoft: string
  label?: string
  imagesOnly?: boolean
}

function MediaPickIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
      <Path
        fill={color}
        d="M9 3a2 2 0 0 0-2 2v1H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-1V5a2 2 0 0 0-2-2H9Zm0 2h6v1H9V5Zm-3 4h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm6 1.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
      />
    </Svg>
  )
}

const createStyles = (t: AppPalette) => ({
  dropzone: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 148,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderRadius: HomeRadius.lg,
    marginBottom: Spacing.two,
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    marginBottom: 6,
  },
  pickTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
    textAlign: 'center' as const,
  },
  pickHint: {
    fontSize: 13,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  pickMeta: {
    fontSize: 11,
    color: t.textMuted,
    textAlign: 'center' as const,
    marginTop: 2,
    opacity: 0.9,
  },
  preview: {
    marginBottom: Spacing.two,
    gap: 10,
  },
  frame: {
    overflow: 'hidden' as const,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    maxWidth: 320,
    alignSelf: 'flex-start' as const,
  },
  media: {
    width: 280,
    height: 180,
    backgroundColor: t.card,
  },
  videoCard: {
    width: 280,
    height: 120,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.card2,
  },
  videoLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    color: t.textMuted,
  },
})

export function TrackingMediaField({
  picked,
  existingUrl,
  existingType,
  removeExisting,
  onPick,
  onRemoveExisting,
  accentColor,
  accentBorder,
  accentSoft,
  label = 'Photo or video (optional)',
  imagesOnly = false,
}: Props) {
  const styles = useThemedStyles(createStyles)

  const showExisting = Boolean(existingUrl?.trim()) && !removeExisting && !picked
  const displayUrl = picked?.uri ?? (showExisting ? existingUrl : null)
  const displayType: TrackingMediaType | null | undefined = picked
    ? picked.mediaType
    : showExisting
      ? existingType
      : null

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imagesOnly ? ['images'] : ['images', 'videos'],
      quality: 0.92,
      videoMaxDuration: 120,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    })

    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    if (!isAllowedTrackingMediaAsset(asset)) return
    onPick(prepareTrackingMediaUpload(asset))
  }

  return (
    <View>
      <Label>{label}</Label>
      {displayUrl ? (
        <View style={styles.preview}>
          <View style={styles.frame}>
            {displayType === 'video' ? (
              <Pressable
                style={styles.videoCard}
                onPress={() => {
                  if (displayUrl) void Linking.openURL(displayUrl)
                }}
              >
                <Text style={styles.videoLabel}>▶ Play video</Text>
              </Pressable>
            ) : (
              <Image source={{ uri: displayUrl }} style={styles.media} contentFit="cover" />
            )}
          </View>
          {picked ? <Text style={styles.fileName}>{picked.name}</Text> : null}
          <View style={styles.actions}>
            <Button title="Replace" variant="secondary" onPress={() => void pickMedia()} style={styles.actionBtn} />
            <Button
              title="Remove"
              variant="secondary"
              onPress={() => {
                if (picked) onPick(null)
                else onRemoveExisting()
              }}
              style={styles.actionBtn}
            />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => void pickMedia()}
          style={[
            styles.dropzone,
            { borderColor: accentBorder, backgroundColor: accentSoft },
          ]}
          accessibilityRole="button"
          accessibilityLabel={imagesOnly ? 'Choose photo' : 'Choose photo or video'}
        >
          <View style={styles.iconWrap}>
            <MediaPickIcon color={accentColor} />
          </View>
          <Text style={styles.pickTitle}>{imagesOnly ? 'Choose photo' : 'Choose photo or video'}</Text>
          <Text style={styles.pickHint}>Tap to open your library</Text>
          <Text style={styles.pickMeta}>
            {imagesOnly ? 'JPG, PNG, GIF, WEBP · up to 50 MB' : 'JPG, PNG, GIF, WEBP, MP4 · up to 50 MB'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
