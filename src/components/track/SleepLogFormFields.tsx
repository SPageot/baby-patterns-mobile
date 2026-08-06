import { Pressable, Text, View } from 'react-native'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Label } from '@/components/ui/primitives'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { LogToggleRow } from '@/components/track/LogToggleRow'
import { sleepFieldsToUtc } from '@/api/sleepApi'
import type { SleepLogCreate, SleepWakeUp } from '@/types/babyLog'
import { sleepLogFromDetails } from '@/types/babyLog'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { mapSleepOptions } from '@/i18n/trackLabels'
import {
  HOW_FELL_ASLEEP,
  PRE_SLEEP_ACTIVITIES,
  SLEEP_EXTRA_TAGS,
  SLEEP_QUALITY,
  WAKE_UP_REASONS,
  type SleepOption,
} from '@/lib/sleepLogOptions'
import {
  formatMinutesHuman,
  isoToUtcTimeValue,
  minutesBetweenUtcSleepTimes,
  nowUtcTimeValue,
  sleepTimesToUtcIso,
} from '@/lib/trackUtils'
import { Spacing } from '@/constants/theme'

export type SleepWakeUpForm = {
  time: string
  durationMinutes: string
  reason: string
}

export type SleepFormState = {
  sleepDate: string
  sleepStart: string
  sleepEnd: string
  sleepMood: string
  sleepEnvironment: string
  sleepTeething: boolean
  sleepSick: boolean
  sleepNap: boolean
  quality: string
  howFellAsleep: string
  wakeUps: SleepWakeUpForm[]
  preSleepActivity: string[]
  notes: string
  extraTags: string[]
  isNightSleepFragmented: boolean
}

export function defaultSleepFormState(): SleepFormState {
  return {
    sleepDate: '',
    sleepStart: '',
    sleepEnd: '',
    sleepMood: '',
    sleepEnvironment: '',
    sleepTeething: false,
    sleepSick: false,
    sleepNap: false,
    quality: '',
    howFellAsleep: '',
    wakeUps: [],
    preSleepActivity: [],
    notes: '',
    extraTags: [],
    isNightSleepFragmented: false,
  }
}

function toggleListValue(list: string[], value: string, checked: boolean): string[] {
  if (checked) return list.includes(value) ? list : [...list, value]
  return list.filter((v) => v !== value)
}

function buildTags(state: SleepFormState): string[] | undefined {
  const tags = [...state.extraTags]
  if (state.sleepTeething) tags.push('teething')
  if (state.sleepSick) tags.push('sick')
  const unique = [...new Set(tags)]
  return unique.length ? unique : undefined
}

function wakeUpsToApi(dateYmd: string, rows: SleepWakeUpForm[]): SleepWakeUp[] {
  const result: SleepWakeUp[] = []
  for (const row of rows) {
    const time = row.time.trim()
    if (!time) continue
    const times = sleepTimesToUtcIso(dateYmd, time, time)
    if (!times) continue
    const durationMinutes = Number(row.durationMinutes)
    result.push({
      time: times.startIso,
      durationMinutes: Number.isFinite(durationMinutes) && durationMinutes >= 0 ? Math.round(durationMinutes) : 0,
      reason: row.reason.trim() || undefined,
    })
  }
  return result
}

function wakeUpsFromApi(rows: SleepWakeUp[] | undefined): SleepWakeUpForm[] {
  if (!rows?.length) return []
  return rows.map((row) => ({
    time: isoToUtcTimeValue(row.time),
    durationMinutes: String(row.durationMinutes ?? 0),
    reason: row.reason?.trim() ?? '',
  }))
}

