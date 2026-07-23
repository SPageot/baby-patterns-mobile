export type ConsultantPdfAttachment = 'none' | 'sleep' | 'diaper' | 'feeding' | 'potty' | 'reports'

export const CONSULTANT_PDF_OPTIONS: {
  value: ConsultantPdfAttachment
  label: string
  description: string
}[] = [
  {
    value: 'none',
    label: 'None',
    description: 'Open email without a PDF attachment.',
  },
  {
    value: 'sleep',
    label: 'Sleep report',
    description: 'Attach your sleep tracking PDF.',
  },
  {
    value: 'diaper',
    label: 'Diaper report',
    description: 'Attach your diaper tracking PDF.',
  },
  {
    value: 'feeding',
    label: 'Feeding report',
    description: 'Attach your feeding tracking PDF.',
  },
  {
    value: 'potty',
    label: 'Potty report',
    description: 'Attach your potty tracking PDF.',
  },
  {
    value: 'reports',
    label: 'Full reports PDF',
    description: 'Attach the combined tracking report (Pro).',
  },
]

export function consultantMailtoUrl(email: string, consultantName: string, attachmentLabel?: string): string {
  const subject = encodeURIComponent(`Baby Pattern update for ${consultantName}`)
  const bodyLines = [
    `Hi ${consultantName},`,
    '',
    'I wanted to share an update from Baby Pattern.',
  ]
  if (attachmentLabel && attachmentLabel !== 'None') {
    bodyLines.push(
      '',
      `I've prepared my ${attachmentLabel.toLowerCase()} PDF — please see the attached file.`,
    )
  }
  bodyLines.push('', 'Thank you!')
  const body = encodeURIComponent(bodyLines.join('\n'))
  return `mailto:${email}?subject=${subject}&body=${body}`
}

export function attachmentOptionLabel(value: ConsultantPdfAttachment): string {
  return CONSULTANT_PDF_OPTIONS.find((o) => o.value === value)?.label ?? 'None'
}
