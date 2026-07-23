import { apiFetch } from '@/api/client'

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export type ChangeEmailPayload = {
  newEmail: string
  currentPassword: string
}

export type ChangeEmailResult = {
  message: string
  pendingEmail?: string
}

function parseApiErrorMessage(raw: unknown, fallback: string): string {
  if (raw instanceof Error && raw.message) {
    const text = raw.message.trim()
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message?.trim()) return parsed.message.trim()
      } catch {
        /* not JSON */
      }
    }
    if (text && !text.startsWith('Request failed')) return text
  }
  return fallback
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

/** POST `api/user/change-password` */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  try {
    await apiFetch<void>('api/user/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      }),
    })
  } catch (e) {
    throw new Error(parseApiErrorMessage(e, 'Could not change password'))
  }
}

/** POST `api/user/change-email` — sends confirmation to the new address via Resend. */
export async function requestEmailChange(payload: ChangeEmailPayload): Promise<ChangeEmailResult> {
  try {
    const data = await apiFetch<unknown>('api/user/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail: payload.newEmail.trim(),
        currentPassword: payload.currentPassword,
      }),
    })
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
      message:
        pickStr(o, 'message', 'Message') ||
        "We sent a confirmation link to your new email. If you don't see it, check junk or spam.",
      pendingEmail: pickStr(o, 'pendingEmail', 'PendingEmail') || undefined,
    }
  } catch (e) {
    throw new Error(parseApiErrorMessage(e, 'Could not start email change'))
  }
}

/** GET `api/auth/confirm-email/validate?token=` */
export async function validateEmailChangeToken(token: string): Promise<boolean> {
  const q = new URLSearchParams({ token: token.trim() })
  try {
    await apiFetch<unknown>(`api/auth/confirm-email/validate?${q}`, undefined, { skipAuth: true })
    return true
  } catch {
    return false
  }
}

/** POST `api/auth/confirm-email` */
export async function confirmEmailChange(token: string): Promise<void> {
  try {
    await apiFetch<void>(
      'api/auth/confirm-email',
      {
        method: 'POST',
        body: JSON.stringify({ token: token.trim() }),
      },
      { skipAuth: true },
    )
  } catch (e) {
    throw new Error(parseApiErrorMessage(e, 'Could not confirm email'))
  }
}
