import { supabase } from '@/integrations/supabase/client'
import { handleApiError } from '@/lib/error-handler'

export interface ScoreUpdate {
  id: string
  bet_id: string
  team_side: 'creator' | 'opponent'
  captain_id: string
  score_data: {
    team_score: number
    opponent_score: number
    game_progress?: string
    timestamp: string
  }
  is_confirmed: boolean
  confirmed_by?: string
  confirmation_timestamp?: string
  updated_at: string
  created_at: string
}

export interface Evidence {
  id: string
  bet_id: string
  submitted_by: string
  evidence_type: 'screenshot' | 'video' | 'score_update' | 'other'
  evidence_url?: string
  description?: string
  submitted_at: string
}

export interface Dispute {
  id: string
  bet_id: string
  raised_by: string
  dispute_type: string
  reason: string
  status: 'pending' | 'under_review' | 'resolved' | 'rejected'
  resolution?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
}

/**
 * Update score for a bet (captain only)
 */
export async function updateBetScore(
  betId: string,
  captainId: string,
  teamSide: 'creator' | 'opponent',
  scoreData: {
    team_score: number
    opponent_score: number
    game_progress?: string
  }
): Promise<{ data: ScoreUpdate | null; error: string | null }> {
  try {
    // Verify captain permissions
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('captain_creator, captain_opponent, live_tracking_enabled')
      .eq('id', betId)
      .single()

    if (betError) {
      return { data: null, error: handleApiError(betError) }
    }

    if (!bet.live_tracking_enabled) {
      return { data: null, error: 'Live tracking is not enabled for this bet' }
    }

    // Verify user is the captain for their team
    const isCaptain =
      (teamSide === 'creator' && bet.captain_creator === captainId) ||
      (teamSide === 'opponent' && bet.captain_opponent === captainId)

    if (!isCaptain) {
      return { data: null, error: 'Only team captains can update scores' }
    }

    // Create score update record
    const { data: scoreUpdate, error: scoreError } = await supabase
      .from('live_scores')
      .insert({
        bet_id: betId,
        team_side: teamSide,
        captain_id: captainId,
        score_data: {
          ...scoreData,
          timestamp: new Date().toISOString(),
        },
        is_confirmed: false,
      })
      .select()
      .single()

    if (scoreError) {
      return { data: null, error: handleApiError(scoreError) }
    }

    return { data: scoreUpdate, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Confirm opponent's score update
 */
export async function confirmScore(
  scoreUpdateId: string,
  confirmingCaptainId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get score update
    const { data: scoreUpdate, error: fetchError } = await supabase
      .from('live_scores')
      .select('*, bets!inner(captain_creator, captain_opponent)')
      .eq('id', scoreUpdateId)
      .single()

    if (fetchError) {
      return { success: false, error: handleApiError(fetchError) }
    }

    // Verify confirming captain is from opposite team
    const bet = scoreUpdate.bets
    const isOpposingCaptain =
      (scoreUpdate.team_side === 'creator' &&
        bet.captain_opponent === confirmingCaptainId) ||
      (scoreUpdate.team_side === 'opponent' &&
        bet.captain_creator === confirmingCaptainId)

    if (!isOpposingCaptain) {
      return {
        success: false,
        error: 'Only the opposing team captain can confirm scores',
      }
    }

    // Update score as confirmed
    const { error: updateError } = await supabase
      .from('live_scores')
      .update({
        is_confirmed: true,
        confirmed_by: confirmingCaptainId,
        confirmation_timestamp: new Date().toISOString(),
      })
      .eq('id', scoreUpdateId)

    if (updateError) {
      return { success: false, error: handleApiError(updateError) }
    }

    // Update bet's current score
    const { error: betUpdateError } = await supabase
      .from('bets')
      .update({
        current_score: scoreUpdate.score_data,
      })
      .eq('id', scoreUpdate.bet_id)

    if (betUpdateError) {
      return { success: false, error: handleApiError(betUpdateError) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}

/**
 * Raise a dispute for score mismatch
 */
export async function raiseDispute(
  betId: string,
  userId: string,
  reason: string,
  disputeType: string = 'score_mismatch'
): Promise<{ data: Dispute | null; error: string | null }> {
  try {
    // Verify user is a participant
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('creator_id, opponent_id')
      .eq('id', betId)
      .single()

    if (betError) {
      return { data: null, error: handleApiError(betError) }
    }

    if (bet.creator_id !== userId && bet.opponent_id !== userId) {
      return { data: null, error: 'Only bet participants can raise disputes' }
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .insert({
        bet_id: betId,
        raised_by: userId,
        dispute_type: disputeType,
        reason: reason,
        status: 'pending',
      })
      .select()
      .single()

    if (disputeError) {
      return { data: null, error: handleApiError(disputeError) }
    }

    // Update bet status to disputed
    await supabase
      .from('bets')
      .update({ status: 'disputed' })
      .eq('id', betId)

    return { data: dispute, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Submit evidence for a bet
 */
export async function submitEvidence(
  betId: string,
  userId: string,
  evidenceType: 'screenshot' | 'video' | 'score_update' | 'other',
  evidenceUrl: string,
  description?: string
): Promise<{ data: Evidence | null; error: string | null }> {
  try {
    // Verify user is a participant
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('creator_id, opponent_id')
      .eq('id', betId)
      .single()

    if (betError) {
      return { data: null, error: handleApiError(betError) }
    }

    if (bet.creator_id !== userId && bet.opponent_id !== userId) {
      return {
        data: null,
        error: 'Only bet participants can submit evidence',
      }
    }

    // Create evidence record
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .insert({
        bet_id: betId,
        submitted_by: userId,
        evidence_type: evidenceType,
        evidence_url: evidenceUrl,
        description: description,
      })
      .select()
      .single()

    if (evidenceError) {
      return { data: null, error: handleApiError(evidenceError) }
    }

    return { data: evidence, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Get live scores for a bet
 */
export async function getLiveScores(
  betId: string
): Promise<{ data: ScoreUpdate[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('live_scores')
      .select('*')
      .eq('bet_id', betId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Get latest confirmed score for a bet
 */
export async function getLatestConfirmedScore(
  betId: string
): Promise<{ data: ScoreUpdate | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('live_scores')
      .select('*')
      .eq('bet_id', betId)
      .eq('is_confirmed', true)
      .order('confirmation_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Get pending score updates (unconfirmed)
 */
export async function getPendingScores(
  betId: string
): Promise<{ data: ScoreUpdate[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('live_scores')
      .select('*')
      .eq('bet_id', betId)
      .eq('is_confirmed', false)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Get all evidence for a bet
 */
export async function getBetEvidence(
  betId: string
): Promise<{ data: Evidence[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('bet_id', betId)
      .order('submitted_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Get disputes for a bet
 */
export async function getBetDisputes(
  betId: string
): Promise<{ data: Dispute[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('bet_id', betId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Subscribe to live score updates
 */
export function subscribeToLiveScores(
  betId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`live_scores:${betId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_scores',
        filter: `bet_id=eq.${betId}`,
      },
      callback
    )
    .subscribe()
}
