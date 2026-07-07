import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { DailyMemoryCard } from '@/components/dailyMemories/DailyMemoryCard'
import { DailyMemoryFormModal } from '@/components/dailyMemories/DailyMemoryFormModal'
import { NavIcon } from '@/components/icons/NavIcon'
import { Button, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { DAILY_MEMORY_THEME, dailyMemoryPrimaryButtonStyle } from '@/constants/dailyMemoryTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useApp } from '@/context/AppContext'
import { useDailyMemories } from '@/hooks/useDailyMemories'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { formatDayLabel, parseYmd } from '@/lib/trackUtils'
import { Spacing } from '@/constants/theme'

type Props = {
  ymd: string
}

const createStyles = (t: AppPalette) => ({
  screen: { flex: 1, backgroundColor: t.background },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: DAILY_MEMORY_THEME.accent,
  },
  headerMain: { flex: 1 },
  title: { ...heading(22, { weight: '800' }), color: t.text },
  sub: { fontSize: 14, color: t.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  addRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  empty: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.five,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
})

export function DailyMemoryDayScreen({ ymd }: Props) {
  const router = useRouter()
  const styles = useThemedStyles(createStyles)
  const { user, authReady } = useApp()
  const page = useDailyMemories()
  const { setSelectedYmd } = page

  const validDate = !Number.isNaN(parseYmd(ymd).getTime())
  const dayLabel = validDate ? formatDayLabel(ymd, 'long') : ymd
  const dayMemories = page.memoriesByDate.get(ymd) ?? []
  const showBabyName = !page.filterBabyId && page.babies.length > 1

  useEffect(() => {
    if (validDate) setSelectedYmd(ymd)
  }, [ymd, validDate, setSelectedYmd])

  useEffect(() => {
    if (!validDate) router.back()
  }, [validDate, router])

  useEffect(() => {
    if (!authReady) return
    if (!user || !isApiConfigured() || !page.hasBaby) {
      router.replace('/daily-memories' as '/')
    }
  }, [authReady, user, page.hasBaby, router])

  if (!authReady || page.loading || page.babiesLoading) {
    return <PageLoadingScreen label="Loading memories…" />
  }

  if (!user || !isApiConfigured() || !page.hasBaby) {
    return null
  }

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to calendar"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.headerMain}>
            <Text style={styles.title}>{dayLabel}</Text>
            <Text style={styles.sub}>
              {dayMemories.length} memor{dayMemories.length === 1 ? 'y' : 'ies'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.addRow}>
            <Button
              title="Add memory"
              onPress={() => page.openCreate(ymd)}
              style={dailyMemoryPrimaryButtonStyle}
            />
          </View>

          {page.error ? <ErrorText>{page.error}</ErrorText> : null}

          {dayMemories.length === 0 ? (
            <View style={styles.empty}>
              <NavIcon name="memories" size={36} color={DAILY_MEMORY_THEME.accent} />
              <Text style={styles.emptyText}>
                No memories for this day yet. Add one to capture a sweet moment.
              </Text>
            </View>
          ) : (
            dayMemories.map((memory) => (
              <DailyMemoryCard
                key={memory.id}
                memory={memory}
                showBabyName={showBabyName}
                deleting={page.saving}
                onEdit={page.openEdit}
                onDelete={page.removeMemory}
              />
            ))
          )}
        </ScrollView>
      </View>

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
