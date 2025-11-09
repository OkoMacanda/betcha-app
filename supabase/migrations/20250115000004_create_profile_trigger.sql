-- ================================================
-- AUTO-CREATE PROFILE FOR NEW USERS
-- Migration: Create trigger to auto-generate profile when user signs up
-- Date: 2025-01-15
-- ================================================

-- Function: Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $trigger$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    wallet_balance,
    escrow_balance,
    total_bets,
    total_wins,
    total_losses,
    total_earnings,
    total_referrals,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Call function after user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
