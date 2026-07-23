/** Keep mobile and web copies of this file identical (npm run verify:consultants in mobile). */
export const CONSULTANT_TYPES = ['sleep consultant'] as const

export type ConsultantType = (typeof CONSULTANT_TYPES)[number]

export type Consultant = {
  id: string
  name: string
  type: ConsultantType
  /** Filename key — web serves /public/consultants/{key}.png; mobile maps in consultantImages.ts */
  imageKey?: string
  email: string
  instagram: string
  website: string
}

export const CONSULTANTS_DISCLAIMER =
  'Listings are for informational purposes only. Baby Pattern does not endorse, employ, or vet consultants. Any services you arrange are solely between you and the consultant. Consultant advice is not medical advice from Baby Pattern — consult your pediatrician about your child\'s health.'

/** Add or edit entries here to list consultants on /consultants */
export const CONSULTANTS: Consultant[] = [
  {
    id: 'catherine-nutureowlsleep',
    name: 'Catherine',
    type: 'sleep consultant',
    imageKey: 'nurture-owl-sleep',
    email: 'Catherine@nutureowlsleep.com',
    instagram: 'https://www.instagram.com/nurtureowlsleep/',
    website: 'https://www.nurtureowlsleep.com/',
  },
]
