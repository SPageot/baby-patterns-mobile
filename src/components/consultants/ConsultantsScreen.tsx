import { ScrollView, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { ConsultantCard } from '@/components/consultants/ConsultantCard'
import { NavIcon } from '@/components/icons/NavIcon'
import { Eyebrow } from '@/components/ui/primitives'
import { CONSULTANTS, CONSULTANTS_DISCLAIMER } from '@/content/consultants'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hero: {
    gap: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  empty: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  grid: {
    gap: Spacing.two,
  },
  disclaimer: {
    marginTop: Spacing.one,
    fontSize: 12,
    lineHeight: 18,
    color: t.textMuted,
  },
})

export function ConsultantsScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <NavIcon name="info" size={22} color={palette.accentDeep} />
        </View>
        <Eyebrow>Directory</Eyebrow>
        <Text style={styles.title}>{t('community.consultants.title')}</Text>
        <Text style={styles.subtitle}>
          Connect with specialists who support parents and families. Reach out by email, Instagram, or their website.
        </Text>
      </View>

      {CONSULTANTS.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('community.consultants.empty')}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {CONSULTANTS.map((consultant) => (
            <ConsultantCard key={consultant.id} consultant={consultant} />
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>{CONSULTANTS_DISCLAIMER}</Text>
    </ScrollView>
  )
}
