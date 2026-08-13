import { LEGAL_LAST_UPDATED, LEGAL_POLICY_VERSION, SUPPORT_EMAIL } from '@/lib/legalContent'
import { PRIVACY_POLICY_URL, PUBLIC_SITE_URL, TERMS_OF_SERVICE_URL } from '@/lib/siteUrls'

/**
 * Reference for filling out Google Play Console before submission.
 * Copy values from here into Play Console → App content, Data safety, and Store listing.
 */
export const GOOGLE_PLAY_PACKAGE = 'com.babypattern.app'

export const GOOGLE_PLAY_STORE_LISTING = {
  appName: 'Baby Pattern',
  privacyPolicyUrl: PRIVACY_POLICY_URL,
  termsUrl: TERMS_OF_SERVICE_URL,
  websiteUrl: PUBLIC_SITE_URL,
  supportEmail: SUPPORT_EMAIL,
} as const

/**
 * Play Console links to the public website for legal pages.
 * Deploy the web client before submission so live URLs match legalContent.ts.
 */
export const GOOGLE_PLAY_LEGAL_PAGES = {
  policyVersion: LEGAL_POLICY_VERSION,
  lastUpdated: LEGAL_LAST_UPDATED,
  privacyUrl: PRIVACY_POLICY_URL,
  termsUrl: TERMS_OF_SERVICE_URL,
  mustAppearOnLiveSite: [
    `Last updated: ${LEGAL_LAST_UPDATED}`,
    SUPPORT_EMAIL,
    'Not medical advice',
    "Children's privacy",
  ],
} as const

/** Play Console → Target audience and content → Target age */
export const GOOGLE_PLAY_TARGET_AUDIENCE = {
  /** App is for parents/caregivers 18+, not child-directed. */
  primaryAudience: 'Parents and adult caregivers (18+)',
  designedForChildren: false,
  /** Select in Play Console: not primarily child-directed. Children under 13 do not create accounts. */
  playConsoleAnswer:
    'No — the app is intended for parents and guardians. Children do not sign up or use the app on their own.',
} as const

/**
 * Play Console → Data safety.
 * Mark "Collected" when users can provide data while signed in.
 * Mark "Shared" only where third-party processors apply (hosting, Stripe, email).
 */
export const GOOGLE_PLAY_DATA_SAFETY = [
  {
    dataType: 'Name',
    collected: true,
    shared: false,
    purpose: ['App functionality', 'Account management'],
    optional: false,
    notes: 'Account full name and baby names.',
  },
  {
    dataType: 'Email address',
    collected: true,
    shared: false,
    purpose: ['App functionality', 'Account management', 'Developer communications'],
    optional: false,
    notes: 'Login, password reset, optional weekly summary emails (Pro).',
  },
  {
    dataType: 'User IDs',
    collected: true,
    shared: false,
    purpose: ['App functionality', 'Account management'],
    optional: false,
    notes: 'Username and internal account identifiers.',
  },
  {
    dataType: 'Phone number',
    collected: true,
    shared: false,
    purpose: ['App functionality', 'Account management'],
    optional: false,
    notes: 'Collected at signup.',
  },
  {
    dataType: 'Photos and videos',
    collected: true,
    shared: false,
    purpose: ['App functionality'],
    optional: true,
    notes: 'Profile avatars, Parents Corner posts, growth/milestone media — user-initiated.',
  },
  {
    dataType: 'Health info',
    collected: true,
    shared: false,
    purpose: ['App functionality'],
    optional: true,
    notes: 'Sickness, injury, and pediatrician logs entered by caregivers. Not sold or used for ads.',
  },
  {
    dataType: 'Other info',
    collected: true,
    shared: false,
    purpose: ['App functionality'],
    optional: true,
    notes: 'Baby tracking logs (sleep, feeding, diapers, growth), community posts, product reviews.',
  },
  {
    dataType: 'App activity',
    collected: true,
    shared: false,
    purpose: ['App functionality'],
    optional: false,
    notes: 'In-app actions needed to operate features (e.g. posts, logs). No third-party ad analytics.',
  },
  {
    dataType: 'Device or other IDs',
    collected: true,
    shared: false,
    purpose: ['App functionality'],
    optional: true,
    notes: 'Push notification tokens when the user enables alerts.',
  },
] as const

/**
 * Play Console → App content → Health apps & Families policy answers.
 * Baby Pattern logs caregiver-entered baby care data — it is not a medical device.
 */
export const GOOGLE_PLAY_HEALTH_AND_FAMILIES = {
  isMedicalDevice: false,
  providesMedicalDiagnosisOrTreatment: false,
  healthFeatureSummary:
    'Optional sickness, injury, and pediatrician visit logs entered by parents. Reports and charts are informational only.',
  familiesPolicy: {
    targetAgeGroup: '18+ (parents and adult caregivers)',
    designedForChildren: false,
    childrenCanSignUp: false,
    collectsChildrenPersonalInfo:
      'Parents enter baby names and care logs on behalf of their children. Children do not use the app independently.',
    playConsoleFamiliesAnswers: [
      'Target audience: parents and caregivers, not children',
      'App is not designed primarily to appeal to children under 13',
      'Age gate: account creation requires user birthdate showing 18+',
      "Children's privacy section in Privacy Policy (section 9)",
    ],
  },
  contentRatingHints: [
    'User-generated content (posts, reviews, Parent Solutions Board) — disclose in questionnaire',
    'Health logging is caregiver-entered notes, not clinical decision support',
    'No simulated gambling, violence, or mature themes in core tracking features',
  ],
  storeListingHealthLine:
    'Baby Pattern helps parents log daily baby care. It is not medical advice and is not a substitute for professional care.',
} as const

/** Play Console → App content checklist (manual steps). */
export const GOOGLE_PLAY_CONSOLE_CHECKLIST = [
  `Deploy web client so ${PRIVACY_POLICY_URL} and ${TERMS_OF_SERVICE_URL} show version ${LEGAL_POLICY_VERSION} (${LEGAL_LAST_UPDATED})`,
  `Run npm run verify:legal — mobile and web legalContent.ts must match`,
  `Set privacy policy URL to ${PRIVACY_POLICY_URL}`,
  `Set support email to ${SUPPORT_EMAIL}`,
  'Complete Data safety using GOOGLE_PLAY_DATA_SAFETY in googlePlayCompliance.ts',
  'Target audience: parents/adults — see GOOGLE_PLAY_TARGET_AUDIENCE and GOOGLE_PLAY_HEALTH_AND_FAMILIES',
  'Complete content rating questionnaire — see GOOGLE_PLAY_HEALTH_AND_FAMILIES.contentRatingHints',
  'Declare UGC: Parents Corner, reviews, Parent Solutions Board — report and block in app; Terms section 5 describes moderation',
  'Declare health features as caregiver logging only (not a medical device)',
  'Upload store listing graphics, screenshots, and short + full description',
  'Complete production app signing and upload AAB via EAS Submit or Play Console',
] as const
