import AsyncStorage from '@react-native-async-storage/async-storage'

import type { NavGroupId } from './navLinks'

export type MenuGroupsDefault = 'collapsed' | 'expanded'

export const MENU_GROUPS_DEFAULT_KEY = 'baby-patterns-menu-groups-default'

export async function getStoredMenuGroupsDefault(): Promise<MenuGroupsDefault> {
  try {
    const stored = await AsyncStorage.getItem(MENU_GROUPS_DEFAULT_KEY)
    return stored === 'expanded' ? 'expanded' : 'collapsed'
  } catch {
    return 'collapsed'
  }
}

export async function storeMenuGroupsDefault(value: MenuGroupsDefault): Promise<void> {
  try {
    await AsyncStorage.setItem(MENU_GROUPS_DEFAULT_KEY, value)
  } catch {
    /* ignore */
  }
}

export function menuGroupsExpandedMap(
  sectionIds: NavGroupId[],
  preference: MenuGroupsDefault,
): Partial<Record<NavGroupId, boolean>> {
  if (preference !== 'expanded') return {}
  return Object.fromEntries(sectionIds.map((id) => [id, true]))
}
