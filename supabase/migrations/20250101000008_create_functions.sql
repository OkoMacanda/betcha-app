-- Database functions for bet management

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10, 2),
  p_transaction_type TEXT,
  p_bet_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update profile balance
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
  VALUES (p_user_id, p_amount, p_transaction_type, 'completed', p_bet_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate payout (bet amount * 2 - 10% platform fee)
CREATE OR REPLACE FUNCTION public.calculate_payout(p_bet_amount DECIMAL(10, 2))
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (p_bet_amount * 2) * 0.9; -- 10% platform fee
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to complete a bet and distribute funds
CREATE OR REPLACE FUNCTION public.complete_bet(
  p_bet_id UUID,
  p_winner_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_bet_amount DECIMAL(10, 2);
  v_creator_id UUID;
  v_opponent_id UUID;
  v_payout DECIMAL(10, 2);
  v_platform_fee DECIMAL(10, 2);
BEGIN
  -- Get bet details
  SELECT bet_amount, creator_id, opponent_id
  INTO v_bet_amount, v_creator_id, v_opponent_id
  FROM public.bets
  WHERE id = p_bet_id;

  -- Calculate payout and fee
  v_payout := public.calculate_payout(v_bet_amount);
  v_platform_fee := (v_bet_amount * 2) - v_payout;

  -- Update bet status and winner
  UPDATE public.bets
  SET status = 'completed', winner_id = p_winner_id
  WHERE id = p_bet_id;

  -- Update escrow status
  UPDATE public.escrow
  SET status = 'released', released_at = NOW()
  WHERE bet_id = p_bet_id;

  -- Pay winner
  PERFORM public.update_wallet_balance(p_winner_id, v_payout, 'bet_won', p_bet_id);

  -- Record platform fee
  INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
  VALUES (p_winner_id, -v_platform_fee, 'platform_fee', 'completed', p_bet_id);

  -- Record loser transaction
  IF p_winner_id = v_creator_id THEN
    INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
    VALUES (v_opponent_id, -v_bet_amount, 'bet_lost', 'completed', p_bet_id);
  ELSE
    INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
    VALUES (v_creator_id, -v_bet_amount, 'bet_lost', 'completed', p_bet_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refund a cancelled bet
CREATE OR REPLACE FUNCTION public.refund_bet(p_bet_id UUID)
RETURNS VOID AS $$
DECLARE
  v_bet_amount DECIMAL(10, 2);
  v_creator_id UUID;
  v_opponent_id UUID;
  v_escrow_status TEXT;
BEGIN
  -- Get bet and escrow details
  SELECT b.bet_amount, b.creator_id, b.opponent_id, e.status
  INTO v_bet_amount, v_creator_id, v_opponent_id, v_escrow_status
  FROM public.bets b
  JOIN public.escrow e ON e.bet_id = b.id
  WHERE b.id = p_bet_id;

  -- Update bet and escrow status
  UPDATE public.bets SET status = 'cancelled' WHERE id = p_bet_id;
  UPDATE public.escrow SET status = 'refunded', released_at = NOW() WHERE bet_id = p_bet_id;

  -- Refund creator
  PERFORM public.update_wallet_balance(v_creator_id, v_bet_amount, 'refund', p_bet_id);

  -- Refund opponent if they had locked funds
  IF v_escrow_status = 'locked' THEN
    PERFORM public.update_wallet_balance(v_opponent_id, v_bet_amount, 'refund', p_bet_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
