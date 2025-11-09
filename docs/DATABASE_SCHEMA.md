# Betcha Database Schema

Complete database schema documentation for the Betcha platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Extended Tables](#extended-tables)
5. [Row Level Security](#row-level-security)
6. [Database Functions](#database-functions)
7. [Triggers](#triggers)
8. [Indexes](#indexes)

---

## Overview

The Betcha database uses PostgreSQL 15+ via Supabase with the following key features:
- Row Level Security (RLS) enabled on all tables
- UUID primary keys
- Timestamped records
- JSONB for flexible rule storage
- Enums for constrained values
- Foreign key constraints for referential integrity

**Total Tables:** 17
- 8 new Betcha tables
- 9 inherited from initial schema

---

## Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
    ├─→ bets (1:many as creator/opponent)
    │      ↓
    │      ├─→ escrow_holds (1:1)
    │      ├─→ evidence_submissions (1:many)
    │      ├─→ ref_decisions (1:1)
    │      └─→ disputes (1:many)
    │
    ├─→ transactions (1:many)
    ├─→ team_members (1:many)
    ├─→ live_streams (1:many as creator)
    ├─→ stream_bets (1:many as bettor)
    └─→ kyc_verifications (1:1)

game_rules
    ↓
bets (many:1)

teams
    ↓
team_members (1:many)
```

---

## Core Tables

### 1. `profiles`

Extended user profile and wallet information.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Profile ID |
| `user_id` | UUID | FK → auth.users(id), UNIQUE, NOT NULL | Supabase Auth user ID |
| `full_name` | TEXT | | User's full name |
| `avatar_url` | TEXT | | Profile picture URL |
| `wallet_balance` | DECIMAL(10,2) | DEFAULT 0.00, NOT NULL | Current wallet balance |
| `kyc_status` | TEXT | CHECK IN ('pending', 'verified', 'rejected') | KYC verification status |
| `total_bets` | INTEGER | DEFAULT 0, NOT NULL | Lifetime bet count |
| `total_wins` | INTEGER | DEFAULT 0, NOT NULL | Lifetime wins |
| `total_earnings` | DECIMAL(10,2) | DEFAULT 0.00, NOT NULL | Lifetime earnings |
| `reputation_score` | INTEGER | DEFAULT 1000 | User reputation (1000 base) |
| `phone_verified` | BOOLEAN | DEFAULT false | Phone verification status |
| `email_verified` | BOOLEAN | DEFAULT false | Email verification status |
| `withdrawal_limit` | DECIMAL(10,2) | DEFAULT 1000.00 | Daily withdrawal limit |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Account creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Last update |

**Indexes:**
- `idx_profiles_user_id` on `user_id`
- `idx_profiles_kyc_status` on `kyc_status`

**RLS:**
- Users can view their own profile
- Users can update their own profile
- Admins can view all profiles

---

### 2. `bets`

Core bet/challenge records.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Bet ID |
| `creator_id` | UUID | FK → auth.users(id), NOT NULL | Bet creator |
| `opponent_id` | UUID | FK → auth.users(id) | Opponent (null until accepted) |
| `game_rule_id` | UUID | FK → game_rules(id) | Game rule template |
| `title` | TEXT | NOT NULL | Bet title |
| `description` | TEXT | | Detailed description |
| `bet_amount` | DECIMAL(10,2) | CHECK > 0, NOT NULL | Individual stake |
| `status` | TEXT | CHECK IN ('pending', 'active', 'completed', 'disputed', 'cancelled') | Current status |
| `winner_id` | UUID | FK → auth.users(id) | Winner (null until resolved) |
| `progress` | JSONB | DEFAULT '{}' | Game progress data |
| `escrow_id` | UUID | FK → escrow_holds(id) | Escrow record |
| `evidence_deadline` | TIMESTAMPTZ | | Evidence submission deadline |
| `ref_decision_id` | UUID | FK → ref_decisions(id) | REF decision |
| `platform_fee_amount` | DECIMAL(10,2) | DEFAULT 0.00 | Fee collected (10%) |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Bet creation |
| `started_at` | TIMESTAMPTZ | | When bet became active |
| `completed_at` | TIMESTAMPTZ | | Resolution timestamp |

**Indexes:**
- `idx_bets_creator` on `creator_id`
- `idx_bets_opponent` on `opponent_id`
- `idx_bets_status` on `status`
- `idx_bets_game_rule` on `game_rule_id`

**RLS:**
- Users can view bets they're involved in
- Users can create bets
- Users can update bets they're involved in

---

### 3. `escrow_holds`

Fund locking for active bets.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Escrow ID |
| `bet_id` | UUID | FK → bets(id), NOT NULL | Associated bet |
| `total_amount` | DECIMAL(10,2) | CHECK > 0, NOT NULL | Total locked (both stakes) |
| `status` | TEXT | CHECK IN ('locked', 'released', 'refunded') | Escrow status |
| `locked_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Lock timestamp |
| `released_at` | TIMESTAMPTZ | | Release timestamp |
| `released_to` | UUID | FK → auth.users(id) | Winner who received funds |
| `refund_reason` | TEXT | | Reason for refund |

**Indexes:**
- `idx_escrow_bet_id` on `bet_id`
- `idx_escrow_status` on `status`

**RLS:**
- Users can view escrow for their bets (read-only)

---

### 4. `evidence_submissions`

Proof uploads for bet verification.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Evidence ID |
| `bet_id` | UUID | FK → bets(id), NOT NULL | Associated bet |
| `submitted_by` | UUID | FK → auth.users(id), NOT NULL | Submitter |
| `type` | TEXT | CHECK IN ('photo', 'video', 'score_sheet', 'text', 'number') | Evidence type |
| `file_url` | TEXT | | Supabase Storage URL |
| `file_hash` | TEXT | | SHA256 file hash |
| `metadata` | JSONB | DEFAULT '{}' | Timestamps, GPS, device info |
| `verified` | BOOLEAN | DEFAULT false | Verification status |
| `verified_by` | UUID | FK → auth.users(id) | Verifier (admin/REF) |
| `verified_at` | TIMESTAMPTZ | | Verification timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Upload timestamp |

**Indexes:**
- `idx_evidence_bet_id` on `bet_id`
- `idx_evidence_submitted_by` on `submitted_by`

**RLS:**
- Users can view evidence for their bets
- Users can submit evidence for their bets

---

### 5. `ref_decisions`

REF AI decision logs.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Decision ID |
| `bet_id` | UUID | FK → bets(id), NOT NULL | Associated bet |
| `decision_type` | TEXT | CHECK IN ('auto_resolve', 'needs_evidence', 'dispute_required', 'manual_review') | Decision type |
| `confidence_score` | DECIMAL(5,2) | CHECK >= 0 AND <= 100 | Confidence 0-100 |
| `winner_id` | UUID | FK → auth.users(id) | Determined winner |
| `evidence_analyzed` | UUID[] | DEFAULT ARRAY[]::UUID[] | Evidence IDs analyzed |
| `reasoning` | TEXT | NOT NULL | REF reasoning |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Decision timestamp |

**Indexes:**
- `idx_ref_decisions_bet_id` on `bet_id`

**RLS:**
- Users can view REF decisions for their bets (read-only)

---

### 6. `disputes`

Bet dispute management.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Dispute ID |
| `bet_id` | UUID | FK → bets(id), NOT NULL | Disputed bet |
| `opened_by` | UUID | FK → auth.users(id), NOT NULL | Dispute opener |
| `reason` | TEXT | NOT NULL | Dispute reason |
| `evidence_refs` | UUID[] | DEFAULT ARRAY[]::UUID[] | Relevant evidence |
| `status` | TEXT | CHECK IN ('open', 'under_review', 'resolved', 'closed') | Dispute status |
| `resolution` | TEXT | | Admin resolution notes |
| `resolved_by` | UUID | FK → auth.users(id) | Resolving admin |
| `resolved_at` | TIMESTAMPTZ | | Resolution timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Dispute opened |

**Indexes:**
- `idx_disputes_bet_id` on `bet_id`
- `idx_disputes_status` on `status`

**RLS:**
- Users can view disputes for their bets
- Users can create disputes for their bets

---

### 7. `transactions`

Financial transaction log.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Transaction ID |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | User |
| `bet_id` | UUID | FK → bets(id) | Related bet (if applicable) |
| `amount` | DECIMAL(10,2) | NOT NULL | Amount (negative for deductions) |
| `type` | TEXT | CHECK IN ('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'refund', 'platform_fee') | Transaction type |
| `status` | TEXT | CHECK IN ('pending', 'completed', 'failed') | Status |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Transaction time |

**Indexes:**
- `idx_transactions_user_id` on `user_id`
- `idx_transactions_type` on `type`
- `idx_transactions_status` on `status`

**RLS:**
- Users can view their own transactions

---

## Extended Tables

### 8. `teams`

Team/group management.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Team ID |
| `name` | TEXT | NOT NULL | Team name |
| `description` | TEXT | | Team description |
| `avatar_url` | TEXT | | Team logo |
| `created_by` | UUID | FK → auth.users(id), NOT NULL | Team creator |
| `member_count` | INTEGER | DEFAULT 1, NOT NULL | Current members |
| `total_bets` | INTEGER | DEFAULT 0 | Team bet count |
| `total_wins` | INTEGER | DEFAULT 0 | Team wins |
| `wallet_balance` | DECIMAL(10,2) | DEFAULT 0.00 | Team wallet |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Creation timestamp |

---

### 9. `team_members`

Team membership.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Membership ID |
| `team_id` | UUID | FK → teams(id), NOT NULL | Team |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Member |
| `role` | TEXT | CHECK IN ('owner', 'admin', 'member') | Role |
| `joined_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Join timestamp |

**Constraints:**
- UNIQUE(team_id, user_id)

---

### 10. `live_streams`

Live streaming integration.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Stream ID |
| `creator_id` | UUID | FK → auth.users(id), NOT NULL | Streamer |
| `platform` | TEXT | CHECK IN ('youtube', 'tiktok', 'instagram') | Platform |
| `stream_id` | TEXT | NOT NULL | Platform stream ID |
| `stream_url` | TEXT | NOT NULL | Stream URL |
| `title` | TEXT | NOT NULL | Stream title |
| `description` | TEXT | | Description |
| `status` | TEXT | CHECK IN ('pending', 'live', 'ended', 'cancelled') | Status |
| `viewer_count` | INTEGER | DEFAULT 0 | Current viewers |
| `bet_enabled` | BOOLEAN | DEFAULT true | Betting enabled |
| `total_bets_placed` | INTEGER | DEFAULT 0 | Total bets |
| `total_bet_amount` | DECIMAL(10,2) | DEFAULT 0.00 | Total wagered |
| `started_at` | TIMESTAMPTZ | | Stream start |
| `ended_at` | TIMESTAMPTZ | | Stream end |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Creation |

---

### 11. `stream_bets`

Viewer bets on live streams.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Bet ID |
| `stream_id` | UUID | FK → live_streams(id), NOT NULL | Stream |
| `bettor_id` | UUID | FK → auth.users(id), NOT NULL | Bettor |
| `prediction` | TEXT | CHECK IN ('success', 'fail') | Prediction |
| `amount` | DECIMAL(10,2) | CHECK > 0, NOT NULL | Bet amount |
| `odds` | DECIMAL(5,2) | NOT NULL | Odds at time of bet |
| `potential_payout` | DECIMAL(10,2) | NOT NULL | Potential winnings |
| `status` | TEXT | CHECK IN ('pending', 'won', 'lost', 'refunded') | Status |
| `payout_amount` | DECIMAL(10,2) | | Actual payout |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Bet placed |

---

### 12. `kyc_verifications`

KYC verification records.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Verification ID |
| `user_id` | UUID | FK → auth.users(id), UNIQUE, NOT NULL | User |
| `provider` | TEXT | CHECK IN ('jumio', 'onfido', 'manual') | KYC provider |
| `verification_id` | TEXT | | Provider verification ID |
| `status` | TEXT | CHECK IN ('pending', 'in_progress', 'verified', 'rejected', 'expired') | Status |
| `document_type` | TEXT | | Document type used |
| `verification_data` | JSONB | DEFAULT '{}' | Provider response data |
| `verified_at` | TIMESTAMPTZ | | Verification timestamp |
| `expires_at` | TIMESTAMPTZ | | Expiration (annual renewal) |
| `rejection_reason` | TEXT | | Rejection reason |
| `created_at` | TIMESTAMPTZ | DEFAULT now(), NOT NULL | Creation |

---

## Row Level Security

All tables have RLS enabled. Key policies:

### Profiles
```sql
-- Users view own profile
CREATE POLICY "view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users update own profile
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### Bets
```sql
-- View bets user is involved in
CREATE POLICY "view_own_bets" ON bets
  FOR SELECT USING (
    auth.uid() = creator_id OR auth.uid() = opponent_id
  );

-- Create bets
CREATE POLICY "create_bets" ON bets
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
```

### Escrow (Read-only for users)
```sql
CREATE POLICY "view_bet_escrow" ON escrow_holds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = escrow_holds.bet_id
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );
```

---

## Database Functions

### `deduct_from_wallet(user_id UUID, amount DECIMAL)`

Deducts amount from user wallet with balance check.

**Returns:** BOOLEAN

**Throws:** Exception if insufficient balance

**Usage:**
```sql
SELECT deduct_from_wallet('user-uuid', 50.00);
```

---

### `add_to_wallet(user_id UUID, amount DECIMAL)`

Adds amount to user wallet.

**Returns:** BOOLEAN

**Usage:**
```sql
SELECT add_to_wallet('user-uuid', 90.00);
```

---

### `process_bet_payout(bet_id UUID, winner_id UUID)`

Processes bet payout with 10% platform fee.

**Returns:** TABLE(winner_payout, platform_fee, total_pot)

**Side Effects:**
- Credits winner
- Updates escrow to 'released'
- Updates bet to 'completed'
- Creates transactions

**Usage:**
```sql
SELECT * FROM process_bet_payout('bet-uuid', 'winner-uuid');
```

---

### `refund_bet(bet_id UUID, refund_reason TEXT)`

Refunds bet to both participants.

**Returns:** BOOLEAN

**Side Effects:**
- Refunds both users
- Updates escrow to 'refunded'
- Updates bet to 'cancelled'
- Creates refund transactions

**Usage:**
```sql
SELECT refund_bet('bet-uuid', 'Mutual cancellation');
```

---

## Triggers

### `on_auth_user_created`

Creates profile and assigns 'user' role when new user signs up.

**Fires:** AFTER INSERT on auth.users

**Function:** `handle_new_user()`

---

### `update_profiles_updated_at`

Updates `updated_at` timestamp on profile changes.

**Fires:** BEFORE UPDATE on profiles

**Function:** `update_updated_at()`

---

### `update_team_member_count_trigger`

Maintains team member count.

**Fires:** AFTER INSERT OR DELETE on team_members

**Function:** `update_team_member_count()`

---

### `set_evidence_deadline_trigger`

Sets 24-hour evidence deadline when bet becomes active.

**Fires:** BEFORE UPDATE on bets

**Function:** `set_evidence_deadline()`

---

## Indexes

Performance indexes on high-traffic columns:

```sql
-- Evidence
CREATE INDEX idx_evidence_bet_id ON evidence_submissions(bet_id);
CREATE INDEX idx_evidence_submitted_by ON evidence_submissions(submitted_by);

-- Disputes
CREATE INDEX idx_disputes_bet_id ON disputes(bet_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- REF Decisions
CREATE INDEX idx_ref_decisions_bet_id ON ref_decisions(bet_id);

-- Escrow
CREATE INDEX idx_escrow_bet_id ON escrow_holds(bet_id);
CREATE INDEX idx_escrow_status ON escrow_holds(status);

-- Teams
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- Team Members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Live Streams
CREATE INDEX idx_streams_creator_id ON live_streams(creator_id);
CREATE INDEX idx_streams_status ON live_streams(status);
CREATE INDEX idx_streams_platform ON live_streams(platform);

-- Stream Bets
CREATE INDEX idx_stream_bets_stream_id ON stream_bets(stream_id);
CREATE INDEX idx_stream_bets_bettor_id ON stream_bets(bettor_id);

-- KYC
CREATE INDEX idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);
```

---

## Best Practices

1. **Always use transactions** for multi-step operations (e.g., escrow locking)
2. **Leverage RLS** - Don't bypass it in application code
3. **Use database functions** for critical operations like payouts
4. **Index foreign keys** for query performance
5. **Store audit trails** - Keep all REF decisions and transactions
6. **Validate constraints** at both database and application layer
7. **Use UUIDs** for distributed systems and security

---

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-10-07 | Initial schema (profiles, bets, transactions, game_rules) |
| 1.1.0 | 2025-10-08 | Added escrow, evidence, REF, teams, streams, KYC |

---

**Last Updated:** 2025-10-08
