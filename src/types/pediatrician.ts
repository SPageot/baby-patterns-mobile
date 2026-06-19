export type PediatricianVisitDto = {
  id: string
  babyId: string
  visitedAt: string
  hospital: string | null
  pediatricianName: string
  recommendations: string | null
  immunizations: string[]
  notes: string | null
}

export type PediatricianVisitWrite = {
  id?: string
  babyId: string
  visitedAt: string
  hospital?: string
  pediatricianName: string
  recommendations?: string
  immunizations: string[]
  notes?: string
}

export const IMMUNIZATION_SUGGESTIONS = [
  'DTaP',
  'IPV',
  'Hib',
  'PCV',
  'RV',
  'HepB',
  'Flu',
  'MMR',
  'Varicella',
  'HepA',
  'COVID-19',
] as const

export const FREE_PEDIATRICIAN_HISTORY_MESSAGE =
  'Free includes pediatrician visit logging with 7 days of history. Upgrade to Pro for unlimited history, family alerts, and PDF export.'
