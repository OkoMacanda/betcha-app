import { BetStatusType } from '@/types/bet.types'
import { CheckCircle2, Clock, XCircle, AlertCircle, Timer } from 'lucide-react'

export const BET_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
} as const

export function getBetStatusLabel(status: BetStatusType): string {
  const labels: Record<BetStatusType, string> = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

export function getBetStatusColor(status: BetStatusType): string {
  const colors: Record<BetStatusType, string> = {
    pending: 'text-yellow-500',
    active: 'text-blue-500',
    completed: 'text-green-500',
    disputed: 'text-red-500',
    cancelled: 'text-gray-500',
  }
  return colors[status]
}

export function getBetStatusBgColor(status: BetStatusType): string {
  const colors: Record<BetStatusType, string> = {
    pending: 'bg-yellow-50 border-yellow-200',
    active: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    disputed: 'bg-red-50 border-red-200',
    cancelled: 'bg-gray-50 border-gray-200',
  }
  return colors[status]
}

export function getBetStatusIcon(status: BetStatusType) {
  const icons = {
    pending: Timer,
    active: Clock,
    completed: CheckCircle2,
    disputed: AlertCircle,
    cancelled: XCircle,
  }
  return icons[status]
}

export function canSubmitEvidence(status: BetStatusType): boolean {
  return status === BET_STATUS.ACTIVE || status === BET_STATUS.DISPUTED
}

export function canRaiseDispute(status: BetStatusType): boolean {
  return status === BET_STATUS.ACTIVE
}

export function canAcceptBet(status: BetStatusType): boolean {
  return status === BET_STATUS.PENDING
}

export function canCancelBet(status: BetStatusType): boolean {
  return status === BET_STATUS.PENDING
}
