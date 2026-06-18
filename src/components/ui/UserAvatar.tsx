import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'

import { avatarDisplayUrlCandidates } from '@/api/userApi'
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
  user: Pick<User, 'id' | 'fullName' | 'username' | 'isPro' | 'isSiteDeveloper'> & {
    avatarUrl?: string
  }
  size?: Size
  showProBadge?: boolean
}

const createStyles = (t: AppPalette) => ({
  wrap: {
    alignItems: 'center' as const,
  },
  avatar: {
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarPro: {
    borderColor: t.accentDeep,
  },
  avatarSiteDev: {
    borderColor: '#0d9488',
  },
  initials: {
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
  proBanner: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.accentDeep,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  siteDevBanner: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f766e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  proBannerText: {
    color: '#fff',
    fontWeight: '800' as const,
    letterSpacing: 0.6,
  },
})

export function UserAvatar({ user, size = 'md', showProBadge }: Props) {
  const styles = useThemedStyles(createStyles)
  const dimension = SIZES[size]
  const initials = getUserInitials(user)
  const candidates = avatarDisplayUrlCandidates(user.id, user.avatarUrl)
  const [candidateIndex, setCandidateIndex] = useState(0)
  const imgSrc = candidates[candidateIndex]
  const showImage = Boolean(imgSrc) && candidateIndex < candidates.length
  useEffect(() => {
    setCandidateIndex(0)
  }, [user.id, user.avatarUrl])

  const isSiteDeveloper = Boolean(user.isSiteDeveloper)
  const isPaidPro = showProBadge ?? Boolean(user.isPro)
  const showBadge = isSiteDeveloper || isPaidPro
  const bannerHeight = Math.max(12, Math.round(dimension * 0.28))
  const fontSize = Math.max(7, Math.round(bannerHeight * 0.62))

  return (
    <View style={[styles.wrap, { width: dimension, height: dimension }]}>
      <View
        style={[
          styles.avatar,
          isSiteDeveloper ? styles.avatarSiteDev : isPaidPro ? styles.avatarPro : null,
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
            onError={() => {
              setCandidateIndex((index) => (index + 1 < candidates.length ? index + 1 : candidates.length))
            }}
          />
        ) : (
          <Text style={[styles.initials, { fontSize: dimension * 0.34 }]}>{initials}</Text>
        )}
        {showBadge ? (
          <View
            style={[
              isSiteDeveloper ? styles.siteDevBanner : styles.proBanner,
              {
                height: bannerHeight,
                borderBottomLeftRadius: dimension / 2,
                borderBottomRightRadius: dimension / 2,
              },
            ]}
          >
            <Text style={[styles.proBannerText, { fontSize }]}>{isSiteDeveloper ? 'DEV' : 'PRO'}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}
