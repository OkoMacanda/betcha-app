-- =============================================
-- BETCHA CORE FEATURES MIGRATION
-- Adds: Escrow, Evidence, Disputes, REF AI, Streams, Teams, KYC
-- Version: 1.0.0
-- Date: 2025-10-08
-- =============================================

-- =============================================
-- 1. CREATE NEW TABLES
-- =============================================

-- Evidence submissions for bet verification
CREATE TABLE IF NOT EXISTS public.evidence_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'score_sheet', 'text', 'number')),
  file_url TEXT,
  file_hash TEXT, -- SHA256 hash for tamper detection
  metadata JSONB DEFAULT '{}', -- timestamps, GPS, device info
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Dispute management
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  opened_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  evidence_refs UUID[] DEFAULT ARRAY[]::UUID[], -- Array of evidence_submission IDs
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- REF AI decision logs
CREATE TABLE IF NOT EXISTS public.ref_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('auto_resolve', 'needs_evidence', 'dispute_required', 'manual_review')),
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  winner_id UUID REFERENCES auth.users(id),
  evidence_analyzed UUID[] DEFAULT ARRAY[]::UUID[],
  reasoning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Escrow holds for bet funds
CREATE TABLE IF NOT EXISTS public.escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'refunded')),
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  released_to UUID REFERENCES auth.users(id),
  refund_reason TEXT
);

-- Teams for group competitions
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_count INTEGER DEFAULT 1 NOT NULL,
  total_bets INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Team membership
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Live streams integration
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram')),
  stream_id TEXT NOT NULL, -- Platform's stream ID
  stream_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'ended', 'cancelled')),
  viewer_count INTEGER DEFAULT 0,
  bet_enabled BOOLEAN DEFAULT true,
  total_bets_placed INTEGER DEFAULT 0,
  total_bet_amount DECIMAL(10,2) DEFAULT 0.00,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Viewer bets on live streams
CREATE TABLE IF NOT EXISTS public.stream_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE NOT NULL,
  bettor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('success', 'fail')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  odds DECIMAL(5,2) NOT NULL,
  potential_payout DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  payout_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- KYC verifications
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('jumio', 'onfido', 'manual')),
  verification_id TEXT, -- Provider's verification ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified', 'rejected', 'expired')),
  document_type TEXT, -- passport, drivers_license, national_id
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- 2. MODIFY EXISTING TABLES
-- =============================================

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00;

-- Add new columns to bets
ALTER TABLE public.bets
  ADD COLUMN IF NOT EXISTS escrow_id UUID REFERENCES public.escrow_holds(id),
  ADD COLUMN IF NOT EXISTS evidence_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ref_decision_id UUID REFERENCES public.ref_decisions(id),
  ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2) DEFAULT 0.00;

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.evidence_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Evidence Submissions Policies
CREATE POLICY "Users can view evidence for their bets"
  ON public.evidence_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = evidence_submissions.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Users can submit evidence for their bets"
  ON public.evidence_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

-- Disputes Policies
CREATE POLICY "Users can view disputes for their bets"
  ON public.disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = disputes.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes for their bets"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by
    AND EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

-- REF Decisions Policies (Read-only for users)
CREATE POLICY "Users can view REF decisions for their bets"
  ON public.ref_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = ref_decisions.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

-- Escrow Holds Policies (Read-only for users)
CREATE POLICY "Users can view escrow for their bets"
  ON public.escrow_holds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = escrow_holds.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

-- Teams Policies
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Team Members Policies
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team admins can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave teams"
  ON public.team_members FOR DELETE
  USING (user_id = auth.uid());

-- Live Streams Policies
CREATE POLICY "Anyone can view live streams"
  ON public.live_streams FOR SELECT
  TO authenticated
  USING (status = 'live' OR creator_id = auth.uid());

CREATE POLICY "Users can create live streams"
  ON public.live_streams FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their streams"
  ON public.live_streams FOR UPDATE
  USING (auth.uid() = creator_id);

-- Stream Bets Policies
CREATE POLICY "Users can view their own stream bets"
  ON public.stream_bets FOR SELECT
  USING (auth.uid() = bettor_id);

CREATE POLICY "Users can place stream bets"
  ON public.stream_bets FOR INSERT
  WITH CHECK (auth.uid() = bettor_id);

-- KYC Verifications Policies
CREATE POLICY "Users can view their own KYC status"
  ON public.kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC verification"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. DATABASE FUNCTIONS
-- =============================================

