import { Platform } from 'react-native'

let installed = false

/**
 * Previously monkey-patched Text/TextInput for Roboto. RN 0.85+ and react-native-web
 * expose those exports as read-only getters, so typography is applied via appFont()
 * in component styles instead.
 */
export function installAppTypography(): void {
  if (installed) return
  installed = true
  if (Platform.OS === 'web') return
}
