import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import type { BehaviorLogCreate } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import { tBehaviorTag } from '@/i18n/trackLabels'
import {
  BEHAVIOR_TAG_PRESETS,
  DEFAULT_BEHAVIOR_TAG,
  addCustomBehaviorTag,
  customTagsFromSelection,
  formatBehaviorTags,
  parseBehaviorTags,
  todayLocalYmd,
  toggleBehaviorTag,
} from '@/lib/behaviorLogUtils'

export type BehaviorFormState = {
  behaviorTags: string[]
  customTags: string[]
  occurredOn: string
  occurredTime: string
  location: string
  notes: string
  resolution: string
}

export function behaviorFormStateToCreate(state: BehaviorFormState): BehaviorLogCreate {
  return {
    behaviorTag: formatBehaviorTags(state.behaviorTags),
    occurredOn: state.occurredOn.trim(),
    occurredTime: state.occurredTime.trim() || null,
    location: state.location.trim(),
    notes: state.notes.trim() || null,
    resolution: state.resolution.trim() || null,
  }
}

export function behaviorCreateToFormState(fields: BehaviorLogCreate): BehaviorFormState {
  const tags = parseBehaviorTags(fields.behaviorTag)
  const selected = tags.length ? tags : [DEFAULT_BEHAVIOR_TAG]
  return {
    behaviorTags: selected,
    customTags: customTagsFromSelection(selected),
    occurredOn: fields.occurredOn || todayLocalYmd(),
    occurredTime: fields.occurredTime?.trim() || '',
    location: fields.location || '',
    notes: fields.notes || '',
    resolution: fields.resolution || '',
  }
}

export function behaviorDraftSummary(fields: BehaviorLogCreate): string {
  const parts: string[] = []
  const tags = parseBehaviorTags(fields.behaviorTag)
  if (tags.length) parts.push(tags.join(', '))
  if (fields.location) parts.push(fields.location)
  if (fields.occurredOn) {
    parts.push(
      fields.occurredTime?.trim()
        ? `${fields.occurredOn} ${fields.occurredTime}`
        : fields.occurredOn,
    )
  }
  return parts.join(' · ') || 'Tap to add details'
}

const createStyles = (t: AppPalette) => ({
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  chip: {
    borderWidth: 0,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
  customRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: Spacing.three,
  },
  customInput: {
    flex: 1,
  },
  addBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  addText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  addTextDisabled: {
    opacity: 0.45,
  },
  error: {
    color: '#b42318',
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  babyRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  babyChip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  babyChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.text,
  },
})

type Props = {
  state: BehaviorFormState
  setState: (patch: Partial<BehaviorFormState>) => void
  accent: string
  accentBorder: string
  accentSoft: string
  disabled?: boolean
}

export function BehaviorLogFormFields({
  state,
  setState,
  accent,
  accentSoft,
  disabled,
}: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const set = (patch: Partial<BehaviorFormState>) => setState(patch)
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)

  const visibleTags = [...BEHAVIOR_TAG_PRESETS, ...state.customTags]

  const addCustom = () => {
    const result = addCustomBehaviorTag(state.behaviorTags, state.customTags, draft)
    if (result.error) {
      setDraftError(result.error)
      return
    }
    set({ behaviorTags: result.selected, customTags: result.customOptions })
    setDraft('')
    setDraftError(null)
  }

  return (
    <>
      <Label>{t('track.behaviorForm.label')}</Label>
      <View style={styles.chipRow}>
        {visibleTags.map((tag) => {
          const active = state.behaviorTags.includes(tag)
          return (
            <Pressable
              key={tag}
              disabled={disabled}
              onPress={() => set({ behaviorTags: toggleBehaviorTag(state.behaviorTags, tag) })}
              style={[styles.chip, active && { backgroundColor: accentSoft }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && { color: accent }]}>
                {tBehaviorTag(t, tag)}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.customRow}>
        <Input
          style={styles.customInput}
          value={draft}
          onChangeText={(v) => {
            setDraft(v)
            if (draftError) setDraftError(null)
          }}
          placeholder={t('track.behaviorForm.customTag')}
          editable={!disabled}
          maxLength={40}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          accessibilityLabel={t('track.behaviorForm.customTagAria')}
        />
        <Pressable
          onPress={addCustom}
          disabled={disabled || !draft.trim()}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel={t('track.behaviorForm.add')}
        >
          <Text style={[styles.addText, (!draft.trim() || disabled) && styles.addTextDisabled]}>
            {t('track.behaviorForm.add')}
          </Text>
        </Pressable>
      </View>
      {draftError ? <Text style={styles.error}>{draftError}</Text> : null}

      <DateTimeField
        label={t('track.fields.date')}
        mode="date"
        value={state.occurredOn}
        onChange={(v) => set({ occurredOn: v })}
      />

      <DateTimeField
        label={t('track.fields.timeOptional')}
        mode="time"
        value={state.occurredTime}
        onChange={(v) => set({ occurredTime: v })}
        placeholder={t('track.fields.timeOptional')}
      />

      <Label>{t('track.fields.location')}</Label>
      <Input
        value={state.location}
        onChangeText={(v) => set({ location: v })}
        placeholder={t('track.behaviorForm.locationPlaceholder')}
        editable={!disabled}
        maxLength={120}
      />

      <Label>{t('track.behaviorForm.resolution')}</Label>
      <Input
        value={state.resolution}
        onChangeText={(v) => set({ resolution: v })}
        placeholder={t('track.behaviorForm.resolutionPlaceholder')}
        editable={!disabled}
        multiline
      />

      <Label>{t('track.fields.notesOptional')}</Label>
      <Input
        value={state.notes}
        onChangeText={(v) => set({ notes: v })}
        placeholder={t('track.behaviorForm.notesPlaceholder')}
        editable={!disabled}
        multiline
      />
    </>
  )
}

export function BehaviorBabyPicker({
  babies,
  formBabyId,
  setFormBabyId,
  accentBorder,
  accentSoft,
}: {
  babies: { id: string; fullName?: string | null }[]
  formBabyId: string
  setFormBabyId: (id: string) => void
  accentBorder: string
  accentSoft: string
}) {
  const styles = useThemedStyles(createStyles)

  return (
    <>
      <Label>Baby</Label>
      <View style={styles.babyRow}>
        {babies.map((baby) => {
          const active = baby.id === formBabyId
          return (
            <Pressable
              key={baby.id}
              onPress={() => setFormBabyId(baby.id)}
              style={[
                styles.babyChip,
                active && { borderColor: accentBorder, backgroundColor: accentSoft },
              ]}
            >
              <Text style={styles.babyChipText}>{baby.fullName?.trim() || 'Baby'}</Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )
}
