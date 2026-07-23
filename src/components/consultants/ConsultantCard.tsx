import { useState, type ReactNode } from 'react'
import { Image } from 'expo-image'
import { Linking, Pressable, Text, View } from 'react-native'

import type { Consultant } from '@/content/consultants'
import {
  consultantInstagramLabel,
  consultantInstagramUrl,
  consultantWebsiteLabel,
  consultantWebsiteUrl,
} from '@/lib/consultantLinks'
import { consultantImageSource } from '@/lib/consultantImages'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { ConsultantEmailModal } from './ConsultantEmailModal'

const createStyles = (t: AppPalette) => ({
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    overflow: 'hidden' as const,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  image: {
    width: '100%' as const,
    height: 180,
    backgroundColor: t.card2,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  body: {
    paddingHorizontal: Spacing.two,
    gap: 6,
  },
  name: {
    ...heading(20, { weight: '800' }),
    color: t.text,
  },
  type: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    textTransform: 'capitalize' as const,
    color: t.accentDeep,
  },
  details: {
    marginTop: 8,
    gap: 10,
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: t.accentDeep,
  },
  value: {
    fontSize: 15,
    lineHeight: 21,
    color: t.text,
  },
  link: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
    color: t.accentDeep,
  },
  empty: {
    fontSize: 15,
    color: t.textMuted,
  },
})

type Props = {
  consultant: Consultant
}

function DetailRow({
  label,
  children,
  styles,
}: {
  label: string
  children: ReactNode
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View>{children}</View>
    </View>
  )
}

async function openUrl(url: string) {
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) await Linking.openURL(url)
}

export function ConsultantCard({ consultant }: Props) {
  const styles = useThemedStyles(createStyles)
  const email = consultant.email.trim()
  const instagramUrl = consultantInstagramUrl(consultant.instagram)
  const instagramLabel = consultantInstagramLabel(consultant.instagram)
  const websiteUrl = consultantWebsiteUrl(consultant.website)
  const websiteLabel = consultantWebsiteLabel(consultant.website)
  const imageSource = consultantImageSource(consultant.imageKey)
  const [emailOpen, setEmailOpen] = useState(false)

  return (
    <View style={styles.card} accessibilityRole="summary">
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel={`${consultant.name} — ${consultant.type}`}
        />
      ) : null}

      <View style={styles.body}>
        <Text style={styles.name}>{consultant.name}</Text>
        <Text style={styles.type}>{consultant.type}</Text>

        <View style={styles.details}>
          <DetailRow label="Email" styles={styles}>
            {email ? (
              <Pressable onPress={() => setEmailOpen(true)} accessibilityRole="button">
                <Text style={styles.link}>{email}</Text>
              </Pressable>
            ) : (
              <Text style={styles.empty}>—</Text>
            )}
          </DetailRow>

          <DetailRow label="Instagram" styles={styles}>
            {instagramUrl ? (
              <Pressable onPress={() => void openUrl(instagramUrl)} accessibilityRole="link">
                <Text style={styles.link}>{instagramLabel}</Text>
              </Pressable>
            ) : (
              <Text style={styles.empty}>—</Text>
            )}
          </DetailRow>

          <DetailRow label="Website" styles={styles}>
            {websiteUrl ? (
              <Pressable onPress={() => void openUrl(websiteUrl)} accessibilityRole="link">
                <Text style={styles.link}>{websiteLabel}</Text>
              </Pressable>
            ) : (
              <Text style={styles.empty}>—</Text>
            )}
          </DetailRow>
        </View>
      </View>

      {email ? (
        <ConsultantEmailModal
          open={emailOpen}
          email={email}
          consultantName={consultant.name}
          onClose={() => setEmailOpen(false)}
        />
      ) : null}
    </View>
  )
}
