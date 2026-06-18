export const SICKNESS_TYPE_OPTIONS = [
  'Cold',
  'Flu',
  'Ear infection',
  'Stomach bug',
  'RSV',
  'COVID',
  'Other',
] as const

export const SYMPTOM_SUGGESTIONS = [
  'Fever',
  'Cough',
  'Runny nose',
  'Congestion',
  'Vomiting',
  'Diarrhea',
  'Rash',
  'Fussy',
  'Poor sleep',
  'Sore throat',
  'Ear pain',
  'Low appetite',
] as const

export type SicknessEventDto = {
  id: string
  babyId: string
  sicknessType: string
  startedAt: string
  endedAt: string | null
  temperatureF: string | null
  symptoms: string[]
  usedDoctorRecommendations: boolean
  doctorRecommendations: string | null
  usedNaturalRemedies: boolean
  naturalRemedies: string | null
  usedMedication: boolean
  medicationUsed: string | null
  medicationAmount: string | null
  notes: string | null
}

export type SicknessEventWrite = {
  id?: string
  babyId: string
  sicknessType: string
  startedAt: string
  endedAt?: string
  temperatureF?: string
  symptoms: string[]
  usedDoctorRecommendations: boolean
  doctorRecommendations?: string
  usedNaturalRemedies: boolean
  naturalRemedies?: string
  usedMedication: boolean
  medicationUsed?: string
  medicationAmount?: string
  notes?: string
}

export type InjuryEventDto = {
  id: string
  babyId: string
  description: string
  bodyPart: string | null
  hasSwelling: boolean
  occurredAt: string
  endedAt: string | null
  usedDoctorRecommendations: boolean
  doctorRecommendations: string | null
  usedNaturalRemedies: boolean
  naturalRemedies: string | null
  notes: string | null
}

export type InjuryEventWrite = {
  id?: string
  babyId: string
  description: string
  bodyPart?: string
  hasSwelling: boolean
  occurredAt: string
  endedAt?: string
  usedDoctorRecommendations: boolean
  doctorRecommendations?: string
  usedNaturalRemedies: boolean
  naturalRemedies?: string
  notes?: string
}

export type HealthTabId = 'sickness' | 'injuries'

export function formatHealthDuration(startIso: string, endIso: string | null | undefined): string {
  const start = new Date(startIso)
  if (Number.isNaN(start.getTime())) return '—'
  const end = endIso ? new Date(endIso) : new Date()
  if (Number.isNaN(end.getTime())) return 'Ongoing'
  const ms = Math.max(0, end.getTime() - start.getTime())
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`
  const mins = Math.max(1, Math.floor(ms / (1000 * 60)))
  return `${mins} min`
}
