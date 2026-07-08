/** Bump when Terms or Privacy content changes materially. Keep mobile and web copies identical. */
export const LEGAL_POLICY_VERSION = '2026-07-09'

export const LEGAL_LAST_UPDATED = 'July 9, 2026'

/** Public support and privacy contact for Terms, Privacy Policy, and app store listings. */
export const SUPPORT_EMAIL = 'admin@baby-pattern.com'

export function supportEmailMailto(): string {
  return `mailto:${SUPPORT_EMAIL}`
}

export function splitAroundSupportEmail(text: string): { before: string; after: string } | null {
  const idx = text.indexOf(SUPPORT_EMAIL)
  if (idx === -1) return null
  return {
    before: text.slice(0, idx),
    after: text.slice(idx + SUPPORT_EMAIL.length),
  }
}

export type LegalSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

/** True when a signed-in user must accept the current Terms and Privacy Policy. */
export function userNeedsLegalAcceptance(legalPolicyVersion: string | null | undefined): boolean {
  return legalPolicyVersion !== LEGAL_POLICY_VERSION
}

export const TERMS_OF_USE: LegalSection[] = [
  {
    title: '1. Agreement',
    paragraphs: [
      'These Terms of Use ("Terms") govern your access to and use of Baby Pattern (the "Service"), including our website, mobile apps, and related APIs.',
      'By creating an account or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.',
    ],
  },
  {
    title: '2. Who may use the Service',
    paragraphs: [
      'The Service is intended for parents, guardians, and caregivers who are at least 18 years old (or the age of majority where you live).',
      'You represent that you have legal authority to enter information about any child profile you create, and that you will not allow minors to create accounts without appropriate parental consent.',
    ],
  },
  {
    title: '3. Not medical advice',
    paragraphs: [
      'Baby Pattern helps you log and review daily baby care and development information, including diapers, feeding, sleep, naps, potty training, growth measurements, milestones, sickness and injury events, and pediatrician visits (such as hospital, provider name, recommendations, and immunizations).',
      'Reports, charts, weekly summaries, PDF exports, community posts, reviews, and other analysis features are for general informational purposes only. They are designed to help you organize caregiver-entered data and share summaries with your pediatrician or care team when you choose.',
      'The Service does not provide medical advice, diagnosis, or treatment and is not a substitute for professional care. Always consult a qualified pediatrician or healthcare provider about your child\'s health.',
      'Do not delay or disregard medical advice because of something you read, export, or log in the Service.',
    ],
  },
  {
    title: '4. Your account and content',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your login credentials and for activity under your account.',
      'You may post in Parents Corner, submit product reviews, share challenges and solutions on the Solution Board, upload profile images, log tracking data, export PDF reports, and share tracking access with family members you invite. You retain ownership of content you submit, but grant us a limited license to host, display, process, and transmit it solely to operate the Service (including notifications and email summaries you enable).',
    ],
    bullets: [
      'Do not upload unlawful, harmful, or misleading content.',
      'Do not harass other users or impersonate others.',
      'Do not attempt to access another user\'s data without authorization.',
      'Do not scrape, reverse engineer, or disrupt the Service.',
    ],
  },
  {
    title: '5. Community content and moderation',
    paragraphs: [
      'Some features let users share content with others, including Parents Corner posts and comments, product reviews, and Solution Board notes. Community content reflects the views of the person who posted it, not Baby Pattern.',
      'If you see content that violates these Terms, use the in-app report option on that post, comment, review, or note. You can also block another user to stop seeing their posts, comments, reviews, and Solution Board notes in your feed. Blocking is private — the other person is not notified.',
      'When you submit a report, we store the content type, content identifier, reason you select (such as spam, harassment, inappropriate content, or other), and any optional details you provide. Reports help us identify abuse and improve safety.',
      'We review reports and may remove content, restrict features, or suspend or terminate accounts that violate these Terms or that we reasonably believe pose a safety risk. We aim to review reports within a reasonable time, but we do not guarantee immediate removal.',
      `For urgent safety concerns, email ${SUPPORT_EMAIL} with a link or description of the content and your username.`,
    ],
  },
  {
    title: '6. Family sharing',
    paragraphs: [
      'When you add family members or friends, you choose who can view and log data for your babies, including health and pediatrician visit information. You are responsible for only inviting people you trust and for removing access when appropriate.',
    ],
  },
  {
    title: '7. Subscriptions and billing',
    paragraphs: [
      'Baby Pattern offers free and Pro plans. Pro may include extended history, family sharing alerts, PDF export, weekly email summaries, and other features described on our pricing page.',
      'Paid subscriptions are processed by Stripe or another payment provider we designate. Billing terms, renewals, and cancellations are shown at checkout and in your account settings. Payment card details are handled by the payment provider, not stored directly by us.',
    ],
  },
  {
    title: '8. Availability and changes',
    paragraphs: [
      'We may modify, suspend, or discontinue features at any time. We may update these Terms from time to time. If changes are material, we will provide reasonable notice (for example, by posting an updated effective date and, where appropriate, asking you to accept the revised Terms). Continued use after changes take effect constitutes acceptance.',
    ],
  },
  {
    title: '9. Disclaimer and limitation of liability',
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, BABY PATTERN AND ITS OPERATORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.',
    ],
  },
  {
    title: '10. Termination',
    paragraphs: [
      'You may stop using the Service at any time and may delete your account through available account features where supported.',
      'We may suspend or terminate access if you violate these Terms or if necessary to protect the Service or other users.',
    ],
  },
  {
    title: '11. Contact',
    paragraphs: [
      `For questions about these Terms, account access, billing, or technical support, email us at ${SUPPORT_EMAIL}. We aim to respond within a few business days.`,
    ],
  },
]

