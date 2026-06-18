import { Link } from 'expo-router'
import { Text } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { TrackInsights } from '@/components/charts/TrackInsights'
import { SleepLogModal } from '@/components/track/SleepLogModal'
import { SleepLogsList } from '@/components/track/SleepLogsList'
import { TrackLogSection } from '@/components/track/TrackLogSection'
import { ErrorText } from '@/components/ui/primitives'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useSleepLogs } from '@/hooks/useSleepLogs'
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

export function SleepTrackScreen() {
  const { user, authReady } = useApp()
  const sleep = useSleepLogs()
  const styles = useThemedStyles(createStyles)

  const alerts =
    sleep.error || sleep.loading ? (
      <>
        {sleep.error ? <ErrorText>{sleep.error}</ErrorText> : null}
        {sleep.loading ? <Text style={styles.hint}>Loading sleep logs…</Text> : null}
      </>
    ) : undefined

  if (!authReady) {
    return <Text style={styles.hint}>Loading…</Text>
  }

  if (!isApiConfigured()) {
    return (
      <TrackLogSection
        kind="sleep"
        todayCount={0}
        onLogClick={sleep.openForm}
        alerts={<ErrorText>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</ErrorText>}
        recent={<Text style={styles.hint}>Configure the API to load and save sleep logs.</Text>}
      />
    )
  }

  if (!user) {
    return (
      <TrackLogSection
        kind="sleep"
        todayCount={0}
        onLogClick={() => {}}
        alerts={
          <Text style={styles.loginPrompt}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track sleep.
          </Text>
        }
        recent={<Text style={styles.hint}>Sign in to view and save sleep sessions.</Text>}
      />
    )
  }

  return (
    <TrackLogSection
      kind="sleep"
      todayCount={sleep.todaySleep}
      countLoading={sleep.loading || sleep.babiesLoading}
      onLogClick={sleep.openForm}
      logFormOpen={sleep.formOpen}
      alerts={alerts}
      panelToolbar={<BabyChipBar />}
      insights={<TrackInsights logs={sleep.sleepLogs} kind="sleep" />}
      recent={
        <SleepLogsList
          logs={sleep.sleepLogs}
          onEditLog={sleep.openEditSleep}
          onDeleteLog={sleep.onDeleteSleep}
          busyLogId={sleep.busyLogId}
        />
      }
    >
      <SleepLogModal
        open={sleep.formOpen}
        onClose={sleep.closeForm}
        onSave={() => void sleep.onSaveSleep()}
        onBackToEntry={sleep.backToEntry}
        saving={sleep.saving}
        babies={sleep.babies}
        formBabyId={sleep.formBabyId}
        setFormBabyId={sleep.setFormBabyId}
        formBabyIds={sleep.formBabyIds}
        onToggleFormBabyId={sleep.toggleFormBabyId}
        showReviewStep={sleep.showReviewStep}
        isMultiCreate={sleep.isMultiCreate}
        reviewDrafts={sleep.reviewDrafts}
        onUpdateReviewDraft={sleep.updateReviewDraft}
        formState={sleep.formState}
        setFormState={sleep.setFormState}
        editingLogId={sleep.editingLogId}
      />
    </TrackLogSection>
  )
}

