import { useTranslation } from 'react-i18next'

import { LegalDocument } from '@/components/legal/LegalDocument'
import { getTermsOfUse, getLegalLastUpdated } from '@/lib/legalContent'
import { TERMS_OF_SERVICE_URL } from '@/lib/siteUrls'

export default function TermsScreen() {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  return (
    <LegalDocument
      title={t('legal.termsTitle')}
      intro={t('legal.termsIntro')}
      sections={getTermsOfUse(language)}
      lastUpdated={getLegalLastUpdated(language)}
      publicWebUrl={TERMS_OF_SERVICE_URL}
    />
  )
}