-- Function to deduct from wallet
CREATE OR REPLACE FUNCTION public.deduct_from_wallet(
  user_id UUID,
  amount DECIMAL(10,2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Get current balance with row lock
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE profiles.user_id = deduct_from_wallet.user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct amount
  UPDATE profiles
  SET wallet_balance = wallet_balance - amount
  WHERE profiles.user_id = deduct_from_wallet.user_id;

  RETURN TRUE;
END;
$$;

-- Function to add to wallet
CREATE OR REPLACE FUNCTION public.add_to_wallet(
  user_id UUID,
  amount DECIMAL(10,2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET wallet_balance = wallet_balance + amount
  WHERE profiles.user_id = add_to_wallet.user_id;

  RETURN TRUE;
END;
$$;

-- Function to calculate and distribute bet payout with 10% platform fee
CREATE OR REPLACE FUNCTION public.process_bet_payout(
  bet_id UUID,
  winner_id UUID
)
RETURNS TABLE(
  winner_payout DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  total_pot DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet_amount DECIMAL(10,2);
  v_total_pot DECIMAL(10,2);
  v_platform_fee DECIMAL(10,2);
  v_winner_payout DECIMAL(10,2);
  v_escrow_id UUID;
BEGIN
  -- Get bet details
  SELECT bet_amount, escrow_id INTO v_bet_amount, v_escrow_id
  FROM bets
  WHERE bets.id = process_bet_payout.bet_id;

  -- Calculate payouts (10% platform fee)
  v_total_pot := v_bet_amount * 2; -- Both players contributed
  v_platform_fee := v_total_pot * 0.10;
  v_winner_payout := v_total_pot - v_platform_fee;

  -- Credit winner
  PERFORM add_to_wallet(process_bet_payout.winner_id, v_winner_payout);

  -- Update escrow
  UPDATE escrow_holds
  SET status = 'released',
      released_at = now(),
      released_to = process_bet_payout.winner_id
  WHERE id = v_escrow_id;

  -- Update bet
  UPDATE bets
  SET status = 'completed',
      winner_id = process_bet_payout.winner_id,
      platform_fee_amount = v_platform_fee,
      completed_at = now()
  WHERE bets.id = process_bet_payout.bet_id;

  -- Return payout details
  RETURN QUERY SELECT v_winner_payout, v_platform_fee, v_total_pot;
END;
$$;

-- Function to refund bet on dispute or cancellation
CREATE OR REPLACE FUNCTION public.refund_bet(
  bet_id UUID,
  refund_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_opponent_id UUID;
  v_bet_amount DECIMAL(10,2);
  v_escrow_id UUID;
BEGIN
  -- Get bet details
  SELECT creator_id, opponent_id, bet_amount, escrow_id
  INTO v_creator_id, v_opponent_id, v_bet_amount, v_escrow_id
  FROM bets
  WHERE bets.id = refund_bet.bet_id;

  -- Refund both users
  PERFORM add_to_wallet(v_creator_id, v_bet_amount);
  PERFORM add_to_wallet(v_opponent_id, v_bet_amount);

  -- Update escrow
  UPDATE escrow_holds
  SET status = 'refunded',
      released_at = now(),
      refund_reason = refund_bet.refund_reason
  WHERE id = v_escrow_id;

  -- Update bet
  UPDATE bets
  SET status = 'cancelled',
      completed_at = now()
  WHERE bets.id = refund_bet.bet_id;

  -- Create refund transaction records
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES
    (v_creator_id, refund_bet.bet_id, v_bet_amount, 'refund', 'completed'),
    (v_opponent_id, refund_bet.bet_id, v_bet_amount, 'refund', 'completed');

  RETURN TRUE;
END;
$$;

-- Function to update team member count
CREATE OR REPLACE FUNCTION public.update_team_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE teams
    SET member_count = member_count + 1
    WHERE id = NEW.team_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE teams
    SET member_count = member_count - 1
    WHERE id = OLD.team_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to auto-update team member count
CREATE TRIGGER update_team_member_count_trigger
AFTER INSERT OR DELETE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_team_member_count();

-- Function to set evidence deadline when bet becomes active
CREATE OR REPLACE FUNCTION public.set_evidence_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    NEW.evidence_deadline := now() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to set evidence deadline
CREATE TRIGGER set_evidence_deadline_trigger
BEFORE UPDATE ON public.bets
FOR EACH ROW EXECUTE FUNCTION public.set_evidence_deadline();

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================

-- Evidence submissions indexes
CREATE INDEX IF NOT EXISTS idx_evidence_bet_id ON public.evidence_submissions(bet_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submitted_by ON public.evidence_submissions(submitted_by);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_bet_id ON public.disputes(bet_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- REF decisions indexes
CREATE INDEX IF NOT EXISTS idx_ref_decisions_bet_id ON public.ref_decisions(bet_id);

-- Escrow holds indexes
CREATE INDEX IF NOT EXISTS idx_escrow_bet_id ON public.escrow_holds(bet_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_holds(status);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Live streams indexes
CREATE INDEX IF NOT EXISTS idx_streams_creator_id ON public.live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON public.live_streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_platform ON public.live_streams(platform);

-- Stream bets indexes
CREATE INDEX IF NOT EXISTS idx_stream_bets_stream_id ON public.stream_bets(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_bets_bettor_id ON public.stream_bets(bettor_id);

-- KYC verifications indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_verifications(status);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
