import { Link } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { DailyMemoryCalendar } from '@/components/dailyMemories/DailyMemoryCalendar'
import { DailyMemoryFormModal } from '@/components/dailyMemories/DailyMemoryFormModal'
import { NavIcon } from '@/components/icons/NavIcon'
import { Button, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { DAILY_MEMORY_THEME } from '@/constants/dailyMemoryTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useApp } from '@/context/AppContext'
import { useDailyMemories } from '@/hooks/useDailyMemories'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

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
    backgroundColor: DAILY_MEMORY_THEME.accentSoft,
    borderWidth: 1,
    borderColor: DAILY_MEMORY_THEME.accentBorder,
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
  statN: { fontSize: 22, fontWeight: '800' as const, color: DAILY_MEMORY_THEME.accent },
  statLabel: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  gate: { gap: Spacing.two, paddingTop: Spacing.two, alignItems: 'center' as const },
  gateIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: DAILY_MEMORY_THEME.accentSoft,
    borderWidth: 1,
    borderColor: DAILY_MEMORY_THEME.accentBorder,
  },
  gateTitle: { ...heading(22, { weight: '700' }), color: t.text, textAlign: 'center' as const },
  gateText: {
    fontSize: 14,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  gateActions: { flexDirection: 'row' as const, gap: 10, marginTop: 8 },
  loginLink: { fontSize: 14, fontWeight: '800' as const, color: t.accentDeep },
})

export function DailyMemoriesScreen() {
  const styles = useThemedStyles(createStyles)
  const { user, authReady } = useApp()
  const page = useDailyMemories()

  if (!authReady) {
    return <PageLoadingScreen label="Loading daily memories…" />
  }

  if (!user) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <NavIcon name="heart" size={24} color={DAILY_MEMORY_THEME.accent} />
          </View>
          <Text style={styles.gateTitle}>Daily memories</Text>
          <Text style={styles.gateText}>
            Log in to save sweet moments on a calendar — first words, funny faces, and little wins worth remembering.
          </Text>
          <View style={styles.gateActions}>
            <Link href="/login" asChild>
              <Button title="Log in" />
            </Link>
            <Link href="/signup" asChild>
              <Button title="Sign up" variant="secondary" />
            </Link>
          </View>
        </View>
      </ScrollView>
    )
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.gateText}>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</Text>
      </ScrollView>
    )
  }

  if (!page.hasBaby) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gate}>
          <View style={styles.gateIcon}>
            <NavIcon name="heart" size={24} color={DAILY_MEMORY_THEME.accent} />
          </View>
          <Text style={styles.gateTitle}>Daily memories</Text>
          <Text style={styles.gateText}>
            Add a baby profile to start capturing memorable moments on your calendar.
          </Text>
          <Link href="/add-baby" asChild>
            <Button title="Add a baby" />
          </Link>
        </View>
      </ScrollView>
    )
  }

  if (page.loading || page.babiesLoading) {
    return <PageLoadingScreen label="Loading memories…" />
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={styles.iconWrap}>
              <NavIcon name="heart" size={22} color={DAILY_MEMORY_THEME.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Daily memories</Text>
              <Text style={styles.sub}>
                Capture something memorable your baby did each day. Tap a date to view memories or add a new one.
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statN}>{page.visibleMemories.length}</Text>
              <Text style={styles.statLabel}>memories saved</Text>
            </View>
          </View>
        </View>

        <BabyChipBar />

        {page.error ? <ErrorText>{page.error}</ErrorText> : null}

        <DailyMemoryCalendar
          memoriesByDate={page.memoriesByDate}
          selectedYmd={page.selectedYmd}
          onSelectDay={page.selectDay}
          onChangeDay={page.setSelectedYmd}
        />
      </ScrollView>

      <DailyMemoryFormModal
        open={page.formOpen}
        onClose={page.closeForm}
        onSave={() => void page.saveForm()}
        saving={page.saving}
        isEdit={Boolean(page.editingId)}
        babies={page.babies}
        formState={page.formState}
        patchFormState={page.patchFormState}
        fieldErrors={page.fieldErrors}
        mediaPick={page.mediaPick}
        existingMediaUrl={page.existingMediaUrl}
        existingMediaType={page.existingMediaType}
        removeMedia={page.removeMedia}
        onPickMedia={page.setMediaPick}
        onRemoveExistingMedia={() => page.setRemoveMedia(true)}
      />
    </>
  )
}
