# Betcha Business Account Setup Guide

## Overview

This guide will walk you through setting up your Yoco business account to collect platform fees (10% on all bet winnings) for the Betcha platform.

---

## Part 1: Yoco Business Account Registration

### Step 1: Create Account

1. **Visit** https://www.yoco.com/za/
2. **Click** "Get Started" → Select "Online Payments"
3. **Fill in business details:**
   - Business name: `Betcha (Pty) Ltd` (or your registered name)
   - Business type: `Online Gaming/Entertainment Platform`
   - Trading name: `Betcha`
   - Registration number: [Your CIPC registration number]
   - VAT number: [If VAT registered]
   - Physical address: [Your business address]
   - Contact person: [Your name]
   - Contact email: [Your business email]
   - Contact phone: [Your phone number]

### Step 2: Upload Required Documents

Yoco will request the following documents:

- ✅ **Company Registration Certificate** (CIPC document)
- ✅ **Proof of Business Address** (utility bill or lease agreement)
- ✅ **Director's ID Copy** (certified copy of SA ID)
- ✅ **Bank Proof** (bank statement or confirmation letter showing:
  - Account holder name
  - Account number
  - Branch code
  - Bank name)
- ✅ **Tax Clearance Certificate** (from SARS)

**Timeline:** Verification takes 1-2 business days

### Step 3: Link Business Bank Account

1. Log into **Yoco Portal**: https://portal.yoco.com
2. Navigate to **Settings** → **Bank Account**
3. Enter your business banking details:
   ```
   Bank name: [e.g., Standard Bank, FNB, Nedbank]
   Account holder: Betcha (Pty) Ltd
   Account number: [Your account number]
   Account type: Business Cheque Account
   Branch code: [6-digit branch code]
   ```
4. **Verify account:**
   - Yoco will make 2 small test deposits (e.g., R0.23 and R0.47)
   - Check your bank statement (1-2 days)
   - Return to Yoco Portal and enter the exact amounts
   - Account will be verified once amounts match

### Step 4: Get API Keys

1. In Yoco Portal, go to **Settings** → **API Keys**
2. You'll see two sets of keys:

   **Test Keys** (for development):
   ```
   Public Key: pk_test_xxxxxxxxxxxxx
   Secret Key: sk_test_xxxxxxxxxxxxx
   ```

   **Live Keys** (for production):
   ```
   Public Key: pk_live_xxxxxxxxxxxxx
   Secret Key: sk_live_xxxxxxxxxxxxx
   ```

3. **Copy these keys** - you'll need them for your `.env` file

⚠️ **IMPORTANT**: Never commit secret keys to git! Keep them secure.

### Step 5: Configure Webhooks

1. In Yoco Portal, go to **Settings** → **Webhooks**
2. Click **"Add Webhook"**
3. Enter your webhook URL:
   ```
   https://moammhjzzqjyeeffsiue.supabase.co/functions/v1/yoco-webhook
   ```
4. Subscribe to these events:
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`
   - ✅ `refund.succeeded`
5. **Copy the Webhook Secret** (looks like `whsec_xxxxx`)
6. Save this to your `.env` file

### Step 6: Set Settlement Schedule

1. Go to **Settings** → **Settlements**
2. Choose settlement frequency:
   - **Daily** (Recommended for cash flow)
   - Weekly
   - Monthly
3. Funds will be transferred to your bank account **2 business days** after transaction

---

## Part 2: Platform Fee Collection System

### How Platform Fees Work in Betcha

**Fee Structure:**
- Platform collects **10% of the total pot** before distributing winnings
- Example: R100 bet → Winner gets R180 (R200 - R20 fee)
- Fees are automatically deducted via database functions

### Tracking Platform Fees

Fees are stored in the `platform_wallet` table:

```sql
SELECT
  balance,              -- Current uncollected fees
  total_fees_collected, -- All-time fees
  total_payouts        -- Transferred to business account
FROM platform_wallet;
```

### Accessing Platform Wallet (Admin Dashboard)

Create an admin page to view platform earnings:

```typescript
// src/pages/Admin/PlatformWallet.tsx
const { data } = await supabase
  .from('platform_wallet')
  .select('*')
  .single();

console.log('Available to transfer:', data.balance);
console.log('Total fees collected:', data.total_fees_collected);
```

### Transferring Fees to Business Account

**Current Setup: Manual Transfer**

1. Log into Yoco Portal
2. View available balance
3. Click "Payout to Bank Account"
4. Funds arrive in 2 business days

**Future: Automated Transfers**

You can set up automatic transfers:
- **Weekly**: Transfer every Monday
- **Threshold**: Auto-transfer when balance > R5,000
- **Monthly**: Transfer on 1st of each month

Configure in Yoco Portal → Settings → Payouts

---

## Part 3: Financial Record Keeping

### Daily Reconciliation

**Recommended Process:**

1. **Export Yoco transactions** (daily)
   - Yoco Portal → Transactions → Export CSV
2. **Export Betcha transactions**
   ```sql
   SELECT * FROM transactions
   WHERE type = 'platform_fee'
   AND DATE(created_at) = CURRENT_DATE;
   ```
3. **Match totals**:
   - Yoco deposits should equal bet completions
   - Platform fees should match 10% of completed bets

### Monthly Accounting

Create monthly report:

```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_bets,
  SUM(amount) as total_bet_volume,
  SUM(amount) * 0.10 as platform_fees
