-- Seed data for testing Betcha app
-- Creates test users, bets, evidence, and disputes

-- Note: You'll need to create users through Supabase Auth first, then insert profiles
-- For local testing, use these credentials:
-- User 1: creator@betcha.test / TestPass123!
-- User 2: opponent@betcha.test / TestPass123!

-- Example: Create users via Supabase CLI or Dashboard, then run this seed

-- Insert test profiles (replace UUIDs with actual auth.users IDs after creating users)
-- To get user IDs after creating through auth:
-- SELECT id, email FROM auth.users WHERE email IN ('creator@betcha.test', 'opponent@betcha.test');

-- For demonstration, using placeholder UUIDs
-- REPLACE THESE WITH ACTUAL USER IDs AFTER CREATING USERS

DO $$
DECLARE
  v_creator_id UUID := '00000000-0000-0000-0000-000000000001';
  v_opponent_id UUID := '00000000-0000-0000-0000-000000000002';
  v_bet_1_id UUID := gen_random_uuid();
  v_bet_2_id UUID := gen_random_uuid();
  v_bet_3_id UUID := gen_random_uuid();
  v_bet_4_id UUID := gen_random_uuid();
  v_bet_5_id UUID := gen_random_uuid();
BEGIN
  -- Note: In production, uncomment and update with real user IDs
  /*
  -- Insert profiles for test users
  INSERT INTO public.profiles (user_id, email, balance, kyc_status)
  VALUES
    (v_creator_id, 'creator@betcha.test', 500.00, 'verified'),
    (v_opponent_id, 'opponent@betcha.test', 500.00, 'verified')
  ON CONFLICT (user_id) DO UPDATE
  SET balance = EXCLUDED.balance, kyc_status = EXCLUDED.kyc_status;

  -- Insert sample bets

  -- Bet 1: Pending (waiting for opponent to accept)
  INSERT INTO public.bets (id, creator_id, opponent_id, game_name, bet_amount, game_rules, duration, status, game_rule_id)
  VALUES (
    v_bet_1_id,
    v_creator_id,
    v_opponent_id,
    'Basketball 1v1',
    25.00,
    'First to score 21 points wins. Must win by 2 points.',
    '30 minutes',
    'pending',
    'basketball_1v1'
  );

  -- Create escrow for pending bet (creator only)
  INSERT INTO public.escrow (bet_id, creator_amount, status)
  VALUES (v_bet_1_id, 25.00, 'pending');

  -- Transaction for pending bet
  INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
  VALUES (v_creator_id, -25.00, 'bet_locked', 'completed', v_bet_1_id);

  -- Bet 2: Active (both accepted, in progress)
  INSERT INTO public.bets (id, creator_id, opponent_id, game_name, bet_amount, game_rules, duration, status, game_rule_id)
  VALUES (
    v_bet_2_id,
    v_creator_id,
    v_opponent_id,
    'Push-Up Challenge',
    50.00,
    'Most push-ups in 2 minutes wins. Must have video evidence.',
    '2 minutes',
    'active',
    'pushup_challenge'
  );

  -- Escrow for active bet (both locked)
  INSERT INTO public.escrow (bet_id, creator_amount, opponent_amount, status)
  VALUES (v_bet_2_id, 50.00, 50.00, 'locked');

  -- Transactions for active bet
  INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
  VALUES
    (v_creator_id, -50.00, 'bet_locked', 'completed', v_bet_2_id),
    (v_opponent_id, -50.00, 'bet_locked', 'completed', v_bet_2_id);

  -- Evidence for active bet
  INSERT INTO public.evidence (bet_id, user_id, evidence_type, evidence_url, description, status)
  VALUES
    (v_bet_2_id, v_creator_id, 'video', '/evidence/' || v_bet_2_id || '/creator_pushups.mp4', '62 push-ups completed', 'submitted'),
    (v_bet_2_id, v_opponent_id, 'video', '/evidence/' || v_bet_2_id || '/opponent_pushups.mp4', '58 push-ups completed', 'submitted');

  -- Bet 3: Another active bet
  INSERT INTO public.bets (id, creator_id, opponent_id, game_name, bet_amount, game_rules, duration, status, game_rule_id)
  VALUES (
    v_bet_3_id,
    v_opponent_id,
    v_creator_id,
    'Chess Match',
    30.00,
    'Standard chess rules. Checkmate wins.',
    '1 hour',
    'active',
    'chess_match'
  );

  INSERT INTO public.escrow (bet_id, creator_amount, opponent_amount, status)
  VALUES (v_bet_3_id, 30.00, 30.00, 'locked');

  INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
  VALUES
    (v_opponent_id, -30.00, 'bet_locked', 'completed', v_bet_3_id),
    (v_creator_id, -30.00, 'bet_locked', 'completed', v_bet_3_id);

  -- Bet 4: Completed (creator won)
  INSERT INTO public.bets (id, creator_id, opponent_id, game_name, bet_amount, game_rules, duration, status, winner_id, game_rule_id)
  VALUES (
    v_bet_4_id,
    v_creator_id,
    v_opponent_id,
    'Spelling Bee',
    20.00,
    'Spell 10 advanced words correctly. Most correct wins.',
    '15 minutes',
    'completed',
    v_creator_id,
    'spelling_bee'
  );

  INSERT INTO public.escrow (bet_id, creator_amount, opponent_amount, status, released_at)
  VALUES (v_bet_4_id, 20.00, 20.00, 'released', NOW() - INTERVAL '2 days');

  -- Transactions for completed bet
  INSERT INTO public.transactions (user_id, amount, type, status, bet_id, created_at)
  VALUES
    (v_creator_id, -20.00, 'bet_locked', 'completed', v_bet_4_id, NOW() - INTERVAL '3 days'),
    (v_opponent_id, -20.00, 'bet_locked', 'completed', v_bet_4_id, NOW() - INTERVAL '3 days'),
    (v_creator_id, 36.00, 'bet_won', 'completed', v_bet_4_id, NOW() - INTERVAL '2 days'),
    (v_creator_id, -4.00, 'platform_fee', 'completed', v_bet_4_id, NOW() - INTERVAL '2 days'),
    (v_opponent_id, -20.00, 'bet_lost', 'completed', v_bet_4_id, NOW() - INTERVAL '2 days');

  -- Evidence for completed bet
  INSERT INTO public.evidence (bet_id, user_id, evidence_type, evidence_url, description, status, submitted_at)
  VALUES
    (v_bet_4_id, v_creator_id, 'photo', '/evidence/' || v_bet_4_id || '/creator_spelling.jpg', '10/10 words correct', 'verified', NOW() - INTERVAL '2 days'),
    (v_bet_4_id, v_opponent_id, 'photo', '/evidence/' || v_bet_4_id || '/opponent_spelling.jpg', '7/10 words correct', 'verified', NOW() - INTERVAL '2 days');

  -- Bet 5: Disputed
  INSERT INTO public.bets (id, creator_id, opponent_id, game_name, bet_amount, game_rules, duration, status, game_rule_id)
  VALUES (
    v_bet_5_id,
    v_creator_id,
    v_opponent_id,
    'Running Race',
    40.00,
    '5K run, fastest time wins. GPS tracking required.',
    '45 minutes',
    'disputed',
    'running_race'
  );

  INSERT INTO public.escrow (bet_id, creator_amount, opponent_amount, status)
  VALUES (v_bet_5_id, 40.00, 40.00, 'locked');

  INSERT INTO public.transactions (user_id, amount, type, status, bet_id)
  VALUES
    (v_creator_id, -40.00, 'bet_locked', 'completed', v_bet_5_id),
    (v_opponent_id, -40.00, 'bet_locked', 'completed', v_bet_5_id);

  -- Evidence for disputed bet
  INSERT INTO public.evidence (bet_id, user_id, evidence_type, evidence_url, description, status)
  VALUES
    (v_bet_5_id, v_creator_id, 'screenshot', '/evidence/' || v_bet_5_id || '/creator_gps.png', 'Finished in 24:32', 'submitted'),
    (v_bet_5_id, v_opponent_id, 'screenshot', '/evidence/' || v_bet_5_id || '/opponent_gps.png', 'Finished in 24:30', 'submitted');

  -- Disputes
  INSERT INTO public.disputes (bet_id, raised_by_user_id, reason, status)
  VALUES (
    v_bet_5_id,
    v_creator_id,
    'Opponent GPS data shows irregularities. Route does not match 5K distance.',
    'open'
  );

  -- Additional transactions (deposits, withdrawals)
  INSERT INTO public.transactions (user_id, amount, type, status, created_at)
  VALUES
    (v_creator_id, 500.00, 'deposit', 'completed', NOW() - INTERVAL '7 days'),
    (v_opponent_id, 500.00, 'deposit', 'completed', NOW() - INTERVAL '7 days');

  -- KYC verifications
  INSERT INTO public.kyc_verifications (user_id, status, id_front_url, id_back_url, selfie_url, submitted_at, reviewed_at)
  VALUES
    (v_creator_id, 'verified', '/kyc/' || v_creator_id || '/id_front.jpg', '/kyc/' || v_creator_id || '/id_back.jpg', '/kyc/' || v_creator_id || '/selfie.jpg', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
    (v_opponent_id, 'verified', '/kyc/' || v_opponent_id || '/id_front.jpg', '/kyc/' || v_opponent_id || '/id_back.jpg', '/kyc/' || v_opponent_id || '/selfie.jpg', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days');
  */

  RAISE NOTICE 'Seed data template created. Please:';
  RAISE NOTICE '1. Create users via Supabase Auth: creator@betcha.test, opponent@betcha.test';
  RAISE NOTICE '2. Get their user IDs from auth.users table';
  RAISE NOTICE '3. Replace placeholder UUIDs in this file';
  RAISE NOTICE '4. Uncomment the INSERT statements';
  RAISE NOTICE '5. Run this migration again';
END $$;
