import type { ImagePickerAsset } from 'expo-image-picker'

export type AvatarUploadPayload = {
  uri: string
  name: string
  type: string
}

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif'])

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
])

function fileExtension(name: string): string {
  const trimmed = name.trim()
  const dot = trimmed.lastIndexOf('.')
  if (dot <= 0 || dot === trimmed.length - 1) return ''
  return trimmed.slice(dot + 1).toLowerCase()
}

export function isAllowedAvatarAsset(asset: ImagePickerAsset): boolean {
  const type = (asset.mimeType ?? '').trim().toLowerCase()
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'avatar.jpg'
  const ext = fileExtension(name)

  if (ext && ALLOWED_EXTENSIONS.has(ext)) return true
  if (type && ALLOWED_MIME_TYPES.has(type)) return true
  return type.startsWith('image/') && type !== 'image/svg+xml'
}

export function prepareAvatarUpload(asset: ImagePickerAsset): AvatarUploadPayload {
  if (!isAllowedAvatarAsset(asset)) {
    throw new Error('Photo must be JPG, PNG, GIF, WEBP, HEIC, HEIF, or AVIF.')
  }

  const name = asset.fileName ?? `avatar.${fileExtension(asset.uri) || 'jpg'}`
  const type = asset.mimeType?.trim() || 'image/jpeg'

  return {
    uri: asset.uri,
    name,
    type,
  }
}
