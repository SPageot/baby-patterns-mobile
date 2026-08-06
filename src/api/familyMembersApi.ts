import { apiFetch } from '@/api/client'
import type { FamilyMember, FamilyMemberBaby, FamilyShareRequest } from '@/schemas/familyMember'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function normalizeFamilyMemberBaby(raw: unknown): FamilyMemberBaby | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const fullName = pickStr(o, 'fullName', 'FullName')
  if (!id || !fullName) return null

  return {
    id,
    fullName,
    birthdate: pickStr(o, 'birthdate', 'Birthdate'),
  }
}

function normalizeFamilyMember(raw: unknown): FamilyMember | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const memberUserId = pickStr(o, 'memberUserId', 'MemberUserId')
  const username = pickStr(o, 'username', 'Username')
  if (!id || !memberUserId || !username) return null

  const babiesRaw = o.babies ?? o.Babies
  const babies = Array.isArray(babiesRaw)
    ? babiesRaw.map(normalizeFamilyMemberBaby).filter((b): b is FamilyMemberBaby => b != null)
    : []

  return {
    id,
    memberUserId,
    username,
    fullName: pickStr(o, 'fullName', 'FullName'),
    relationshipTag: pickStr(o, 'relationshipTag', 'RelationshipTag') || null,
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    babies,
  }
}

function normalizeFamilyShareRequest(raw: unknown): FamilyShareRequest | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const requesterUserId = pickStr(o, 'requesterUserId', 'RequesterUserId')
  const recipientUserId = pickStr(o, 'recipientUserId', 'RecipientUserId')
  if (!id || !requesterUserId || !recipientUserId) return null

  return {
    id,
    requesterUserId,
    requesterUsername: pickStr(o, 'requesterUsername', 'RequesterUsername'),
    requesterFullName: pickStr(o, 'requesterFullName', 'RequesterFullName'),
    recipientUserId,
    recipientUsername: pickStr(o, 'recipientUsername', 'RecipientUsername'),
    recipientFullName: pickStr(o, 'recipientFullName', 'RecipientFullName'),
    status: pickStr(o, 'status', 'Status'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
  }
}

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const data = await apiFetch<unknown>('api/family-members')
  if (!Array.isArray(data)) return []
  return data.map(normalizeFamilyMember).filter((m): m is FamilyMember => m != null)
}

export async function fetchIncomingFamilyRequests(): Promise<FamilyShareRequest[]> {
  const data = await apiFetch<unknown>('api/family-members/requests/incoming')
  if (!Array.isArray(data)) return []
  return data.map(normalizeFamilyShareRequest).filter((r): r is FamilyShareRequest => r != null)
}

export async function fetchOutgoingFamilyRequests(): Promise<FamilyShareRequest[]> {
  const data = await apiFetch<unknown>('api/family-members/requests/outgoing')
  if (!Array.isArray(data)) return []
  return data.map(normalizeFamilyShareRequest).filter((r): r is FamilyShareRequest => r != null)
}

export async function sendFamilyShareRequest(username: string): Promise<FamilyShareRequest> {
  const data = await apiFetch<unknown>('api/family-members', {
    method: 'POST',
    body: JSON.stringify({ username: username.trim() }),
  })
  const request = normalizeFamilyShareRequest(data)
  if (!request) throw new Error('Invalid family share request response from server')
  return request
}

export async function acceptFamilyShareRequest(
  requestId: string,
  relationshipTag?: string | null,
): Promise<FamilyMember> {
  const data = await apiFetch<unknown>(
    `api/family-members/requests/${encodeURIComponent(requestId)}/accept`,
    {
      method: 'POST',
      body: JSON.stringify({
        relationshipTag: relationshipTag?.trim() || null,
      }),
    },
  )
  const member = normalizeFamilyMember(data)
  if (!member) throw new Error('Invalid family member response from server')
  return member
}

export async function updateFamilyMemberTag(
  memberUserId: string,
  relationshipTag: string | null,
): Promise<FamilyMember> {
  const data = await apiFetch<unknown>(
    `api/family-members/${encodeURIComponent(memberUserId)}/tag`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        relationshipTag: relationshipTag?.trim() || null,
      }),
    },
  )
  const member = normalizeFamilyMember(data)
  if (!member) throw new Error('Invalid family member response from server')
  return member
}

export async function declineFamilyShareRequest(requestId: string): Promise<void> {
  await apiFetch<void>(`api/family-members/requests/${encodeURIComponent(requestId)}/decline`, {
    method: 'POST',
  })
}

export async function cancelFamilyShareRequest(requestId: string): Promise<void> {
  await apiFetch<void>(`api/family-members/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: 'POST',
  })
}

export async function removeFamilyMember(memberUserId: string): Promise<void> {
  await apiFetch<void>(`api/family-members/${encodeURIComponent(memberUserId)}`, {
    method: 'DELETE',
  })
}
