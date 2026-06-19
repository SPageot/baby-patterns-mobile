import { persistAuthTokens } from '@/api/authApi'
import { apiFetch, UnauthorizedError } from '@/api/client'
import { fetchCurrentUser } from '@/api/userApi'
import type { User } from '@/schemas/user'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '') return String(v).trim()
  }
  return ''
}

function unwrapPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return data as Record<string, unknown>
}

export type MfaStatus = {
  enabled: boolean
  recoveryCodesRemaining: number
}

export type MfaSetup = {
  secret: string
  otpAuthUri: string
}

export type MfaConfirmResult = {
  enabled: boolean
  recoveryCodes: string[]
}

export async function fetchMfaStatus(): Promise<MfaStatus> {
  const data = await apiFetch<unknown>('api/mfa/status')
  const o = unwrapPayload(data)
  return {
    enabled: o.enabled === true || o.Enabled === true,
    recoveryCodesRemaining: Number(o.recoveryCodesRemaining ?? o.RecoveryCodesRemaining ?? 0),
  }
}

export async function beginMfaSetup(): Promise<MfaSetup> {
  const data = await apiFetch<unknown>('api/mfa/setup', { method: 'POST' })
  const o = unwrapPayload(data)
  const secret = pickStr(o, 'secret', 'Secret')
  const otpAuthUri = pickStr(o, 'otpAuthUri', 'OtpAuthUri')
  if (!secret || !otpAuthUri) throw new Error('Could not start authenticator setup.')
  return { secret, otpAuthUri }
}

export async function confirmMfaSetup(code: string): Promise<MfaConfirmResult> {
  const data = await apiFetch<unknown>('api/mfa/confirm', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim() }),
  })
  const o = unwrapPayload(data)
  const recoveryRaw = o.recoveryCodes ?? o.RecoveryCodes
  const recoveryCodes = Array.isArray(recoveryRaw)
    ? recoveryRaw.map((c) => String(c).trim()).filter(Boolean)
    : []
  return {
    enabled: o.enabled === true || o.Enabled === true,
    recoveryCodes,
  }
}

export async function disableMfa(password: string, code: string): Promise<void> {
  await apiFetch<void>('api/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ password, code: code.trim() }),
  })
}

export async function completeMfaLogin(options: {
  challengeToken: string
  code?: string
  recoveryCode?: string
  fallbackUsername?: string
}): Promise<User> {
  const body: Record<string, string> = {
    challengeToken: options.challengeToken.trim(),
  }
  if (options.code?.trim()) body.code = options.code.trim()
  if (options.recoveryCode?.trim()) body.recoveryCode = options.recoveryCode.trim()

  try {
    const data = await apiFetch<unknown>(
      'api/auth/login/mfa',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      { skipAuth: true, skipRefresh: true },
    )

    const tokens = await persistAuthTokens(data)
    if (!tokens) {
      throw new UnauthorizedError('Invalid authenticator or recovery code.')
    }

    return fetchCurrentUser(options.fallbackUsername)
  } catch (e) {
    if (e instanceof UnauthorizedError) throw e
    throw new UnauthorizedError('Invalid authenticator or recovery code.')
  }
}
