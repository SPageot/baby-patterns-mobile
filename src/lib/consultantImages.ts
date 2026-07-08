import type { ImageSourcePropType } from 'react-native'

const CONSULTANT_IMAGE_ASSETS: Record<string, ImageSourcePropType> = {
  'nurture-owl-sleep': require('@/assets/consultants/nurture-owl-sleep.png'),
}

export function consultantImageSource(imageKey?: string): ImageSourcePropType | undefined {
  if (!imageKey?.trim()) return undefined
  return CONSULTANT_IMAGE_ASSETS[imageKey.trim()]
}
