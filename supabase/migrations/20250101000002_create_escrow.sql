-- Create escrow table
CREATE TABLE IF NOT EXISTS public.escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  creator_amount DECIMAL(10, 2) NOT NULL CHECK (creator_amount > 0),
  opponent_amount DECIMAL(10, 2) CHECK (opponent_amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'released', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  CONSTRAINT unique_bet_escrow UNIQUE (bet_id)
);

-- Enable Row Level Security
ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Bet participants can view escrow"
  ON public.escrow FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = escrow.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Bet participants can insert escrow"
  ON public.escrow FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = escrow.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Bet participants can update escrow"
  ON public.escrow FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = escrow.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

-- Index
CREATE INDEX idx_escrow_bet_id ON public.escrow(bet_id);
CREATE INDEX idx_escrow_status ON public.escrow(status);
