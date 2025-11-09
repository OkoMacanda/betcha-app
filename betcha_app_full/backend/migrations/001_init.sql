CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(20) UNIQUE,
  email varchar(200),
  name varchar(200),
  password_hash varchar(200),
  created_at timestamptz DEFAULT now(),
  verified boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id varchar PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type varchar(50),
  amount numeric(12,2),
  status varchar(50),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenges (
  id varchar PRIMARY KEY,
  title text,
  description text,
  rules text,
  stake numeric(12,2),
  creator_id uuid REFERENCES users(id),
  status varchar(30) DEFAULT 'open',
  participants uuid[] DEFAULT '{}',
  winner_id uuid,
  winner_payout numeric(12,2),
  created_at timestamptz DEFAULT now(),
  category varchar(50)
);