export const PRIVACY_POLICY: LegalSection[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'This Privacy Policy explains how Baby Pattern ("we," "us") collects, uses, and shares information when you use our Service.',
      'We designed Baby Pattern for parents and caregivers tracking daily baby care. Protecting your family\'s information matters to us.',
      `You can reach our support team at ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: '2. Information we collect',
    paragraphs: ['We collect information you provide directly and information generated when you use the Service:'],
    bullets: [
      'Account information: username, email, password (stored hashed), phone, birthdate, full name, and location.',
      'Baby profiles: name, birthdate, locations, and optional measurements.',
      'Tracking logs: diaper, feeding, sleep, nap, potty, growth, milestone, sickness, injury, and pediatrician visit entries you or invited family members create (including dates, notes, symptoms, care details, hospital or clinic names, provider names, recommendations, and immunizations you enter).',
      'Reports and exports: aggregated charts, weekly summaries, and PDF reports generated from your logs when you view or download them.',
      'Community content: Parents Corner posts, comments, likes, product reviews, and Solution Board notes.',
      'Safety and moderation: content reports you submit (content type, content identifier, reason, and optional details) and a list of user accounts you choose to block.',
      'Profile media: avatar images you upload.',
      'Notifications: in-app notification history; optional browser or device push subscription endpoints when you turn alerts on; notification preferences.',
      'Email communications: account-related messages (such as welcome, password reset, and Pro trial reminders) and optional weekly summary emails when you enable them (Pro).',
      'Subscription and billing: plan status, billing interval, and subscription identifiers from our payment provider (such as Stripe customer and subscription IDs). We do not store full payment card numbers.',
      'Technical data: authentication tokens, basic request metadata, and security logs needed to operate and protect the API.',
    ],
  },
  {
    title: '3. How we use information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Create and manage your account and baby profiles.',
      'Store, display, and analyze your tracking data, charts, reports, and weekly summaries.',
      'Enable family sharing and activity alerts you configure.',
      'Operate community features such as Parents Corner, reviews, and the Solution Board.',
      'Review content reports, enforce these Terms, and respond to abuse or safety concerns.',
      'Send service emails (such as password reset and account notices) and optional weekly summary emails you opt into.',
      'Deliver push or in-app notifications about mentions, likes, family activity, and tracking updates when enabled.',
      'Process subscriptions and Pro features through our payment provider.',
      'Maintain security, prevent abuse, and improve reliability.',
      'Comply with legal obligations.',
    ],
  },
  {
    title: '4. Health-related information',
    paragraphs: [
      'Sickness, injury, and pediatrician visit logs may contain sensitive health-related information that you choose to enter. We use this information only to provide the Service — for example, to display history, include it in reports you request, share it with family members you authorize, and summarize it in optional weekly emails.',
      'We do not use health-related logs for advertising and we do not sell them.',
    ],
  },
  {
    title: '5. How we share information',
    paragraphs: [
      'We do not sell your personal information.',
      'We share information only in these situations:',
    ],
    bullets: [
      'With people you invite: family members you add can access baby tracking data you authorize, including health and pediatrician visit logs.',
      'With service providers: hosting, email delivery, payment processing (such as Stripe), and infrastructure partners that process data on our behalf under contractual safeguards.',
      'For legal reasons: when required by law or to protect rights, safety, and security.',
      'With your direction: when you export PDF reports, copy weekly summaries, or otherwise choose to share information outside the Service.',
    ],
  },
  {
    title: '6. Cookies and local storage',
    paragraphs: [
      'The Service uses browser local storage to keep you signed in (access and refresh tokens), remember preferences such as theme settings, and support optional web push notifications on devices where you enable them.',
      'We do not use third-party advertising cookies in the current version of the Service.',
    ],
  },
  {
    title: '7. Data retention and deletion',
    paragraphs: [
      'We retain account and tracking data while your account is active so the Service can function.',
      'You may delete your account where that feature is available; we will delete or de-identify associated personal data within a reasonable period, except where retention is required by law or for legitimate security purposes.',
    ],
  },
  {
    title: '8. Security',
    paragraphs: [
      'We use industry-standard measures such as hashed passwords, authenticated API access, and encrypted connections (HTTPS) in production.',
      'No method of transmission or storage is completely secure; please use a strong, unique password and protect your device.',
    ],
  },
  {
    title: '9. Children\'s privacy',
    paragraphs: [
      'Baby Pattern is not directed to children under 13 to use on their own. Parents and guardians enter information about their children.',
      `If you believe a child has created an account without appropriate consent, contact us at ${SUPPORT_EMAIL} so we can take appropriate action.`,
    ],
  },
  {
    title: '10. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, delete, or export personal information. You can update profile details in the app, manage notification and weekly email preferences in settings, and remove family sharing connections from your profile settings.',
      `To exercise privacy rights (access, correction, or deletion), email ${SUPPORT_EMAIL} from the address associated with your account.`,
    ],
  },
  {
    title: '11. International users',
    paragraphs: [
      'If you access the Service from outside the United States, your information may be processed in the United States or other countries where our service providers operate, which may have different data protection laws.',
    ],
  },
  {
    title: '12. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the revised policy with an updated "Last updated" date. Material changes may require renewed acceptance at signup or login.',
    ],
  },
  {
    title: '13. Contact',
    paragraphs: [
      `For privacy questions or data requests, email ${SUPPORT_EMAIL}.`,
    ],
  },
]
