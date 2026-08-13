export type OnboardingAdvance =
  | { type: 'menu-open' }
  | { type: 'pathname'; path: string }
  | { type: 'click-target' }
  | { type: 'event'; name: string }
  | { type: 'next-button' }
  | { type: 'finish-button' }

export type OnboardingStepId = string

export type OnboardingStep = {
  id: OnboardingStepId
  targetId: string | null
  alternateTargetId?: string
  preferAlternateIfVisible?: boolean
  skipIfMissing?: boolean
  advance: OnboardingAdvance
}

const closeFormAlt = {
  alternateTargetId: 'log-form-close',
  preferAlternateIfVisible: true as const,
}

const MOBILE_PROFILE_CORE: OnboardingStep[] = [
  {
    id: 'welcome',
    targetId: 'profile-this-month',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'historyCalendar',
    targetId: 'profile-activity-calendar',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'babyProfile',
    targetId: 'profile-add-baby-btn',
    alternateTargetId: 'edit-baby-btn',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
]

const MOBILE_CARE_TRACKING: OnboardingStep[] = [
  {
    id: 'openMenuDiapers',
    targetId: 'nav-menu-btn',
    advance: { type: 'menu-open' },
  },
  {
    id: 'goDiapers',
    targetId: 'nav-link-diapers',
    advance: { type: 'pathname', path: '/diapers' },
  },
  {
    id: 'diapersPage',
    targetId: 'page-diaper-content',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'logDiaper',
    targetId: 'log-cta-diaper',
    advance: { type: 'click-target' },
  },
  {
    id: 'diaperForm',
    targetId: 'log-form',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'openMenuFeeding',
    targetId: 'nav-menu-btn',
    ...closeFormAlt,
    advance: { type: 'menu-open' },
  },
  {
    id: 'goFeeding',
    targetId: 'nav-link-feeding',
    advance: { type: 'pathname', path: '/feeding' },
  },
  {
    id: 'feedingPage',
    targetId: 'page-feeding-content',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'logFeeding',
    targetId: 'log-cta-feeding',
    advance: { type: 'click-target' },
  },
  {
    id: 'feedingForm',
    targetId: 'log-form',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'openMenuSleep',
    targetId: 'nav-menu-btn',
    ...closeFormAlt,
    advance: { type: 'menu-open' },
  },
  {
    id: 'goSleep',
    targetId: 'nav-link-sleep',
    advance: { type: 'pathname', path: '/sleep' },
  },
  {
    id: 'sleepPage',
    targetId: 'page-sleep-content',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'logSleep',
    targetId: 'log-cta-sleep',
    advance: { type: 'click-target' },
  },
  {
    id: 'sleepForm',
    targetId: 'log-form',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'openMenuGrowth',
    targetId: 'nav-menu-btn',
    ...closeFormAlt,
    advance: { type: 'menu-open' },
  },
  {
    id: 'goGrowth',
    targetId: 'nav-link-growth',
    advance: { type: 'pathname', path: '/growth' },
  },
  {
    id: 'growthPage',
    targetId: 'page-growth-content',
    alternateTargetId: 'growth-add-measurement',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'growthMeasure',
    targetId: 'growth-add-measurement',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'growthMilestone',
    targetId: 'growth-add-milestone',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
]

const MOBILE_AFTER_REPORTS: OnboardingStep[] = [
  {
    id: 'openMenuPediatrician',
    targetId: 'nav-menu-btn',
    ...closeFormAlt,
    advance: { type: 'menu-open' },
  },
  {
    id: 'goPediatrician',
    targetId: 'nav-link-pediatrician',
    advance: { type: 'pathname', path: '/pediatrician' },
  },
  {
    id: 'pediatricianPage',
    targetId: 'page-pediatrician-content',
    alternateTargetId: 'pediatrician-log-visit',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'pediatricianLog',
    targetId: 'pediatrician-log-visit',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'goParents',
    targetId: 'tab-parents-corner',
    advance: { type: 'pathname', path: '/parents-corner' },
  },
  {
    id: 'parentsCompose',
    targetId: 'parents-corner-compose',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
]

export const FREE_ONBOARDING_STEPS: OnboardingStep[] = [
  ...MOBILE_PROFILE_CORE,
  ...MOBILE_CARE_TRACKING,
  {
    id: 'goReports',
    targetId: 'tab-reports',
    ...closeFormAlt,
    advance: { type: 'pathname', path: '/reports' },
  },
  {
    id: 'reportsPage',
    targetId: 'page-reports-content',
    alternateTargetId: 'reports-range',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'reportsRangeFree',
    targetId: 'reports-range',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'reportsUpgrade',
    targetId: 'reports-upgrade',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  ...MOBILE_AFTER_REPORTS,
  {
    id: 'openMenuPricing',
    targetId: 'nav-menu-btn',
    advance: { type: 'menu-open' },
  },
  {
    id: 'goPricing',
    targetId: 'nav-link-pricing',
    skipIfMissing: true,
    advance: { type: 'pathname', path: '/pricing' },
  },
  {
    id: 'pricingOverview',
    targetId: null,
    advance: { type: 'next-button' },
  },
  {
    id: 'goSettings',
    targetId: 'tab-settings',
    advance: { type: 'pathname', path: '/settings' },
  },
  {
    id: 'settingsSubscriptionFree',
    targetId: 'settings-tab-subscription',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'settingsAccount',
    targetId: 'settings-tab-account',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'done',
    targetId: null,
    advance: { type: 'finish-button' },
  },
]

export const PRO_ONBOARDING_STEPS: OnboardingStep[] = [
  ...MOBILE_PROFILE_CORE,
  {
    id: 'familyInvite',
    targetId: 'family-invite-search',
    alternateTargetId: 'family-invite-section',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  ...MOBILE_CARE_TRACKING,
  {
    id: 'goReports',
    targetId: 'tab-reports',
    ...closeFormAlt,
    advance: { type: 'pathname', path: '/reports' },
  },
  {
    id: 'reportsPage',
    targetId: 'page-reports-content',
    alternateTargetId: 'reports-range',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'reportsRangePro',
    targetId: 'reports-range',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'reportsPdf',
    targetId: 'reports-download-pdf',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'openMenuWeekly',
    targetId: 'nav-menu-btn',
    advance: { type: 'menu-open' },
  },
  {
    id: 'goWeeklySummary',
    targetId: 'nav-link-weekly-summary',
    advance: { type: 'pathname', path: '/weekly-summary' },
  },
  {
    id: 'weeklyOverview',
    targetId: 'weekly-summary-heading',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  ...MOBILE_AFTER_REPORTS,
  {
    id: 'goSettings',
    targetId: 'tab-settings',
    advance: { type: 'pathname', path: '/settings' },
  },
  {
    id: 'settingsSubscriptionPro',
    targetId: 'settings-tab-subscription',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'settingsWeeklyEmail',
    targetId: 'settings-tab-weekly-summary',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'settingsAccount',
    targetId: 'settings-tab-account',
    skipIfMissing: true,
    advance: { type: 'next-button' },
  },
  {
    id: 'done',
    targetId: null,
    advance: { type: 'finish-button' },
  },
]

export function getOnboardingSteps(isPro: boolean): OnboardingStep[] {
  return isPro ? PRO_ONBOARDING_STEPS : FREE_ONBOARDING_STEPS
}

export const ONBOARDING_STEPS = FREE_ONBOARDING_STEPS
