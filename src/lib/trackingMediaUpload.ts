import type { ImagePickerAsset } from 'expo-image-picker'

import type { TrackingMediaType } from '@/types/growth'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov'])

export type TrackingMediaUploadPayload = {
  uri: string
  name: string
  type: string
  mediaType: TrackingMediaType
}

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0] ?? uri
  const dot = clean.lastIndexOf('.')
  if (dot < 0) return ''
  return clean.slice(dot).toLowerCase()
}

function mimeFromExtension(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.mov':
      return 'video/quicktime'
    default:
      return 'application/octet-stream'
  }
}

export function isAllowedTrackingMediaAsset(asset: ImagePickerAsset): boolean {
  const ext = extensionFromUri(asset.uri)
  if (IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext)) return true
  const mime = asset.mimeType?.toLowerCase() ?? ''
  return mime.startsWith('image/') || mime.startsWith('video/')
}

export function prepareTrackingMediaUpload(asset: ImagePickerAsset): TrackingMediaUploadPayload {
  const ext = extensionFromUri(asset.uri)
  const isVideo = asset.type === 'video' || VIDEO_EXTENSIONS.has(ext)
  const mediaType: TrackingMediaType = isVideo ? 'video' : 'image'
  const safeExt = ext || (isVideo ? '.mp4' : '.jpg')
  const type = asset.mimeType?.trim() || mimeFromExtension(safeExt)
  const name = `tracking-${Date.now()}${safeExt}`

  return {
    uri: asset.uri,
    name,
    type,
    mediaType,
  }
}
