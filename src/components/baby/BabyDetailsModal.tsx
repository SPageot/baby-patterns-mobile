import { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { updateBaby } from '@/api/babyApi'
import { isApiConfigured } from '@/api/config'
import { TrackLogModalShell } from '@/components/track/TrackLogModalShell'
import { Button, ErrorText, Input, Label } from '@/components/ui/primitives'
import { getTrackThemeFromPalette } from '@/constants/trackTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import {
  normalizeBabySignup,
  validateBabySignup,
  type Baby,
  type BabySignup,
  type ValidationIssue,
} from '@/schemas/user'
import { formatBabyAge, formatBabyAgeParts } from '@/lib/babyAge'
import type { AppPalette } from '@/constants/homeTheme'

type Props = {
  baby: Baby | null
  open: boolean
  onClose: () => void
  canEdit?: boolean
  startInEditMode?: boolean
  onBabyUpdated?: (baby: Baby) => void
}

function displayText(value: string | null | undefined): string {
  const text = value?.trim()
  return text || '—'
}

function displayNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return String(value)
}

function formatBirthdate(value: string): string {
  const text = value.trim()
  if (!text) return '—'
  const parsed = new Date(`${text}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return text
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function babyToFormValues(baby: Baby): Omit<BabySignup, 'userId'> {
  return {
    fullName: baby.fullName ?? '',
    birthdate: baby.birthdate ?? '',
    age: baby.age ?? null,
    locationBorn: baby.locationBorn ?? '',
    currentLocation: baby.currentLocation ?? '',
    weight: baby.weight ?? null,
    height: baby.height ?? null,
  }
}

const createStyles = (t: AppPalette) => ({
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: t.text,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: Spacing.three,
  },
})

export function BabyDetailsModal({
  baby,
  open,
  onClose,
  canEdit = false,
  startInEditMode = false,
  onBabyUpdated,
}: Props) {
  const palette = useHomeTheme()
  const trackTheme = getTrackThemeFromPalette('diaper', palette)
  const styles = useThemedStyles(createStyles)

  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ValidationIssue[]>([])

  const [fullName, setFullName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [locationBorn, setLocationBorn] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')

  useEffect(() => {
    if (!open || !baby) {
      setEditing(false)
      setError(null)
      setFieldErrors([])
      return
    }

    const values = babyToFormValues(baby)
    setFullName(values.fullName)
    setBirthdate(values.birthdate)
    setLocationBorn(values.locationBorn)
    setCurrentLocation(values.currentLocation)
    setEditing(Boolean(startInEditMode && canEdit))
  }, [open, baby?.id, canEdit, startInEditMode, baby])

  const handleClose = useCallback(() => {
    if (submitting) return
    onClose()
  }, [onClose, submitting])

  const handleSave = useCallback(async () => {
    if (!baby?.id?.trim() || !baby.userId?.trim() || submitting) return

    const raw: Omit<BabySignup, 'userId'> = {
      fullName,
      birthdate,
      age: null,
      locationBorn,
      currentLocation,
      weight: baby.weight ?? null,
      height: baby.height ?? null,
    }

    const data = normalizeBabySignup({ ...raw, userId: baby.userId })
    const issues = validateBabySignup(data)
    if (issues.length) {
      setFieldErrors(issues)
      setError('Please fix the highlighted fields.')
      return
    }
    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    setSubmitting(true)
    setError(null)
    setFieldErrors([])

    try {
      const updated = await updateBaby({ ...data, id: baby.id })
      onBabyUpdated?.(updated)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save baby profile')
    } finally {
      setSubmitting(false)
    }
  }, [
    baby,
    birthdate,
    currentLocation,
    fullName,
    locationBorn,
    onBabyUpdated,
    submitting,
  ])

  const title = editing
    ? `Edit ${baby?.fullName?.trim() || 'baby'}`
    : baby?.fullName?.trim() || 'Baby profile'

  const firstFieldError = fieldErrors[0]?.message

  return (
    <TrackLogModalShell
      open={open}
      onClose={handleClose}
      title={title}
      accentColor={trackTheme.accent}
      accentBorder={trackTheme.accentBorder}
      accentSoft={trackTheme.accentSoft}
    >
      {!baby ? null : editing ? (
        <View>
          {error || firstFieldError ? <ErrorText>{error ?? firstFieldError}</ErrorText> : null}
          <Label>Full name</Label>
          <Input value={fullName} onChangeText={setFullName} editable={!submitting} />
          <Label>Birthdate (YYYY-MM-DD)</Label>
          <Input value={birthdate} onChangeText={setBirthdate} editable={!submitting} />
          <Label>Location born</Label>
          <Input value={locationBorn} onChangeText={setLocationBorn} editable={!submitting} />
          <Label>Current location</Label>
          <Input value={currentLocation} onChangeText={setCurrentLocation} editable={!submitting} />
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              disabled={submitting}
              onPress={() => {
                if (submitting) return
                setEditing(false)
                setError(null)
                setFieldErrors([])
              }}
            />
            <Button
              title={submitting ? 'Saving…' : 'Save changes'}
              loading={submitting}
              onPress={() => void handleSave()}
            />
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.row}>
            <Text style={styles.label}>Full name</Text>
            <Text style={styles.value}>{displayText(baby.fullName)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Birthdate</Text>
            <Text style={styles.value}>{formatBirthdate(baby.birthdate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>
              {baby.birthdate?.trim()
                ? formatBabyAge(baby.birthdate) || '—'
                : baby.age != null && Number.isFinite(baby.age)
                  ? formatBabyAgeParts({ years: baby.age, months: 0 })
                  : '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location born</Text>
            <Text style={styles.value}>{displayText(baby.locationBorn)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Current location</Text>
            <Text style={styles.value}>{displayText(baby.currentLocation)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Weight</Text>
            <Text style={styles.value}>{displayNumber(baby.weight)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Height</Text>
            <Text style={styles.value}>{displayNumber(baby.height)}</Text>
          </View>
          <View style={styles.actions}>
            {canEdit ? (
              <Button title="Edit profile" variant="secondary" onPress={() => setEditing(true)} />
            ) : null}
            <Button title="Close" onPress={handleClose} />
          </View>
        </View>
      )}
    </TrackLogModalShell>
  )
}