FROM transactions
WHERE type = 'bet_placed'
AND status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Tax Reporting

**VAT (if registered):**
- Platform fees are subject to 15% VAT
- File VAT returns every 2 months
- Keep records for 5 years

**Income Tax:**
- Platform fees are taxable income
- Declare in annual tax return
- Consult with your accountant

---

## Part 4: Compliance & Legal

### FICA Compliance

As a financial services provider, you must:
- ✅ Verify user identity (KYC)
- ✅ Monitor suspicious transactions
- ✅ Report to FIC if required
- ✅ Keep records for 5 years

**Already implemented in Betcha:**
- KYC status tracking in `profiles` table
- Transaction monitoring via `transactions` table
- Withdrawal limits for unverified users

### POPIA Compliance

Protect user data:
- ✅ Encrypt sensitive data (bank details, IDs)
- ✅ Only store necessary information
- ✅ Allow users to delete their data
- ✅ Provide privacy policy

### Gaming License (Future)

**Note:** Online betting may require licensing in South Africa. Consult with:
- National Gambling Board: https://www.ngb.org.za
- Legal advisor specializing in gaming law

---

## Part 5: Security Best Practices

### API Key Security

✅ **DO:**
- Store keys in environment variables
- Use test keys in development
- Rotate keys every 6 months
- Restrict API key permissions

❌ **DON'T:**
- Commit keys to Git
- Share keys via email/Slack
- Use production keys in development
- Hardcode keys in source code

### Webhook Security

Always verify webhook signatures:

```typescript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}
```

### Database Security

- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Use service role key only in secure backend
- ✅ Never expose service key to frontend
- ✅ Audit database access logs monthly

---

## Part 6: Going Live Checklist

### Before Launch

- [ ] Yoco account verified and approved
- [ ] Business bank account linked
- [ ] Test API keys working in development
- [ ] Webhooks configured and tested
- [ ] Platform fee calculation tested (10% deduction)
- [ ] Admin dashboard created for fee monitoring
- [ ] Accounting process established
- [ ] Tax advisor consulted
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] User KYC system tested

### Launch Day

- [ ] Switch from Test to Live API keys
- [ ] Update `.env` with live keys
- [ ] Test with small real transaction (R10)
- [ ] Verify funds arrive in business account (2 days later)
- [ ] Monitor webhook logs
- [ ] Set up alerts for failed transactions

### First Week

- [ ] Daily reconciliation of transactions
- [ ] Monitor platform fee accumulation
- [ ] Check for any failed webhooks
- [ ] Respond to any user payment issues
- [ ] Review Yoco dashboard daily

### First Month

- [ ] Review total fees collected
- [ ] Make first payout to business account
- [ ] Reconcile with accounting records
- [ ] Analyze transaction patterns
- [ ] Optimize settlement schedule if needed

---

## Part 7: Support & Troubleshooting

### Yoco Support

- **Email**: support@yoco.com
- **Phone**: 087 550 0100 (7 days/week)
- **Portal**: https://support.yoco.help/

### Common Issues

**1. Webhook not received**
- Check Supabase function logs
- Verify webhook URL is correct
- Confirm webhook secret matches `.env`

**2. Settlement delayed**
- Settlements take 2 business days (excludes weekends)
- Public holidays extend timeline
- Check Yoco Portal for status

**3. Transaction failed**
- Most common: Insufficient funds
- Check user's available balance
- Review error logs in transactions table

**4. Platform fee mismatch**
- Run integrity check:
  ```sql
  SELECT bet_id, SUM(amount) as total
  FROM transactions
  WHERE bet_id IS NOT NULL
  GROUP BY bet_id
  HAVING SUM(amount) != 0;
  ```

---

## Part 8: Cost Breakdown

### Yoco Transaction Fees

| Transaction Type | Fee |
|-----------------|-----|
| Local card | 2.7% (ex VAT) |
| International card | 3.4% (ex VAT) |
| Settlement | Free |
| Refund | Free |

### Example Cost Calculation

**Scenario:** User deposits R100

1. User charged: R100
2. Yoco fee (2.7%): R2.70
3. Net to platform: R97.30
4. User's wallet: R97.30

**Scenario:** User wins R200 bet (R100 from each player)

1. Total pot: R200
2. Platform fee (10%): R20
3. Winner receives: R180
4. Platform keeps: R20
5. Yoco fee on R20: R0.54
6. Net platform earnings: R19.46

### Monthly Revenue Example

If 1,000 bets completed monthly at average R100 each:

- Total bet volume: R100,000
- Platform fees collected: R10,000
- Yoco fees on platform fees: R270
- **Net monthly revenue: R9,730**

---

## Summary

You now have everything needed to:
✅ Set up Yoco business account
✅ Configure payment processing
✅ Collect platform fees automatically
✅ Track financial records
✅ Stay compliant with regulations
✅ Troubleshoot issues

**Next Steps:**
1. Complete Yoco registration (1-2 days)
2. Get API keys and add to `.env`
3. Test with small transactions
4. Launch! 🚀

---

**Questions?** Refer to:
- Yoco documentation: https://developer.yoco.com
- This repository's payment integration code
- Your financial advisor for tax questions
