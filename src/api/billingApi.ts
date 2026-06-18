import { apiFetch } from './client'

export type BillingInterval = 'monthly' | 'annual'

export type BillingStatus = {
  isPro: boolean
  subscriptionStatus: string
  proBillingInterval?: string | null
  proCurrentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}

function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = o[k]
    if (v === true || v === 'true') return true
    if (v === false || v === 'false') return false
  }
  return false
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function normalizeBillingStatus(raw: unknown): BillingStatus {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    isPro: pickBool(o, 'isPro', 'IsPro'),
    subscriptionStatus: pickStr(o, 'subscriptionStatus', 'SubscriptionStatus') || 'none',
    proBillingInterval: pickStr(o, 'proBillingInterval', 'ProBillingInterval') || null,
    proCurrentPeriodEnd: pickStr(o, 'proCurrentPeriodEnd', 'ProCurrentPeriodEnd') || null,
    cancelAtPeriodEnd: pickBool(o, 'cancelAtPeriodEnd', 'CancelAtPeriodEnd'),
  }
}

export async function createCheckoutSession(interval: BillingInterval): Promise<string> {
  const data = await apiFetch<unknown>('api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ interval }),
  })
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const url = pickStr(o, 'url', 'Url')
  if (!url) throw new Error('Checkout did not return a URL.')
  return url
}

export async function createBillingPortalSession(): Promise<string> {
  const data = await apiFetch<unknown>('api/billing/portal', { method: 'POST' })
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const url = pickStr(o, 'url', 'Url')
  if (!url) throw new Error('Billing portal did not return a URL.')
  return url
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const data = await apiFetch<unknown>('api/billing/status')
  return normalizeBillingStatus(data)
}

/** POST `api/billing/sync` — pull latest subscription state from Stripe */
export async function syncBillingSubscription(): Promise<BillingStatus> {
  const data = await apiFetch<unknown>('api/billing/sync', { method: 'POST' })
  return normalizeBillingStatus(data)
}

/** POST `api/billing/cancel` — stop renewal and return to Free at period end */
export async function cancelBillingSubscription(): Promise<BillingStatus> {
  const data = await apiFetch<unknown>('api/billing/cancel', { method: 'POST' })
  return normalizeBillingStatus(data)
}
