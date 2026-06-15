/** Initials for avatar fallback (full name preferred, then username). */
import type { User } from '@/schemas/user'

export function getUserInitials(user: Pick<User, 'fullName' | 'username'>): string {
  const name = user.fullName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    }
    const single = parts[0] ?? ''
    if (single.length >= 2) return single.slice(0, 2).toUpperCase()
    return (single[0] ?? '?').toUpperCase()
  }

  const username = user.username?.trim() ?? ''
  if (username.length >= 2) return username.slice(0, 2).toUpperCase()
  return (username[0] ?? '?').toUpperCase()
}
