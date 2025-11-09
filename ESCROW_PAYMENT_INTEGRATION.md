# Escrow System Integration with Real Payments

## Overview

This document explains how to integrate the Betcha escrow system with Yoco payment gateway to handle real money flow for betting.

**Key Principle:** Escrow = Locked wallet balance that can't be withdrawn until bet concludes

---

## Current Escrow Implementation

### Existing Tables

```
profiles
├── wallet_balance (total available funds)
└── escrow_balance (funds locked in active bets)

escrow
├── bet_id (reference to bet)
├── creator_stake (creator's locked amount)
├── opponent_stake (opponent's locked amount)
└── status (pending/locked/released)

transactions
└── type (deposit, withdrawal, bet_placed, bet_won, bet_lost, refund, platform_fee)
```

---

## Escrow Flow with Real Payments

### Scenario: User A challenges User B to R100 bet

```
┌─────────────────────────────────────────────────────────────────┐
│                        ESCROW LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

1. BET CREATION (User A)
   ┌──────────────────────────────────────────────────────┐
   │ User A creates bet (R100)                            │
   │ ├─ Check: wallet_balance >= R100                    │
   │ ├─ Deduct: wallet_balance -= R100                   │
   │ ├─ Increment: escrow_balance += R100                │
   │ └─ Create: escrow record (creator_stake = R100)     │
   └──────────────────────────────────────────────────────┘
   Result: User A has R100 locked in escrow
   Transaction: "bet_placed" (-R100)

2. BET ACCEPTANCE (User B)
   ┌──────────────────────────────────────────────────────┐
   │ User B accepts bet (R100)                            │
   │ ├─ Check: wallet_balance >= R100                    │
   │ ├─ Deduct: wallet_balance -= R100                   │
   │ ├─ Increment: escrow_balance += R100                │
   │ └─ Update: escrow (opponent_stake = R100)           │
   │ └─ Update: escrow status = "locked"                 │
   └──────────────────────────────────────────────────────┘
   Result: Both users have R100 locked (total R200 in escrow)
   Transaction: "bet_placed" (-R100)

3. BET COMPLETION (User A wins)
   ┌──────────────────────────────────────────────────────┐
   │ REF AI declares User A winner                        │
   │ ├─ Calculate platform fee: R200 * 10% = R20         │
   │ ├─ Winner payout: R200 - R20 = R180                 │
   │ │                                                     │
   │ └─ Execute payout:                                   │
   │    ├─ User A: wallet_balance += R180                │
   │    ├─ User A: escrow_balance -= R100                │
   │    ├─ User B: escrow_balance -= R100                │
   │    └─ Platform: platform_balance += R20             │
   └──────────────────────────────────────────────────────┘
   Transactions:
   - User A: "bet_won" (+R180)
   - User B: "bet_lost" (R0)
   - Platform: "platform_fee" (+R20)

4. BET CANCELLATION/DISPUTE (Refund scenario)
   ┌──────────────────────────────────────────────────────┐
   │ Bet cancelled or dispute resolved as draw            │
   │ ├─ Refund User A: wallet_balance += R100            │
   │ ├─ Refund User B: wallet_balance += R100            │
   │ ├─ Release escrow: escrow_balance -= R100 (each)    │
   │ └─ Update: escrow status = "released"               │
   └──────────────────────────────────────────────────────┘
   Transactions:
   - User A: "refund" (+R100)
   - User B: "refund" (+R100)
```

---

## Database Schema Updates

### Add Escrow Tracking Columns

```sql
-- Add escrow_balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS escrow_balance DECIMAL(10, 2) DEFAULT 0;

-- Add platform balance tracking
CREATE TABLE IF NOT EXISTS platform_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance DECIMAL(12, 2) DEFAULT 0,
  total_fees_collected DECIMAL(12, 2) DEFAULT 0,
  total_payouts DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initialize platform wallet
INSERT INTO platform_wallet (balance) VALUES (0) ON CONFLICT DO NOTHING;

-- Add constraint to ensure users can't over-withdraw
ALTER TABLE profiles ADD CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance >= 0);
ALTER TABLE profiles ADD CONSTRAINT escrow_balance_non_negative CHECK (escrow_balance >= 0);
```

### Update Escrow Table

```sql
-- Add more detailed tracking
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS winner_payout_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE escrow ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE;
```

---

## Updated Database Functions

### 1. Create Bet with Escrow Lock

