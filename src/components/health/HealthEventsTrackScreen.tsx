import { Link, useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { HealthDisclaimer } from '@/components/health/HealthDisclaimer'
import { NavIcon } from '@/components/icons/NavIcon'
import { SicknessLogModal } from '@/components/health/SicknessLogModal'
import { InjuryLogModal } from '@/components/health/InjuryLogModal'
import { Button, Card, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useHealthEventsPage } from '@/hooks/useHealthEventsPage'
import { formatHealthDuration, type HealthTabId } from '@/types/health'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const TABS: { id: HealthTabId; label: string }[] = [
  { id: 'sickness', label: 'Sickness' },
  { id: 'injuries', label: 'Injuries' },
]

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
  tabs: { flexDirection: 'row' as const, gap: 8, marginBottom: Spacing.two },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.stroke,
    alignItems: 'center' as const,
    backgroundColor: t.card,
  },
  tabActive: {
    borderColor: 'rgba(196, 92, 122, 0.45)',
    backgroundColor: 'rgba(196, 92, 122, 0.12)',
  },
  tabText: { fontWeight: '700' as const, color: t.textMuted },
  tabTextActive: { color: HEALTH_ACCENT },
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

export function HealthEventsTrackScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const { user, authReady } = useApp()
  const health = useHealthEventsPage()

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
            <NavIcon name="health" size={22} color={HEALTH_ACCENT} />
          </View>
          <Text style={styles.gateTitle}>Health events</Text>
          <Text style={styles.gateText}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track sickness, injuries, symptoms, and care notes.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (health.loading || health.babiesLoading) {
    return <PageLoadingScreen label="Loading health events…" />
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={styles.iconWrap}>
              <NavIcon name="health" size={22} color={HEALTH_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Health events</Text>
              <Text style={styles.sub}>
                Track sickness and injuries — symptoms, temperature, care, and duration.
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statN}>{health.sicknessCount}</Text>
              <Text style={styles.statLabel}>sickness</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statN}>{health.injuryCount}</Text>
              <Text style={styles.statLabel}>injuries</Text>
            </View>
          </View>
        </View>

        <BabyChipBar />

        {health.error ? <ErrorText>{health.error}</ErrorText> : null}

        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const active = health.activeTab === tab.id
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                onPress={() => health.setActiveTab(tab.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {health.activeTab === 'sickness' ? (
          <Card>
            <View style={styles.sectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Sickness logs</Text>
                <Text style={styles.sectionSub}>Illness type, duration, temperature, symptoms, and care.</Text>
              </View>
              <Button title="Log sickness" onPress={health.openSicknessForm} />
            </View>
            {health.visibleSickness.length === 0 ? (
              <Text style={styles.empty}>No sickness events yet.</Text>
            ) : (
              health.visibleSickness.map((row) => (
                <Card key={row.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{row.sicknessType}</Text>
                  <Text style={styles.cardMeta}>
                    {formatStamp(row.startedAt)} · {formatHealthDuration(row.startedAt, row.endedAt)}
                    {row.temperatureF ? ` · ${row.temperatureF}°F` : ''}
                  </Text>
                  {row.symptoms.length > 0 ? (
                    <View style={styles.tagRow}>
                      {row.symptoms.map((s) => (
                        <View key={s} style={styles.tag}>
                          <Text style={styles.tagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.cardActions}>
                    <Pressable onPress={() => health.openEditSickness(row)}>
                      <Text style={styles.link}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => health.onDeleteSickness(row.id)}>
                      <Text style={[styles.link, { color: palette.error }]}>Delete</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </Card>
        ) : (
          <Card>
            <View style={styles.sectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Injuries</Text>
                <Text style={styles.sectionSub}>Bumps, scratches, swelling, and how you treated them.</Text>
              </View>
              <Button title="Log injury" variant="secondary" onPress={health.openInjuryForm} />
            </View>
            {health.visibleInjuries.length === 0 ? (
              <Text style={styles.empty}>No injuries logged yet.</Text>
            ) : (
              health.visibleInjuries.map((row) => (
                <Card key={row.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{row.description}</Text>
                  <Text style={styles.cardMeta}>
                    {formatStamp(row.occurredAt)}
                    {row.bodyPart ? ` · ${row.bodyPart}` : ''}
                    {row.hasSwelling ? ' · Swelling' : ''}
                    {' · '}
                    {formatHealthDuration(row.occurredAt, row.endedAt)}
                  </Text>
                  <View style={styles.cardActions}>
                    <Pressable onPress={() => health.openEditInjury(row)}>
                      <Text style={styles.link}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => health.onDeleteInjury(row.id)}>
                      <Text style={[styles.link, { color: palette.error }]}>Delete</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </Card>
        )}

        {health.babies.length === 0 && !health.babiesLoading ? (
          <Button title="Add a baby" onPress={() => router.push('/add-baby')} />
        ) : null}

        <HealthDisclaimer />
      </ScrollView>

      <SicknessLogModal health={health} />
      <InjuryLogModal health={health} />
    </>
  )
}
