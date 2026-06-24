import type { ValidationIssue } from '@/schemas/user'
import type { TrackingMediaType } from '@/types/growth'

/** Daily memory returned from the API. */
export type DailyMemory = {
  id: string
  babyId: string
  memoryDate: string
  title: string | null
  content: string
  mediaUrl: string | null
  mediaType: TrackingMediaType | null
  createdAt: string
  updatedAt: string | null
}

/** Create or update payload (no server timestamps). */
export type DailyMemoryWrite = {
  id?: string
  babyId: string
  memoryDate: string
  title?: string | null
  content: string
}

/** Form state for the daily memory modal. */
export type DailyMemoryFormState = {
  babyId: string
  memoryDate: string
  title: string
  content: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_TITLE_LENGTH = 120
const MAX_CONTENT_LENGTH = 2000

function isValidDateYmd(ymd: string): boolean {
  if (!DATE_RE.test(ymd)) return false
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12, 0, 0)
  return !Number.isNaN(date.getTime()) && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export function emptyDailyMemoryFormState(memoryDate = ''): DailyMemoryFormState {
  return {
    babyId: '',
    memoryDate,
    title: '',
    content: '',
  }
}

export function dailyMemoryToFormState(memory: DailyMemory): DailyMemoryFormState {
  return {
    babyId: memory.babyId,
    memoryDate: memory.memoryDate,
    title: memory.title?.trim() ?? '',
    content: memory.content,
  }
}

export function formStateToDailyMemoryWrite(
  state: DailyMemoryFormState,
  id?: string,
): DailyMemoryWrite {
  return {
    id,
    babyId: state.babyId.trim(),
    memoryDate: state.memoryDate.trim(),
    title: state.title.trim() || null,
    content: state.content.trim(),
  }
}

export function normalizeDailyMemoryWrite(data: DailyMemoryWrite): DailyMemoryWrite {
  return {
    id: data.id?.trim() || undefined,
    babyId: data.babyId.trim(),
    memoryDate: data.memoryDate.trim(),
    title: data.title?.trim() || null,
    content: data.content.trim(),
  }
}

export function validateDailyMemory(data: DailyMemoryWrite): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!data.babyId.trim()) {
    issues.push({ path: 'babyId', message: 'Baby is required' })
  }

  if (!data.memoryDate.trim() || !isValidDateYmd(data.memoryDate.trim())) {
    issues.push({ path: 'memoryDate', message: 'Valid memory date (YYYY-MM-DD) is required' })
  } else {
    const memoryNoon = new Date(`${data.memoryDate.trim()}T12:00:00`)
    const todayNoon = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0)
    if (memoryNoon > todayNoon) {
      issues.push({ path: 'memoryDate', message: 'Memory date cannot be in the future' })
    }
  }

  const title = data.title?.trim() ?? ''
  if (title.length > MAX_TITLE_LENGTH) {
    issues.push({ path: 'title', message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` })
  }

  if (!data.content.trim()) {
    issues.push({ path: 'content', message: 'Describe what your baby did' })
  } else if (data.content.trim().length > MAX_CONTENT_LENGTH) {
    issues.push({ path: 'content', message: `Memory must be ${MAX_CONTENT_LENGTH} characters or fewer` })
  }

  return issues
}

export function fieldError(issues: ValidationIssue[], path: string): string | undefined {
  return issues.find((issue) => issue.path === path)?.message
}
