-- ================================================
-- BETCHA SOCIAL & GROUP BETTING FEATURES
-- Migration: Social features, group betting, contacts, invites
-- Date: 2025-01-15
-- ================================================

-- ================================================
-- SECTION 1: CONTACTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_avatar_url TEXT,

  -- Linked user (if they're on the platform)
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Import source
  source TEXT NOT NULL CHECK (source IN ('phone', 'email', 'challenged', 'manual')),

  -- Stats
  total_challenges INTEGER DEFAULT 0,
  wins_against INTEGER DEFAULT 0,
  losses_against INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_user_contact_phone UNIQUE(user_id, contact_phone),
  CONSTRAINT unique_user_contact_email UNIQUE(user_id, contact_email)
);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_linked_user ON contacts(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(contact_phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(contact_email);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);

-- RLS for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
CREATE POLICY "Users can insert own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- SECTION 2: FRIEND GROUPS
-- ================================================

CREATE TABLE IF NOT EXISTS friend_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,

  member_count INTEGER DEFAULT 0,
  total_challenges INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for friend_groups
CREATE INDEX IF NOT EXISTS idx_friend_groups_owner ON friend_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_friend_groups_name ON friend_groups(name);

-- RLS for friend_groups
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view groups they own or are members of" ON friend_groups;
CREATE POLICY "Users can view groups they own or are members of" ON friend_groups
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = friend_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON friend_groups;
CREATE POLICY "Users can create groups" ON friend_groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own groups" ON friend_groups;
CREATE POLICY "Users can update own groups" ON friend_groups
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own groups" ON friend_groups;
CREATE POLICY "Users can delete own groups" ON friend_groups
  FOR DELETE USING (auth.uid() = owner_id);

-- ================================================
-- SECTION 3: GROUP MEMBERS
-- ================================================

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES friend_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_group_member UNIQUE(group_id, user_id)
);

-- Indexes for group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- RLS for group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON group_members;
CREATE POLICY "Users can view members of groups they belong to" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = group_members.group_id
      AND (
        friend_groups.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members gm2
          WHERE gm2.group_id = friend_groups.id
          AND gm2.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Group owners can add members" ON group_members;
CREATE POLICY "Group owners can add members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = group_members.group_id
      AND friend_groups.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group owners can remove members" ON group_members;
CREATE POLICY "Group owners can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = group_members.group_id
      AND friend_groups.owner_id = auth.uid()
    )
  );

-- ================================================
-- SECTION 4: CHALLENGE INVITES
-- ================================================

CREATE TABLE IF NOT EXISTS challenge_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE,

  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_phone TEXT,
  invitee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  invite_method TEXT NOT NULL CHECK (invite_method IN ('email', 'sms', 'in_app')),
  invite_token TEXT UNIQUE,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  responded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for challenge_invites
