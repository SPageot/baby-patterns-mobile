import { Link } from 'expo-router'
import { Text, View } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { BehaviorLogModal } from '@/components/track/BehaviorLogModal'
import { BehaviorLogSection } from '@/components/track/BehaviorLogSection'
import { BehaviorLogsHistory } from '@/components/track/BehaviorLogsHistory'
import { BehaviorLogsList } from '@/components/track/BehaviorLogsList'
import { ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useBehaviorLogs } from '@/hooks/useBehaviorLogs'
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

export function BehaviorTrackScreen() {
  const { user, authReady } = useApp()
  const behavior = useBehaviorLogs()
  const styles = useThemedStyles(createStyles)

  const alerts = behavior.error ? <ErrorText>{behavior.error}</ErrorText> : undefined

  if (!authReady) {
    return <PageLoadingScreen label="Loading…" />
  }

  if (!isApiConfigured()) {
    return (
      <BehaviorLogSection
        todayCount={0}
        onLogClick={behavior.openForm}
        alerts={<ErrorText>Set EXPO_PUBLIC_API_URL in .env to connect to the API.</ErrorText>}
        recent={<Text style={styles.hint}>Configure the API to load and save behavior logs.</Text>}
      />
    )
  }

  if (!user) {
    return (
      <BehaviorLogSection
        todayCount={0}
        onLogClick={() => {}}
        alerts={
          <Text style={styles.loginPrompt}>
            <Link href="/login" style={styles.loginLink}>
              Log in
            </Link>{' '}
            to track behaviors.
          </Text>
        }
        recent={<Text style={styles.hint}>Sign in to view and save behavior logs.</Text>}
      />
    )
  }

  if (behavior.loading || behavior.babiesLoading) {
    return <PageLoadingScreen label="Loading behavior logs…" />
  }

  return (
    <BehaviorLogSection
      todayCount={behavior.todayBehavior}
      onLogClick={behavior.openForm}
      logFormOpen={behavior.formOpen}
      alerts={alerts}
      panelToolbar={<BabyChipBar />}
      recent={
        <View>
          <BehaviorLogsList
            logs={behavior.behaviorLogs}
            onEditLog={behavior.openEditBehavior}
            onDeleteLog={behavior.onDeleteBehavior}
            busyLogId={behavior.busyLogId}
          />
          <BehaviorLogsHistory
            logs={behavior.behaviorLogs}
            babies={behavior.babies}
            onEditLog={behavior.openEditBehavior}
            onDeleteLog={behavior.onDeleteBehavior}
            busyLogId={behavior.busyLogId}
          />
        </View>
      }
    >
      <BehaviorLogModal
        open={behavior.formOpen}
        onClose={behavior.closeForm}
        onSave={() => void behavior.onSaveBehavior()}
        onBackToEntry={behavior.backToEntry}
        saving={behavior.saving}
        babies={behavior.babies}
        formBabyId={behavior.formBabyId}
        setFormBabyId={behavior.setFormBabyId}
        formBabyIds={behavior.formBabyIds}
        onToggleFormBabyId={behavior.toggleFormBabyId}
        showReviewStep={behavior.showReviewStep}
        isMultiCreate={behavior.isMultiCreate}
        reviewDrafts={behavior.reviewDrafts}
        onUpdateReviewDraft={behavior.updateReviewDraft}
        formState={behavior.formState}
        setFormState={behavior.setFormState}
        editingLogId={behavior.editingLogId}
      />
    </BehaviorLogSection>
  )
}
