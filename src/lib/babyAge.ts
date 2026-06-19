/** Whole years from a `YYYY-MM-DD` birthdate as of today (local calendar). */
export function ageYearsFromBirthdate(ymd: string, refDate = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const birthNoon = new Date(year, month - 1, day, 12, 0, 0)
  if (Number.isNaN(birthNoon.getTime())) return null

  let age = refDate.getFullYear() - year
  const refMonthDay = (refDate.getMonth() + 1) * 100 + refDate.getDate()
  const birthMonthDay = month * 100 + day
  if (birthMonthDay > refMonthDay) age -= 1
  return Math.max(0, age)
}

export function formatBabyAge(ymd: string): string {
  const years = ageYearsFromBirthdate(ymd)
  if (years == null) return ''
  if (years === 0) return 'Under 1 year'
  return `${years} year${years === 1 ? '' : 's'}`
}
