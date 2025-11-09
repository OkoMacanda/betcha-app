import { Dispute } from './database.types'
import { Bet } from './bet.types'

// Dispute status enum
export const DisputeStatus = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
} as const

export type DisputeStatusType = (typeof DisputeStatus)[keyof typeof DisputeStatus]

// Dispute with bet details
export interface DisputeWithDetails extends Dispute {
  bet?: Bet
  raised_by?: {
    email: string
    user_id: string
  }
}

// Input for raising a dispute
export interface DisputeInput {
  bet_id: string
  reason: string
}

// Input for resolving a dispute
export interface DisputeResolution {
  dispute_id: string
  resolution: string
  winner_id?: string
}

// Helper functions
export function getDisputeStatusLabel(status: DisputeStatusType): string {
  const labels: Record<DisputeStatusType, string> = {
    open: 'Open',
    under_review: 'Under Review',
    resolved: 'Resolved',
  }
  return labels[status]
}

export function isDisputeOpen(status: DisputeStatusType): boolean {
  return status === DisputeStatus.OPEN
}

export function isDisputeUnderReview(status: DisputeStatusType): boolean {
  return status === DisputeStatus.UNDER_REVIEW
}

export function isDisputeResolved(status: DisputeStatusType): boolean {
  return status === DisputeStatus.RESOLVED
}

export function canUpdateDispute(status: DisputeStatusType): boolean {
  return status !== DisputeStatus.RESOLVED
}
