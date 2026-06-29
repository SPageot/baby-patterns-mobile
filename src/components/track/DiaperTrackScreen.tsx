import { Link } from 'expo-router'
import { Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { TrackInsights } from '@/components/charts/TrackInsights'
import { DiaperLogModal } from '@/components/track/DiaperLogModal'
import { DiaperLogSection } from '@/components/track/DiaperLogSection'
import { DiaperLogsHistory } from '@/components/track/DiaperLogsHistory'
import { DiaperLogsList } from '@/components/track/DiaperLogsList'
import { ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useDiaperLogs } from '@/hooks/useDiaperLogs'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  hint: {
    color: t.textMuted,
    fontSize: 14,
    padding: Spacing.three,
  },
  loginLink: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  loginPrompt: {
    color: '#b42318',
    fontSize: 14,
    marginBottom: Spacing.two,
  },
})

export function DiaperTrackScreen() {
  const { user, authReady } = useApp()
  const diaper = useDiaperLogs()
  const styles = useThemedStyles(createStyles)

  const alerts = diaper.error ? <ErrorText>{diaper.error}</ErrorText> : undefined

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (!isApiConfigured()) {
    return (
      <DiaperLogSection
        todayCount={0}
        onLogClick={diaper.openForm}
        alerts={<ErrorText>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</ErrorText>}
        recent={<Text style={styles.hint}>Configure the API to load and save diaper logs.</Text>}
      />
    )
  }

  if (!user) {
    return (
      <DiaperLogSection
        todayCount={0}
        onLogClick={() => {}}
        alerts={
          <Text style={styles.loginPrompt}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track diapers.
          </Text>
        }
        recent={<Text style={styles.hint}>Sign in to view and save diaper changes.</Text>}
      />
    )
  }

  if (diaper.loading || diaper.babiesLoading) {
    return <PageLoadingScreen label="Loading diaper logs…" />
  }

  return (
    <DiaperLogSection
      todayCount={diaper.todayDiapers}
      onLogClick={diaper.openForm}
      logFormOpen={diaper.formOpen}
      alerts={alerts}
      panelToolbar={<BabyChipBar />}
      insights={<TrackInsights logs={diaper.diaperLogs} kind="diaper" />}
      recent={
        <View>
          <DiaperLogsList
            logs={diaper.diaperLogs}
            onEditLog={diaper.openEditDiaper}
            onDeleteLog={diaper.onDeleteDiaper}
            busyLogId={diaper.busyLogId}
          />
          <DiaperLogsHistory
            logs={diaper.diaperLogs}
            babies={diaper.babies}
            onEditLog={diaper.openEditDiaper}
            onDeleteLog={diaper.onDeleteDiaper}
            busyLogId={diaper.busyLogId}
          />
        </View>
      }
    >
      <DiaperLogModal
        open={diaper.formOpen}
        onClose={diaper.closeForm}
        onSave={() => void diaper.onSaveDiaper()}
        onBackToEntry={diaper.backToEntry}
        saving={diaper.saving}
        babies={diaper.babies}
        formBabyId={diaper.formBabyId}
        setFormBabyId={diaper.setFormBabyId}
        formBabyIds={diaper.formBabyIds}
        onToggleFormBabyId={diaper.toggleFormBabyId}
        showReviewStep={diaper.showReviewStep}
        isMultiCreate={diaper.isMultiCreate}
        reviewDrafts={diaper.reviewDrafts}
        onUpdateReviewDraft={diaper.updateReviewDraft}
        formState={diaper.formState}
        setFormState={diaper.setFormState}
        editingLogId={diaper.editingLogId}
      />
    </DiaperLogSection>
  )
}
