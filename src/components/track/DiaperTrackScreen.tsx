import { Link } from 'expo-router'
import { Text } from 'react-native'

import { BabyChipBar } from '@/components/BabyChipBar'
import { TrackInsights } from '@/components/charts/TrackInsights'
import { DiaperLogModal } from '@/components/track/DiaperLogModal'
import { DiaperLogSection } from '@/components/track/DiaperLogSection'
import { DiaperLogsList } from '@/components/track/DiaperLogsList'
import { ErrorText } from '@/components/ui/primitives'
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

  const alerts =
    diaper.error || diaper.loading ? (
      <>
        {diaper.error ? <ErrorText>{diaper.error}</ErrorText> : null}
        {diaper.loading ? <Text style={styles.hint}>Loading diaper logs…</Text> : null}
      </>
    ) : undefined

  if (!authReady) {
    return <Text style={styles.hint}>Loading…</Text>
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

  return (
    <DiaperLogSection
      todayCount={diaper.todayDiapers}
      countLoading={diaper.loading || diaper.babiesLoading}
      onLogClick={diaper.openForm}
      logFormOpen={diaper.formOpen}
      alerts={alerts}
      panelToolbar={<BabyChipBar />}
      insights={<TrackInsights logs={diaper.diaperLogs} kind="diaper" />}
      recent={
        <DiaperLogsList
          logs={diaper.diaperLogs}
          onEditLog={diaper.openEditDiaper}
          onDeleteLog={diaper.onDeleteDiaper}
          busyLogId={diaper.busyLogId}
        />
      }
    >
      <DiaperLogModal
        open={diaper.formOpen}
        onClose={diaper.closeForm}
        onSave={() => void diaper.onSaveDiaper()}
        saving={diaper.saving}
        babies={diaper.babies}
        formBabyId={diaper.formBabyId}
        setFormBabyId={diaper.setFormBabyId}
        diaperPee={diaper.diaperPee}
        setDiaperPee={diaper.setDiaperPee}
        diaperPoop={diaper.diaperPoop}
        setDiaperPoop={diaper.setDiaperPoop}
        diaperAnythingElse={diaper.diaperAnythingElse}
        setDiaperAnythingElse={diaper.setDiaperAnythingElse}
        diaperAnythingElseDesc={diaper.diaperAnythingElseDesc}
        setDiaperAnythingElseDesc={diaper.setDiaperAnythingElseDesc}
        diaperTime={diaper.diaperTime}
        setDiaperTime={diaper.setDiaperTime}
        diaperBrand={diaper.diaperBrand}
        setDiaperBrand={diaper.setDiaperBrand}
        diaperSize={diaper.diaperSize}
        setDiaperSize={diaper.setDiaperSize}
        diaperCream={diaper.diaperCream}
        setDiaperCream={diaper.setDiaperCream}
        diaperTeething={diaper.diaperTeething}
        setDiaperTeething={diaper.setDiaperTeething}
        diaperSick={diaper.diaperSick}
        setDiaperSick={diaper.setDiaperSick}
        editingLogId={diaper.editingLogId}
      />
    </DiaperLogSection>
  )
}

