/** Bump when Terms or Privacy content changes materially. */
export const LEGAL_POLICY_VERSION = '2025-06-10'

export const LEGAL_LAST_UPDATED = 'June 10, 2025'

export type LegalSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export const TERMS_OF_USE: LegalSection[] = [
  {
    title: '1. Agreement',
    paragraphs: [
      'These Terms of Use ("Terms") govern your access to and use of Baby Patterns (the "Service"), including our website, mobile experience, and related APIs.',
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
      'Baby Patterns helps you log and review diaper, feeding, and sleep information. Any insights, community posts, reviews, or future analysis features are for general informational purposes only.',
      'The Service does not provide medical advice and is not a substitute for professional care. Always consult a qualified pediatrician or healthcare provider about your child\'s health.',
      'Do not delay or disregard medical advice because of something you read or log in the Service.',
    ],
  },
  {
    title: '4. Your account and content',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your login credentials and for activity under your account.',
      'You may post in Parents Corner, submit product reviews, upload profile images, and share tracking access with family members you invite. You retain ownership of content you submit, but grant us a limited license to host, display, and process it solely to operate the Service.',
    ],
    bullets: [
      'Do not upload unlawful, harmful, or misleading content.',
      'Do not harass other users or impersonate others.',
      'Do not attempt to access another user\'s data without authorization.',
      'Do not scrape, reverse engineer, or disrupt the Service.',
    ],
  },
  {
    title: '5. Family sharing',
    paragraphs: [
      'When you add family members or friends, you choose who can view and log data for your babies. You are responsible for only inviting people you trust and for removing access when appropriate.',
    ],
  },
  {
    title: '6. Availability and changes',
    paragraphs: [
      'We may modify, suspend, or discontinue features at any time. We may update these Terms from time to time. If changes are material, we will provide reasonable notice (for example, by posting an updated effective date). Continued use after changes take effect constitutes acceptance.',
    ],
  },
  {
    title: '7. Disclaimer and limitation of liability',
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, BABY PATTERNS AND ITS OPERATORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.',
    ],
  },
  {
    title: '8. Termination',
    paragraphs: [
      'You may stop using the Service at any time and may delete your account through available account features where supported.',
      'We may suspend or terminate access if you violate these Terms or if necessary to protect the Service or other users.',
    ],
  },
  {
    title: '9. Contact',
    paragraphs: [
      'Questions about these Terms may be sent to the contact address listed on the Baby Patterns website or app.',
    ],
  },
]

export const PRIVACY_POLICY: LegalSection[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'This Privacy Policy explains how Baby Patterns ("we," "us") collects, uses, and shares information when you use our Service.',
      'We designed Baby Patterns for parents and caregivers tracking daily baby care. Protecting your family\'s information matters to us.',
    ],
  },
  {
    title: '2. Information we collect',
    paragraphs: ['We collect information you provide directly and information generated when you use the Service:'],
    bullets: [
      'Account information: username, email, password (stored hashed), phone, birthdate, full name, and location.',
      'Baby profiles: name, birthdate, locations, and optional measurements.',
      'Tracking logs: diaper, feeding, and sleep entries you or invited family members create.',
      'Community content: Parents Corner posts, comments, likes, and product reviews.',
      'Profile media: avatar images you upload.',
      'Technical data: authentication tokens, basic request metadata needed to secure and operate the API.',
    ],
  },
  {
    title: '3. How we use information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Create and manage your account.',
      'Store and display your tracking data, charts, and reports.',
      'Enable family sharing you configure.',
      'Operate community features such as Parents Corner and reviews.',
      'Send in-app notifications about activity you opt into (for example, mentions or likes).',
      'Maintain security, prevent abuse, and improve reliability.',
      'Comply with legal obligations.',
    ],
  },
  {
    title: '4. How we share information',
    paragraphs: [
      'We do not sell your personal information.',
      'We share information only in these situations:',
    ],
    bullets: [
      'With people you invite: family members you add can access baby tracking data you authorize.',
      'With service providers: hosting and infrastructure partners (for example, cloud database and deployment providers) that process data on our behalf under contractual safeguards.',
      'For legal reasons: when required by law or to protect rights, safety, and security.',
      'With your direction: when you choose to export or share information (for example, PDF reports).',
    ],
  },
  {
    title: '5. Cookies and local storage',
    paragraphs: [
      'The Service uses browser local storage to keep you signed in (access and refresh tokens) and to remember preferences such as theme settings.',
      'We do not use third-party advertising cookies in the current version of the Service.',
    ],
  },
  {
    title: '6. Data retention and deletion',
    paragraphs: [
      'We retain account and tracking data while your account is active so the Service can function.',
      'You may delete your account where that feature is available; we will delete or de-identify associated personal data within a reasonable period, except where retention is required by law or for legitimate security purposes.',
    ],
  },
  {
    title: '7. Security',
    paragraphs: [
      'We use industry-standard measures such as hashed passwords, authenticated API access, and encrypted connections (HTTPS) in production.',
      'No method of transmission or storage is completely secure; please use a strong, unique password and protect your device.',
    ],
  },
  {
    title: '8. Children\'s privacy',
    paragraphs: [
      'Baby Patterns is not directed to children under 13 to use on their own. Parents and guardians enter information about their children.',
      'If you believe a child has created an account without appropriate consent, contact us so we can take appropriate action.',
    ],
  },
  {
    title: '9. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, delete, or export personal information. You can update profile details in the app and remove family sharing connections from your profile settings.',
      'To exercise privacy rights, contact us using the information on our website.',
    ],
  },
  {
    title: '10. International users',
    paragraphs: [
      'If you access the Service from outside the United States, your information may be processed in the United States or other countries where our service providers operate, which may have different data protection laws.',
    ],
  },
  {
    title: '11. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the revised policy with an updated "Last updated" date. Material changes may require renewed acceptance at signup or login.',
    ],
  },
  {
    title: '12. Contact',
    paragraphs: [
      'Privacy questions may be sent to the contact address listed on the Baby Patterns website or app.',
    ],
  },
]
