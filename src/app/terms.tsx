import { LegalDocument } from '@/components/legal/LegalDocument'
import { TERMS_OF_USE } from '@/lib/legalContent'

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Terms of Use"
      intro="Please read these terms carefully before using Baby Patterns."
      sections={TERMS_OF_USE}
    />
  )
}
