export function consultantInstagramUrl(handle: string): string {
  const trimmed = handle.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const user = trimmed.replace(/^@/, '')
  return `https://instagram.com/${user}`
}

export function consultantInstagramLabel(handle: string): string {
  const trimmed = handle.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      const segment = url.pathname.replace(/^\//, '').split('/')[0]
      return segment ? `@${segment}` : trimmed
    } catch {
      return trimmed
    }
  }
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

export function consultantWebsiteUrl(website: string): string {
  const trimmed = website.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function consultantWebsiteLabel(website: string): string {
  const trimmed = website.trim()
  if (!trimmed) return ''
  return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}
