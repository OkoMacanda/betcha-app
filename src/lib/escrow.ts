import { supabase } from '@/integrations/supabase/client';

export interface EscrowHold {
  id: string;
  bet_id: string;
  total_amount: number;
  status: 'locked' | 'released' | 'refunded';
  locked_at: string;
  released_at?: string;
  released_to?: string;
}

export interface PayoutBreakdown {
  totalPot: number;
  platformFee: number;
  winnerPayout: number;
  feePercentage: number;
  breakdown: {
    gross: number;
    fee: number;
    net: number;
  };
}

/**
 * Calculate payout with 10% platform fee
 * Fee is ALWAYS 10% of total pot, not just winner's share
 */
export function calculatePayout(
  betAmount: number,
  participantCount: number = 2
): PayoutBreakdown {
  const totalPot = betAmount * participantCount;
  const platformFee = totalPot * 0.10; // 10% of entire pot
  const winnerPayout = totalPot - platformFee;

  return {
    totalPot,
    platformFee,
    winnerPayout,
    feePercentage: 10,
    breakdown: {
      gross: totalPot,
      fee: platformFee,
      net: winnerPayout,
    },
  };
}

/**
 * Lock funds in escrow when bet is accepted
 */
export async function lockFunds(
  betId: string,
  creatorId: string,
  opponentId: string,
  betAmount: number
): Promise<{ success: boolean; escrowId?: string; error?: string }> {
  try {
    // 1. Verify both users have sufficient balance
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', creatorId)
      .single();

    const { data: opponentProfile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', opponentId)
      .single();

    if (!creatorProfile || creatorProfile.wallet_balance < betAmount) {
      return { success: false, error: 'Creator has insufficient balance' };
    }

    if (!opponentProfile || opponentProfile.wallet_balance < betAmount) {
      return { success: false, error: 'Opponent has insufficient balance' };
    }

    // 2. Create escrow hold
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_holds')
      .insert({
        bet_id: betId,
        total_amount: betAmount * 2,
        status: 'locked',
      })
      .select()
      .single();

    if (escrowError) throw escrowError;

    // 3. Deduct from both wallets
    const { error: deductCreatorError } = await supabase.rpc('deduct_from_wallet', {
      user_id: creatorId,
      amount: betAmount,
    });

    if (deductCreatorError) throw deductCreatorError;

    const { error: deductOpponentError } = await supabase.rpc('deduct_from_wallet', {
      user_id: opponentId,
      amount: betAmount,
    });

    if (deductOpponentError) {
      // Rollback creator deduction
      await supabase.rpc('add_to_wallet', {
        user_id: creatorId,
        amount: betAmount,
      });
      throw deductOpponentError;
    }

    // 4. Create transaction records
    await supabase.from('transactions').insert([
      {
        user_id: creatorId,
        bet_id: betId,
        amount: -betAmount,
        type: 'bet_placed',
        status: 'completed',
      },
      {
        user_id: opponentId,
        bet_id: betId,
        amount: -betAmount,
        type: 'bet_placed',
        status: 'completed',
      },
    ]);

    // 5. Update bet with escrow_id
    await supabase
      .from('bets')
      .update({ escrow_id: escrow.id, status: 'active' })
      .eq('id', betId);

    return { success: true, escrowId: escrow.id };
  } catch (error) {
    console.error('Error locking funds:', error);
    return { success: false, error: 'Failed to lock funds in escrow' };
  }
}

/**
 * Release funds to winner with 10% platform fee deduction
 */
export async function releaseFunds(
  betId: string,
  winnerId: string,
  escrowId: string
): Promise<{ success: boolean; payout?: PayoutBreakdown; error?: string }> {
  try {
    // 1. Get escrow details
    const { data: escrow } = await supabase
      .from('escrow_holds')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (!escrow || escrow.status !== 'locked') {
      return { success: false, error: 'Invalid or already released escrow' };
    }

    // 2. Calculate payout
    const payout = calculatePayout(escrow.total_amount / 2, 2);

    // 3. Update escrow status
    await supabase
      .from('escrow_holds')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        released_to: winnerId,
      })
      .eq('id', escrowId);

    // 4. Credit winner
    await supabase.rpc('add_to_wallet', {
      user_id: winnerId,
      amount: payout.winnerPayout,
    });

    // 5. Record transactions
    await supabase.from('transactions').insert([
      {
        user_id: winnerId,
        bet_id: betId,
        amount: payout.winnerPayout,
        type: 'bet_won',
        status: 'completed',
      },
      {
        user_id: 'platform', // Special platform user ID
        bet_id: betId,
        amount: payout.platformFee,
        type: 'platform_fee',
        status: 'completed',
      },
    ]);

    // 6. Update bet record
    await supabase
      .from('bets')
      .update({
        status: 'completed',
        winner_id: winnerId,
        platform_fee_amount: payout.platformFee,
        completed_at: new Date().toISOString(),
      })
      .eq('id', betId);

    return { success: true, payout };
  } catch (error) {
    console.error('Error releasing funds:', error);
    return { success: false, error: 'Failed to release escrow funds' };
  }
}