export function sleepFormStateToCreate(state: SleepFormState): SleepLogCreate | null {
  const date = state.sleepDate.trim()
  const start = state.sleepStart.trim()
  if (!date || !start) return null

  const hasEnd = Boolean(state.sleepEnd.trim())
  const times = sleepTimesToUtcIso(date, start, state.sleepEnd)
  if (!times) return null

  const durationMin = hasEnd ? minutesBetweenUtcSleepTimes(date, start, state.sleepEnd) : 0
  if (hasEnd && durationMin == null) return null

  const isNap = state.sleepNap
  const tags = buildTags(state)

  return sleepFieldsToUtc({
    sleepDate: date,
    sleepDuration: String(durationMin ?? 0),
    sleepMood: state.sleepMood.trim(),
    sleepStartTime: times.startIso,
    sleepEndTime: times.endIso,
    sleepEnvironment: state.sleepEnvironment.trim(),
    isTeething: state.sleepTeething,
    isSick: state.sleepSick,
    isNap,
    sleepType: isNap ? 'nap' : 'night',
    quality: state.quality.trim() || undefined,
    howFellAsleep: state.howFellAsleep.trim() || undefined,
    wakeUps: wakeUpsToApi(date, state.wakeUps),
    preSleepActivity: state.preSleepActivity.length ? state.preSleepActivity : undefined,
    notes: state.notes.trim() || undefined,
    tags,
    isNightSleepFragmented: state.isNightSleepFragmented,
  })
}

export function sleepCreateToFormState(fields: SleepLogCreate): SleepFormState {
  const allTags = fields.tags ?? []
  return {
    sleepDate: fields.sleepDate,
    sleepStart: isoToUtcTimeValue(fields.sleepStartTime),
    sleepEnd: fields.sleepEndTime?.trim() ? isoToUtcTimeValue(fields.sleepEndTime) : nowUtcTimeValue(),
    sleepMood: fields.sleepMood?.trim() ?? '',
    sleepEnvironment: fields.sleepEnvironment?.trim() ?? '',
    sleepTeething: Boolean(fields.isTeething) || allTags.includes('teething'),
    sleepSick: Boolean(fields.isSick) || allTags.includes('sick'),
    sleepNap: Boolean(fields.isNap),
    quality: fields.quality?.trim() ?? '',
    howFellAsleep: fields.howFellAsleep?.trim() ?? '',
    wakeUps: wakeUpsFromApi(fields.wakeUps),
    preSleepActivity: fields.preSleepActivity ?? [],
    notes: fields.notes?.trim() ?? '',
    extraTags: allTags.filter((tag) => tag !== 'teething' && tag !== 'sick'),
    isNightSleepFragmented: Boolean(fields.isNightSleepFragmented),
  }
}

export function sleepDetailsToFormState(details: Record<string, string>, atIso: string): SleepFormState {
  return sleepCreateToFormState(sleepLogFromDetails(details, atIso))
}

export function sleepDraftSummary(fields: SleepLogCreate): string {
  const parts: string[] = []
  if (fields.isNap) parts.push('Nap')
  if (fields.sleepMood) parts.push(fields.sleepMood)
  if (fields.quality) parts.push(fields.quality)
  const start = new Date(fields.sleepStartTime)
  if (!Number.isNaN(start.getTime())) {
    parts.push(start.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }))
  }
  if (fields.sleepDuration) {
    const min = Number(fields.sleepDuration)
    if (Number.isFinite(min) && min > 0) parts.push(formatMinutesHuman(min))
  } else if (!fields.sleepEndTime?.trim()) {
    parts.push('In progress')
  }
  return parts.join(' · ') || 'Tap to edit'
}

const createStyles = (t: AppPalette) => ({
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: t.card2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.text,
  },
  durationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.two,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  endLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  clearEndBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  clearEndText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: t.textMuted,
    marginBottom: Spacing.two,
  },
  linkBtn: {
    alignSelf: 'flex-start' as const,
  },
  linkBtnRemove: {
    marginTop: 4,
  },
  linkBtnAdd: {
    marginTop: 8,
    marginBottom: 0,
  },
  wakeSection: {
    flexDirection: 'column' as const,
    gap: 12,
    marginBottom: Spacing.two,
  },
  wakeSectionLabel: {
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  wakeBlock: {
    marginBottom: Spacing.two,
    padding: 12,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
    gap: 8,
  },
})

function OptionChips({
  label,
  options,
  value,
  multi,
  selected,
  onSelect,
  onToggle,
  accent,
  accentSoft,
  accentBorder,
}: {
  label: string
  options: SleepOption[]
  value?: string
  multi?: boolean
  selected?: string[]
  onSelect?: (value: string) => void
  onToggle?: (value: string, checked: boolean) => void
  accent: string
  accentSoft: string
  accentBorder: string
}) {
  const styles = useThemedStyles(createStyles)

  return (
    <>
      <Label>{label}</Label>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = multi
            ? Boolean(selected?.includes(option.value))
            : value === option.value
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                if (multi) {
                  onToggle?.(option.value, !active)
                } else {
                  onSelect?.(active ? '' : option.value)
                }
              }}
              style={[
                styles.chip,
                active && { borderColor: accentBorder, backgroundColor: accentSoft },
              ]}
            >
              <Text style={[styles.chipText, active && { color: accent }]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )
}

