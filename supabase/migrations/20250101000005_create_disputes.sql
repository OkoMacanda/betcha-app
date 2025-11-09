-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  raised_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = disputes.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
    AND auth.uid() = raised_by_user_id
  );

CREATE POLICY "Admins can update disputes"
  ON public.disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = disputes.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX idx_disputes_bet_id ON public.disputes(bet_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_created_at ON public.disputes(created_at DESC);
