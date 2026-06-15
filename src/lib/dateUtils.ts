export function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function isoLocalYmd(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function parseDatetimeLocalValue(value: string, zone: 'local' | 'utc' = 'local'): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value.trim())
  if (!m) {
    const parsed = new Date(value.trim())
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const h = Number(m[4] ?? 0)
  const min = Number(m[5] ?? 0)
  return zone === 'utc' ? new Date(Date.UTC(y, mo, d, h, min, 0, 0)) : new Date(y, mo, d, h, min, 0, 0)
}

export function formatDatetimeLocalValue(date: Date, zone: 'local' | 'utc' = 'local'): string {
  if (zone === 'utc') {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatDateValue(date: Date, zone: 'local' | 'utc' = 'local'): string {
  if (zone === 'utc') {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function wallClockFromPicker(date: Date, mode: 'date' | 'datetime'): string {
  const y = date.getFullYear()
  const mo = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  if (mode === 'date') return `${y}-${mo}-${d}`
  return `${y}-${mo}-${d}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function wallClockToPicker(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value.trim())
  if (!m) return new Date()
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0), 0, 0)
}

export function formatPickerLabel(value: string, mode: 'date' | 'datetime', zone: 'local' | 'utc' = 'local'): string {
  if (!value.trim()) return ''
  const date = zone === 'utc' ? wallClockToPicker(value) : parseDatetimeLocalValue(value, zone)
  if (Number.isNaN(date.getTime())) return value
  if (mode === 'date') {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (zone === 'utc') {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value.trim())
    if (m) {
      const utcDate = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0)))
      return `${utcDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · ${utcDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} UTC`
    }
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export { wallClockFromPicker, wallClockToPicker }