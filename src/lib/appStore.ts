import type { Baby, User } from '@/schemas/user'

let selectedBabyId = ''

export function syncAppStore(state: {
  user: User | null
  babies: Baby[]
  selectedBabyId: string
}): void {
  selectedBabyId = state.selectedBabyId
}

export function getBabyId(): string {
  const id = selectedBabyId.trim()
  if (id) return id
  return (process.env.EXPO_PUBLIC_BABY_ID ?? '').trim()
}
