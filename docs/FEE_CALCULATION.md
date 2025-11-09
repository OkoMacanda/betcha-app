# Betcha Platform Fee Calculation Guide

Complete guide to how the 10% platform fee is calculated and collected across all bet types.

---

## Table of Contents

1. [Fee Structure Overview](#fee-structure-overview)
2. [Standard 1v1 Bets](#standard-1v1-bets)
3. [Stream Betting (Pool System)](#stream-betting-pool-system)
4. [Team Bets](#team-bets)
5. [Fee Collection Process](#fee-collection-process)
6. [Edge Cases](#edge-cases)
7. [Examples](#examples)

---

## Fee Structure Overview

### Core Principle

**The Betcha platform collects a 10% fee from the TOTAL POT of EVERY completed bet.**

- Fee is NEVER collected from individual stakes
- Fee is ALWAYS calculated from the total pool of all participants
- Fee is collected ONLY when a bet is resolved (not on cancellation/refund)
- Fee applies to ALL bet types consistently

### Formula

```
Total Pot = Sum of all participant stakes
Platform Fee = Total Pot × 0.10 (10%)
Net Payout = Total Pot - Platform Fee
```

### When Fees Are NOT Collected

- ✅ Bet cancelled before completion
- ✅ Bet refunded due to dispute
- ✅ Bet results in tie (if no tiebreaker)
- ✅ Deposits and withdrawals (separate payment provider fees may apply)

---

## Standard 1v1 Bets

The most common bet type: two participants, winner takes all.

### Calculation

```typescript
Bet Amount (each player): $50
Participant Count: 2

Total Pot = $50 × 2 = $100
Platform Fee = $100 × 0.10 = $10
Winner Payout = $100 - $10 = $90
```

### Breakdown Table

| Bet Amount | Participants | Total Pot | Platform Fee (10%) | Winner Gets |
|------------|--------------|-----------|-------------------|-------------|
| $1 | 2 | $2 | $0.20 | $1.80 |
| $10 | 2 | $20 | $2.00 | $18.00 |
| $50 | 2 | $100 | $10.00 | $90.00 |
| $100 | 2 | $200 | $20.00 | $180.00 |
| $500 | 2 | $1,000 | $100.00 | $900.00 |

### Return on Investment (ROI)

For a $50 bet:
- **Win:** Receive $90 (net +$40, or 80% ROI)
- **Lose:** Lose $50 (net -$50, or -100%)

---

## Stream Betting (Pool System)

Viewers bet on whether a streamer will succeed or fail at a challenge. This uses parimutuel (pool betting) with dynamic odds.

### How It Works

1. Bettors place wagers on "Success" or "Fail"
2. All bets go into a shared pool
3. 10% fee is taken from the TOTAL POOL
4. Remaining 90% is distributed proportionally to winners

### Calculation

```typescript
Success Bets: $300 total (from 10 bettors)
Fail Bets: $200 total (from 5 bettors)

Total Pool = $300 + $200 = $500
Platform Fee = $500 × 0.10 = $50
Net Payout Pool = $500 - $50 = $450

If outcome is "Success":
  Winners share $450 proportionally
  Each success bettor gets: (their bet / $300) × $450

If outcome is "Fail":
  Winners share $450 proportionally
  Each fail bettor gets: (their bet / $200) × $450
```

### Example: Individual Payout

**Scenario:** Outcome is "Success"

Bettor Alice:
- Bet on Success: $50
- Total Success Pool: $300
- Her share: $50 / $300 = 16.67%
- Her payout: 16.67% × $450 = $75

**Alice's ROI:** $75 - $50 = +$25 (50% profit)

### Odds Calculation

Odds are calculated in real-time based on pool distribution:

```typescript
Success Odds = (Total Pool / Success Pool) × 0.9  // 0.9 accounts for 10% fee
Fail Odds = (Total Pool / Fail Pool) × 0.9

Example:
Success Pool = $300
Fail Pool = $200
Total Pool = $500

Success Odds = (500 / 300) × 0.9 = 1.50x
Fail Odds = (500 / 200) × 0.9 = 2.25x
```

**Interpretation:**
- Betting $100 on Success would win $150 (gross)
- Betting $100 on Fail would win $225 (gross)

---

## Team Bets

Team vs Team competitions with multiple participants per side.

### Calculation

```typescript
Team A: 3 members, each bets $20
Team B: 4 members, each bets $20

Team A Total: 3 × $20 = $60
Team B Total: 4 × $20 = $80
Total Pot = $60 + $80 = $140

Platform Fee = $140 × 0.10 = $14
Net Payout = $140 - $14 = $126

If Team A wins:
  Payout per Team A member = $126 / 3 = $42 each

If Team B wins:
  Payout per Team B member = $126 / 4 = $31.50 each
```

### Team Member Payouts

| Team | Members | Bet Each | Total Stake | If Win (Total) | Per Member |
|------|---------|----------|-------------|----------------|------------|
| A | 3 | $20 | $60 | $126 | $42 |
| B | 4 | $20 | $80 | $126 | $31.50 |

**Team A ROI per member:** $42 - $20 = +$22 (110% profit)
**Team B ROI per member:** $31.50 - $20 = +$11.50 (57.5% profit)

---

## Fee Collection Process

### Implementation

Fees are collected automatically during bet resolution:

```typescript
// 1. Bet resolves with winner determined
const totalPot = betAmount * participantCount;
const platformFee = totalPot * 0.10;
const winnerPayout = totalPot - platformFee;

// 2. Database transaction
await supabase.from('transactions').insert([
  {
    user_id: winnerId,
    amount: winnerPayout,
    type: 'bet_won'
  },
  {
    user_id: 'platform',  // Special platform user
    amount: platformFee,
    type: 'platform_fee'
  }
]);

// 3. Update bet record
await supabase.from('bets').update({
  platform_fee_amount: platformFee
}).eq('id', betId);
```

### Transparency

Users see fee breakdown BEFORE placing bets:

```
Your Bet: $50
Opponent Bet: $50
─────────────────
Total Pot: $100
Platform Fee (10%): -$10
─────────────────
If You Win: $90
If You Lose: -$50
```

---

## Edge Cases

### Case 1: Tie (No Tiebreaker)

If a bet ends in a tie with no tiebreaker rule:

```typescript
Result: Refund both parties
Fee Collected: $0
Action: Full refund, no fees
```

### Case 2: Dispute Resolved in Favor of Challenger

```typescript
Original Bet: Creator $50 vs Opponent $50
Dispute: Opponent wins after admin review
Fee Collected: $10 (normal)
Opponent Gets: $90
```

### Case 3: Mutual Cancellation Before Completion

```typescript
Both parties agree to cancel
Action: Refund via refund_bet() function
Fee Collected: $0
```

### Case 4: Stream Bet with No Losers

If everyone bets the same way:

```typescript
Success Bets: $500
Fail Bets: $0
Outcome: Success

Result: Refund all bets (no contest)
Fee Collected: $0
```

### Case 5: Rounding

All fee calculations round to 2 decimal places:

```typescript
Total Pot: $7.77
Platform Fee: $7.77 × 0.10 = $0.777 → $0.78
Net Payout: $7.77 - $0.78 = $6.99
```

---

## Examples

### Example 1: Chess Match

```
Game: Chess (10+0 Blitz)
Creator Bet: $25
Opponent Bet: $25

Calculation:
  Total Pot = $25 + $25 = $50
  Platform Fee = $50 × 0.10 = $5
  Winner Gets = $50 - $5 = $45

Outcome: Creator wins by checkmate
  Creator receives: $45
  Platform collects: $5
  Opponent loses: $25
```

---

### Example 2: Push-up Contest Stream

```
Stream: 100 Push-ups in 2 Minutes
Success Bets:
  - User A: $20
  - User B: $30
  - User C: $10
  Total: $60

Fail Bets:
  - User D: $40
  Total: $40

Grand Total: $100
Platform Fee: $10
Net Pool: $90

Outcome: Streamer succeeds (completes 100 push-ups)

Success Winners Distribution:
  User A: ($20 / $60) × $90 = $30  (+$10 profit)
  User B: ($30 / $60) × $90 = $45  (+$15 profit)
  User C: ($10 / $60) × $90 = $15  (+$5 profit)
  Total paid: $90

User D (Fail): Loses $40
Platform: Collects $10
```

---

### Example 3: Team Basketball Tournament

```
Tournament: 5v5 Basketball
Team Alpha: 5 members × $100 = $500
Team Omega: 5 members × $100 = $500
Total Pot: $1,000

Platform Fee: $1,000 × 0.10 = $100
Net Payout: $900

Outcome: Team Alpha wins

Team Alpha Distribution:
  $900 / 5 members = $180 per member
  ROI per member: $180 - $100 = +$80 (80% profit)

Team Omega:
  Each member loses: $100

Platform: Collects $100
```

---

## Fee Revenue Model

### Monthly Projections

Assuming 1,000 bets/month with average pot of $100:

```
Total Monthly Volume = 1,000 bets × $100 = $100,000
Platform Revenue = $100,000 × 0.10 = $10,000/month
Annual Revenue = $10,000 × 12 = $120,000/year
```

### Scalability

At 10,000 bets/month:
```
Monthly Volume: $1,000,000
Platform Revenue: $100,000/month
Annual Revenue: $1,200,000/year
```

---

## Compliance

### Gambling Regulations

- 10% is competitive with industry standards (casinos: 2-15%)
- Transparent fee disclosure required by most jurisdictions
- Fees must be clearly shown before bet acceptance
- Fee revenue must be properly reported for tax purposes

### User Protection

- Fees displayed before bet placement
- Breakdown shown in bet confirmation
- Transaction history shows fee per bet
- No hidden fees or additional charges

---

## API Functions for Fee Calculation

### `calculatePlatformFee(amount)`

```typescript
import { calculatePlatformFee } from '@/lib/feeCalculator';

const fee = calculatePlatformFee(100); // Returns 10.00
```

### `calculateNetPayout(grossAmount)`

```typescript
import { calculateNetPayout } from '@/lib/feeCalculator';

const breakdown = calculateNetPayout(100);
// {
//   grossAmount: 100,
//   platformFee: 10,
//   netAmount: 90,
//   feePercentage: 10
// }
```

### `getFeeBreakdownDisplay(betAmount, participantCount)`

```typescript
import { getFeeBreakdownDisplay } from '@/lib/feeCalculator';

const display = getFeeBreakdownDisplay(50, 2);
// {
//   yourStake: 50,
//   opponentStake: 50,
//   totalPot: 100,
//   platformFee: 10,
//   youWin: 90,
//   youLose: -50
// }
```

---

## Testing Fee Calculations

Run these tests to verify fee logic:

```typescript
import { validateFeeCalculation } from '@/lib/feeCalculator';

// Test 1: Standard bet
const valid1 = validateFeeCalculation(100, 10, 90);
console.assert(valid1 === true);

// Test 2: Rounding
const valid2 = validateFeeCalculation(7.77, 0.78, 6.99);
console.assert(valid2 === true);

// Test 3: Large amounts
const valid3 = validateFeeCalculation(10000, 1000, 9000);
console.assert(valid3 === true);
```

---

## Frequently Asked Questions

### Q: Why is the fee 10%?
**A:** 10% is competitive with industry standards and allows sustainable platform operation while keeping bets attractive.

### Q: Can the fee ever change?
**A:** Fee changes would require advance notice to all users and updates to terms of service.

### Q: Are there fees on deposits/withdrawals?
**A:** Payment providers (Paystack/Stripe) may charge processing fees separately. Betcha's 10% fee is ONLY on bet resolution.

### Q: What happens to fees from refunded bets?
**A:** No fees are collected on refunds. Users receive 100% of their original stakes back.

### Q: Can I see my total fees paid?
**A:** Yes, view your transaction history and filter by type: 'platform_fee'.

---

**Last Updated:** 2025-10-08