type Props = {
  state: SleepFormState
  setState: (patch: Partial<SleepFormState>) => void
  accent: string
  stroke: string
  disabled?: boolean
}

export function SleepLogFormFields({ state, setState, accent, stroke, disabled }: Props) {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const accentSoft = `${accent}22`
  const accentBorder = accent
  const set = (patch: Partial<SleepFormState>) => setState(patch)

  const qualityOptions = useMemo(() => mapSleepOptions(t, 'quality', SLEEP_QUALITY), [t])
  const howOptions = useMemo(() => mapSleepOptions(t, 'how', HOW_FELL_ASLEEP), [t])
  const preSleepOptions = useMemo(() => mapSleepOptions(t, 'preSleep', PRE_SLEEP_ACTIVITIES), [t])
  const tagOptions = useMemo(() => mapSleepOptions(t, 'tags', SLEEP_EXTRA_TAGS), [t])
  const wakeReasonOptions = useMemo(() => mapSleepOptions(t, 'wakeReasons', WAKE_UP_REASONS), [t])

  const durationPreview = useMemo(() => {
    if (!state.sleepEnd.trim()) return state.sleepStart.trim() ? 'In progress' : '—'
    const m = minutesBetweenUtcSleepTimes(state.sleepDate, state.sleepStart, state.sleepEnd)
    return m == null ? '—' : formatMinutesHuman(m)
  }, [state.sleepDate, state.sleepStart, state.sleepEnd])

  const setWakeUp = (index: number, patch: Partial<SleepWakeUpForm>) => {
    const wakeUps = state.wakeUps.map((row, i) => (i === index ? { ...row, ...patch } : row))
    setState({ wakeUps })
  }

  return (
    <>
      <LogToggleRow
        label={t('track.sleepForm.nap')}
        value={state.sleepNap}
        onChange={(v) => set({ sleepNap: v })}
        accent={accent}
        stroke={stroke}
      />

      <DateTimeField
        label={t('track.fields.date')}
        value={state.sleepDate}
        onChange={(v) => set({ sleepDate: v })}
        mode="date"
        zone="utc"
      />

      <DateTimeField
        label={t('track.sleepForm.start')}
        value={state.sleepStart}
        onChange={(v) => set({ sleepStart: v })}
        mode="time"
        zone="utc"
      />

      <View style={styles.endLabelRow}>
        <Label>{t('track.sleepForm.end')}</Label>
        {state.sleepEnd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear sleep end time"
            onPress={() => set({ sleepEnd: '' })}
            disabled={disabled}
            style={styles.clearEndBtn}
          >
            <Text style={[styles.clearEndText, { color: accent }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <DateTimeField
        label={t('track.sleepForm.end')}
        hideLabel
        value={state.sleepEnd}
        onChange={(v) => set({ sleepEnd: v })}
        mode="time"
        zone="utc"
        placeholder="Optional — leave blank if still sleeping"
      />

      <View style={styles.durationRow}>
        <Text style={styles.durationLabel}>Duration</Text>
        <Text style={[styles.durationValue, { color: accent }]}>{durationPreview}</Text>
      </View>

      <Label>{t('track.sleepForm.moodBefore')}</Label>
      <Input
        value={state.sleepMood}
        onChangeText={(v) => set({ sleepMood: v })}
        placeholder="e.g. calm, fussy, restless"
        editable={!disabled}
      />

      <Label>{t('track.sleepForm.environment')}</Label>
      <Input
        value={state.sleepEnvironment}
        onChangeText={(v) => set({ sleepEnvironment: v })}
        placeholder="e.g. crib, stroller, parents' room"
        editable={!disabled}
      />

      <OptionChips
        label={t('track.sleepForm.quality')}
        options={qualityOptions}
        value={state.quality}
        onSelect={(quality) => set({ quality })}
        accent={accent}
        accentSoft={accentSoft}
        accentBorder={accentBorder}
      />

      <OptionChips
        label={t('track.sleepForm.howFellAsleep')}
        options={howOptions}
        value={state.howFellAsleep}
        onSelect={(howFellAsleep) => set({ howFellAsleep })}
        accent={accent}
        accentSoft={accentSoft}
        accentBorder={accentBorder}
      />

      <OptionChips
        label={t('track.sleepForm.preSleep')}
        options={preSleepOptions}
        multi
        selected={state.preSleepActivity}
        onToggle={(value, checked) =>
          set({ preSleepActivity: toggleListValue(state.preSleepActivity, value, checked) })
        }
        accent={accent}
        accentSoft={accentSoft}
        accentBorder={accentBorder}
      />

      <OptionChips
        label={t('track.sleepForm.tags')}
        options={tagOptions}
        multi
        selected={state.extraTags}
        onToggle={(value, checked) =>
          set({ extraTags: toggleListValue(state.extraTags, value, checked) })
        }
        accent={accent}
        accentSoft={accentSoft}
        accentBorder={accentBorder}
      />

      <View style={styles.wakeSection}>
        <View style={styles.wakeSectionLabel}>
          <Label>{t('track.sleepForm.wakeUps')}</Label>
        </View>
        {state.wakeUps.map((row, index) => (
          <View key={`wake-${index}`} style={styles.wakeBlock}>
            <DateTimeField
              label={t('track.fields.time')}
              value={row.time}
              onChange={(time) => setWakeUp(index, { time })}
              mode="time"
              zone="utc"
            />
            <Label>Duration (minutes)</Label>
            <Input
              value={row.durationMinutes}
              onChangeText={(durationMinutes) => setWakeUp(index, { durationMinutes })}
              keyboardType="number-pad"
              editable={!disabled}
            />
            <OptionChips
              label="Reason"
              options={wakeReasonOptions}
              value={row.reason}
              onSelect={(reason) => setWakeUp(index, { reason })}
              accent={accent}
              accentSoft={accentSoft}
              accentBorder={accentBorder}
            />
            <Pressable
              onPress={() => setState({ wakeUps: state.wakeUps.filter((_, i) => i !== index) })}
              style={[styles.linkBtn, styles.linkBtnRemove]}
            >
              <Text style={[styles.linkText, { color: accent }]}>Remove</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() =>
            setState({ wakeUps: [...state.wakeUps, { time: '', durationMinutes: '', reason: '' }] })
          }
          style={[styles.linkBtn, styles.linkBtnAdd]}
        >
          <Text style={[styles.linkText, { color: accent }]}>{t('track.behaviorForm.add')}</Text>
        </Pressable>
      </View>

      <Label>{t('track.fields.notes')}</Label>
      <Input
        value={state.notes}
        onChangeText={(notes) => set({ notes })}
        placeholder="Anything else to remember"
        editable={!disabled}
      />

      <LogToggleRow
        label={t('track.sleepForm.fragmented')}
        value={state.isNightSleepFragmented}
        onChange={(isNightSleepFragmented) => set({ isNightSleepFragmented })}
        accent={accent}
        stroke={stroke}
      />

      <LogToggleRow
        label={t('track.fields.teething')}
        value={state.sleepTeething}
        onChange={(v) => set({ sleepTeething: v })}
        accent={accent}
        stroke={stroke}
      />
      <LogToggleRow
        label={t('track.fields.sick')}
        value={state.sleepSick}
        onChange={(v) => set({ sleepSick: v })}
        accent={accent}
        stroke={stroke}
      />

      <Text style={styles.hint}>
        Enter the sleep date and start time in UTC. End time is optional — leave blank for sleep in progress. If end is earlier than start, it counts as the next day.
      </Text>
    </>
  )
}

export function SleepBabyPicker({
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
      <View style={styles.chipRow}>
        {babies.map((baby) => {
          const active = baby.id === formBabyId
          return (
            <Pressable
              key={baby.id}
              onPress={() => setFormBabyId(baby.id)}
              style={[
                styles.chip,
                active && { borderColor: accentBorder, backgroundColor: accentSoft },
              ]}
            >
              <Text style={styles.chipText}>{baby.fullName?.trim() || 'Baby'}</Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )
}
