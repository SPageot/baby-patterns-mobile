import { Link, useRouter } from 'expo-router'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { LegalParagraph } from '@/components/legal/LegalParagraph'
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL, supportEmailMailto, type LegalSection } from '@/lib/legalContent'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  title: string
  intro: string
  sections: LegalSection[]
  /** Public HTTPS URL for Play Console / app store listings. */
  publicWebUrl?: string
}

const createStyles = (t: AppPalette) => ({
  screen: {
    flex: 1,
    backgroundColor: t.background,
  },
  headerBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  docTitle: {
    ...heading(28, { weight: '800' }),
    color: t.text,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: t.textMuted,
    marginBottom: 12,
  },
  intro: {
    fontSize: 15,
    lineHeight: 24,
    color: t.textMuted,
    marginBottom: Spacing.three,
  },
  section: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  sectionTitle: {
    ...heading(16, { weight: '800' }),
    color: t.text,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: 8,
    paddingLeft: 4,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: t.strokeSubtle,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.accentDeep,
  },
  emailLink: {
    fontWeight: '700' as const,
    color: t.accentDeep,
    textDecorationLine: 'underline' as const,
  },
  webLink: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600' as const,
    color: t.accentDeep,
    textDecorationLine: 'underline' as const,
    marginBottom: 12,
  },
  footerDot: {
    color: t.textMuted,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function LegalDocument({ title, intro, sections, publicWebUrl }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.screen}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={[styles.backText, { flex: 1 }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.meta}>Last updated: {LEGAL_LAST_UPDATED}</Text>
        {publicWebUrl ? (
          <Pressable onPress={() => void Linking.openURL(publicWebUrl)}>
            <Text style={styles.webLink}>View online: {publicWebUrl}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.intro}>{intro}</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <LegalParagraph
                key={paragraph}
                text={paragraph}
                style={styles.paragraph}
                linkStyle={styles.emailLink}
              />
            ))}
            {section.bullets?.map((item) => (
              <Text key={item} style={styles.bullet}>
                • {item}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Pressable onPress={() => void Linking.openURL(supportEmailMailto())}>
            <Text style={styles.footerLink}>Support</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Link href="/privacy" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </Link>
          <Text style={styles.footerDot}>·</Text>
          <Link href="/terms" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Terms of Use</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  )
}
