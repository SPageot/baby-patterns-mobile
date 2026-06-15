export { getBabyId } from '@/lib/appStore'

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL ?? ''
  return url.replace(/\/$/, '')
}

export function getMediaBaseUrl(): string {
  const media = process.env.EXPO_PUBLIC_MEDIA_URL ?? ''
  const trimmed = media.replace(/\/$/, '')
  if (trimmed) return trimmed
  return getApiBaseUrl()
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0
}
