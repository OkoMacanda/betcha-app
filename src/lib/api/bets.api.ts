import { supabase } from '@/integrations/supabase/client'
import { CreateBetInput, BetWithParticipants, Bet } from '@/types/bet.types'
import { handleApiError } from '@/lib/error-handler'

export async function createBet(
  creatorId: string,
  input: CreateBetInput
): Promise<{ data: Bet | null; error: string | null }> {
  try {
    let opponentId: string | null = null
    let shouldSendInvite = false

    // Look up opponent by email if provided
    if (input.opponent_email) {
      const { data: opponentProfile, error: opponentError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', input.opponent_email)
        .maybeSingle()

      if (opponentError) {
        return { data: null, error: 'Error looking up opponent' }
      }

      if (opponentProfile) {
        // User exists - check it's not the creator
        if (opponentProfile.user_id === creatorId) {
          return { data: null, error: 'You cannot create a bet against yourself' }
        }
        opponentId = opponentProfile.user_id
      } else {
        // User doesn't exist - we'll send an invite after creating the bet
        shouldSendInvite = true
      }
    }

    // Create bet (opponent_id can be null for unregistered users or open challenges)
    const betData = {
      creator_id: creatorId,
      opponent_id: opponentId,
      game_name: input.game_name,
      bet_amount: input.bet_amount,
      challenge_type: 'one_on_one',
      status: 'pending',
    }

    console.log('Creating bet with data:', betData)

    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert(betData)
      .select()
      .single()

    if (betError) {
      console.error('Bet creation error:', betError)
      console.error('Failed bet data:', betData)
      return { data: null, error: handleApiError(betError) }
    }

    // TODO: Re-enable escrow and wallet updates after debugging
    // For now, skip these steps to isolate the bet creation issue
    /*
    // Create escrow
    const { error: escrowError } = await supabase
      .from('escrow')
      .insert({
        bet_id: bet.id,
        creator_amount: input.bet_amount,
        status: 'pending',
      })

    if (escrowError) {
      await supabase.from('bets').delete().eq('id', bet.id)
      return { data: null, error: handleApiError(escrowError) }
    }

    // Update wallet balance
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: creatorId,
      p_amount: -input.bet_amount,
      p_transaction_type: 'bet_locked',
      p_bet_id: bet.id,
    })

    if (walletError) {
      await supabase.from('bets').delete().eq('id', bet.id)
      return { data: null, error: handleApiError(walletError) }
    }
    */

    // Send invite if opponent is not registered
    if (shouldSendInvite && input.opponent_email) {
      const inviteToken = crypto.randomUUID()

      // Create invite record
      await supabase
        .from('challenge_invites')
        .insert({
          bet_id: bet.id,
          inviter_id: creatorId,
          invitee_email: input.opponent_email,
          invite_method: 'email',
          invite_token: inviteToken,
          status: 'pending',
        })

      // TODO: Send actual email via email service (Resend, SendGrid, etc.)
      // For now, just log the invite link
      console.log(`Invite link: ${window.location.origin}/invite/${inviteToken}`)
    }

    return { data: bet, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function getBet(
  betId: string
): Promise<{ data: BetWithParticipants | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select(
        `
        *,
        creator:profiles!creator_id(user_id, email, full_name, username),
        opponent:profiles!opponent_id(user_id, email, full_name, username)
      `
      )
      .eq('id', betId)
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function getUserBets(
  userId: string
): Promise<{ data: BetWithParticipants[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select(
        `
        *,
        creator:profiles!creator_id(user_id, email, full_name, username),
        opponent:profiles!opponent_id(user_id, email, full_name, username)
      `
      )
      .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function acceptBet(
  betId: string,
  userId: string,
  betAmount: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Update bet status
    const { error: betError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', betId)

    if (betError) {
      return { success: false, error: handleApiError(betError) }
    }

    // Update escrow
    const { error: escrowError } = await supabase
      .from('escrow')
      .update({
        opponent_amount: betAmount,
        status: 'locked',
      })
      .eq('bet_id', betId)

    if (escrowError) {
      return { success: false, error: handleApiError(escrowError) }
    }

    // Update wallet
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: -betAmount,
      p_transaction_type: 'bet_locked',
      p_bet_id: betId,
    })

    if (walletError) {
      return { success: false, error: handleApiError(walletError) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}

export async function rejectBet(
  betId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.rpc('refund_bet', {
      p_bet_id: betId,
    })

    if (error) {
      return { success: false, error: handleApiError(error) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}

export async function completeBet(
  betId: string,
  winnerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.rpc('complete_bet', {
      p_bet_id: betId,
      p_winner_id: winnerId,
    })

    if (error) {
      return { success: false, error: handleApiError(error) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}

/**
 * Create a bet with an invite (email/SMS/in-app)
 */
export async function createBetWithInvite(
  creatorId: string,
  input: CreateBetInput & { inviteMethod?: 'email' | 'sms' | 'in_app' }
): Promise<{ data: Bet | null; error: string | null }> {
  try {
    // Create bet first
    const { data: bet, error: betError } = await createBet(creatorId, input)

    if (betError || !bet) {
      return { data: null, error: betError }
    }

    // Send invite if method specified
    if (input.inviteMethod) {
      // Import invite functions dynamically to avoid circular dependency
      const { sendEmailInvite, sendSMSInvite, sendInAppInvite } = await import('./invites.api')

      if (input.inviteMethod === 'email' && input.opponent_email) {
        await sendEmailInvite(bet.id, creatorId, input.opponent_email)
      } else if (input.inviteMethod === 'sms' && input.opponent_email) {
        // Assuming opponent_email might be phone for SMS
        await sendSMSInvite(bet.id, creatorId, input.opponent_email)
      }
    }

    return { data: bet, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

/**
 * Accept a bet via invite token
 */
export async function acceptBetViaInvite(
  inviteToken: string,
  userId: string
): Promise<{ success: boolean; betId?: string; error: string | null }> {
  try {
    // Import invite functions
    const { getInviteByToken, acceptInvite } = await import('./invites.api')

    // Get invite
    const { data: invite, error: inviteError } = await getInviteByToken(inviteToken)

    if (inviteError || !invite || !invite.bet_id) {
      return { success: false, error: inviteError || 'Invalid invite' }
    }

    // Get bet details
    const { data: bet } = await getBet(invite.bet_id)

    if (!bet) {
      return { success: false, error: 'Bet not found' }
    }

    // Accept the bet
    const { success, error } = await acceptBet(invite.bet_id, userId, bet.bet_amount)

    if (!success) {
      return { success: false, error }
    }

    // Mark invite as accepted
    await acceptInvite(inviteToken, userId)

    return { success: true, betId: invite.bet_id, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}
