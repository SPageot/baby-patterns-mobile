import { Link } from 'expo-router'
import { Linking, Pressable, Text, View } from 'react-native'

import { SUPPORT_EMAIL, supportEmailMailto } from '@/lib/legalContent'

import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  link: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.accentDeep,
  },
  dot: {
    fontSize: 13,
    color: t.textMuted,
  },
})

export function LegalFooterLinks() {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.row}>
      <Link href="/terms">
        <Text style={styles.link}>Terms of Use</Text>
      </Link>
      <Text style={styles.dot}>·</Text>
      <Link href="/privacy">
        <Text style={styles.link}>Privacy Policy</Text>
      </Link>
      <Text style={styles.dot}>·</Text>
      <Pressable onPress={() => void Linking.openURL(supportEmailMailto())}>
        <Text style={styles.link}>{SUPPORT_EMAIL}</Text>
      </Pressable>
    </View>
  )
}
