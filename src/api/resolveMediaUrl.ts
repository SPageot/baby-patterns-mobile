import { getApiBaseUrl, getMediaBaseUrl } from '@/api/config'

function mediaUrlExplicit(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_MEDIA_URL?.trim())
}

export function trackingMediaPathAndQuery(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      return `${parsed.pathname}${parsed.search}`
    } catch {
      return null
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function trackingMediaUrlCandidates(url: string | null | undefined): string[] {
  const raw = url?.trim() ?? ''
  if (!raw) return []

  const path = trackingMediaPathAndQuery(raw)
  if (!path?.startsWith('/uploads/')) {
    if (/^https?:\/\//i.test(raw)) return [raw]
    const base = getApiBaseUrl()
    return base ? [`${base}${path ?? raw}`] : [raw]
  }

  const api = getApiBaseUrl()
  const media = getMediaBaseUrl()
  const bases: string[] = []

  if (mediaUrlExplicit()) {
    if (media) bases.push(media)
    if (api && api !== media) bases.push(api)
  } else {
    const apiIsLocal = Boolean(api && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(api))
    for (const base of apiIsLocal ? [api, media] : [media, api]) {
      if (base && !bases.includes(base)) bases.push(base)
    }
  }

  if (!bases.length) return [raw]
  return bases.map((base) => `${base}${path}`)
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  return trackingMediaUrlCandidates(url)[0] ?? null
}
