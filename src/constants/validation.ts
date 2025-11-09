// Validation rules and helper functions

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidBetAmount(amount: number): boolean {
  return amount > 0 && amount <= 10000 // Max $10,000 per bet
}

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export function isValidPassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const FILE_SIZE_LIMITS = {
  KYC: 5 * 1024 * 1024, // 5MB
  EVIDENCE: 50 * 1024 * 1024, // 50MB
}

export const MIN_BET_AMOUNT = 1
export const MAX_BET_AMOUNT = 10000

export const MIN_WITHDRAWAL_AMOUNT = 10
export const MAX_WITHDRAWAL_AMOUNT = 10000

export const PLATFORM_FEE_PERCENT = 10
