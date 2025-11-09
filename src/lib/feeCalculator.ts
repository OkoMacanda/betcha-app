/**
 * Fee Calculator for Betcha Platform
 * Ensures 10% platform fee is collected from EVERY bet
 */

export interface FeeBreakdown {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  feePercentage: number;
}

export interface StreamBetDistribution {
  totalPool: number;
  successPool: number;
  failPool: number;
  winningSide: 'success' | 'fail';
  totalFee: number;
  netPayout: number;
  winnerCount: number;
  payoutPerWinner: number;
}

/**
 * Calculate platform fee (always 10%)
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.10 * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate net payout after fee
 */
export function calculateNetPayout(grossAmount: number): FeeBreakdown {
  const platformFee = calculatePlatformFee(grossAmount);
  const netAmount = grossAmount - platformFee;

  return {
    grossAmount,
    platformFee,
    netAmount,
    feePercentage: 10,
  };
}

/**
 * Distribute winnings for standard 1v1 bet
 */
export function distributeBetPayout(
  betAmount: number,
  participantCount: number = 2
): {
  totalPot: number;
  platformFee: number;
  winnerPayout: number;
} {
  const totalPot = betAmount * participantCount;
  const platformFee = calculatePlatformFee(totalPot);
  const winnerPayout = totalPot - platformFee;

  return {
    totalPot,
    platformFee,
    winnerPayout,
  };
}

/**
 * Calculate stream bet distribution (pool betting with odds)
 * Works like a parimutuel system but with fixed 10% fee
 */
export function distributeStreamBetPayout(
  successBets: Array<{ amount: number; bettor_id: string }>,
  failBets: Array<{ amount: number; bettor_id: string }>,
  outcome: 'success' | 'fail'
): StreamBetDistribution {
  const successPool = successBets.reduce((sum, bet) => sum + bet.amount, 0);
  const failPool = failBets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalPool = successPool + failPool;

  const platformFee = calculatePlatformFee(totalPool);
  const netPayout = totalPool - platformFee;

  const winningSide = outcome;
  const winningPool = outcome === 'success' ? successPool : failPool;
  const winnerCount = outcome === 'success' ? successBets.length : failBets.length;

  // Each winner gets proportional share of net payout based on their bet
  const payoutPerWinner = winnerCount > 0 ? netPayout / winnerCount : 0;

  return {
    totalPool,
    successPool,
    failPool,
    winningSide,
    totalFee: platformFee,
    netPayout,
    winnerCount,
    payoutPerWinner,
  };
}

/**
 * Calculate individual payout for stream bet winner
 */
export function calculateStreamBetWinnerPayout(
  betAmount: number,
  totalSuccessPool: number,
  totalFailPool: number,
  outcome: 'success' | 'fail'
): number {
  const totalPool = totalSuccessPool + totalFailPool;
  const platformFee = calculatePlatformFee(totalPool);
  const netPayout = totalPool - platformFee;

  const winningPool = outcome === 'success' ? totalSuccessPool : totalFailPool;

  if (winningPool === 0) return 0;

  // Winner's share proportional to their bet
  const winnerShare = betAmount / winningPool;
  return Math.round(netPayout * winnerShare * 100) / 100;
}

/**
 * Calculate odds for stream bets in real-time
 */
export function calculateStreamOdds(
  successPool: number,
  failPool: number
): {
  successOdds: number;
  failOdds: number;
} {
  const totalPool = successPool + failPool;

  if (totalPool === 0) {
    return { successOdds: 2.0, failOdds: 2.0 }; // Even odds when no bets
  }

  const platformFeeMultiplier = 0.9; // Account for 10% fee

  // Calculate implied odds (returns per $1 bet)
  const rawSuccessOdds = totalPool / (successPool || 1);
  const rawFailOdds = totalPool / (failPool || 1);

  return {
    successOdds: Math.max(1.01, Math.round(rawSuccessOdds * platformFeeMultiplier * 100) / 100),
    failOdds: Math.max(1.01, Math.round(rawFailOdds * platformFeeMultiplier * 100) / 100),
  };
}

/**
 * Validate and calculate team bet distribution
 */
export function distributeTeamBetPayout(
  betAmount: number,
  teamASize: number,
  teamBSize: number,
  winningTeam: 'A' | 'B'
): {
  totalPot: number;
  platformFee: number;
  winningTeamPayout: number;
  perMemberPayout: number;
} {
  const totalParticipants = teamASize + teamBSize;
  const totalPot = betAmount * totalParticipants;
  const platformFee = calculatePlatformFee(totalPot);
  const winningTeamPayout = totalPot - platformFee;

  const winningTeamSize = winningTeam === 'A' ? teamASize : teamBSize;
  const perMemberPayout = winningTeamPayout / winningTeamSize;

  return {
    totalPot,
    platformFee,
    winningTeamPayout,
    perMemberPayout,
  };
}

/**
 * Calculate minimum bet to ensure meaningful payouts after fees
 */
export function calculateMinimumBet(participantCount: number): number {
  // Ensure at least $0.50 payout after 10% fee
  const minNetPayout = 0.50;
  const minGrossPot = minNetPayout / 0.9; // Account for 10% fee
  const minBetPerPerson = minGrossPot / participantCount;

  return Math.max(1, Math.ceil(minBetPerPerson * 100) / 100);
}

/**
 * Calculate potential winnings for display
 */
export function calculatePotentialWinnings(
  betAmount: number,
  participantCount: number = 2
): number {
  const totalPot = betAmount * participantCount;
  const platformFee = calculatePlatformFee(totalPot);
  return totalPot - platformFee;
}

/**
 * Breakdown fee for transparency display
 */
export function getFeeBreakdownDisplay(
  betAmount: number,
  participantCount: number = 2
): {
  yourStake: number;
  opponentStake: number;
  totalPot: number;
  platformFee: number;
  youWin: number;
  youLose: number;
} {
  const totalPot = betAmount * participantCount;
  const platformFee = calculatePlatformFee(totalPot);
  const winnerPayout = totalPot - platformFee;

  return {
    yourStake: betAmount,
    opponentStake: betAmount * (participantCount - 1),
    totalPot,
    platformFee,
    youWin: winnerPayout,
    youLose: -betAmount,
  };
}

/**
 * Validate fee calculation (for testing)
 */
export function validateFeeCalculation(
  totalPot: number,
  platformFee: number,
  winnerPayout: number
): boolean {
  const expectedFee = calculatePlatformFee(totalPot);
  const expectedPayout = totalPot - expectedFee;

  // Allow for small rounding differences
  const feeMatch = Math.abs(platformFee - expectedFee) < 0.01;
  const payoutMatch = Math.abs(winnerPayout - expectedPayout) < 0.01;

  return feeMatch && payoutMatch;
}

/**
 * Calculate refund amounts (no fees on refunds)
 */
export function calculateRefundAmounts(
  betAmount: number,
  participantCount: number
): Array<{ userId: string; refundAmount: number }> {
  // Refunds return original stake, no fees
  return Array(participantCount).fill(null).map((_, i) => ({
    userId: `user_${i}`, // Placeholder, actual IDs passed separately
    refundAmount: betAmount,
  }));
}
