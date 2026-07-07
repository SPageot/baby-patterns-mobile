import { LegalDocument } from '@/components/legal/LegalDocument'
import { PRIVACY_POLICY } from '@/lib/legalContent'
import { PRIVACY_POLICY_URL } from '@/lib/siteUrls'

export default function PrivacyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="This policy describes how Baby Patterns handles your information."
      sections={PRIVACY_POLICY}
      publicWebUrl={PRIVACY_POLICY_URL}
    />
  )
}
