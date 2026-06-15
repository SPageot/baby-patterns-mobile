import { apiFetch } from '@/api/client'
import { clearAuthSession, getAccessToken, getRefreshToken } from '@/lib/authSession'

export {
  extractAuthTokens,
  extractUserIdFromAccessToken,
  persistAuthTokens,
  refreshAccessToken,
  resolveAuthenticatedUserId,
} from '@/api/authTokens'

export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken()?.trim()
  const accessToken = getAccessToken()?.trim()
  try {
    if (refreshToken && accessToken) {
      await apiFetch<void>(
        'api/auth/logout',
        { method: 'POST', body: JSON.stringify({ refreshToken }) },
        { skipRefresh: true },
      )
    }
  } catch {
    /* still clear */
  } finally {
    await clearAuthSession()
  }
}

export async function acceptLegalPolicies(options: {
  acceptTerms: boolean
  acceptPrivacy: boolean
  policyVersion: string
}): Promise<void> {
  await apiFetch<void>('api/auth/accept-legal', {
    method: 'POST',
    body: JSON.stringify(options),
  })
}
