import { Transaction } from './database.types'
import { Bet } from './bet.types'

// Transaction type enum
export const TransactionType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  BET_LOCKED: 'bet_locked',
  BET_WON: 'bet_won',
  BET_LOST: 'bet_lost',
  PLATFORM_FEE: 'platform_fee',
  REFUND: 'refund',
} as const

export type TransactionTypeValue = (typeof TransactionType)[keyof typeof TransactionType]

// Transaction status enum
export const TransactionStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type TransactionStatusType = (typeof TransactionStatus)[keyof typeof TransactionStatus]

// Transaction with bet details
export interface TransactionWithBet extends Transaction {
  bet?: Bet
}

// Helper functions
export function formatTransactionType(type: TransactionTypeValue): string {
  const labels: Record<TransactionTypeValue, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    bet_locked: 'Bet Locked',
    bet_won: 'Bet Won',
    bet_lost: 'Bet Lost',
    platform_fee: 'Platform Fee',
    refund: 'Refund',
  }
  return labels[type]
}

export function formatTransactionStatus(status: TransactionStatusType): string {
  const labels: Record<TransactionStatusType, string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
  }
  return labels[status]
}

export function isTransactionPositive(type: TransactionTypeValue, amount: number): boolean {
  const positiveTypes: TransactionTypeValue[] = [
    TransactionType.DEPOSIT,
    TransactionType.BET_WON,
    TransactionType.REFUND,
  ]
  return positiveTypes.includes(type) && amount > 0
}

export function isTransactionNegative(type: TransactionTypeValue, amount: number): boolean {
  const negativeTypes: TransactionTypeValue[] = [
    TransactionType.WITHDRAWAL,
    TransactionType.BET_LOCKED,
    TransactionType.BET_LOST,
    TransactionType.PLATFORM_FEE,
  ]
  return negativeTypes.includes(type) || amount < 0
}

export function getTransactionSign(type: TransactionTypeValue, amount: number): '+' | '-' | '' {
  if (isTransactionPositive(type, amount)) return '+'
  if (isTransactionNegative(type, amount)) return '-'
  return ''
}

export function formatTransactionAmount(
  type: TransactionTypeValue,
  amount: number
): string {
  const sign = getTransactionSign(type, amount)
  const absAmount = Math.abs(amount).toFixed(2)
  return `${sign}$${absAmount}`
}
