export type BabyAgeParts = {
  years: number
  months: number
}

function parseBirthdateYmd(ymd: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const birthNoon = new Date(year, month - 1, day, 12, 0, 0)
  if (Number.isNaN(birthNoon.getTime())) return null

  return { year, month, day }
}

/** Whole years from a `YYYY-MM-DD` birthdate as of today (local calendar). */
export function ageYearsFromBirthdate(ymd: string, refDate = new Date()): number | null {
  const parts = ageYearsMonthsFromBirthdate(ymd, refDate)
  return parts?.years ?? null
}

/** Years and months from a `YYYY-MM-DD` birthdate as of the reference date (local calendar). */
export function ageYearsMonthsFromBirthdate(ymd: string, refDate = new Date()): BabyAgeParts | null {
  const birth = parseBirthdateYmd(ymd)
  if (!birth) return null

  let totalMonths =
    (refDate.getFullYear() - birth.year) * 12 + (refDate.getMonth() + 1 - birth.month)
  if (refDate.getDate() < birth.day) totalMonths -= 1

  if (totalMonths < 0) return { years: 0, months: 0 }

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  }
}

export function formatBabyAgeParts(parts: BabyAgeParts): string {
  const { years, months } = parts

  if (years === 0 && months === 0) return 'Less than 1 month'

  const yearPart =
    years > 0 ? `${years} year${years === 1 ? '' : 's'}` : ''
  const monthPart =
    months > 0 ? `${months} month${months === 1 ? '' : 's'}` : ''

  if (yearPart && monthPart) return `${yearPart}, ${monthPart}`
  return yearPart || monthPart
}

export function formatBabyAge(ymd: string, refDate = new Date()): string {
  const parts = ageYearsMonthsFromBirthdate(ymd, refDate)
  if (!parts) return ''
  return formatBabyAgeParts(parts)
}
