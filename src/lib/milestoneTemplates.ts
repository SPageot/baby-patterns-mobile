import type { MilestoneCategory } from '@/types/growth'

export type MilestoneTemplate = {
  title: string
  category: MilestoneCategory
  typicalAgeMonths?: string
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  { title: 'Lifts head during tummy time', category: 'motor', typicalAgeMonths: '1–2' },
  { title: 'Smiles socially', category: 'social', typicalAgeMonths: '1–2' },
  { title: 'Coos and makes vowel sounds', category: 'language', typicalAgeMonths: '2–3' },
  { title: 'Follows objects with eyes', category: 'cognitive', typicalAgeMonths: '2–3' },
  { title: 'Holds head steady', category: 'motor', typicalAgeMonths: '3–4' },
  { title: 'Laughs out loud', category: 'social', typicalAgeMonths: '3–4' },
  { title: 'Reaches for toys', category: 'motor', typicalAgeMonths: '4–5' },
  { title: 'Rolls tummy to back', category: 'motor', typicalAgeMonths: '4–6' },
  { title: 'Babbles consonant sounds', category: 'language', typicalAgeMonths: '5–6' },
  { title: 'Sits without support', category: 'motor', typicalAgeMonths: '6–8' },
  { title: 'Responds to own name', category: 'social', typicalAgeMonths: '6–9' },
  { title: 'Plays peek-a-boo', category: 'social', typicalAgeMonths: '6–9' },
  { title: 'Says “mama” or “dada”', category: 'language', typicalAgeMonths: '8–10' },
  { title: 'Pulls to stand', category: 'motor', typicalAgeMonths: '9–11' },
  { title: 'Waves bye-bye', category: 'social', typicalAgeMonths: '9–12' },
  { title: 'Cruises along furniture', category: 'motor', typicalAgeMonths: '10–12' },
  { title: 'First steps', category: 'motor', typicalAgeMonths: '12–15' },
  { title: 'Says first word with meaning', category: 'language', typicalAgeMonths: '12–15' },
  { title: 'Points to show interest', category: 'cognitive', typicalAgeMonths: '12–15' },
  { title: 'Uses spoon or cup with help', category: 'motor', typicalAgeMonths: '15–18' },
]
