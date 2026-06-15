import { LegalDocument } from '@/components/legal/LegalDocument'
import { PRIVACY_POLICY } from '@/lib/legalContent'

export default function PrivacyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="This policy describes how Baby Patterns handles your information."
      sections={PRIVACY_POLICY}
    />
  )
}
