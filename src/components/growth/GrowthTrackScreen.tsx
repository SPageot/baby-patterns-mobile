import { useMemo } from 'react'
import { Link, useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { HealthDisclaimer } from '@/components/health/HealthDisclaimer'
import { GrowthLogModal } from '@/components/growth/GrowthLogModal'
import { GrowthMilestoneModal } from '@/components/growth/GrowthMilestoneModal'
import { GrowthTrendChart } from '@/components/growth/GrowthTrendChart'
import { TrackingMediaThumb } from '@/components/growth/TrackingMediaThumb'
import { NavIcon } from '@/components/icons/NavIcon'
import { Button, Card, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useGrowthPage } from '@/hooks/useGrowthPage'
import { MILESTONE_TEMPLATES } from '@/lib/milestoneTemplates'
import {
  MILESTONE_CATEGORY_LABELS,
  type MilestoneCategory,
  type MilestoneDto,
} from '@/types/growth'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const CATEGORY_ORDER: MilestoneCategory[] = ['motor', 'social', 'language', 'cognitive', 'other']

const GROWTH_COLORS = {
  weight: '#7c5cc4',
  height: '#4a9a72',
  head: '#5a7fd4',
} as const

function formatStamp(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' }
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

function fmtNum(v: string | number | null | undefined, suffix: string) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n} ${suffix}`
}

function formatMilestoneStamp(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  hero: {
    marginBottom: Spacing.three,
  },
  heroMain: {
    flexDirection: 'row' as const,
    gap: 14,
    marginBottom: Spacing.two,
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
    flex: 1,
    ...heading(26, { weight: '700' }),
    color: t.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    alignItems: 'center' as const,
  },
  statN: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: t.text,
  },
  statLabel: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
  },
  sectionHead: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    ...heading(20, { weight: '800' }),
    color: t.text,
  },
  sectionSub: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  chartCard: {
    marginBottom: Spacing.two,
    padding: Spacing.two,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.one,
  },
  empty: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 22,
    paddingVertical: Spacing.two,
  },
  measureCard: {
    marginBottom: Spacing.three,
  },
  measureRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  measureMain: {
    flex: 1,
    gap: 6,
  },
  measureDate: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  measureTime: {
    fontSize: 12,
    color: t.textMuted,
  },
  measureValues: {
    fontSize: 13,
    color: t.textMuted,
    lineHeight: 20,
  },
  measureNotes: {
    fontSize: 13,
    color: t.textMuted,
    fontStyle: 'italic' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  deleteText: {
    color: '#b42318',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  milestoneItem: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
  },
  milestoneCheck: {
    fontSize: 16,
    color: t.accentDeep,
    fontWeight: '800' as const,
    marginTop: 2,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  milestoneMeta: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: Spacing.three,
    marginBottom: 4,
  },
  suggestionsSub: {
    fontSize: 13,
    color: t.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  templateChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: t.card2,
    maxWidth: '100%' as const,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
  templateAge: {
    fontSize: 11,
    color: t.textMuted,
    marginTop: 2,
  },
  gate: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  gateTitle: {
    ...heading(22, { weight: '700' }),
    color: t.text,
  },
  gateText: {
    fontSize: 14,
    color: t.textMuted,
    lineHeight: 22,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
})

export function GrowthTrackScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const { user, authReady } = useApp()
  const growth = useGrowthPage()

  const achievedTitles = useMemo(
    () => new Set(growth.milestones.map((m) => m.title.trim().toLowerCase())),
    [growth.milestones],
  )

  const groupedMilestones = useMemo(() => {
    const map = new Map<MilestoneCategory, MilestoneDto[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const m of growth.milestones) {
      const list = map.get(m.category) ?? []
      list.push(m)
      map.set(m.category, list)
    }
    for (const [key, list] of map) {
      list.sort((a, b) => (a.achievedAt < b.achievedAt ? 1 : -1))
      map.set(key, list)
    }
    return map
  }, [growth.milestones])

  const suggestions = MILESTONE_TEMPLATES.filter(
    (t) => !achievedTitles.has(t.title.trim().toLowerCase()),
  ).slice(0, 8)

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
            <NavIcon name="growth" size={22} color={palette.accentDeep} />
          </View>
          <Text style={styles.gateTitle}>Growth & milestones</Text>
          <Text style={styles.gateText}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track weight, length, head size, and developmental milestones.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (growth.loading || growth.babiesLoading) {
    return <PageLoadingScreen label="Loading growth data…" />
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={styles.iconWrap}>
              <NavIcon name="growth" size={22} color={palette.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Growth & milestones</Text>
              <Text style={styles.subtitle}>
                Track weight, length, and head size over time — and celebrate developmental firsts in one place.
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statN}>{growth.measurementCount}</Text>
              <Text style={styles.statLabel}>measurements</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statN}>{growth.milestoneCount}</Text>
              <Text style={styles.statLabel}>milestones</Text>
            </View>
          </View>
        </View>

        <BabyChipBar />

        {growth.error ? <ErrorText>{growth.error}</ErrorText> : null}

        <Card>
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Growth measurements</Text>
              <Text style={styles.sectionSub}>Log checkup or home measurements (lb and in).</Text>
            </View>
            <Button title="Add" onPress={growth.openGrowthForm} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weight</Text>
            <GrowthTrendChart
              measurements={growth.measurements}
              metric="weightLbs"
              title="Weight"
              unit="Pounds (lb)"
              color={GROWTH_COLORS.weight}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Height / length</Text>
            <GrowthTrendChart
              measurements={growth.measurements}
              metric="heightInches"
              title="Height"
              unit="Inches (in)"
              color={GROWTH_COLORS.height}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Head circumference</Text>
            <GrowthTrendChart
              measurements={growth.measurements}
              metric="headCircumferenceInches"
              title="Head circumference"
              unit="Inches (in)"
              color={GROWTH_COLORS.head}
            />
          </View>

          {growth.measurements.length === 0 ? (
            <Text style={styles.empty}>
              No measurements yet — log weight, height, or head size from a checkup or home scale.
            </Text>
          ) : (
            growth.measurements.map((row) => {
              const { date, time } = formatStamp(row.recordedAt)
              return (
                <Card key={row.id} style={styles.measureCard}>
                  <View style={styles.measureRow}>
                    <View style={styles.measureMain}>
                      <Text style={styles.measureDate}>{date}</Text>
                      {time ? <Text style={styles.measureTime}>{time}</Text> : null}
                      <Text style={styles.measureValues}>
                        Weight: {fmtNum(row.weightLbs, 'lb')} · Height: {fmtNum(row.heightInches, 'in')} · Head:{' '}
                        {fmtNum(row.headCircumferenceInches, 'in')}
                      </Text>
                      {row.notes?.trim() ? (
                        <Text style={styles.measureNotes}>{row.notes.trim()}</Text>
                      ) : null}
                      <TrackingMediaThumb url={row.mediaUrl} mediaType={row.mediaType} />
                      <View style={styles.actions}>
                        <Pressable onPress={() => growth.openEditGrowth(row)}>
                          <Text style={styles.actionText}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => growth.onDeleteGrowth(row.id)}>
                          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })
          )}
        </Card>

        <Card>
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Milestones</Text>
              <Text style={styles.sectionSub}>
                Record smiles, rolling, first words, and other developmental wins.
              </Text>
            </View>
            <Button title="Add" variant="secondary" onPress={() => growth.openMilestoneForm()} />
          </View>

          {growth.milestones.length === 0 ? (
            <Text style={styles.empty}>
              No milestones saved yet. Log firsts from the suggestions below or add your own.
            </Text>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const rows = groupedMilestones.get(cat) ?? []
              if (rows.length === 0) return null
              return (
                <View key={cat}>
                  <Text style={styles.groupTitle}>{MILESTONE_CATEGORY_LABELS[cat]}</Text>
                  {rows.map((row) => (
                    <View key={row.id} style={styles.milestoneItem}>
                      <Text style={styles.milestoneCheck}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.milestoneTitle}>{row.title}</Text>
                        <Text style={styles.milestoneMeta}>
                          {formatMilestoneStamp(row.achievedAt)}
                          {row.notes?.trim() ? ` · ${row.notes.trim()}` : ''}
                        </Text>
                        <TrackingMediaThumb url={row.mediaUrl} mediaType={row.mediaType} />
                        <View style={styles.actions}>
                          <Pressable onPress={() => growth.openEditMilestone(row)}>
                            <Text style={styles.actionText}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => growth.onDeleteMilestone(row.id)}>
                            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )
            })
          )}

          {suggestions.length > 0 ? (
            <>
              <Text style={styles.suggestionsTitle}>Common milestones to log</Text>
              <Text style={styles.suggestionsSub}>
                Typical age ranges are approximate — every baby develops on their own timeline.
              </Text>
              <View style={styles.chipRow}>
                {suggestions.map((t) => (
                  <Pressable
                    key={t.title}
                    style={styles.templateChip}
                    onPress={() => growth.openMilestoneForm({ title: t.title, category: t.category })}
                  >
                    <Text style={styles.templateTitle}>{t.title}</Text>
                    {t.typicalAgeMonths ? (
                      <Text style={styles.templateAge}>~{t.typicalAgeMonths} mo</Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </Card>

        {growth.babies.length === 0 && !growth.babiesLoading ? (
          <Button title="Add a baby" onPress={() => router.push('/add-baby')} />
        ) : null}

        <HealthDisclaimer />
      </ScrollView>

      <GrowthLogModal
        open={growth.growthFormOpen}
        onClose={growth.closeGrowthForm}
        onSave={() => void growth.onSaveGrowth()}
        saving={growth.saving}
        babies={growth.babies}
        formBabyId={growth.formBabyId}
        setFormBabyId={growth.setFormBabyId}
        recordedAt={growth.recordedAt}
        setRecordedAt={growth.setRecordedAt}
        weightLbs={growth.weightLbs}
        setWeightLbs={growth.setWeightLbs}
        heightInches={growth.heightInches}
        setHeightInches={growth.setHeightInches}
        headInches={growth.headInches}
        setHeadInches={growth.setHeadInches}
        growthNotes={growth.growthNotes}
        setGrowthNotes={growth.setGrowthNotes}
        growthMedia={growth.growthMedia}
        setGrowthMedia={growth.setGrowthMedia}
        growthExistingMediaUrl={growth.growthExistingMediaUrl}
        growthExistingMediaType={growth.growthExistingMediaType}
        growthRemoveMedia={growth.growthRemoveMedia}
        setGrowthRemoveMedia={growth.setGrowthRemoveMedia}
        editingGrowthId={growth.editingGrowthId}
      />

      <GrowthMilestoneModal
        open={growth.milestoneFormOpen}
        onClose={growth.closeMilestoneForm}
        onSave={() => void growth.onSaveMilestone()}
        saving={growth.saving}
        babies={growth.babies}
        formBabyId={growth.formBabyId}
        setFormBabyId={growth.setFormBabyId}
        milestoneTitle={growth.milestoneTitle}
        setMilestoneTitle={growth.setMilestoneTitle}
        milestoneCategory={growth.milestoneCategory}
        setMilestoneCategory={growth.setMilestoneCategory}
        achievedAt={growth.achievedAt}
        setAchievedAt={growth.setAchievedAt}
        milestoneNotes={growth.milestoneNotes}
        setMilestoneNotes={growth.setMilestoneNotes}
        milestoneMedia={growth.milestoneMedia}
        setMilestoneMedia={growth.setMilestoneMedia}
        milestoneExistingMediaUrl={growth.milestoneExistingMediaUrl}
        milestoneExistingMediaType={growth.milestoneExistingMediaType}
        milestoneRemoveMedia={growth.milestoneRemoveMedia}
        setMilestoneRemoveMedia={growth.setMilestoneRemoveMedia}
        editingMilestoneId={growth.editingMilestoneId}
      />
    </>
  )
}
