import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { Linking, Pressable, Text, View } from 'react-native'

import { trackingMediaUrlCandidates } from '@/api/resolveMediaUrl'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { TrackingMediaType } from '@/types/growth'

type Props = {
  url?: string | null
  mediaType?: TrackingMediaType | null
}

const createStyles = (t: AppPalette) => ({
  wrap: {
    marginTop: 10,
  },
  image: {
    width: '100%' as const,
    maxWidth: 220,
    height: 140,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  videoBtn: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  videoText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.text,
  },
})

export function TrackingMediaThumb({ url, mediaType }: Props) {
  const styles = useThemedStyles(createStyles)
  const candidates = trackingMediaUrlCandidates(url)
  const [candidateIndex, setCandidateIndex] = useState(0)
  const displayUrl = candidates[candidateIndex]

  useEffect(() => {
    setCandidateIndex(0)
  }, [url])

  if (!displayUrl) return null

  const tryNext = () => {
    setCandidateIndex((index) => (index + 1 < candidates.length ? index + 1 : candidates.length))
  }

  if (mediaType === 'video') {
    return (
      <View style={styles.wrap}>
        <Pressable style={styles.videoBtn} onPress={() => void Linking.openURL(displayUrl)}>
          <Text style={styles.videoText}>▶ View video</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <Image source={{ uri: displayUrl }} style={styles.image} contentFit="cover" onError={tryNext} />
    </View>
  )
}