CREATE INDEX IF NOT EXISTS idx_challenge_invites_bet ON challenge_invites(bet_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_inviter ON challenge_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_invitee_user ON challenge_invites(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_token ON challenge_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_status ON challenge_invites(status);

-- RLS for challenge_invites
ALTER TABLE challenge_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invites they sent or received" ON challenge_invites;
CREATE POLICY "Users can view invites they sent or received" ON challenge_invites
  FOR SELECT USING (
    auth.uid() = inviter_id OR
    auth.uid() = invitee_user_id
  );

DROP POLICY IF EXISTS "Users can create invites" ON challenge_invites;
CREATE POLICY "Users can create invites" ON challenge_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can update invites they received" ON challenge_invites;
CREATE POLICY "Users can update invites they received" ON challenge_invites
  FOR UPDATE USING (auth.uid() = invitee_user_id);

-- ================================================
-- SECTION 5: CHALLENGE PARTICIPANTS
-- ================================================

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT, -- NULL for individual competition
  entry_paid BOOLEAN DEFAULT false,
  escrow_amount DECIMAL(10, 2) DEFAULT 0,
  final_rank INTEGER, -- 1, 2, 3, etc.
  payout_amount DECIMAL(10, 2) DEFAULT 0,

  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_bet_participant UNIQUE(bet_id, user_id)
);

-- Indexes for challenge_participants
CREATE INDEX IF NOT EXISTS idx_challenge_participants_bet ON challenge_participants(bet_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_team ON challenge_participants(team_name);

-- RLS for challenge_participants
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants of challenges they're in" ON challenge_participants;
CREATE POLICY "Users can view participants of challenges they're in" ON challenge_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp2
      WHERE cp2.bet_id = challenge_participants.bet_id
      AND cp2.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = challenge_participants.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave challenges" ON challenge_participants;
CREATE POLICY "Users can leave challenges" ON challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- SECTION 6: CHALLENGE TEAMS
-- ================================================

CREATE TABLE IF NOT EXISTS challenge_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_captain_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  total_stake DECIMAL(10, 2) DEFAULT 0,
  final_rank INTEGER, -- 1, 2, 3 (after challenge completes)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_bet_team_name UNIQUE(bet_id, team_name)
);

-- Indexes for challenge_teams
CREATE INDEX IF NOT EXISTS idx_challenge_teams_bet ON challenge_teams(bet_id);
CREATE INDEX IF NOT EXISTS idx_challenge_teams_captain ON challenge_teams(team_captain_id);

-- RLS for challenge_teams
ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view teams of challenges they're in" ON challenge_teams;
CREATE POLICY "Users can view teams of challenges they're in" ON challenge_teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_participants.bet_id = challenge_teams.bet_id
      AND challenge_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team captains can create teams" ON challenge_teams;
CREATE POLICY "Team captains can create teams" ON challenge_teams
  FOR INSERT WITH CHECK (auth.uid() = team_captain_id);

-- ================================================
-- SECTION 7: UPDATE EXISTING TABLES
-- ================================================

-- Add columns to bets table
ALTER TABLE bets ADD COLUMN IF NOT EXISTS challenge_type TEXT DEFAULT 'one_on_one'
  CHECK (challenge_type IN ('one_on_one', 'group_individual', 'team_vs_team', 'tournament'));
ALTER TABLE bets ADD COLUMN IF NOT EXISTS prize_distribution JSONB;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 2;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS invited_via UUID REFERENCES challenge_invites(id);
ALTER TABLE bets ADD COLUMN IF NOT EXISTS is_group_challenge BOOLEAN DEFAULT false;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES friend_groups(id);

-- Add columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS escrow_balance DECIMAL(10, 2) DEFAULT 0;

-- Add constraints (drop first if exists to avoid errors)
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS wallet_balance_non_negative;
  ALTER TABLE profiles ADD CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance >= 0);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS escrow_balance_non_negative;
  ALTER TABLE profiles ADD CONSTRAINT escrow_balance_non_negative CHECK (escrow_balance >= 0);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ================================================
-- SECTION 8: PLATFORM WALLET
-- ================================================

CREATE TABLE IF NOT EXISTS platform_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance DECIMAL(12, 2) DEFAULT 0,
  total_fees_collected DECIMAL(12, 2) DEFAULT 0,
  total_payouts DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initialize platform wallet
INSERT INTO platform_wallet (balance)
VALUES (0)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- SECTION 9: DATABASE FUNCTIONS
-- ================================================

-- FUNCTION: Complete Group Individual Challenge
CREATE OR REPLACE FUNCTION complete_group_individual_challenge(
  p_bet_id UUID,
  p_rankings JSONB
) RETURNS JSONB AS $$
DECLARE
  v_entry_fee DECIMAL;
  v_total_pot DECIMAL;
  v_platform_fee DECIMAL;
  v_prize_pool DECIMAL;
  v_first_place DECIMAL;
  v_second_place DECIMAL;
  v_third_place DECIMAL;
  v_participant RECORD;
  v_user_id UUID;
  v_rank INTEGER;
