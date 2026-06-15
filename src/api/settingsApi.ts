import { apiFetch } from '@/api/client'

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
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
