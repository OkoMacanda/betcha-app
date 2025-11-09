# Betcha API Reference

Complete API documentation for the Betcha platform - Competition Regulation App.

---

## Table of Contents

1. [Edge Functions](#edge-functions)
2. [Client-Side Libraries](#client-side-libraries)
3. [Database Functions](#database-functions)
4. [Supabase Tables](#supabase-tables)

---

## Edge Functions

### Escrow Manager

**Endpoint:** `POST /functions/v1/escrow-manager`

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
{
  action: 'lock_funds' | 'release_funds' | 'refund_funds';
  betId: string;
  creatorId?: string;
  opponentId?: string;
  betAmount?: number;
  winnerId?: string;
  escrowId?: string;
  reason?: string;
}
```

#### Lock Funds

Locks bet amounts in escrow when a bet is accepted.

**Request:**
```typescript
{
  action: 'lock_funds',
  betId: 'uuid-of-bet',
  creatorId: 'uuid-of-creator',
  opponentId: 'uuid-of-opponent',
  betAmount: 50.00
}
```

**Response:**
```typescript
{
  success: true,
  escrowId: 'uuid-of-escrow-hold'
}
```

**Errors:**
- `Creator has insufficient balance`
- `Opponent has insufficient balance`
- `Failed to lock funds in escrow`

---

#### Release Funds

Releases escrow to winner with 10% platform fee.

**Request:**
```typescript
{
  action: 'release_funds',
  betId: 'uuid-of-bet',
  winnerId: 'uuid-of-winner',
  escrowId: 'uuid-of-escrow-hold'
}
```

**Response:**
```typescript
{
  success: true,
  payout: {
    totalPot: 100.00,
    platformFee: 10.00,
    winnerPayout: 90.00,
    feePercentage: 10
  }
}
```

---

#### Refund Funds

Refunds both parties (e.g., on dispute or cancellation).

**Request:**
```typescript
{
  action: 'refund_funds',
  betId: 'uuid-of-bet',
  escrowId: 'uuid-of-escrow-hold',
  reason: 'Bet cancelled by mutual agreement'
}
```

**Response:**
```typescript
{
  success: true
}
```

---

## Client-Side Libraries

### Escrow Library (`src/lib/escrow.ts`)

#### `calculatePayout()`

Calculate payout with 10% platform fee.

**Signature:**
```typescript
function calculatePayout(
  betAmount: number,
  participantCount: number = 2
): PayoutBreakdown
```

**Parameters:**
- `betAmount` - Individual bet amount
- `participantCount` - Number of participants (default: 2)

**Returns:**
```typescript
{
  totalPot: number;           // betAmount × participantCount
  platformFee: number;        // totalPot × 0.10
  winnerPayout: number;       // totalPot - platformFee
  feePercentage: number;      // Always 10
  breakdown: {
    gross: number;
    fee: number;
    net: number;
  }
}
```

**Example:**
```typescript
const payout = calculatePayout(50, 2);
// {
//   totalPot: 100,
//   platformFee: 10,
//   winnerPayout: 90,
//   feePercentage: 10,
//   breakdown: { gross: 100, fee: 10, net: 90 }
// }
```

---

#### `lockFunds()`

Lock funds in escrow when bet is accepted.

**Signature:**
```typescript
async function lockFunds(
  betId: string,
  creatorId: string,
  opponentId: string,
  betAmount: number
): Promise<{ success: boolean; escrowId?: string; error?: string }>
```

**Example:**
```typescript
const result = await lockFunds(
  'bet-uuid',
  'creator-uuid',
  'opponent-uuid',
  50.00
);

if (result.success) {
  console.log('Funds locked:', result.escrowId);
} else {
  console.error('Error:', result.error);
}
```

---

#### `releaseFunds()`

Release funds to winner with 10% fee deduction.

**Signature:**
```typescript
async function releaseFunds(
  betId: string,
  winnerId: string,
  escrowId: string
): Promise<{ success: boolean; payout?: PayoutBreakdown; error?: string }>
```

---

#### `refundFunds()`

Refund funds to both parties.

**Signature:**
```typescript
async function refundFunds(
  betId: string,
  escrowId: string,
  reason: string
): Promise<{ success: boolean; error?: string }>
```

---

#### `validateBetAmount()`

Validate bet amount against balance and limits.

**Signature:**
```typescript
function validateBetAmount(
  amount: number,
  userBalance: number,
  withdrawalLimit?: number
): { valid: boolean; error?: string }
```

**Validation Rules:**
- Minimum: $1
- Maximum: $10,000
- Must not exceed user balance

---

### Fee Calculator Library (`src/lib/feeCalculator.ts`)

#### `calculatePlatformFee()`

Calculate 10% platform fee.

**Signature:**
```typescript
function calculatePlatformFee(amount: number): number
```

**Example:**
```typescript
const fee = calculatePlatformFee(100); // 10.00
```

---

#### `distributeBetPayout()`

Distribute winnings for standard 1v1 bet.

**Signature:**
```typescript
function distributeBetPayout(
  betAmount: number,
  participantCount?: number
): {
  totalPot: number;
  platformFee: number;
  winnerPayout: number;
}
```

---

#### `calculateStreamOdds()`

Calculate real-time odds for stream bets.

**Signature:**
```typescript
function calculateStreamOdds(
  successPool: number,
  failPool: number
): {
  successOdds: number;
  failOdds: number;
}
```

**Example:**
```typescript
const odds = calculateStreamOdds(300, 200);
// { successOdds: 1.50, failOdds: 2.25 }
// Accounts for 10% platform fee
```

---

#### `distributeStreamBetPayout()`

Calculate pool betting distribution with 10% fee.

**Signature:**
```typescript
function distributeStreamBetPayout(
  successBets: Array<{ amount: number; bettor_id: string }>,
  failBets: Array<{ amount: number; bettor_id: string }>,
  outcome: 'success' | 'fail'
): StreamBetDistribution
```

**Returns:**
```typescript
{
  totalPool: number;
  successPool: number;
  failPool: number;
  winningSide: 'success' | 'fail';
  totalFee: number;           // 10% of total pool
  netPayout: number;          // Total pool - fee
  winnerCount: number;
  payoutPerWinner: number;
}
```

---

### REF AI Library (`src/lib/refAI.ts`)

#### `RefAI.evaluateBet()`

Evaluate evidence and make decision.

**Signature:**
```typescript
async evaluateBet(
  betId: string,
  gameRule: GameRule,
  submittedEvidence: Evidence[]
): Promise<RefDecision>
```

**Returns:**
```typescript
{
  decision_type: 'auto_resolve' | 'needs_evidence' | 'dispute_required' | 'manual_review';
  confidence_score: number;   // 0-100
  winner_id?: string;
  reasoning: string;
  evidence_quality: 'high' | 'medium' | 'low';
}
```

**Decision Logic:**
- `confidence >= 95` → `auto_resolve` (instant payout)
- `70 <= confidence < 95` → `needs_evidence`
- `confidence < 70` → `manual_review`

**Example:**
```typescript
import { refAI } from '@/lib/refAI';

const decision = await refAI.evaluateBet(
  'bet-uuid',
  gameRule,
  evidenceArray
);

if (decision.decision_type === 'auto_resolve') {
  // Pay winner automatically
  await releaseFunds(betId, decision.winner_id!, escrowId);
}
```

---

#### `RefAI.saveDecision()`

Store REF decision in database.

**Signature:**
```typescript
async saveDecision(
  betId: string,
  decision: RefDecision,
  evidenceIds: string[]
): Promise<void>
```

---

### Rule Builder Library (`src/lib/ruleBuilder.ts`)

#### `getRuleTemplate()`

Get rule template by ID.

**Signature:**
```typescript
function getRuleTemplate(templateId: string): GameRule | null
```

**Example:**
```typescript
const rule = getRuleTemplate('basketball-1v1');
console.log(rule.name); // "Basketball 1v1"
```

---

#### `getAllRuleTemplates()`

Get all 100 game rule templates.

**Signature:**
```typescript
function getAllRuleTemplates(): GameRule[]
```

---

#### `getRulesByCategory()`

Filter rules by category.

**Signature:**
```typescript
function getRulesByCategory(category: string): GameRule[]
```

**Categories:**
- `sports`
- `board_games`
- `card_games`
- `word_games`
- `video_games`
- `physical`
- `spoken_word`

---

#### `searchRules()`

Search rules by name, description, or category.

**Signature:**
```typescript
function searchRules(query: string): GameRule[]
```

---

#### `validateRule()`

Validate rule structure.

**Signature:**
```typescript
function validateRule(rule: Partial<GameRule>): ValidationResult
```

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

---

#### `generateRuleDescription()`

Convert rule JSON to natural language.

**Signature:**
```typescript
function generateRuleDescription(rule: GameRule): string
```

**Example:**
```typescript
const description = generateRuleDescription(basketballRule);
// "First player to score 21 points with a margin of 2 points wins"
```

---

## Database Functions

These are PostgreSQL functions callable via Supabase RPC.

### `deduct_from_wallet()`

Deduct amount from user wallet.

**SQL:**
```sql
SELECT deduct_from_wallet(
  user_id := 'uuid',
  amount := 50.00
);
```

**Returns:** `BOOLEAN`

**Throws:** Exception if insufficient balance

---

### `add_to_wallet()`

Add amount to user wallet.

**SQL:**
```sql
SELECT add_to_wallet(
  user_id := 'uuid',
  amount := 90.00
);
```

**Returns:** `BOOLEAN`

---

### `process_bet_payout()`

Calculate and distribute bet payout with 10% fee.

**SQL:**
```sql
SELECT * FROM process_bet_payout(
  bet_id := 'uuid',
  winner_id := 'uuid'
);
```

**Returns:**
```sql
TABLE(
  winner_payout DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  total_pot DECIMAL(10,2)
)
```

**Side Effects:**
- Credits winner wallet
- Updates escrow status to 'released'
- Updates bet status to 'completed'
- Creates transaction records

---

### `refund_bet()`

Refund bet to both participants.

**SQL:**
```sql
SELECT refund_bet(
  bet_id := 'uuid',
  refund_reason := 'Bet cancelled'
);
```

**Returns:** `BOOLEAN`

**Side Effects:**
- Refunds both users original stake
- Updates escrow status to 'refunded'
- Updates bet status to 'cancelled'
- Creates refund transaction records

---

## Supabase Tables

### Key Tables

#### `profiles`
User account and wallet information.

**Key Columns:**
- `user_id` (UUID, FK to auth.users)
- `wallet_balance` (DECIMAL)
- `kyc_status` (TEXT)
- `reputation_score` (INTEGER)
- `withdrawal_limit` (DECIMAL)

---

#### `bets`
Challenge/bet records.

**Key Columns:**
- `id` (UUID, PK)
- `creator_id` (UUID)
- `opponent_id` (UUID)
- `bet_amount` (DECIMAL)
- `status` (TEXT: pending/active/completed/disputed/cancelled)
- `escrow_id` (UUID, FK to escrow_holds)
- `winner_id` (UUID)
- `platform_fee_amount` (DECIMAL)

---

#### `escrow_holds`
Fund locking for active bets.

**Key Columns:**
- `id` (UUID, PK)
- `bet_id` (UUID, FK to bets)
- `total_amount` (DECIMAL)
- `status` (TEXT: locked/released/refunded)
- `released_to` (UUID)

---

#### `evidence_submissions`
Proof uploads for bet verification.

**Key Columns:**
- `id` (UUID, PK)
- `bet_id` (UUID, FK to bets)
- `submitted_by` (UUID)
- `type` (TEXT: photo/video/score_sheet/text/number)
- `file_url` (TEXT)
- `file_hash` (TEXT)
- `verified` (BOOLEAN)

---

#### `ref_decisions`
REF AI decision logs.

**Key Columns:**
- `id` (UUID, PK)
- `bet_id` (UUID, FK to bets)
- `decision_type` (TEXT)
- `confidence_score` (DECIMAL)
- `winner_id` (UUID)
- `reasoning` (TEXT)

---

## Error Handling

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `INSUFFICIENT_BALANCE` | User has insufficient balance | Top up wallet |
| `ESCROW_NOT_FOUND` | Invalid escrow ID | Check bet has escrow_id |
| `ESCROW_ALREADY_RELEASED` | Escrow already released | Cannot release twice |
| `INVALID_BET_AMOUNT` | Bet amount out of range | Use $1-$10,000 |
| `MISSING_EVIDENCE` | Required evidence not submitted | Upload all evidence types |
| `LOW_CONFIDENCE` | REF confidence too low | Add more evidence or escalate |

---

## Rate Limits

- **Edge Functions:** 100 requests/minute per user
- **Database Functions:** No hard limit (use wisely)
- **File Uploads:** 10 MB max per file, 50 MB total per bet

---

## Best Practices

1. **Always validate bet amounts** before calling `lockFunds()`
2. **Check escrow status** before attempting to release funds
3. **Store REF decisions** for audit trail
4. **Use idempotency keys** for payment operations
5. **Handle errors gracefully** - display user-friendly messages
6. **Test in sandbox** before going live with real payments

---

## Example Workflows

### Complete Bet Flow

```typescript
// 1. Create bet
const bet = await supabase.from('bets').insert({
  creator_id: currentUser.id,
  game_rule_id: ruleId,
  bet_amount: 50.00,
  status: 'pending'
}).select().single();

// 2. Opponent accepts
// ... (UI interaction)

// 3. Lock funds in escrow
const escrowResult = await lockFunds(
  bet.id,
  bet.creator_id,
  bet.opponent_id,
  bet.bet_amount
);

// 4. Bet becomes active, players complete challenge
// ... (time passes)

// 5. Submit evidence
await supabase.from('evidence_submissions').insert({
  bet_id: bet.id,
  submitted_by: currentUser.id,
  type: 'video',
  file_url: uploadedVideoUrl
});

// 6. REF evaluates
const decision = await refAI.evaluateBet(bet.id, gameRule, evidence);

// 7. Auto-resolve if high confidence
if (decision.decision_type === 'auto_resolve') {
  await releaseFunds(bet.id, decision.winner_id!, escrowResult.escrowId!);
}
```

---

## Support

For API questions or issues:
- Check database logs in Supabase dashboard
- Review Edge Function logs
- Test with sandbox credentials first
- File issues on GitHub repository

---

**Last Updated:** 2025-10-08
