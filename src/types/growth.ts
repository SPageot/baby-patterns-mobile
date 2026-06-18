export type TrackingMediaType = 'image' | 'video'

export type MilestoneCategory = 'motor' | 'social' | 'language' | 'cognitive' | 'other'

export type GrowthMeasurementDto = {
  id: string
  babyId: string
  recordedAt: string
  weightLbs?: string | number | null
  heightInches?: string | number | null
  headCircumferenceInches?: string | number | null
  notes?: string | null
  mediaUrl?: string | null
  mediaType?: TrackingMediaType | null
}

export type GrowthMeasurementWrite = {
  babyId: string
  id?: string
  recordedAt: string
  weightLbs?: string
  heightInches?: string
  headCircumferenceInches?: string
  notes?: string
}

export type MilestoneDto = {
  id: string
  babyId: string
  title: string
  category: MilestoneCategory
  achievedAt: string
  notes?: string | null
  mediaUrl?: string | null
  mediaType?: TrackingMediaType | null
}

export type MilestoneWrite = {
  babyId: string
  id?: string
  title: string
  category: MilestoneCategory
  achievedAt: string
  notes?: string
}

export const MILESTONE_CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  motor: 'Motor',
  social: 'Social',
  language: 'Language',
  cognitive: 'Cognitive',
  other: 'Other',
}
