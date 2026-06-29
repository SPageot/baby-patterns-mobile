import { Link } from 'expo-router'
import { Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { TrackInsights } from '@/components/charts/TrackInsights'
import { PottyLogModal } from '@/components/track/PottyLogModal'
import { PottyLogSection } from '@/components/track/PottyLogSection'
import { PottyLogsHistory } from '@/components/track/PottyLogsHistory'
import { PottyLogsList } from '@/components/track/PottyLogsList'
import { ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { usePottyLogs } from '@/hooks/usePottyLogs'
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

export function PottyTrackScreen() {
  const { user, authReady } = useApp()
  const potty = usePottyLogs()
  const styles = useThemedStyles(createStyles)

  const alerts = potty.error ? <ErrorText>{potty.error}</ErrorText> : undefined

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (!isApiConfigured()) {
    return (
      <PottyLogSection
        todayCount={0}
        onLogClick={potty.openForm}
        alerts={<ErrorText>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</ErrorText>}
        recent={<Text style={styles.hint}>Configure the API to load and save potty logs.</Text>}
      />
    )
  }

  if (!user) {
    return (
      <PottyLogSection
        todayCount={0}
        onLogClick={() => {}}
        alerts={
          <Text style={styles.loginPrompt}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track potty visits.
          </Text>
        }
        recent={<Text style={styles.hint}>Sign in to view and save potty visits.</Text>}
      />
    )
  }

  if (potty.loading || potty.babiesLoading) {
    return <PageLoadingScreen label="Loading potty logs…" />
  }

  return (
    <PottyLogSection
      todayCount={potty.todayPotty}
      onLogClick={potty.openForm}
      logFormOpen={potty.formOpen}
      alerts={alerts}
      panelToolbar={<BabyChipBar />}
      insights={<TrackInsights logs={potty.pottyLogs} kind="potty" />}
      recent={
        <View>
          <PottyLogsList
            logs={potty.pottyLogs}
            onEditLog={potty.openEditPotty}
            onDeleteLog={potty.onDeletePotty}
            busyLogId={potty.busyLogId}
          />
          <PottyLogsHistory
            logs={potty.pottyLogs}
            babies={potty.babies}
            onEditLog={potty.openEditPotty}
            onDeleteLog={potty.onDeletePotty}
            busyLogId={potty.busyLogId}
          />
        </View>
      }
    >
      <PottyLogModal
        open={potty.formOpen}
        onClose={potty.closeForm}
        onSave={() => void potty.onSavePotty()}
        onBackToEntry={potty.backToEntry}
        saving={potty.saving}
        babies={potty.babies}
        formBabyId={potty.formBabyId}
        setFormBabyId={potty.setFormBabyId}
        formBabyIds={potty.formBabyIds}
        onToggleFormBabyId={potty.toggleFormBabyId}
        showReviewStep={potty.showReviewStep}
        isMultiCreate={potty.isMultiCreate}
        reviewDrafts={potty.reviewDrafts}
        onUpdateReviewDraft={potty.updateReviewDraft}
        formState={potty.formState}
        setFormState={potty.setFormState}
        editingLogId={potty.editingLogId}
      />
    </PottyLogSection>
  )
}
