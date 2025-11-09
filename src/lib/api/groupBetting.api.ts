import { supabase } from '@/integrations/supabase/client';
import { GroupChallengeData, TeamChallengeData, ChallengeResults, ChallengeParticipant, ChallengeTeam } from '@/types/social.types';
import { handleApiError } from '@/lib/error-handler';

/**
 * Create a group individual challenge (everyone competes, top 3 win)
 */
export async function createGroupIndividualChallenge(
  userId: string,
  data: GroupChallengeData
): Promise<{ data: { betId: string } | null; error: string | null }> {
  try {
    // Validate user has sufficient balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance, escrow_balance')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.wallet_balance < data.entry_fee) {
      return { data: null, error: 'Insufficient balance' };
    }

    // Create bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        creator_id: userId,
        game_name: data.game_name,
        bet_amount: data.entry_fee,
        game_rules: data.game_rules,
        duration: data.duration,
        challenge_type: 'group_individual',
        prize_distribution: { first: 50, second: 35, third: 15 },
        min_participants: data.min_participants || 3,
        max_participants: data.max_participants,
        current_participants: 1,
        is_group_challenge: true,
        status: 'pending',
      })
      .select()
      .single();

    if (betError) {
      return { data: null, error: handleApiError(betError) };
    }

    // Add creator as first participant
    await supabase.from('challenge_participants').insert({
      bet_id: bet.id,
      user_id: userId,
      entry_paid: true,
      escrow_amount: data.entry_fee,
    });

    // Lock creator's entry fee in escrow
    await supabase
      .from('profiles')
      .update({
        wallet_balance: profile.wallet_balance - data.entry_fee,
        escrow_balance: (profile.escrow_balance || 0) + data.entry_fee,
      })
      .eq('user_id', userId);

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      bet_id: bet.id,
      amount: -data.entry_fee,
      type: 'bet_placed',
      status: 'completed',
    });

    return { data: { betId: bet.id }, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Create a team vs team challenge
 */
export async function createTeamChallenge(
  userId: string,
  data: TeamChallengeData
): Promise<{ data: { betId: string } | null; error: string | null }> {
  try {
    const isTournament = data.teams.length > 2;

    // Create bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        creator_id: userId,
        game_name: data.game_name,
        bet_amount: data.entry_fee,
        game_rules: data.game_rules,
        duration: data.duration,
        challenge_type: isTournament ? 'tournament' : 'team_vs_team',
        prize_distribution: isTournament ? { first: 50, second: 35, third: 15 } : null,
        is_group_challenge: true,
        status: 'pending',
      })
      .select()
      .single();

    if (betError) {
      return { data: null, error: handleApiError(betError) };
    }

    // Create teams
    for (const team of data.teams) {
      // Create team record
      const { data: teamRecord, error: teamError } = await supabase
        .from('challenge_teams')
        .insert({
          bet_id: bet.id,
          team_name: team.name,
          team_captain_id: team.captain_id,
          member_count: team.member_ids.length,
          total_stake: team.member_ids.length * data.entry_fee,
        })
        .select()
        .single();

      if (teamError) {
        return { data: null, error: handleApiError(teamError) };
      }

      // Add team members as participants
      for (const memberId of team.member_ids) {
        await supabase.from('challenge_participants').insert({
          bet_id: bet.id,
          user_id: memberId,
          team_name: team.name,
          entry_paid: memberId === userId, // Only mark creator as paid initially
          escrow_amount: data.entry_fee,
        });

        // If it's the creator, lock their funds
        if (memberId === userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_balance, escrow_balance')
            .eq('user_id', memberId)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                wallet_balance: profile.wallet_balance - data.entry_fee,
                escrow_balance: (profile.escrow_balance || 0) + data.entry_fee,
              })
              .eq('user_id', memberId);

            await supabase.from('transactions').insert({
              user_id: memberId,
              bet_id: bet.id,
              amount: -data.entry_fee,
              type: 'bet_placed',
              status: 'completed',
            });
          }
        }
      }
    }

    return { data: { betId: bet.id }, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Create a tournament (alias for team challenge with 3+ teams)
 */
export async function createTournamentChallenge(
  userId: string,
  data: TeamChallengeData
): Promise<{ data: { betId: string } | null; error: string | null }> {
  if (data.teams.length < 3) {
    return { data: null, error: 'Tournament requires at least 3 teams' };
  }
  return createTeamChallenge(userId, data);
}

/**
 * Join a group challenge
 */
export async function joinChallenge(
  betId: string,
  userId: string,
  teamName?: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Get bet details
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .single();

    if (betError) {
      return { data: false, error: handleApiError(betError) };
    }

    // Check if challenge is full
    if (bet.max_participants && bet.current_participants >= bet.max_participants) {
      return { data: false, error: 'Challenge is full' };
    }

    // Check if user already joined
    const { data: existing } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('bet_id', betId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { data: false, error: 'Already joined this challenge' };
    }

    // Validate user has sufficient balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance, escrow_balance')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.wallet_balance < bet.bet_amount) {
      return { data: false, error: 'Insufficient balance' };
    }

    // Add participant
    await supabase.from('challenge_participants').insert({
      bet_id: betId,
      user_id: userId,
      team_name: teamName,
      entry_paid: true,
      escrow_amount: bet.bet_amount,
    });

    // Lock funds in escrow
    await supabase
      .from('profiles')
      .update({
        wallet_balance: profile.wallet_balance - bet.bet_amount,
        escrow_balance: (profile.escrow_balance || 0) + bet.bet_amount,
      })
      .eq('user_id', userId);

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      bet_id: betId,
      amount: -bet.bet_amount,
      type: 'bet_placed',
      status: 'completed',
    });

    // Update participant count
    await supabase
      .from('bets')
      .update({ current_participants: bet.current_participants + 1 })
      .eq('id', betId);

    // Update team stake if team challenge
    if (teamName) {
      const { data: team } = await supabase
        .from('challenge_teams')
        .select('total_stake')
        .eq('bet_id', betId)
        .eq('team_name', teamName)
        .single();

      if (team) {
        await supabase
          .from('challenge_teams')
          .update({ total_stake: team.total_stake + bet.bet_amount })
          .eq('bet_id', betId)
          .eq('team_name', teamName);
      }
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Leave a group challenge (only if not started)
 */
export async function leaveChallenge(
  betId: string,
  userId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Get bet status
    const { data: bet } = await supabase
      .from('bets')
      .select('status, bet_amount, current_participants')
      .eq('id', betId)
      .single();

    if (!bet || bet.status !== 'pending') {
      return { data: false, error: 'Cannot leave an active or completed challenge' };
    }

    // Get participant
    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('escrow_amount')
      .eq('bet_id', betId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return { data: false, error: 'Not a participant' };
    }

    // Remove participant
    await supabase
      .from('challenge_participants')
      .delete()
      .eq('bet_id', betId)
      .eq('user_id', userId);

    // Refund escrow
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance, escrow_balance')
      .eq('user_id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          wallet_balance: profile.wallet_balance + participant.escrow_amount,
          escrow_balance: profile.escrow_balance - participant.escrow_amount,
        })
        .eq('user_id', userId);

      // Create refund transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        bet_id: betId,
        amount: participant.escrow_amount,
        type: 'refund',
        status: 'completed',
      });
    }

    // Update participant count
    await supabase
      .from('bets')
      .update({ current_participants: bet.current_participants - 1 })
      .eq('id', betId);

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Start a group challenge (change status to active)
 */
