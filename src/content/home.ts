export const HOME_HERO = {
  badge: 'Baby care tracking for modern parents',
  sub: 'Log diapers, sleep, feeding, growth, milestones, and health in one place. Spot patterns with reports, connect in Parents Corner, and share with family when you need more.',
} as const

export const homeHighlights = [
  { emoji: '💧', title: 'Diapers', body: 'Wet, dirty, and mixed changes with brand, size, and notes.' },
  { emoji: '🌙', title: 'Sleep', body: 'Naps and night sleep with duration, mood, and environment.' },
  { emoji: '🍼', title: 'Feeding', body: 'Breast, bottle, solids, and snacks with times and amounts.' },
  { emoji: '📏', title: 'Growth & milestones', body: 'Measurements and firsts, with optional photos.' },
  { emoji: '🩺', title: 'Health', body: 'Sickness and injuries — symptoms, temperature, and care.' },
  { emoji: '📊', title: 'Reports', body: 'Trends and insights across all your tracking data.' },
] as const

export const homeAbout = {
  title: 'What is Baby Pattern?',
  paragraphs: [
    'Baby Pattern is a web and mobile app for logging everyday baby care and spotting patterns over time. Create a free account, add your baby, and start tracking in seconds.',
    'Everything you log stays tied to your babies. Reports turn raw entries into trends you can use at home or share with a pediatrician.',
  ],
  bullets: [
    'Works in the browser and on mobile',
    'Multiple babies per account',
    'Private tracking data — community features are separate',
    'Free tier covers daily logging; Pro adds history, exports, and family tools',
  ],
} as const

export type HomeSitePage = {
  title: string
  href: string
  body: string
  requiresAccount?: boolean
}

export const homeSitePages: HomeSitePage[] = [
  {
    title: 'Diapers',
    href: '/diapers',
    body: 'Quick-log changes for one or more babies with recent history and daily insights.',
    requiresAccount: true,
  },
  {
    title: 'Sleep',
    href: '/sleep',
    body: 'Record naps and night sleep with start/end times, duration, mood, and environment.',
    requiresAccount: true,
  },
  {
    title: 'Feeding',
    href: '/feeding',
    body: 'Track breast, bottle, solids, and snacks with duration, ounces, and notes.',
    requiresAccount: true,
  },
  {
    title: 'Growth & milestones',
    href: '/growth',
    body: 'Chart measurements over time and celebrate developmental milestones with media.',
    requiresAccount: true,
  },
  {
    title: 'Health',
    href: '/health',
    body: 'Log sickness and injuries — symptoms, temperature, treatment, and recovery notes.',
    requiresAccount: true,
  },
  {
    title: 'Reports',
    href: '/reports',
    body: 'Analysis across sleep, diapers, feeding, growth, milestones, and health. Free: 7-day window. Pro: longer ranges and PDF.',
    requiresAccount: true,
  },
  {
    title: 'Weekly summary',
    href: '/weekly-summary',
    body: 'Readable digest of the past week. Pro only, with optional email in Settings.',
    requiresAccount: true,
  },
  {
    title: 'Parents Corner',
    href: '/parents-corner',
    body: 'Community feed — post updates, comment, like, mention others, and attach media.',
  },
  {
    title: 'Recommendation Shop',
    href: '/recommendation-shop',
    body: 'Browse parent-recommended baby gear by category, with product links, photos, and reviews.',
  },
  {
    title: 'Consultants',
    href: '/consultants',
    body: 'Connect with specialists — email, Instagram, and website links in one place.',
  },
  {
    title: 'Profile',
    href: '/profile',
    body: 'Manage babies, month stats, activity calendar, family sharing, and posts. Pro unlocks PDF export.',
    requiresAccount: true,
  },
  {
    title: 'Pricing',
    href: '/pricing',
    body: 'Compare Free and Pro. Core tracking is free; upgrade for unlimited history and family tools.',
  },
]

export type PlanRow = {
  feature: string
  free: string
  pro: string
}

export const homePlanRows: PlanRow[] = [
  { feature: 'Sleep, feeding & diaper logging', free: 'Yes', pro: 'Yes' },
  { feature: 'Growth, milestones & health', free: 'Yes', pro: 'Yes' },
  { feature: 'Parents Corner & reviews', free: 'Yes', pro: 'Yes' },
  { feature: 'Log & report history', free: '7 days', pro: 'Unlimited' },
  { feature: 'Reports date range', free: '7 days', pro: '30 / 90 / all time' },
  { feature: 'PDF export', free: '—', pro: 'Yes' },
  { feature: 'Weekly summary', free: '—', pro: 'Yes' },
  { feature: 'Send family invites', free: '—', pro: 'Yes' },
  { feature: 'Accept family invites', free: 'Yes', pro: 'Yes' },
  { feature: 'Family tracking alerts', free: '—', pro: 'Yes' },
  { feature: 'Ads', free: 'Planned', pro: 'No ads' },
  { feature: 'Price', free: '$0', pro: '$4.99/mo or $49.99/yr' },
]

export const homeFooterCta = {
  title: 'Create a free account',
  body: 'Sign up to add babies, start logging, and explore Parents Corner. Upgrade to Pro anytime.',
} as const
