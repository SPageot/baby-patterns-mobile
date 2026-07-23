import { useEffect } from 'react'
import * as Linking from 'expo-linking'

import { openConfirmEmailFromUrl } from '@/lib/confirmEmailLink'

/** Open the in-app confirm-email screen when a confirmation deep link arrives. */
export function ConfirmEmailLinkHandler() {
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return
      openConfirmEmailFromUrl(url)
    }

    void Linking.getInitialURL().then(handleUrl)
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => sub.remove()
  }, [])

  return null
}
