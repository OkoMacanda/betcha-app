import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscrowRequest {
  action: 'lock_funds' | 'release_funds' | 'refund_funds';
  betId: string;
  creatorId?: string;
  opponentId?: string;
  betAmount?: number;
  winnerId?: string;
  escrowId?: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const requestData: EscrowRequest = await req.json();
    const { action, ...params } = requestData;

    let response;

    switch (action) {
      case 'lock_funds':
        response = await lockFunds(supabaseClient, params);
        break;

      case 'release_funds':
        response = await releaseFunds(supabaseClient, params);
        break;

      case 'refund_funds':
        response = await refundFunds(supabaseClient, params);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error in escrow-manager:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function lockFunds(supabase: any, params: any) {
  const { betId, creatorId, opponentId, betAmount } = params;

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

    // 3. Deduct from both wallets using RPC function
    const { error: deductCreatorError } = await supabase.rpc('deduct_from_wallet', {
      user_id: creatorId,
      amount: betAmount,
    });

    if (deductCreatorError) {
      // Rollback escrow creation
      await supabase.from('escrow_holds').delete().eq('id', escrow.id);
      throw deductCreatorError;
    }

    const { error: deductOpponentError } = await supabase.rpc('deduct_from_wallet', {
      user_id: opponentId,
      amount: betAmount,
    });

    if (deductOpponentError) {
      // Rollback both escrow and creator deduction
      await supabase.rpc('add_to_wallet', { user_id: creatorId, amount: betAmount });
      await supabase.from('escrow_holds').delete().eq('id', escrow.id);
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

    // 5. Update bet with escrow_id and set to active
    await supabase
      .from('bets')
      .update({
        escrow_id: escrow.id,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', betId);

    return { success: true, escrowId: escrow.id };
  } catch (error) {
    console.error('Error locking funds:', error);
    return { success: false, error: error.message };
  }
}

async function releaseFunds(supabase: any, params: any) {
  const { betId, winnerId, escrowId } = params;

  try {
    // 1. Get escrow details
    const { data: escrow, error: escrowFetchError } = await supabase
      .from('escrow_holds')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (escrowFetchError) throw escrowFetchError;

    if (!escrow || escrow.status !== 'locked') {
      return { success: false, error: 'Invalid or already released escrow' };
    }

    // 2. Calculate payout with 10% platform fee
    const totalPot = escrow.total_amount;
    const platformFee = totalPot * 0.10; // 10% fee
    const winnerPayout = totalPot - platformFee;

    // 3. Use database function to process payout
    const { data: payoutResult, error: payoutError } = await supabase.rpc(
      'process_bet_payout',
      {
        bet_id: betId,
        winner_id: winnerId,
      }
    );

    if (payoutError) throw payoutError;

    return {
      success: true,
      payout: {
        totalPot,
        platformFee,
        winnerPayout,
        feePercentage: 10,
      },
    };
  } catch (error) {
    console.error('Error releasing funds:', error);
    return { success: false, error: error.message };
  }
}

async function refundFunds(supabase: any, params: any) {
  const { betId, escrowId, reason } = params;

  try {
    // Use database function to process refund
    const { error: refundError } = await supabase.rpc('refund_bet', {
      bet_id: betId,
      refund_reason: reason || 'Bet cancelled',
    });

    if (refundError) throw refundError;

    return { success: true };
  } catch (error) {
    console.error('Error refunding funds:', error);
    return { success: false, error: error.message };
  }
}
