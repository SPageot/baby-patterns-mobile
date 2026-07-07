import { Pressable, Switch, Text, View } from 'react-native'

import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { HealthDisclaimer } from '@/components/health/HealthDisclaimer'
import { Button, Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import type { useHealthEventsPage } from '@/hooks/useHealthEventsPage'

type Props = {
  health: ReturnType<typeof useHealthEventsPage>
}

const createStyles = (t: AppPalette) => ({
  babyRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: Spacing.two },
  babyChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  babyChipText: { fontSize: 13, fontWeight: '600' as const, color: t.text },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginVertical: 8,
  },
  actions: { flexDirection: 'row' as const, gap: 10, marginTop: Spacing.three },
  actionBtn: { flex: 1 },
})

export function InjuryLogModal({ health }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('sleep', palette)
  const styles = useThemedStyles(createStyles)
  const isEdit = Boolean(health.editingInjuryId)

  return (
    <TrackLogModalShell
      open={health.injuryFormOpen}
      onClose={() => health.setInjuryFormOpen(false)}
      title={isEdit ? 'Edit injury' : 'Log injury'}
      accentColor={theme.accent}
      accentBorder={theme.accentBorder}
      accentSoft={theme.accentSoft}
    >
      <HealthDisclaimer compact />
      {health.babies.length > 1 ? (
        <>
          <Label>Baby</Label>
          <View style={styles.babyRow}>
            {health.babies.map((baby) => {
              const active = baby.id === health.formBabyId
              return (
                <Pressable
                  key={baby.id}
                  onPress={() => health.setFormBabyId(baby.id)}
                  style={[
                    styles.babyChip,
                    active && { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Text style={[styles.babyChipText, active && { color: theme.accent }]}>
                    {baby.fullName?.trim() || 'Baby'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      <Label>What happened?</Label>
      <Input
        value={health.injuryDescription}
        onChangeText={health.setInjuryDescription}
        placeholder="e.g. Scratched knee"
      />

      <Label>Body area (optional)</Label>
      <Input value={health.bodyPart} onChangeText={health.setBodyPart} placeholder="e.g. Left knee" />

      <View style={styles.switchRow}>
        <Text>Swelling present</Text>
        <Switch value={health.hasSwelling} onValueChange={health.setHasSwelling} />
      </View>

      <DateTimeField label="When it happened" value={health.occurredAt} onChange={health.setOccurredAt} />
      <DateTimeField label="Resolved (optional)" value={health.injuryEndedAt} onChange={health.setInjuryEndedAt} />

      <View style={styles.switchRow}>
        <Text>Doctor recommendations</Text>
        <Switch value={health.injuryUsedDoctor} onValueChange={health.setInjuryUsedDoctor} />
      </View>
      {health.injuryUsedDoctor ? (
        <Input
          value={health.injuryDoctorRecommendations}
          onChangeText={health.setInjuryDoctorRecommendations}
          placeholder="Doctor advice"
        />
      ) : null}

      <View style={styles.switchRow}>
        <Text>Natural remedies</Text>
        <Switch value={health.injuryUsedNatural} onValueChange={health.setInjuryUsedNatural} />
      </View>
      {health.injuryUsedNatural ? (
        <Input
          value={health.injuryNaturalRemedies}
          onChangeText={health.setInjuryNaturalRemedies}
          placeholder="Natural remedies used"
        />
      ) : null}

      <Label>Notes (optional)</Label>
      <Input value={health.injuryNotes} onChangeText={health.setInjuryNotes} />

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={() => health.setInjuryFormOpen(false)}
          disabled={health.saving}
          style={styles.actionBtn}
        />
        <Button
          title={health.saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
          loading={health.saving}
          onPress={() => void health.onSaveInjury()}
          style={styles.actionBtn}
        />
      </View>
    </TrackLogModalShell>
  )
}
