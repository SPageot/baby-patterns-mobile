import { ageYearsFromBirthdate } from '@/lib/babyAge'

export type UserAccountFields = {
  username: string
  password: string
  email: string
  phone: string
  birthdate: string
  fullName: string
  location: string
}

export type UserSignup = UserAccountFields

export type User = UserAccountFields & {
  id: string
  avatarUrl?: string
  weeklySummaryEmailEnabled?: boolean
  isPro?: boolean
  isSiteDeveloper?: boolean
  hasProAccess?: boolean
  subscriptionStatus?: string
  proBillingInterval?: string | null
  proCurrentPeriodEnd?: string | null
  legalPolicyVersion?: string | null
}

export type BabySignup = {
  userId: string
  fullName: string
  age: number | null
  birthdate: string
  locationBorn: string
  currentLocation: string
  weight: number | null
  height: number | null
}

export type Baby = BabySignup & {
  id: string
  isShared?: boolean
  sharedFromUsername?: string
  sharedFromFullName?: string
}

export type UserUpdate = {
  id: string
  username?: string
  password?: string
  email?: string
  phone?: string
  birthdate?: string
  fullName?: string
  location?: string
  avatarUrl?: string
  weeklySummaryEmailEnabled?: boolean
}

export type LoginCredentials = {
  username: string
  password: string
}

export const INVALID_LOGIN_CREDENTIALS_MESSAGE = 'Username/password is incorrect.'

export type ValidationIssue = {
  path: string
  message: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INVALID_BIRTHDATE_VALUES = new Set(['0001-01-01', '0000-00-00', '-infinity', 'infinity'])

export const MIN_USER_AGE_YEARS = 18
export const EARLIEST_BIRTHDATE_YMD = '1900-01-01'

function isValidDateYmd(ymd: string): boolean {
  if (!DATE_RE.test(ymd)) return false
  const d = new Date(ymd + 'T12:00:00')
  return !Number.isNaN(d.getTime())
}

export function isValidBirthdateYmd(ymd: string): boolean {
  const trimmed = ymd.trim()
  if (!trimmed || INVALID_BIRTHDATE_VALUES.has(trimmed.toLowerCase())) return false
  return isValidDateYmd(trimmed)
}

function todayAtNoon(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
}

export function latestUserBirthdateYmd(now = new Date()): string {
  const y = now.getFullYear() - MIN_USER_AGE_YEARS
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function validateUserBirthdate(ymd: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const trimmed = ymd.trim()

  if (!isValidBirthdateYmd(trimmed)) {
    issues.push({ path: 'birthdate', message: 'Valid birthdate (YYYY-MM-DD) is required' })
    return issues
  }

  const birthNoon = new Date(`${trimmed}T12:00:00`)
  const todayNoon = todayAtNoon()
  if (birthNoon > todayNoon) {
    issues.push({ path: 'birthdate', message: 'Birthdate cannot be in the future' })
    return issues
  }

  const youngestAllowed = new Date(todayNoon)
  youngestAllowed.setFullYear(youngestAllowed.getFullYear() - MIN_USER_AGE_YEARS)
  if (birthNoon > youngestAllowed) {
    issues.push({
      path: 'birthdate',
      message: `You must be at least ${MIN_USER_AGE_YEARS} years old to create an account`,
    })
  }

  return issues
}

export function validateBabyBirthdate(ymd: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const trimmed = ymd.trim()

  if (!isValidBirthdateYmd(trimmed)) {
    issues.push({ path: 'birthdate', message: 'Valid birthdate (YYYY-MM-DD) is required' })
    return issues
  }

  const birthNoon = new Date(`${trimmed}T12:00:00`)
  if (birthNoon > todayAtNoon()) {
    issues.push({ path: 'birthdate', message: 'Birthdate cannot be in the future' })
  }

  return issues
}

export function validateLogin(data: LoginCredentials): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!data.username.trim()) issues.push({ path: 'username', message: 'Username is required' })
  if (!data.password) issues.push({ path: 'password', message: 'Password is required' })
  return issues
}

export function validateUserSignupStep1(
  data: Pick<UserSignup, 'username' | 'password' | 'email'>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!data.username.trim() || data.username.trim().length < 2) {
    issues.push({ path: 'username', message: 'Username must be at least 2 characters' })
  }
  if (!data.password || data.password.length < 8) {
    issues.push({ path: 'password', message: 'Password must be at least 8 characters' })
  }
  if (!data.email.trim() || !EMAIL_RE.test(data.email.trim())) {
    issues.push({ path: 'email', message: 'Valid email is required' })
  }
  return issues
}

export function validateUserSignupStep2(
  data: Pick<UserSignup, 'phone' | 'fullName' | 'birthdate' | 'location'>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!data.phone.trim() || data.phone.trim().length < 7) {
    issues.push({ path: 'phone', message: 'Valid phone number is required' })
  }
  if (!data.fullName.trim()) issues.push({ path: 'fullName', message: 'Full name is required' })
  issues.push(...validateUserBirthdate(data.birthdate))
  if (!data.location.trim()) issues.push({ path: 'location', message: 'Location is required' })
  return issues
}

export function validateUserSignup(data: UserSignup): ValidationIssue[] {
  return [...validateUserSignupStep1(data), ...validateUserSignupStep2(data)]
}

export function validateBabySignup(data: BabySignup): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!data.fullName.trim()) issues.push({ path: 'fullName', message: 'Full name is required' })
  issues.push(...validateBabyBirthdate(data.birthdate))
  if (!data.locationBorn.trim()) {
    issues.push({ path: 'locationBorn', message: 'Location born is required' })
  }
  if (!data.currentLocation.trim()) {
    issues.push({ path: 'currentLocation', message: 'Current location is required' })
  }
  return issues
}

export function validateUserUpdate(data: UserUpdate): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (data.phone !== undefined) {
    if (!data.phone.trim() || data.phone.trim().length < 7) {
      issues.push({ path: 'phone', message: 'Valid phone number is required' })
    }
  }
  if (data.fullName !== undefined && !data.fullName.trim()) {
    issues.push({ path: 'fullName', message: 'Full name is required' })
  }
  if (data.birthdate !== undefined && data.birthdate.trim()) {
    issues.push(...validateUserBirthdate(data.birthdate))
  }
  if (data.location !== undefined && !data.location.trim()) {
    issues.push({ path: 'location', message: 'Location is required' })
  }

  return issues
}

export function normalizeLoginCredentials(data: LoginCredentials): LoginCredentials {
  return { username: data.username.trim(), password: data.password }
}

export function normalizeUserSignup(data: UserSignup): UserSignup {
  return {
    username: data.username.trim(),
    password: data.password,
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    birthdate: data.birthdate.trim(),
    fullName: data.fullName.trim(),
    location: data.location.trim(),
  }
}

export function normalizeBabySignup(data: BabySignup): BabySignup {
  const birthdate = data.birthdate.trim()
  return {
    userId: data.userId.trim(),
    fullName: data.fullName.trim(),
    age: ageYearsFromBirthdate(birthdate),
    birthdate,
    locationBorn: data.locationBorn.trim(),
    currentLocation: data.currentLocation.trim(),
    weight: data.weight == null ? null : Number(data.weight),
    height: data.height == null ? null : Number(data.height),
  }
}