/**
 * Refund funds to both parties (e.g., on dispute or cancellation)
 */
export async function refundFunds(
  betId: string,
  escrowId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get escrow and bet details
    const { data: escrow } = await supabase
      .from('escrow_holds')
      .select('*')
      .eq('id', escrowId)
      .single();

    const { data: bet } = await supabase
      .from('bets')
      .select('creator_id, opponent_id, bet_amount')
      .eq('id', betId)
      .single();

    if (!escrow || !bet) {
      return { success: false, error: 'Escrow or bet not found' };
    }

    // 2. Update escrow status
    await supabase
      .from('escrow_holds')
      .update({
        status: 'refunded',
        released_at: new Date().toISOString(),
        refund_reason: reason,
      })
      .eq('id', escrowId);

    // 3. Refund both users
    await supabase.rpc('add_to_wallet', {
      user_id: bet.creator_id,
      amount: bet.bet_amount,
    });

    await supabase.rpc('add_to_wallet', {
      user_id: bet.opponent_id,
      amount: bet.bet_amount,
    });

    // 4. Record refund transactions
    await supabase.from('transactions').insert([
      {
        user_id: bet.creator_id,
        bet_id: betId,
        amount: bet.bet_amount,
        type: 'refund',
        status: 'completed',
      },
      {
        user_id: bet.opponent_id,
        bet_id: betId,
        amount: bet.bet_amount,
        type: 'refund',
        status: 'completed',
      },
    ]);

    // 5. Update bet status
    await supabase
      .from('bets')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', betId);

    return { success: true };
  } catch (error) {
    console.error('Error refunding funds:', error);
    return { success: false, error: 'Failed to refund escrow funds' };
  }
}

/**
 * Validate bet amount against user balance and limits
 */
export function validateBetAmount(
  amount: number,
  userBalance: number,
  withdrawalLimit: number = 1000
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Bet amount must be greater than zero' };
  }

  if (amount > userBalance) {
    return { valid: false, error: 'Insufficient wallet balance' };
  }

  if (amount < 1) {
    return { valid: false, error: 'Minimum bet amount is $1' };
  }

  if (amount > 10000) {
    return { valid: false, error: 'Maximum bet amount is $10,000' };
  }

  return { valid: true };
}

/**
 * Get escrow status for a bet
 */
export async function getEscrowStatus(
  betId: string
): Promise<{ success: boolean; escrow?: EscrowHold; error?: string }> {
  try {
    const { data: bet } = await supabase
      .from('bets')
      .select('escrow_id')
      .eq('id', betId)
      .single();

    if (!bet?.escrow_id) {
      return { success: false, error: 'No escrow found for this bet' };
    }

    const { data: escrow, error } = await supabase
      .from('escrow_holds')
      .select('*')
      .eq('id', bet.escrow_id)
      .single();

    if (error) throw error;

    return { success: true, escrow };
  } catch (error) {
    console.error('Error getting escrow status:', error);
    return { success: false, error: 'Failed to retrieve escrow status' };
  }
}
