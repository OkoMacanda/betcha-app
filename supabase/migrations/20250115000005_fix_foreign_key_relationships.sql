-- ================================================
-- FIX FOREIGN KEY RELATIONSHIPS
-- Migration: Add properly named foreign key constraints for Supabase relationships
-- Date: 2025-01-15
-- ================================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_creator_id_fkey;
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_opponent_id_fkey;
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_winner_id_fkey;

ALTER TABLE bet_participants DROP CONSTRAINT IF EXISTS bet_participants_bet_id_fkey;
ALTER TABLE bet_participants DROP CONSTRAINT IF EXISTS bet_participants_user_id_fkey;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_bet_id_fkey;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_bet_id_fkey;

ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;

-- Add properly named foreign key constraints for bets table
ALTER TABLE bets
  ADD CONSTRAINT bets_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE bets
  ADD CONSTRAINT bets_opponent_id_fkey
  FOREIGN KEY (opponent_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

ALTER TABLE bets
  ADD CONSTRAINT bets_winner_id_fkey
  FOREIGN KEY (winner_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Add properly named foreign key constraints for bet_participants table
ALTER TABLE bet_participants
  ADD CONSTRAINT bet_participants_bet_id_fkey
  FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE;

ALTER TABLE bet_participants
  ADD CONSTRAINT bet_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add properly named foreign key constraints for notifications table
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_bet_id_fkey
  FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE;

-- Add properly named foreign key constraints for transactions table
ALTER TABLE transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_bet_id_fkey
  FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE SET NULL;

-- Add properly named foreign key constraints for friend_requests table
ALTER TABLE friend_requests
  ADD CONSTRAINT friend_requests_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE friend_requests
  ADD CONSTRAINT friend_requests_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add properly named foreign key constraints for friends table
ALTER TABLE friends
  ADD CONSTRAINT friends_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE friends
  ADD CONSTRAINT friends_friend_id_fkey
  FOREIGN KEY (friend_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Update RLS policies for profiles table to allow SELECT for authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Ensure users can update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
