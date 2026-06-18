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
        saving={sleep.saving}
        babies={sleep.babies}
        formBabyId={sleep.formBabyId}
        setFormBabyId={sleep.setFormBabyId}
        sleepDate={sleep.sleepDate}
        setSleepDate={sleep.setSleepDate}
        sleepStart={sleep.sleepStart}
        setSleepStart={sleep.setSleepStart}
        sleepEnd={sleep.sleepEnd}
        setSleepEnd={sleep.setSleepEnd}
        sleepMood={sleep.sleepMood}
        setSleepMood={sleep.setSleepMood}
        sleepEnvironment={sleep.sleepEnvironment}
        setSleepEnvironment={sleep.setSleepEnvironment}
        sleepTeething={sleep.sleepTeething}
        setSleepTeething={sleep.setSleepTeething}
        sleepSick={sleep.sleepSick}
        setSleepSick={sleep.setSleepSick}
        sleepNap={sleep.sleepNap}
        setSleepNap={sleep.setSleepNap}
        sleepDurationPreview={sleep.sleepDurationPreview}
        editingLogId={sleep.editingLogId}
      />
    </TrackLogSection>
  )
}