BEGIN
  -- Get bet details
  SELECT bet_amount INTO v_entry_fee FROM bets WHERE id = p_bet_id;

  -- Calculate total pot
  SELECT COUNT(*) * v_entry_fee INTO v_total_pot
  FROM challenge_participants WHERE bet_id = p_bet_id AND entry_paid = true;

  -- Calculate platform fee (10%)
  v_platform_fee := v_total_pot * 0.10;
  v_prize_pool := v_total_pot - v_platform_fee;

  -- Calculate prizes (50%, 35%, 15%)
  v_first_place := v_prize_pool * 0.50;
  v_second_place := v_prize_pool * 0.35;
  v_third_place := v_prize_pool * 0.15;

  -- Update participant ranks and payouts
  FOR v_participant IN SELECT * FROM jsonb_array_elements(p_rankings)
  LOOP
    v_user_id := (v_participant.value->>'user_id')::UUID;
    v_rank := (v_participant.value->>'rank')::INTEGER;

    UPDATE challenge_participants
    SET
      final_rank = v_rank,
      payout_amount = CASE v_rank
        WHEN 1 THEN v_first_place
        WHEN 2 THEN v_second_place
        WHEN 3 THEN v_third_place
        ELSE 0
      END
    WHERE bet_id = p_bet_id AND user_id = v_user_id;
  END LOOP;

  -- Update winner balances (1st place)
  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_first_place,
    escrow_balance = escrow_balance - v_entry_fee,
    total_wins = total_wins + 1,
    total_earnings = total_earnings + v_first_place
  WHERE user_id = (
    SELECT user_id FROM challenge_participants
    WHERE bet_id = p_bet_id AND final_rank = 1
  );

  -- Update 2nd place
  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_second_place,
    escrow_balance = escrow_balance - v_entry_fee,
    total_earnings = total_earnings + v_second_place
  WHERE user_id = (
    SELECT user_id FROM challenge_participants
    WHERE bet_id = p_bet_id AND final_rank = 2
  );

  -- Update 3rd place
  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_third_place,
    escrow_balance = escrow_balance - v_entry_fee,
    total_earnings = total_earnings + v_third_place
  WHERE user_id = (
    SELECT user_id FROM challenge_participants
    WHERE bet_id = p_bet_id AND final_rank = 3
  );

  -- Release escrow for losers
  UPDATE profiles
  SET escrow_balance = escrow_balance - v_entry_fee
  WHERE user_id IN (
    SELECT user_id FROM challenge_participants
    WHERE bet_id = p_bet_id AND (final_rank > 3 OR final_rank IS NULL)
  );

  -- Update platform wallet
  UPDATE platform_wallet
  SET
    balance = balance + v_platform_fee,
    total_fees_collected = total_fees_collected + v_platform_fee;

  -- Create transaction records
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  SELECT user_id, p_bet_id, payout_amount,
    CASE
      WHEN final_rank = 1 THEN 'bet_won'
      WHEN final_rank IN (2, 3) THEN 'bet_won'
      ELSE 'bet_lost'
    END,
    'completed'
  FROM challenge_participants WHERE bet_id = p_bet_id;

  -- Platform fee transaction
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES (NULL, p_bet_id, v_platform_fee, 'platform_fee', 'completed');

  -- Update bet status
  UPDATE bets SET status = 'completed', updated_at = now() WHERE id = p_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_pot', v_total_pot,
    'platform_fee', v_platform_fee,
    'prizes', jsonb_build_object('1st', v_first_place, '2nd', v_second_place, '3rd', v_third_place)
  );
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Complete Team vs Team (2 teams, winner takes all)
CREATE OR REPLACE FUNCTION complete_team_challenge_two_teams(
  p_bet_id UUID,
  p_winning_team_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_total_pot DECIMAL;
  v_platform_fee DECIMAL;
  v_winner_pool DECIMAL;
  v_winning_team_members INTEGER;
  v_payout_per_member DECIMAL;
  v_entry_fee DECIMAL;
BEGIN
  -- Get entry fee
  SELECT bet_amount INTO v_entry_fee FROM bets WHERE id = p_bet_id;

  -- Calculate total pot
  SELECT SUM(total_stake) INTO v_total_pot
  FROM challenge_teams WHERE bet_id = p_bet_id;

  -- Platform fee (10%)
  v_platform_fee := v_total_pot * 0.10;
  v_winner_pool := v_total_pot - v_platform_fee;

  -- Get winning team member count
  SELECT COUNT(*) INTO v_winning_team_members
  FROM challenge_participants
  WHERE bet_id = p_bet_id AND team_name = p_winning_team_name;

  -- Calculate per-member payout
  v_payout_per_member := v_winner_pool / v_winning_team_members;

  -- Update winning team members
  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_payout_per_member,
    escrow_balance = escrow_balance - v_entry_fee,
    total_wins = total_wins + 1,
    total_earnings = total_earnings + v_payout_per_member
  WHERE user_id IN (
    SELECT user_id FROM challenge_participants
    WHERE bet_id = p_bet_id AND team_name = p_winning_team_name
  );

  -- Release escrow for losing team
  UPDATE profiles
  SET escrow_balance = escrow_balance - v_entry_fee
  WHERE user_id IN (
    SELECT user_id FROM challenge_participants
    WHERE bet_id = p_bet_id AND team_name != p_winning_team_name
  );

  -- Update platform wallet
  UPDATE platform_wallet
  SET
    balance = balance + v_platform_fee,
    total_fees_collected = total_fees_collected + v_platform_fee;

  -- Create transactions
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  SELECT
    user_id,
    p_bet_id,
    CASE WHEN team_name = p_winning_team_name THEN v_payout_per_member ELSE 0 END,
    CASE WHEN team_name = p_winning_team_name THEN 'bet_won' ELSE 'bet_lost' END,
    'completed'
  FROM challenge_participants WHERE bet_id = p_bet_id;

  -- Platform fee transaction
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES (NULL, p_bet_id, v_platform_fee, 'platform_fee', 'completed');

  -- Update bet status
  UPDATE bets SET status = 'completed', updated_at = now() WHERE id = p_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_pot', v_total_pot,
    'platform_fee', v_platform_fee,
    'winner_pool', v_winner_pool,
    'payout_per_member', v_payout_per_member
  );
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Complete Tournament (3+ teams, 50/35/15)
CREATE OR REPLACE FUNCTION complete_tournament_challenge(
  p_bet_id UUID,
  p_team_rankings JSONB
) RETURNS JSONB AS $$
DECLARE
  v_total_pot DECIMAL;
  v_platform_fee DECIMAL;
  v_prize_pool DECIMAL;
  v_first_prize DECIMAL;
  v_second_prize DECIMAL;
  v_third_prize DECIMAL;
  v_team RECORD;
  v_member_count INTEGER;
  v_payout_per_member DECIMAL;
  v_entry_fee DECIMAL;
  v_team_name TEXT;
  v_rank INTEGER;
