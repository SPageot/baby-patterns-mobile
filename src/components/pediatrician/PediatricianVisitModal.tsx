import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

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
import { IMMUNIZATION_SUGGESTIONS } from '@/types/pediatrician'
import type { usePediatricianVisitsPage } from '@/hooks/usePediatricianVisitsPage'

type Props = {
  page: ReturnType<typeof usePediatricianVisitsPage>
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
  actions: { flexDirection: 'row' as const, gap: 10, marginTop: Spacing.three },
  actionBtn: { flex: 1 },
})

export function PediatricianVisitModal({ page }: Props) {
  const palette = useHomeTheme()
  const theme = getTrackThemeFromPalette('feeding', palette)
  const styles = useThemedStyles(createStyles)
  const [immunizationDraft, setImmunizationDraft] = useState('')
  const isEdit = Boolean(page.editingId)

  const addImmunization = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    if (page.immunizations.some((s) => s.toLowerCase() === value.toLowerCase())) return
    page.setImmunizations([...page.immunizations, value])
    setImmunizationDraft('')
  }

  return (
    <TrackLogModalShell
      open={page.formOpen}
      onClose={() => page.setFormOpen(false)}
      title={isEdit ? 'Edit pediatrician visit' : 'Log pediatrician visit'}
      accentColor={theme.accent}
      accentBorder={theme.accentBorder}
      accentSoft={theme.accentSoft}
    >
      {page.babies.length > 1 ? (
        <>
          <Label>Baby</Label>
          <View style={styles.babyRow}>
            {page.babies.map((baby) => {
              const active = baby.id === page.formBabyId
              return (
                <Pressable
                  key={baby.id}
                  onPress={() => page.setFormBabyId(baby.id)}
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

      <DateTimeField label="Visit date & time" value={page.visitedAt} onChange={page.setVisitedAt} />

      <Label>Pediatrician name</Label>
      <Input
        value={page.pediatricianName}
        onChangeText={page.setPediatricianName}
        placeholder="Dr. Smith"
        autoCapitalize="words"
      />

      <Label>Hospital or clinic (optional)</Label>
      <Input
        value={page.hospital}
        onChangeText={page.setHospital}
        placeholder="Children's Hospital"
        autoCapitalize="words"
      />

      <Label>Recommendations (optional)</Label>
      <Input
        value={page.recommendations}
        onChangeText={page.setRecommendations}
        placeholder="Follow-up in 2 weeks, etc."
        multiline
      />

      <Label>Immunizations given</Label>
      <View style={styles.chipRow}>
        {page.immunizations.map((tag) => (
          <Pressable key={tag} onPress={() => page.setImmunizations(page.immunizations.filter((t) => t !== tag))}>
            <Text style={[styles.chipText, { color: theme.accent }]}>{tag} ×</Text>
          </Pressable>
        ))}
      </View>
      <Input
        value={immunizationDraft}
        onChangeText={setImmunizationDraft}
        placeholder="Add immunization"
        onSubmitEditing={() => addImmunization(immunizationDraft)}
      />
      <View style={styles.chipRow}>
        {IMMUNIZATION_SUGGESTIONS.filter(
          (s) => !page.immunizations.some((t) => t.toLowerCase() === s.toLowerCase()),
        )
          .slice(0, 6)
          .map((suggestion) => (
            <Pressable key={suggestion} onPress={() => addImmunization(suggestion)} style={styles.chip}>
              <Text style={styles.chipText}>+ {suggestion}</Text>
            </Pressable>
          ))}
      </View>

      <Label>Notes (optional)</Label>
      <Input value={page.notes} onChangeText={page.setNotes} placeholder="Optional notes" />

      <HealthDisclaimer compact />

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={() => page.setFormOpen(false)}
          disabled={page.saving}
          style={styles.actionBtn}
        />
        <Button
          title={page.saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
          loading={page.saving}
          onPress={() => void page.onSave()}
          style={styles.actionBtn}
        />
      </View>
    </TrackLogModalShell>
  )
}
