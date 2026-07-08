import { LegalDocument } from '@/components/legal/LegalDocument'
import { TERMS_OF_USE } from '@/lib/legalContent'
import { TERMS_OF_SERVICE_URL } from '@/lib/siteUrls'

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Terms of Use"
      intro="Please read these terms carefully before using Baby Pattern."
      sections={TERMS_OF_USE}
      publicWebUrl={TERMS_OF_SERVICE_URL}
    />
  )
}
