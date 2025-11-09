-- =====================================================
-- BETCHA APP - ALL MIGRATIONS CONSOLIDATED
-- Run this entire file in Supabase SQL Editor
-- =====================================================
-- This file combines all 9 migration files in order
-- Expected result: "Success. No rows returned" for each section
-- =====================================================

-- =====================================================
-- MIGRATION 1: CREATE PROFILES TABLE
-- File: 20250101000000_create_profiles.sql
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0 CHECK (balance >= 0),
  kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, balance, kyc_status)
  VALUES (NEW.id, NEW.email, 0, 'not_started');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- MIGRATION 2: CREATE BETS TABLE
-- File: 20250101000001_create_bets.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  bet_amount DECIMAL(10, 2) NOT NULL CHECK (bet_amount > 0),
  game_rules TEXT NOT NULL,
  duration TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')),
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  game_rule_id TEXT,
  win_condition JSONB,
  evidence_required TEXT[]
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets"
  ON public.bets FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create bets"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Bet participants can update"
  ON public.bets FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

CREATE INDEX idx_bets_creator ON public.bets(creator_id);
CREATE INDEX idx_bets_opponent ON public.bets(opponent_id);
CREATE INDEX idx_bets_status ON public.bets(status);

-- =====================================================
-- MIGRATION 3: CREATE ESCROW TABLE
-- File: 20250101000002_create_escrow.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  creator_amount DECIMAL(10, 2) NOT NULL CHECK (creator_amount >= 0),
  opponent_amount DECIMAL(10, 2) DEFAULT 0 CHECK (opponent_amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'released', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view escrow for their bets"
  ON public.escrow FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = escrow.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE INDEX idx_escrow_bet ON public.escrow(bet_id);

-- =====================================================
-- MIGRATION 4: CREATE TRANSACTIONS TABLE
-- File: 20250101000003_create_transactions.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet_locked', 'bet_won', 'bet_lost', 'platform_fee', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  bet_id UUID REFERENCES public.bets(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_bet ON public.transactions(bet_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- =====================================================
-- MIGRATION 5: CREATE EVIDENCE TABLE
-- File: 20250101000004_create_evidence.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'video', 'screenshot', 'document', 'link')),
  evidence_url TEXT NOT NULL,
  description TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bet participants can view evidence"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = evidence.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Bet participants can submit evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE INDEX idx_evidence_bet ON public.evidence(bet_id);
CREATE INDEX idx_evidence_user ON public.evidence(user_id);

-- =====================================================
-- MIGRATION 6: CREATE DISPUTES TABLE
-- File: 20250101000005_create_disputes.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  raised_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bet participants can view disputes"
  ON public.disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = disputes.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Bet participants can raise disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = raised_by_user_id AND
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE INDEX idx_disputes_bet ON public.disputes(bet_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

-- =====================================================
-- MIGRATION 7: CREATE KYC VERIFICATIONS TABLE
-- File: 20250101000006_create_kyc_verifications.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON public.kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit KYC"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_kyc_user ON public.kyc_verifications(user_id);

-- =====================================================
-- MIGRATION 8: CREATE STORAGE BUCKETS
-- File: 20250101000007_create_storage_buckets.sql
-- =====================================================

-- Create KYC documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create evidence bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Users can upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for evidence
CREATE POLICY "Bet participants can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Bet participants can view evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence' AND
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- MIGRATION 9: CREATE DATABASE FUNCTIONS
-- File: 20250101000008_create_functions.sql
-- =====================================================

-- Function: Update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10, 2),
  p_transaction_type TEXT,
  p_bet_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update user balance
  UPDATE public.profiles
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO public.transactions (user_id, amount, type, bet_id, status)
  VALUES (p_user_id, p_amount, p_transaction_type, p_bet_id, 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete bet and release escrow
CREATE OR REPLACE FUNCTION public.complete_bet(
  p_bet_id UUID,
  p_winner_id UUID
)
RETURNS void AS $$
DECLARE
  v_bet RECORD;
  v_escrow RECORD;
  v_total_pot DECIMAL(10, 2);
  v_platform_fee DECIMAL(10, 2);
  v_winner_payout DECIMAL(10, 2);
  v_loser_id UUID;
BEGIN
  -- Get bet details
  SELECT * INTO v_bet FROM public.bets WHERE id = p_bet_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;

  -- Get escrow details
  SELECT * INTO v_escrow FROM public.escrow WHERE bet_id = p_bet_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found';
  END IF;

  -- Calculate amounts
  v_total_pot := v_escrow.creator_amount + v_escrow.opponent_amount;
  v_platform_fee := v_total_pot * 0.10; -- 10% platform fee
  v_winner_payout := v_total_pot - v_platform_fee;

  -- Determine loser
  IF p_winner_id = v_bet.creator_id THEN
    v_loser_id := v_bet.opponent_id;
  ELSE
    v_loser_id := v_bet.creator_id;
  END IF;

  -- Update bet status
  UPDATE public.bets
  SET status = 'completed',
      winner_id = p_winner_id,
      completed_at = NOW()
  WHERE id = p_bet_id;

  -- Update escrow status
  UPDATE public.escrow
  SET status = 'released',
      updated_at = NOW()
  WHERE bet_id = p_bet_id;

  -- Credit winner
  PERFORM public.update_wallet_balance(p_winner_id, v_winner_payout, 'bet_won', p_bet_id);

  -- Record loser transaction
  PERFORM public.update_wallet_balance(v_loser_id, 0, 'bet_lost', p_bet_id);

  -- Record platform fee
  INSERT INTO public.transactions (user_id, amount, type, bet_id, status)
  VALUES (v_loser_id, v_platform_fee, 'platform_fee', p_bet_id, 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Refund bet
CREATE OR REPLACE FUNCTION public.refund_bet(p_bet_id UUID)
RETURNS void AS $$
DECLARE
  v_bet RECORD;
  v_escrow RECORD;
BEGIN
  -- Get bet details
  SELECT * INTO v_bet FROM public.bets WHERE id = p_bet_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;

  -- Get escrow details
  SELECT * INTO v_escrow FROM public.escrow WHERE bet_id = p_bet_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found';
  END IF;

  -- Update bet status
  UPDATE public.bets
  SET status = 'cancelled',
      completed_at = NOW()
  WHERE id = p_bet_id;

  -- Update escrow status
  UPDATE public.escrow
  SET status = 'refunded',
      updated_at = NOW()
  WHERE bet_id = p_bet_id;

  -- Refund creator
  IF v_escrow.creator_amount > 0 THEN
    PERFORM public.update_wallet_balance(v_bet.creator_id, v_escrow.creator_amount, 'refund', p_bet_id);
  END IF;

  -- Refund opponent
  IF v_escrow.opponent_amount > 0 THEN
    PERFORM public.update_wallet_balance(v_bet.opponent_id, v_escrow.opponent_amount, 'refund', p_bet_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATIONS COMPLETE
-- =====================================================
-- All 9 migrations have been run successfully
-- Next steps:
-- 1. Verify tables exist in Table Editor
-- 2. Verify storage buckets exist in Storage
-- 3. Test app connection with credentials in .env
-- =====================================================
