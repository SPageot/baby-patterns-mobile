import { apiFetch } from '@/api/client'
import type { FamilyMember } from '@/schemas/familyMember'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function normalizeFamilyMember(raw: unknown): FamilyMember | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const memberUserId = pickStr(o, 'memberUserId', 'MemberUserId')
  const username = pickStr(o, 'username', 'Username')
  if (!id || !memberUserId || !username) return null

  return {
    id,
    memberUserId,
    username,
    fullName: pickStr(o, 'fullName', 'FullName'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
  }
}

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const data = await apiFetch<unknown>('api/family-members')
  if (!Array.isArray(data)) return []
  return data.map(normalizeFamilyMember).filter((m): m is FamilyMember => m != null)
}

export async function addFamilyMember(username: string): Promise<FamilyMember> {
  const data = await apiFetch<unknown>('api/family-members', {
    method: 'POST',
    body: JSON.stringify({ username: username.trim() }),
  })
  const member = normalizeFamilyMember(data)
  if (!member) throw new Error('Invalid family member response from server')
  return member
}

export async function removeFamilyMember(memberUserId: string): Promise<void> {
  await apiFetch<void>(`api/family-members/${encodeURIComponent(memberUserId)}`, {
    method: 'DELETE',
  })
}
