import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { KindReportPanel } from '@/components/reports/KindReportPanel'
import { GrowthReportPanel } from '@/components/reports/GrowthReportPanel'
import { ReportsOverview } from '@/components/reports/ReportsOverview'
import { ReportsTabPanel, ReportsTabs, type ReportsTabId } from '@/components/reports/ReportsTabs'
import { NavIcon } from '@/components/icons/NavIcon'
import { Button, ErrorText, Eyebrow } from '@/components/ui/primitives'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useReports } from '@/hooks/useReports'
import { reportRangeLabel } from '@/lib/reportAnalytics'
import { reportRangeOptionsForUser } from '@/lib/subscription'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const RANGE_OPTIONS_PRO = [
  { value: 30 as const, label: '30 days' },
  { value: 90 as const, label: '90 days' },
  { value: 0 as const, label: 'All time' },
]

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
    marginBottom: 10,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  rangeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  rangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HomeRadius.pill,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  rangeBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  rangeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  rangeLabelActive: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  status: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
  rangeNote: {
    fontSize: 13,
    color: t.textMuted,
    marginBottom: Spacing.one,
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

export function ReportsScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const { user, authReady } = useApp()
  const reports = useReports()
  const [activeTab, setActiveTab] = useState<ReportsTabId>('overview')
  const rangeOptions = reportRangeOptionsForUser(user)

  if (!authReady) {
    return <Text style={styles.status}>Loading reports…</Text>
  }

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.iconWrap}>
            <NavIcon name="chart" size={22} color={palette.accentDeep} />
          </View>
          <Text style={styles.gateTitle}>Reports & analysis</Text>
          <Text style={styles.gateText}>
            Log in to view advanced charts and insights from your baby&apos;s sleep, diaper, feeding, growth, and milestone logs.
          </Text>
          <Link href="/login" style={styles.loginLink}>
            Log in
          </Link>
        </View>
      </ScrollView>
    )
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Eyebrow>Advanced reports</Eyebrow>
          <Text style={styles.title}>Reports</Text>
        </View>
        <ErrorText>Set EXPO_PUBLIC_API_URL in .env to load reports.</ErrorText>
      </ScrollView>
    )
  }

  if (!reports.hasBaby) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.iconWrap}>
            <NavIcon name="chart" size={22} color={palette.accentDeep} />
          </View>
          <Text style={styles.gateTitle}>Reports & analysis</Text>
          <Text style={styles.gateText}>
            Add a baby profile to unlock feeding, diaper, sleep, growth, and milestone charts with detailed insights.
          </Text>
          <Button title="Add a baby" onPress={() => router.push('/add-baby')} />
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <NavIcon name="chart" size={22} color={palette.accentDeep} />
        </View>
        <Eyebrow>Advanced reports</Eyebrow>
        <Text style={styles.title}>Patterns, trends & insights</Text>
        <Text style={styles.subtitle}>
          Deep analysis of sleep, naps, diapers, feeding, growth, and milestones — including best and worst days and times.
        </Text>
      </View>

      <View style={styles.rangeRow}>
        {(reports.isPro ? RANGE_OPTIONS_PRO : rangeOptions).map((option) => {
          const active = reports.rangeDays === option.value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => reports.setRangeDays(option.value)}
              style={[styles.rangeBtn, active && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeLabel, active && styles.rangeLabelActive]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <Button
        title={reports.exportingPdf ? 'Preparing PDF…' : 'Download PDF report'}
        variant="secondary"
        onPress={() => void reports.downloadPdf()}
        disabled={!reports.isPro || reports.exportingPdf}
      />
      {reports.isPro ? (
        <Button title="Weekly summary" variant="ghost" onPress={() => router.push('/weekly-summary')} />
      ) : (
        <Button title="Upgrade for full history" variant="ghost" onPress={() => router.push('/pricing')} />
      )}

      {reports.error ? <ErrorText>{reports.error}</ErrorText> : null}

      {reports.loading ? (
        <Text style={styles.status}>Loading tracking data…</Text>
      ) : (
        <>
          <Text style={styles.rangeNote}>
            Showing {reportRangeLabel(reports.rangeDays).toLowerCase()}.
            {!reports.isPro ? ' Upgrade to Pro for 30/90-day history and weekly summaries.' : ''}
          </Text>

          <ReportsTabs active={activeTab} onChange={setActiveTab} />

          <ReportsTabPanel tab="overview" active={activeTab}>
            <ReportsOverview report={reports.report} />
          </ReportsTabPanel>

          <ReportsTabPanel tab="sleep" active={activeTab}>
            <KindReportPanel report={reports.report.sleep} logs={reports.logs} rangeDays={reports.rangeDays} />
          </ReportsTabPanel>

          <ReportsTabPanel tab="diapers" active={activeTab}>
            <KindReportPanel report={reports.report.diapers} logs={reports.logs} rangeDays={reports.rangeDays} />
          </ReportsTabPanel>

          <ReportsTabPanel tab="feeding" active={activeTab}>
            <KindReportPanel report={reports.report.feeding} logs={reports.logs} rangeDays={reports.rangeDays} />
          </ReportsTabPanel>

          <ReportsTabPanel tab="growth" active={activeTab}>
            <GrowthReportPanel report={reports.report.growth} />
          </ReportsTabPanel>
        </>
      )}
    </ScrollView>
  )
}
