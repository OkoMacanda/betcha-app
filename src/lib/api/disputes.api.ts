import { supabase } from '@/integrations/supabase/client'
import { DisputeInput } from '@/types/dispute.types'
import { Dispute } from '@/types/database.types'
import { handleApiError } from '@/lib/error-handler'

export async function raiseDispute(
  userId: string,
  input: DisputeInput
): Promise<{ data: Dispute | null; error: string | null }> {
  try {
    // Create dispute
    const { data, error } = await supabase
      .from('disputes')
      .insert({
        bet_id: input.bet_id,
        raised_by_user_id: userId,
        reason: input.reason,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    // Update bet status to disputed
    const { error: betError } = await supabase
      .from('bets')
      .update({ status: 'disputed' })
      .eq('id', input.bet_id)

    if (betError) {
      return { data: null, error: handleApiError(betError) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

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

    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function resolveDispute(
  disputeId: string,
  resolution: string,
  betId?: string,
  winnerId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Update dispute
    const { error: disputeError } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    if (disputeError) {
      return { success: false, error: handleApiError(disputeError) }
    }

    // If winner declared, complete the bet
    if (betId && winnerId) {
      const { error: betError } = await supabase.rpc('complete_bet', {
        p_bet_id: betId,
        p_winner_id: winnerId,
      })

      if (betError) {
        return { success: false, error: handleApiError(betError) }
      }
    } else if (betId) {
      // Just update bet status back to active if no winner
      const { error: betError } = await supabase
        .from('bets')
        .update({ status: 'active' })
        .eq('id', betId)

      if (betError) {
        return { success: false, error: handleApiError(betError) }
      }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}
