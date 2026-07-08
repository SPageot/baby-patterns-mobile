import { useState } from 'react'
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
import { SICKNESS_TYPE_OPTIONS, SYMPTOM_SUGGESTIONS } from '@/types/health'
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
  chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: t.text },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginVertical: 8,
  },
  actions: { flexDirection: 'row' as const, gap: 10, marginTop: Spacing.three },
  actionBtn: { flex: 1 },
})

export function SicknessLogModal({ health }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('feeding', palette)
  const styles = useThemedStyles(createStyles)
  const [symptomDraft, setSymptomDraft] = useState('')
  const isEdit = Boolean(health.editingSicknessId)

  const addSymptom = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    if (health.symptoms.some((s) => s.toLowerCase() === value.toLowerCase())) return
    health.setSymptoms([...health.symptoms, value])
    setSymptomDraft('')
  }

  return (
    <TrackLogModalShell
      open={health.sicknessFormOpen}
      onClose={() => health.setSicknessFormOpen(false)}
      title={isEdit ? 'Edit sickness log' : 'Log sickness'}
      accentColor={theme.accent}
      accentBorder={theme.accentBorder}
      accentSoft={theme.accentSoft}
    >
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

      <Label>Type of sickness</Label>
      <View style={styles.chipRow}>
        {SICKNESS_TYPE_OPTIONS.map((opt) => {
          const active = health.sicknessType === opt
          return (
            <Pressable
              key={opt}
              onPress={() => health.setSicknessType(opt)}
              style={[styles.chip, active && { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft }]}
            >
              <Text style={[styles.chipText, active && { color: theme.accent }]}>{opt}</Text>
            </Pressable>
          )
        })}
      </View>

      {health.sicknessType === 'Other' ? (
        <>
          <Label>Describe sickness</Label>
          <Input value={health.sicknessCustomType} onChangeText={health.setSicknessCustomType} />
        </>
      ) : null}

      <DateTimeField label="Started" value={health.startedAt} onChange={health.setStartedAt} />
      <DateTimeField label="Ended (optional)" value={health.endedAt} onChange={health.setEndedAt} />

      <Label>Temperature °F (optional)</Label>
      <Input
        value={health.temperatureF}
        onChangeText={health.setTemperatureF}
        keyboardType="decimal-pad"
        placeholder="e.g. 100.4"
      />

      <Label>Symptoms</Label>
      <View style={styles.chipRow}>
        {health.symptoms.map((tag) => (
          <Pressable key={tag} onPress={() => health.setSymptoms(health.symptoms.filter((s) => s !== tag))}>
            <Text style={[styles.chipText, { color: theme.accent }]}>{tag} ×</Text>
          </Pressable>
        ))}
      </View>
      <Input
        value={symptomDraft}
        onChangeText={setSymptomDraft}
        placeholder="Add symptom"
        onSubmitEditing={() => addSymptom(symptomDraft)}
      />
      <View style={styles.chipRow}>
        {SYMPTOM_SUGGESTIONS.filter(
          (s) => !health.symptoms.some((t) => t.toLowerCase() === s.toLowerCase()),
        ).slice(0, 6).map((s) => (
          <Pressable key={s} onPress={() => addSymptom(s)} style={styles.chip}>
            <Text style={styles.chipText}>+ {s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text>Doctor recommendations</Text>
        <Switch value={health.usedDoctor} onValueChange={health.setUsedDoctor} />
      </View>
      {health.usedDoctor ? (
        <Input
          value={health.doctorRecommendations}
          onChangeText={health.setDoctorRecommendations}
          placeholder="What did the doctor recommend?"
        />
      ) : null}

      <View style={styles.switchRow}>
        <Text>Natural remedies</Text>
        <Switch value={health.usedNatural} onValueChange={health.setUsedNatural} />
      </View>
      {health.usedNatural ? (
        <Input
          value={health.naturalRemedies}
          onChangeText={health.setNaturalRemedies}
          placeholder="Natural remedies used"
        />
      ) : null}

      <View style={styles.switchRow}>
        <Text>Medication</Text>
        <Switch value={health.usedMedication} onValueChange={health.setUsedMedication} />
      </View>
      {health.usedMedication ? (
        <>
          <Label>Medication used</Label>
          <Input value={health.medicationUsed} onChangeText={health.setMedicationUsed} />
          <Label>How much</Label>
          <Input value={health.medicationAmount} onChangeText={health.setMedicationAmount} placeholder="e.g. 2.5 ml" />
        </>
      ) : null}

      <Label>Notes (optional)</Label>
      <Input value={health.sicknessNotes} onChangeText={health.setSicknessNotes} />

      <HealthDisclaimer compact />

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={() => health.setSicknessFormOpen(false)}
          disabled={health.saving}
          style={styles.actionBtn}
        />
        <Button
          title={health.saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
          loading={health.saving}
          onPress={() => void health.onSaveSickness()}
          style={styles.actionBtn}
        />
      </View>
    </TrackLogModalShell>
  )
}
