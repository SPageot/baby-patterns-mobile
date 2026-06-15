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
}

export type LoginCredentials = {
  username: string
  password: string
}

export type ValidationIssue = {
  path: string
  message: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidDateYmd(ymd: string): boolean {
  if (!DATE_RE.test(ymd)) return false
  const d = new Date(ymd + 'T12:00:00')
  return !Number.isNaN(d.getTime())
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
  if (!data.birthdate.trim() || !isValidDateYmd(data.birthdate.trim())) {
    issues.push({ path: 'birthdate', message: 'Valid birthdate is required' })
  }
  if (!data.location.trim()) issues.push({ path: 'location', message: 'Location is required' })
  return issues
}

export function validateBabySignup(data: BabySignup): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!data.fullName.trim()) issues.push({ path: 'fullName', message: 'Full name is required' })
  if (!data.birthdate.trim() || !isValidDateYmd(data.birthdate.trim())) {
    issues.push({ path: 'birthdate', message: 'Valid birthdate is required' })
  }
  if (!data.locationBorn.trim()) {
    issues.push({ path: 'locationBorn', message: 'Location born is required' })
  }
  if (!data.currentLocation.trim()) {
    issues.push({ path: 'currentLocation', message: 'Current location is required' })
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
  return {
    userId: data.userId.trim(),
    fullName: data.fullName.trim(),
    age: data.age == null ? null : Number(data.age),
    birthdate: data.birthdate.trim(),
    locationBorn: data.locationBorn.trim(),
    currentLocation: data.currentLocation.trim(),
    weight: data.weight == null ? null : Number(data.weight),
    height: data.height == null ? null : Number(data.height),
  }
}
