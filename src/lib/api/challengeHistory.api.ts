import { supabase } from '@/integrations/supabase/client';
import { ChallengeHistoryItem, HeadToHeadStats } from '@/types/social.types';
import { handleApiError } from '@/lib/error-handler';

/**
 * Get challenge history for a user
 */
export async function getChallengeHistory(
  userId: string,
  filter?: 'all' | 'won' | 'lost' | 'active' | 'cancelled'
): Promise<{ data: ChallengeHistoryItem[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('bets')
      .select(`
        id,
        game_name,
        bet_amount,
        challenge_type,
        status,
        created_at,
        updated_at,
        creator_id,
        opponent_id,
        winner_id
      `)
      .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    // Apply filter
    if (filter === 'won') {
      query = query.eq('winner_id', userId);
    } else if (filter === 'lost') {
      query = query.neq('winner_id', userId).eq('status', 'completed');
    } else if (filter === 'active') {
      query = query.in('status', ['pending', 'active']);
    } else if (filter === 'cancelled') {
      query = query.eq('status', 'cancelled');
    }

    const { data: bets, error } = await query;

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    if (!bets || bets.length === 0) {
      return { data: [], error: null };
    }

    // Transform bets into challenge history items
    const history: ChallengeHistoryItem[] = await Promise.all(
      bets.map(async (bet) => {
        // Determine opponent
        const opponentId = bet.creator_id === userId ? bet.opponent_id : bet.creator_id;

        // Get opponent profile
        const { data: opponentProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', opponentId)
          .single();

        // Determine result
        let result: ChallengeHistoryItem['result'] = 'active';
        if (bet.status === 'completed') {
          if (bet.winner_id === userId) {
            result = 'won';
          } else if (bet.winner_id) {
            result = 'lost';
          } else {
            result = 'draw';
          }
        } else if (bet.status === 'cancelled') {
          result = 'cancelled';
        }

        // Get winnings from transactions
        let winnings = 0;
        if (result === 'won') {
          const { data: transaction } = await supabase
            .from('transactions')
            .select('amount')
            .eq('bet_id', bet.id)
            .eq('user_id', userId)
            .eq('type', 'bet_won')
            .maybeSingle();

          winnings = transaction?.amount || 0;
        }

        return {
          bet_id: bet.id,
          opponent_name: opponentProfile?.full_name || 'Unknown',
          opponent_id: opponentId,
          game_name: bet.game_name,
          bet_amount: bet.bet_amount,
          challenge_type: bet.challenge_type || 'one_on_one',
          result,
          winnings: result === 'won' ? winnings : undefined,
          completed_at: bet.status === 'completed' ? bet.updated_at : undefined,
          created_at: bet.created_at,
        };
      })
    );

    return { data: history, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get head-to-head history with a specific opponent
 */
export async function getHeadToHeadHistory(
  userId: string,
  opponentId: string
): Promise<{ data: ChallengeHistoryItem[] | null; error: string | null }> {
  try {
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .or(
        `and(creator_id.eq.${userId},opponent_id.eq.${opponentId}),and(creator_id.eq.${opponentId},opponent_id.eq.${userId})`
      )
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    if (!bets || bets.length === 0) {
      return { data: [], error: null };
    }

    // Get opponent profile
    const { data: opponentProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', opponentId)
      .single();

    // Transform to history items
    const history: ChallengeHistoryItem[] = bets.map((bet) => {
      let result: ChallengeHistoryItem['result'] = 'active';
      if (bet.status === 'completed') {
        if (bet.winner_id === userId) {
          result = 'won';
        } else if (bet.winner_id === opponentId) {
          result = 'lost';
        } else {
          result = 'draw';
        }
      } else if (bet.status === 'cancelled') {
        result = 'cancelled';
      }

      return {
        bet_id: bet.id,
        opponent_name: opponentProfile?.full_name || 'Unknown',
        opponent_id: opponentId,
        game_name: bet.game_name,
        bet_amount: bet.bet_amount,
        challenge_type: bet.challenge_type || 'one_on_one',
        result,
        completed_at: bet.status === 'completed' ? bet.updated_at : undefined,
        created_at: bet.created_at,
      };
    });

    return { data: history, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get head-to-head statistics with a specific opponent
 */
export async function getHistoryStats(
  userId: string,
  opponentId: string
): Promise<{ data: HeadToHeadStats | null; error: string | null }> {
  try {
    // Get all bets between these users
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('id, status, winner_id, bet_amount, created_at')
      .or(
        `and(creator_id.eq.${userId},opponent_id.eq.${opponentId}),and(creator_id.eq.${opponentId},opponent_id.eq.${userId})`
      );

    if (betsError) {
      return { data: null, error: handleApiError(betsError) };
    }

    if (!bets || bets.length === 0) {
      return { data: null, error: 'No challenges found' };
    }

    // Get opponent profile
    const { data: opponentProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', opponentId)
      .single();

    // Calculate stats
    const completedBets = bets.filter((b) => b.status === 'completed');
    const wins = completedBets.filter((b) => b.winner_id === userId).length;
    const losses = completedBets.filter((b) => b.winner_id === opponentId).length;
    const draws = completedBets.filter((b) => !b.winner_id).length;

    // Get transactions to calculate money won/lost
    const betIds = completedBets.map((b) => b.id);
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .in('bet_id', betIds)
      .in('type', ['bet_won', 'bet_lost']);

    const totalWon = transactions
      ?.filter((t) => t.type === 'bet_won')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalLost = bets.filter((b) => b.winner_id === opponentId).reduce((sum, b) => sum + b.bet_amount, 0);

    const stats: HeadToHeadStats = {
      opponent_id: opponentId,
      opponent_name: opponentProfile?.full_name || 'Unknown',
      opponent_avatar: opponentProfile?.avatar_url,
      total_challenges: bets.length,
      wins,
      losses,
      draws,
      win_rate: completedBets.length > 0 ? (wins / completedBets.length) * 100 : 0,
      total_won: totalWon,
      total_lost: totalLost,
      net_profit: totalWon - totalLost,
      last_challenge_date: bets[0]?.created_at || '',
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Rechallenge an opponent (create new bet with same params)
 */
export async function rechallenge(
  originalBetId: string,
  userId: string
): Promise<{ data: { betId: string } | null; error: string | null }> {
  try {
    // Get original bet
    const { data: originalBet, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', originalBetId)
      .single();

    if (betError) {
      return { data: null, error: handleApiError(betError) };
    }

    // Determine opponent from original bet
    const opponentId = originalBet.creator_id === userId ? originalBet.opponent_id : originalBet.creator_id;

    // Create new bet with same parameters
    const { data: newBet, error: createError } = await supabase
      .from('bets')
      .insert({
        creator_id: userId,
        opponent_id: opponentId,
        game_name: originalBet.game_name,
        bet_amount: originalBet.bet_amount,
        game_rules: originalBet.game_rules,
        duration: originalBet.duration,
        challenge_type: originalBet.challenge_type,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      return { data: null, error: handleApiError(createError) };
    }

    // Lock escrow for creator
    await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: -originalBet.bet_amount,
      p_transaction_type: 'bet_placed',
    });

    // Update profile escrow balance
    await supabase
      .from('profiles')
      .update({
        escrow_balance: supabase.rpc('increment', { value: originalBet.bet_amount }),
      })
      .eq('user_id', userId);

    return { data: { betId: newBet.id }, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Export challenge history as CSV
 */
export async function exportChallengeHistoryCSV(
  userId: string
): Promise<{ data: string | null; error: string | null }> {
  try {
    const { data: history, error } = await getChallengeHistory(userId);

    if (error || !history) {
      return { data: null, error: error || 'No history found' };
    }

    // Generate CSV
    const headers = ['Date', 'Opponent', 'Game', 'Amount', 'Type', 'Result', 'Winnings'];
    const rows = history.map((item) => [
      new Date(item.created_at).toLocaleDateString(),
      item.opponent_name,
      item.game_name,
      `R${item.bet_amount.toFixed(2)}`,
      item.challenge_type,
      item.result,
      item.winnings ? `R${item.winnings.toFixed(2)}` : '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return { data: csv, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}
