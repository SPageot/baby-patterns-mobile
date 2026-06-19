import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { FREE_TRACKING_HISTORY_MESSAGE } from '@/lib/healthAccess'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  banner: {
    marginBottom: Spacing.one,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  line: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'baseline' as const,
    gap: 4,
  },
  title: { fontSize: 12, fontWeight: '700' as const, color: t.textMuted },
  text: { flex: 1, fontSize: 12, lineHeight: 17, color: t.textMuted },
  link: { fontSize: 12, fontWeight: '700' as const, color: t.accentDeep },
})

export function TrackingHistoryBanner() {
  const router = useRouter()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.banner}>
      <View style={styles.line}>
        <Text style={styles.title}>7-day history on Free</Text>
        <Text style={styles.text}>{FREE_TRACKING_HISTORY_MESSAGE}</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push('/pricing')}>
          <Text style={styles.link}>Upgrade</Text>
        </Pressable>
      </View>
    </View>
  )
}
