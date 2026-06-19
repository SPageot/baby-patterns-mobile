import { apiFetch } from './client'

export type PushConfig = {
  vapidPublicKey: string
  webPushEnabled: boolean
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

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return false
}

export async function fetchPushConfig(): Promise<PushConfig> {
  const data = await apiFetch<unknown>('api/push/config', undefined, { skipAuth: true })
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  return {
    vapidPublicKey: pickStr(o, 'vapidPublicKey', 'VapidPublicKey'),
    webPushEnabled: pickBool(o, 'webPushEnabled', 'WebPushEnabled'),
  }
}

export async function registerExpoPushToken(expoPushToken: string): Promise<void> {
  await apiFetch<void>('api/push/expo', {
    method: 'POST',
    body: JSON.stringify({ expoPushToken }),
  })
}

export async function unregisterExpoPushToken(expoPushToken: string): Promise<void> {
  await apiFetch<void>('api/push/expo', {
    method: 'DELETE',
    body: JSON.stringify({ expoPushToken }),
  })
}
