import { useState } from 'react'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'

import { avatarDisplayUrl } from '@/api/userApi'
import type { AppPalette } from '@/constants/homeTheme'
import { getUserInitials } from '@/lib/userUtils'
import type { User } from '@/schemas/user'
import { useThemedStyles } from '@/hooks/useThemedStyles'

type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 56,
}

type Props = {
  user: Pick<User, 'id' | 'fullName' | 'username'> & { avatarUrl?: string }
  size?: Size
}

const createStyles = (t: AppPalette) => ({
  avatar: {
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  initials: {
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
})

export function UserAvatar({ user, size = 'md' }: Props) {
  const styles = useThemedStyles(createStyles)
  const dimension = SIZES[size]
  const initials = getUserInitials(user)
  const imgSrc = avatarDisplayUrl(user.id, user.avatarUrl)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(imgSrc) && failedSrc !== imgSrc

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imgSrc }}
          style={{ width: dimension, height: dimension }}
          contentFit="cover"
          onError={() => setFailedSrc(imgSrc ?? null)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: dimension * 0.34 }]}>{initials}</Text>
      )}
    </View>
  )
}
