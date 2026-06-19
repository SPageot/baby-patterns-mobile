import { apiFetch } from './client'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

export async function requestPasswordReset(email: string): Promise<string> {
  const data = await apiFetch<unknown>(
    'api/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    },
    { skipAuth: true },
  )

  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  return (
    pickStr(o, 'message', 'Message') ||
    'If an account exists for that email, we sent a password reset link. If you don\'t see it in your inbox, check your junk or spam folder.'
  )
}

export async function validatePasswordResetToken(token: string): Promise<boolean> {
  const q = new URLSearchParams({ token: token.trim() })
  try {
    await apiFetch<unknown>(`api/auth/reset-password/validate?${q}`, undefined, { skipAuth: true })
    return true
  } catch {
    return false
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch<void>(
    'api/auth/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({ token: token.trim(), newPassword }),
    },
    { skipAuth: true },
  )
}