export async function startChallenge(
  betId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Get bet
    const { data: bet } = await supabase
      .from('bets')
      .select('min_participants, current_participants')
      .eq('id', betId)
      .single();

    if (!bet) {
      return { data: false, error: 'Challenge not found' };
    }

    // Check minimum participants
    if (bet.current_participants < bet.min_participants) {
      return { data: false, error: `Need at least ${bet.min_participants} participants` };
    }

    // Update status
    await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', betId);

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Submit challenge results (for REF AI or admin)
 */
export async function submitChallengeResults(
  betId: string,
  results: ChallengeResults
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Get bet
    const { data: bet } = await supabase
      .from('bets')
      .select('challenge_type')
      .eq('id', betId)
      .single();

    if (!bet) {
      return { data: false, error: 'Challenge not found' };
    }

    // Call appropriate completion function based on challenge type
    if (bet.challenge_type === 'group_individual') {
      if (!results.rankings) {
        return { data: false, error: 'Rankings required for individual challenge' };
      }

      await supabase.rpc('complete_group_individual_challenge', {
        p_bet_id: betId,
        p_rankings: results.rankings,
      });
    } else if (bet.challenge_type === 'team_vs_team') {
      if (!results.winning_team_name) {
        return { data: false, error: 'Winning team name required' };
      }

      await supabase.rpc('complete_team_challenge_two_teams', {
        p_bet_id: betId,
        p_winning_team_name: results.winning_team_name,
      });
    } else if (bet.challenge_type === 'tournament') {
      if (!results.team_rankings) {
        return { data: false, error: 'Team rankings required for tournament' };
      }

      await supabase.rpc('complete_tournament_challenge', {
        p_bet_id: betId,
        p_team_rankings: results.team_rankings,
      });
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Get all participants for a challenge
 */
export async function getChallengeParticipants(
  betId: string
): Promise<{ data: ChallengeParticipant[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        profile:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('bet_id', betId)
      .order('joined_at', { ascending: true });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as unknown as ChallengeParticipant[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get all teams for a challenge
 */
export async function getChallengeTeams(
  betId: string
): Promise<{ data: ChallengeTeam[] | null; error: string | null }> {
  try {
    const { data: teams, error: teamsError } = await supabase
      .from('challenge_teams')
      .select('*')
      .eq('bet_id', betId)
      .order('created_at', { ascending: true });

    if (teamsError) {
      return { data: null, error: handleApiError(teamsError) };
    }

    // Get members for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members } = await supabase
          .from('challenge_participants')
          .select(`
            *,
            profile:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq('bet_id', betId)
          .eq('team_name', team.team_name);

        return {
          ...team,
          members: members as unknown as ChallengeParticipant[],
        };
      })
    );

    return { data: teamsWithMembers as ChallengeTeam[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}
