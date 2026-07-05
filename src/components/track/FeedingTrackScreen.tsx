import { Link } from 'expo-router'
import { Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { TrackInsights } from '@/components/charts/TrackInsights'
import { FeedingLogModal } from '@/components/track/FeedingLogModal'
import { FeedingLogsHistory } from '@/components/track/FeedingLogsHistory'
import { FeedingLogsList } from '@/components/track/FeedingLogsList'
import { TrackLogSection } from '@/components/track/TrackLogSection'
import { TrackPdfDownloadButton } from '@/components/track/TrackPdfDownloadButton'
import { ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useFeedingLogs } from '@/hooks/useFeedingLogs'
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

export function FeedingTrackScreen() {
  const { user, authReady } = useApp()
  const feeding = useFeedingLogs()
  const styles = useThemedStyles(createStyles)

  const alerts = feeding.error ? <ErrorText>{feeding.error}</ErrorText> : undefined

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (!isApiConfigured()) {
    return (
      <TrackLogSection
        kind="feeding"
        todayCount={0}
        onLogClick={feeding.openForm}
        alerts={<ErrorText>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</ErrorText>}
        recent={<Text style={styles.hint}>Configure the API to load and save feeding logs.</Text>}
      />
    )
  }

  if (!user) {
    return (
      <TrackLogSection
        kind="feeding"
        todayCount={0}
        onLogClick={() => {}}
        alerts={
          <Text style={styles.loginPrompt}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track feeding.
          </Text>
        }
        recent={<Text style={styles.hint}>Sign in to view and save feeds.</Text>}
      />
    )
  }

  if (feeding.loading || feeding.babiesLoading) {
    return <PageLoadingScreen label="Loading feeding logs…" />
  }

  return (
    <TrackLogSection
      kind="feeding"
      todayCount={feeding.todayFeeds}
      onLogClick={feeding.openForm}
      logFormOpen={feeding.formOpen}
      alerts={alerts}
      panelToolbar={
        <>
          <BabyChipBar />
          <TrackPdfDownloadButton
            loading={feeding.exportingPdf}
            disabled={!feeding.feedingLogs.length}
            onPress={() => void feeding.downloadFeedingPdf()}
          />
        </>
      }
      insights={<TrackInsights logs={feeding.feedingLogs} kind="feeding" />}
      recent={
        <View>
          <FeedingLogsList
            logs={feeding.feedingLogs}
            onEditLog={feeding.openEditFeeding}
            onDeleteLog={feeding.onDeleteFeeding}
            busyLogId={feeding.busyLogId}
          />
          <FeedingLogsHistory
            logs={feeding.feedingLogs}
            babies={feeding.babies}
            onEditLog={feeding.openEditFeeding}
            onDeleteLog={feeding.onDeleteFeeding}
            busyLogId={feeding.busyLogId}
          />
        </View>
      }
    >
      <FeedingLogModal
        open={feeding.formOpen}
        onClose={feeding.closeForm}
        onSave={() => void feeding.onSaveFeeding()}
        onBackToEntry={feeding.backToEntry}
        saving={feeding.saving}
        babies={feeding.babies}
        formBabyId={feeding.formBabyId}
        setFormBabyId={feeding.setFormBabyId}
        formBabyIds={feeding.formBabyIds}
        onToggleFormBabyId={feeding.toggleFormBabyId}
        showReviewStep={feeding.showReviewStep}
        isMultiCreate={feeding.isMultiCreate}
        reviewDrafts={feeding.reviewDrafts}
        onUpdateReviewDraft={feeding.updateReviewDraft}
        formState={feeding.formState}
        setFormState={feeding.setFormState}
        editingLogId={feeding.editingLogId}
      />
    </TrackLogSection>
  )
}

