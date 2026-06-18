import { Link } from 'expo-router'
import { Text } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { TrackInsights } from '@/components/charts/TrackInsights'
import { FeedingLogModal } from '@/components/track/FeedingLogModal'
import { FeedingLogsList } from '@/components/track/FeedingLogsList'
import { TrackLogSection } from '@/components/track/TrackLogSection'
import { ErrorText } from '@/components/ui/primitives'
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

  const alerts =
    feeding.error || feeding.loading ? (
      <>
        {feeding.error ? <ErrorText>{feeding.error}</ErrorText> : null}
        {feeding.loading ? <Text style={styles.hint}>Loading feeding logs…</Text> : null}
      </>
    ) : undefined

  if (!authReady) {
    return <Text style={styles.hint}>Loading…</Text>
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

  return (
    <TrackLogSection
      kind="feeding"
      todayCount={feeding.todayFeeds}
      countLoading={feeding.loading || feeding.babiesLoading}
      onLogClick={feeding.openForm}
      logFormOpen={feeding.formOpen}
      alerts={alerts}
      panelToolbar={<BabyChipBar />}
      insights={<TrackInsights logs={feeding.feedingLogs} kind="feeding" />}
      recent={
        <FeedingLogsList
          logs={feeding.feedingLogs}
          onEditLog={feeding.openEditFeeding}
          onDeleteLog={feeding.onDeleteFeeding}
          busyLogId={feeding.busyLogId}
        />
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

