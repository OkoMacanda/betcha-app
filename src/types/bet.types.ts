import { Bet } from './database.types'

// Bet status enum
export const BetStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
} as const

export type BetStatusType = (typeof BetStatus)[keyof typeof BetStatus]

// Bet with participant details
export interface BetWithParticipants extends Bet {
  creator: {
    email: string
    user_id?: string
  } | null
  opponent: {
    email: string
    user_id?: string
  } | null
}

// Input for creating a new bet
export interface CreateBetInput {
  opponent_email: string
  game_name: string
  bet_amount: number
  game_rules: string
  duration: string
  game_rule_id?: string | null
  win_condition?: Record<string, any> | null
  evidence_required?: string[] | null
}

// Helper functions
export function isBetActive(status: BetStatusType): boolean {
  return status === BetStatus.ACTIVE || status === BetStatus.DISPUTED
}

export function isBetPending(status: BetStatusType): boolean {
  return status === BetStatus.PENDING
}

export function isBetCompleted(status: BetStatusType): boolean {
  return status === BetStatus.COMPLETED
}

export function isBetCancelled(status: BetStatusType): boolean {
  return status === BetStatus.CANCELLED
}

export function canUserModifyBet(bet: Bet, userId: string): boolean {
  return bet.creator_id === userId || bet.opponent_id === userId
}

export function canSubmitEvidence(status: BetStatusType): boolean {
  return status === BetStatus.ACTIVE || status === BetStatus.DISPUTED
}

export function canRaiseDispute(status: BetStatusType): boolean {
  return status === BetStatus.ACTIVE
}

export function isUserBetCreator(bet: Bet, userId: string): boolean {
  return bet.creator_id === userId
}

export function isUserBetOpponent(bet: Bet, userId: string): boolean {
  return bet.opponent_id === userId
}

export function getBetOpponentId(bet: Bet, userId: string): string {
  return bet.creator_id === userId ? bet.opponent_id : bet.creator_id
}

export function calculatePotentialWinnings(betAmount: number): {
  totalPot: number
  winnings: number
  platformFee: number
} {
  const totalPot = betAmount * 2
  const platformFee = totalPot * 0.1 // 10% platform fee
  const winnings = totalPot - platformFee

  return {
    totalPot,
    winnings,
    platformFee,
  }
}
