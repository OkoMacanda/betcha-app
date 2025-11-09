-- Create bets table
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  bet_amount DECIMAL(10, 2) NOT NULL CHECK (bet_amount > 0),
  game_rules TEXT,
  duration TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')),
  winner_id UUID REFERENCES auth.users(id),
  game_rule_id TEXT,
  win_condition JSONB,
  evidence_required TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_participants CHECK (creator_id != opponent_id)
);

-- Enable Row Level Security
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Bet participants can view bets"
  ON public.bets FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

CREATE POLICY "Creators can insert bets"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Participants can update bets"
  ON public.bets FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Indexes for performance
CREATE INDEX idx_bets_creator ON public.bets(creator_id);
CREATE INDEX idx_bets_opponent ON public.bets(opponent_id);
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_bets_created_at ON public.bets(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
