import { useTranslation } from 'react-i18next'

import { LegalDocument } from '@/components/legal/LegalDocument'
import { getPrivacyPolicy, getLegalLastUpdated } from '@/lib/legalContent'
import { PRIVACY_POLICY_URL } from '@/lib/siteUrls'

export default function PrivacyScreen() {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  return (
    <LegalDocument
      title={t('legal.privacyTitle')}
      intro={t('legal.privacyIntro')}
      sections={getPrivacyPolicy(language)}
      lastUpdated={getLegalLastUpdated(language)}
      publicWebUrl={PRIVACY_POLICY_URL}
    />
  )
}
