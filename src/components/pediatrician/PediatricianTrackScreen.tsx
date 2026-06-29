import { Link } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { NavIcon } from '@/components/icons/NavIcon'
import { PediatricianVisitModal } from '@/components/pediatrician/PediatricianVisitModal'
import { TrackingHistoryBanner } from '@/components/track/TrackingHistoryBanner'
import { Button, Card, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { usePediatricianVisitsPage } from '@/hooks/usePediatricianVisitsPage'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const HEALTH_ACCENT = '#c45c7a'

const createStyles = (t: AppPalette) => ({
  scroll: { flex: 1, backgroundColor: t.background },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five },
  status: { fontSize: 14, color: t.textMuted, marginBottom: Spacing.two },
  hero: { marginBottom: Spacing.three },
  heroMain: { flexDirection: 'row' as const, gap: 14, marginBottom: Spacing.two },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(196, 92, 122, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196, 92, 122, 0.22)',
  },
  title: { ...heading(26, { weight: '800' }), color: t.text, marginBottom: 6 },
  sub: { color: t.textMuted, lineHeight: 20 },
  statsRow: { flexDirection: 'row' as const, gap: 10 },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card,
    alignItems: 'center' as const,
  },
  statN: { fontSize: 22, fontWeight: '800' as const, color: HEALTH_ACCENT },
  statLabel: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  sectionHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: Spacing.two,
  },
  sectionTitle: { ...heading(18, { weight: '700' }), color: t.text },
  sectionSub: { fontSize: 13, color: t.textMuted, marginTop: 4, lineHeight: 18 },
  card: { marginBottom: Spacing.two },
  cardTitle: { fontWeight: '700' as const, color: t.text, marginBottom: 4 },
  cardMeta: { color: t.textMuted, fontSize: 13, marginBottom: 6 },
  tagRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 4 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: HomeRadius.pill,
    backgroundColor: 'rgba(196, 92, 122, 0.12)',
  },
  tagText: { fontSize: 12, fontWeight: '600' as const, color: HEALTH_ACCENT },
  cardActions: { flexDirection: 'row' as const, gap: 12, marginTop: 10 },
  link: { color: t.accent, fontWeight: '600' as const },
  empty: { color: t.textMuted, textAlign: 'center' as const, paddingVertical: Spacing.three },
  gate: { gap: Spacing.two, paddingTop: Spacing.two },
  gateTitle: { ...heading(22, { weight: '700' }), color: t.text },
  gateText: { fontSize: 14, color: t.textMuted, lineHeight: 22 },
  loginLink: { fontSize: 14, fontWeight: '800' as const, color: t.accentDeep },
})

function formatStamp(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function PediatricianTrackScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { user, authReady } = useApp()
  const page = usePediatricianVisitsPage()

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ErrorText>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</ErrorText>
      </ScrollView>
    )
  }

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.iconWrap}>
            <NavIcon name="hospital" size={22} color={HEALTH_ACCENT} />
          </View>
          <Text style={styles.gateTitle}>Pediatrician visits</Text>
          <Text style={styles.gateText}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track pediatrician visits, recommendations, and immunizations.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (page.loading || page.babiesLoading) {
    return <PageLoadingScreen label="Loading pediatrician visits…" />
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={styles.iconWrap}>
              <NavIcon name="hospital" size={22} color={HEALTH_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Pediatrician visits</Text>
              <Text style={styles.sub}>
                Track hospital, pediatrician, recommendations, and immunizations given at each visit.
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statN}>{page.visitCount}</Text>
              <Text style={styles.statLabel}>visits logged</Text>
            </View>
          </View>
        </View>

        {!page.isPro ? <TrackingHistoryBanner /> : null}

        <BabyChipBar />

        {page.error ? <ErrorText>{page.error}</ErrorText> : null}

        <Card>
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Visit history</Text>
              <Text style={styles.sectionSub}>
                Hospital or clinic, doctor name, recommendations, and shots given.
              </Text>
            </View>
            <Button title="Log visit" onPress={page.openForm} />
          </View>
          {page.visibleVisits.length === 0 ? (
            <Text style={styles.empty}>No pediatrician visits yet.</Text>
          ) : (
            page.visibleVisits.map((row) => (
              <Card key={row.id} style={styles.card}>
                <Text style={styles.cardTitle}>{row.pediatricianName}</Text>
                <Text style={styles.cardMeta}>
                  {formatStamp(row.visitedAt)}
                  {row.hospital ? ` · ${row.hospital}` : ''}
                </Text>
                {row.recommendations?.trim() ? (
                  <Text style={styles.cardMeta}>{row.recommendations.trim()}</Text>
                ) : null}
                {row.immunizations.length > 0 ? (
                  <View style={styles.tagRow}>
                    {row.immunizations.map((s) => (
                      <View key={s} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.cardActions}>
                  <Pressable onPress={() => page.openEdit(row)}>
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => void page.onDelete(row.id)}>
                    <Text style={[styles.link, { color: palette.error }]}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </Card>
      </ScrollView>

      <PediatricianVisitModal page={page} />
    </>
  )
}
