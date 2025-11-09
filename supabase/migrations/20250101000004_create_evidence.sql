-- Create evidence table
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'video', 'screenshot', 'document')),
  evidence_url TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = evidence.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own evidence"
  ON public.evidence FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_evidence_bet_id ON public.evidence(bet_id);
CREATE INDEX idx_evidence_user_id ON public.evidence(user_id);
CREATE INDEX idx_evidence_submitted_at ON public.evidence(submitted_at DESC);
