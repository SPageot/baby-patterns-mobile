import type { NavIconName } from '@/lib/navLinks'

export type ShopCategoryIconName = NavIconName | 'bell'

/** Map Recommendation Shop groups to existing nav icons. */
export function shopCategoryIcon(category: string): ShopCategoryIconName {
  switch (category.trim().toLowerCase()) {
    case 'diapers':
      return 'diaper'
    case 'strollers':
      return 'users'
    case 'car seats':
      return 'hospital'
    case 'feeding':
      return 'bottle'
    case 'clothing':
      return 'tag'
    case 'toys':
      return 'star'
    case 'monitors':
      return 'bell'
    case 'bath & care':
      return 'health'
    case 'gear':
      return 'apple'
    default:
      return 'heart'
  }
}