```sql
CREATE OR REPLACE FUNCTION create_bet_with_escrow(
  p_creator_id UUID,
  p_bet_id UUID,
  p_stake_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_creator_balance DECIMAL;
  v_escrow_id UUID;
BEGIN
  -- Check creator has sufficient balance
  SELECT wallet_balance INTO v_creator_balance
  FROM profiles
  WHERE user_id = p_creator_id;

  IF v_creator_balance < p_stake_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from wallet and add to escrow
  UPDATE profiles
  SET
    wallet_balance = wallet_balance - p_stake_amount,
    escrow_balance = escrow_balance + p_stake_amount
  WHERE user_id = p_creator_id;

  -- Create escrow record
  INSERT INTO escrow (bet_id, creator_stake, status)
  VALUES (p_bet_id, p_stake_amount, 'pending')
  RETURNING id INTO v_escrow_id;

  -- Create transaction record
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES (p_creator_id, p_bet_id, -p_stake_amount, 'bet_placed', 'completed');

  RETURN jsonb_build_object('success', true, 'escrow_id', v_escrow_id);
END;
$$ LANGUAGE plpgsql;
```

### 2. Accept Bet with Escrow Lock

```sql
CREATE OR REPLACE FUNCTION accept_bet_with_escrow(
  p_opponent_id UUID,
  p_bet_id UUID,
  p_stake_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_opponent_balance DECIMAL;
BEGIN
  -- Check opponent has sufficient balance
  SELECT wallet_balance INTO v_opponent_balance
  FROM profiles
  WHERE user_id = p_opponent_id;

  IF v_opponent_balance < p_stake_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from wallet and add to escrow
  UPDATE profiles
  SET
    wallet_balance = wallet_balance - p_stake_amount,
    escrow_balance = escrow_balance + p_stake_amount
  WHERE user_id = p_opponent_id;

  -- Update escrow record
  UPDATE escrow
  SET
    opponent_stake = p_stake_amount,
    status = 'locked'
  WHERE bet_id = p_bet_id;

  -- Create transaction record
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES (p_opponent_id, p_bet_id, -p_stake_amount, 'bet_placed', 'completed');

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

### 3. Complete Bet with Payout

```sql
CREATE OR REPLACE FUNCTION complete_bet_with_payout(
  p_bet_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_total_pot DECIMAL,
  p_platform_fee_percentage DECIMAL DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_platform_fee DECIMAL;
  v_winner_payout DECIMAL;
  v_creator_stake DECIMAL;
  v_opponent_stake DECIMAL;
BEGIN
  -- Get escrow stakes
  SELECT creator_stake, opponent_stake INTO v_creator_stake, v_opponent_stake
  FROM escrow
  WHERE bet_id = p_bet_id;

  -- Calculate fees and payout
  v_platform_fee := p_total_pot * (p_platform_fee_percentage / 100);
  v_winner_payout := p_total_pot - v_platform_fee;

  -- Update winner's balance
  UPDATE profiles
  SET
    wallet_balance = wallet_balance + v_winner_payout,
    escrow_balance = escrow_balance - CASE
      WHEN user_id = p_winner_id THEN v_creator_stake
      ELSE v_opponent_stake
    END,
    total_wins = total_wins + 1,
    total_earnings = total_earnings + v_winner_payout
  WHERE user_id = p_winner_id;

  -- Update loser's escrow balance
  UPDATE profiles
  SET escrow_balance = escrow_balance - CASE
      WHEN user_id = p_winner_id THEN v_opponent_stake
      ELSE v_creator_stake
    END
  WHERE user_id = p_loser_id;

  -- Update platform wallet
  UPDATE platform_wallet
  SET
    balance = balance + v_platform_fee,
    total_fees_collected = total_fees_collected + v_platform_fee;

  -- Create transaction records
  INSERT INTO transactions (user_id, bet_id, amount, type, status)
  VALUES
    (p_winner_id, p_bet_id, v_winner_payout, 'bet_won', 'completed'),
    (p_loser_id, p_bet_id, 0, 'bet_lost', 'completed'),
    (NULL, p_bet_id, v_platform_fee, 'platform_fee', 'completed');

  -- Update escrow record
  UPDATE escrow
  SET
    status = 'released',
    platform_fee_amount = v_platform_fee,
    winner_payout_amount = v_winner_payout,
    released_at = now()
  WHERE bet_id = p_bet_id;

  RETURN jsonb_build_object(
    'success', true,
    'winner_payout', v_winner_payout,
    'platform_fee', v_platform_fee
  );
END;
$$ LANGUAGE plpgsql;
```

### 4. Refund Bet (Cancellation/Draw)

```sql
CREATE OR REPLACE FUNCTION refund_bet(
  p_bet_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_creator_id UUID;
  v_opponent_id UUID;
  v_creator_stake DECIMAL;
  v_opponent_stake DECIMAL;
BEGIN
  -- Get bet and escrow details
  SELECT b.creator_id, b.opponent_id, e.creator_stake, e.opponent_stake
  INTO v_creator_id, v_opponent_id, v_creator_stake, v_opponent_stake
  FROM bets b
  JOIN escrow e ON e.bet_id = b.id
  WHERE b.id = p_bet_id;

  -- Refund creator
  IF v_creator_stake > 0 THEN
    UPDATE profiles
    SET
      wallet_balance = wallet_balance + v_creator_stake,
      escrow_balance = escrow_balance - v_creator_stake
    WHERE user_id = v_creator_id;

    INSERT INTO transactions (user_id, bet_id, amount, type, status)
    VALUES (v_creator_id, p_bet_id, v_creator_stake, 'refund', 'completed');
  END IF;

  -- Refund opponent
  IF v_opponent_stake > 0 THEN
    UPDATE profiles
    SET
      wallet_balance = wallet_balance + v_opponent_stake,
      escrow_balance = escrow_balance - v_opponent_stake
    WHERE user_id = v_opponent_id;

    INSERT INTO transactions (user_id, bet_id, amount, type, status)
    VALUES (v_opponent_id, p_bet_id, v_opponent_stake, 'refund', 'completed');
  END IF;

  -- Update escrow status
  UPDATE escrow
  SET status = 'released', released_at = now()
  WHERE bet_id = p_bet_id;

  RETURN jsonb_build_object('success', true, 'refunded', v_creator_stake + v_opponent_stake);
END;
$$ LANGUAGE plpgsql;
```

---

## Integration with Payment Flow

### Deposit Flow

```
User deposits R100 via Yoco
         ↓
Transaction created (status: pending)
         ↓
User redirected to Yoco payment page
         ↓
User completes payment
         ↓
Yoco webhook fires
         ↓
Wallet balance += R100
         ↓
Transaction updated (status: completed)
         ↓
User can now create/accept bets
```

### Withdrawal Flow

```
User requests withdrawal of R50
         ↓
Check: wallet_balance >= R50 (not escrow_balance!)
         ↓
Check: KYC verified
         ↓
Create withdrawal transaction (status: pending)
         ↓
Deduct: wallet_balance -= R50
         ↓
Admin processes payout via bank transfer
         ↓
Update: transaction (status: completed)
```

**Important:** Users can only withdraw from `wallet_balance`, NOT from `escrow_balance`. Escrowed funds are locked until bet concludes.

---

## Safety Checks

### Balance Validation

```sql
-- Ensure total balance integrity
CREATE OR REPLACE FUNCTION validate_user_balance(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_wallet DECIMAL;
  v_escrow DECIMAL;
  v_total_locked DECIMAL;
BEGIN
  -- Get user balances
  SELECT wallet_balance, escrow_balance INTO v_wallet, v_escrow
  FROM profiles
  WHERE user_id = p_user_id;

  -- Calculate total locked in active bets
  SELECT COALESCE(SUM(
    CASE
      WHEN b.creator_id = p_user_id THEN e.creator_stake
      WHEN b.opponent_id = p_user_id THEN e.opponent_stake
      ELSE 0
    END
  ), 0) INTO v_total_locked
  FROM escrow e
  JOIN bets b ON b.id = e.bet_id
  WHERE e.status IN ('pending', 'locked')
    AND (b.creator_id = p_user_id OR b.opponent_id = p_user_id);

  -- Escrow balance should match total locked
  RETURN v_escrow = v_total_locked;
END;
$$ LANGUAGE plpgsql;
```

### Prevent Over-Betting

```typescript
// src/lib/api/bets.api.ts
export async function createBet(userId: string, betData: any) {
  // Get user's available balance (wallet - escrow)
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_balance, escrow_balance')
    .eq('user_id', userId)
    .single();

  const availableBalance = (profile?.wallet_balance || 0) - (profile?.escrow_balance || 0);

  if (availableBalance < betData.bet_amount) {
    return {
      data: null,
      error: `Insufficient available balance. You have R${availableBalance.toFixed(2)} available (R${profile?.escrow_balance.toFixed(2)} locked in active bets)`
    };
  }

  // Proceed with bet creation...
}
```

---

## Platform Fee Collection

### Dashboard to Track Fees

```typescript
// src/pages/Admin/PlatformWallet.tsx
const { data: platformWallet } = useQuery({
  queryKey: ['platform-wallet'],
  queryFn: async () => {
    const { data } = await supabase
      .from('platform_wallet')
      .select('*')
      .single();
    return data;
  },
});

// Display:
// - Current balance
// - Total fees collected
// - Total payouts to business account
// - Recent platform fee transactions
```

### Transfer to Business Bank Account

```sql
-- Manual transfer function (called by admin)
CREATE OR REPLACE FUNCTION transfer_platform_fees_to_business(
  p_amount DECIMAL,
  p_bank_reference TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
BEGIN
  -- Get current platform balance
  SELECT balance INTO v_current_balance
  FROM platform_wallet;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient platform balance');
  END IF;

  -- Deduct from platform wallet
  UPDATE platform_wallet
  SET
    balance = balance - p_amount,
    total_payouts = total_payouts + p_amount;

  -- Create audit record
  INSERT INTO transactions (user_id, amount, type, status, payment_metadata)
  VALUES (
    NULL,
    -p_amount,
    'platform_payout',
    'completed',
    jsonb_build_object('bank_reference', p_bank_reference, 'transferred_at', now())
  );

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$ LANGUAGE plpgsql;
```

---

## Example: Complete Bet Lifecycle

### R100 bet between User A and User B

```typescript
// 1. User A creates bet
const { data: bet } = await createBet(userA.id, {
  opponent_email: 'userb@example.com',
  bet_amount: 100,
  game_name: 'Basketball 1v1',
  // ...
});

// Database after creation:
// profiles (User A):
//   wallet_balance: R500 → R400
//   escrow_balance: R0 → R100
// escrow:
//   creator_stake: R100
//   opponent_stake: null
//   status: 'pending'

// 2. User B accepts bet
await acceptBet(userB.id, bet.id);

// Database after acceptance:
// profiles (User B):
//   wallet_balance: R300 → R200
//   escrow_balance: R0 → R100
// escrow:
//   creator_stake: R100
//   opponent_stake: R100
//   status: 'locked'

// 3. User A wins
await completeBet(bet.id, userA.id);

// Database after completion:
// profiles (User A):
//   wallet_balance: R400 → R580 (+R180)
//   escrow_balance: R100 → R0
//   total_wins: 1
//   total_earnings: R180
// profiles (User B):
//   wallet_balance: R200 (unchanged)
//   escrow_balance: R100 → R0
// platform_wallet:
//   balance: R0 → R20
//   total_fees_collected: R20
// escrow:
//   status: 'released'
//   platform_fee_amount: R20
//   winner_payout_amount: R180
```

---

## Security Considerations

### 1. Atomic Transactions
All escrow operations must be atomic (use database transactions) to prevent:
- Double spending
- Race conditions
- Partial updates

### 2. Balance Integrity Checks
Run nightly job to validate:
```sql
SELECT
  user_id,
  wallet_balance,
  escrow_balance,
  (SELECT SUM(amount) FROM transactions WHERE user_id = profiles.user_id AND status = 'completed') as total_tx
FROM profiles
WHERE wallet_balance + escrow_balance != total_tx;
```

### 3. Audit Trail
Every balance change must create a transaction record for:
- Compliance
- Dispute resolution
- Financial reconciliation

### 4. Prevent Manipulation
- Bet completion requires REF AI resolution (not manual user input)
- Platform fee percentage is hard-coded (not user-configurable)
- Escrow release requires admin approval for disputes

---

## Testing Checklist

- [ ] Create bet with insufficient balance (should fail)
- [ ] Create bet → User A funds locked correctly
- [ ] Accept bet → User B funds locked correctly
- [ ] Complete bet → Winner receives correct payout (minus 10%)
- [ ] Complete bet → Platform fee collected correctly
- [ ] Complete bet → Both users' escrow_balance released
- [ ] Refund bet → Both users receive full refund
- [ ] Try to withdraw escrowed funds (should fail)
- [ ] Try to create bet while funds locked in another bet (should check available balance)
- [ ] Verify balance integrity after 100 random bets

---

## Monitoring & Alerts

Set up alerts for:
1. **Escrow Mismatches**: `wallet_balance + escrow_balance` doesn't match transaction sum
2. **Negative Balances**: Any user with `wallet_balance < 0` (should be impossible)
3. **Stuck Escrow**: Bets with locked escrow for > 7 days
4. **Large Platform Balance**: Platform balance > R10,000 (time to transfer to business account)
5. **Failed Payouts**: Withdrawal transactions stuck in 'pending' for > 48 hours

---

## Summary

**Escrow = Wallet balance that's temporarily locked**

- Users deposit real money via Yoco → `wallet_balance`
- Creating/accepting bets locks funds → `escrow_balance` (can't withdraw)
- Bet completion releases escrow → winner gets payout, loser gets nothing, platform gets 10%
- Refunds release escrow → both users get full refund
- Users can only withdraw `wallet_balance`, not `escrow_balance`

This ensures:
✅ Both parties have "skin in the game"
✅ Winner is guaranteed to receive payout
✅ Platform automatically collects fees
✅ Users can't withdraw funds they've committed to bets
✅ Clean separation between available and locked funds