BEGIN
  -- Get entry fee
  SELECT bet_amount INTO v_entry_fee FROM bets WHERE id = p_bet_id;

  -- Calculate total pot
  SELECT SUM(total_stake) INTO v_total_pot
  FROM challenge_teams WHERE bet_id = p_bet_id;

  -- Platform fee (10%)
  v_platform_fee := v_total_pot * 0.10;
  v_prize_pool := v_total_pot - v_platform_fee;

  -- Calculate prizes (50/35/15)
  v_first_prize := v_prize_pool * 0.50;
  v_second_prize := v_prize_pool * 0.35;
  v_third_prize := v_prize_pool * 0.15;

  -- Update team ranks
  FOR v_team IN SELECT * FROM jsonb_array_elements(p_team_rankings)
  LOOP
    v_team_name := (v_team.value->>'team_name')::TEXT;
    v_rank := (v_team.value->>'rank')::INTEGER;

    UPDATE challenge_teams
    SET final_rank = v_rank
    WHERE bet_id = p_bet_id AND team_name = v_team_name;
  END LOOP;

  -- Payout 1st place team
  SELECT member_count INTO v_member_count
  FROM challenge_teams WHERE bet_id = p_bet_id AND final_rank = 1;
  v_payout_per_member := v_first_prize / v_member_count;

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_payout_per_member,
    escrow_balance = escrow_balance - v_entry_fee,
    total_wins = total_wins + 1,
    total_earnings = total_earnings + v_payout_per_member
  WHERE user_id IN (
    SELECT cp.user_id FROM challenge_participants cp
    JOIN challenge_teams ct ON ct.team_name = cp.team_name AND ct.bet_id = cp.bet_id
    WHERE cp.bet_id = p_bet_id AND ct.final_rank = 1
  );

  -- Payout 2nd place team
  SELECT member_count INTO v_member_count
  FROM challenge_teams WHERE bet_id = p_bet_id AND final_rank = 2;
  v_payout_per_member := v_second_prize / v_member_count;

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_payout_per_member,
    escrow_balance = escrow_balance - v_entry_fee,
    total_earnings = total_earnings + v_payout_per_member
  WHERE user_id IN (
    SELECT cp.user_id FROM challenge_participants cp
    JOIN challenge_teams ct ON ct.team_name = cp.team_name AND ct.bet_id = cp.bet_id
    WHERE cp.bet_id = p_bet_id AND ct.final_rank = 2
  );

  -- Payout 3rd place team
  SELECT member_count INTO v_member_count
  FROM challenge_teams WHERE bet_id = p_bet_id AND final_rank = 3;
  v_payout_per_member := v_third_prize / v_member_count;

  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_payout_per_member,
    escrow_balance = escrow_balance - v_entry_fee,
    total_earnings = total_earnings + v_payout_per_member
  WHERE user_id IN (
    SELECT cp.user_id FROM challenge_participants cp
    JOIN challenge_teams ct ON ct.team_name = cp.team_name AND ct.bet_id = cp.bet_id
    WHERE cp.bet_id = p_bet_id AND ct.final_rank = 3
  );

  -- Release escrow for all other teams
  UPDATE profiles
  SET escrow_balance = escrow_balance - v_entry_fee
  WHERE user_id IN (
    SELECT cp.user_id FROM challenge_participants cp
    JOIN challenge_teams ct ON ct.team_name = cp.team_name AND ct.bet_id = cp.bet_id
    WHERE cp.bet_id = p_bet_id AND (ct.final_rank > 3 OR ct.final_rank IS NULL)
  );

  -- Update platform wallet
  UPDATE platform_wallet
  SET
    balance = balance + v_platform_fee,
    total_fees_collected = total_fees_collected + v_platform_fee;

  -- Platform fee transaction
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES (NULL, p_bet_id, v_platform_fee, 'platform_fee', 'completed');

  -- Update bet status
  UPDATE bets SET status = 'completed', updated_at = now() WHERE id = p_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_pot', v_total_pot,
    'platform_fee', v_platform_fee,
    'prizes', jsonb_build_object('1st', v_first_prize, '2nd', v_second_prize, '3rd', v_third_prize)
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- END OF MIGRATION
-- ================================================
