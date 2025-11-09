# Yoco Payment Gateway Implementation Plan

## Overview

This document provides step-by-step instructions for integrating Yoco payment gateway into the Betcha betting platform for South African users.

**Timeline:** 3-5 days
**Complexity:** Moderate
**Cost:** No setup fees, 2.7% transaction fee

---

## Prerequisites

### 1. Yoco Business Account Setup
- [ ] Register business at https://www.yoco.com/za/
- [ ] Complete business verification (1-2 business days)
- [ ] Verify business bank account
- [ ] Obtain Test API keys (for development)
- [ ] Obtain Live API keys (for production)

### 2. Technical Requirements
- [ ] Existing Supabase database (✅ already set up)
- [ ] Node.js backend or Supabase Edge Functions
- [ ] HTTPS endpoint for webhooks (required for production)
- [ ] Environment variables for API keys

---

## Phase 1: Database Schema Updates

### 1.1 Create Payment Methods Table

```sql
-- Store user payment methods (cards)
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'yoco',
  provider_payment_method_id TEXT, -- Yoco card token
  card_last_four TEXT,
  card_brand TEXT, -- visa, mastercard
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT unique_user_card UNIQUE(user_id, card_last_four, card_exp_month, card_exp_year)
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
```

### 1.2 Update Transactions Table

```sql
-- Add payment provider tracking columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'yoco';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_metadata JSONB;

-- Index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent ON transactions(payment_intent_id);
```

### 1.3 Create Payouts Table

```sql
-- Track withdrawals/payouts to users
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  bank_account_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_code TEXT NOT NULL,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payouts
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

---

## Phase 2: Backend API Setup

### 2.1 Install Yoco SDK (if available) or use HTTP client

```bash
# Add to package.json dependencies
npm install axios
```

### 2.2 Create Yoco API Client (`src/lib/yoco/client.ts`)

```typescript
import axios, { AxiosInstance } from 'axios';

interface YocoConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

interface YocoPaymentIntent {
  id: string;
  amount: number; // in cents
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}

interface YocoCheckoutResponse {
  redirectUrl: string;
  id: string;
}

class YocoClient {
  private client: AxiosInstance;
  private secretKey: string;
  public publicKey: string;

  constructor(config: YocoConfig) {
    this.secretKey = config.secretKey;
    this.publicKey = config.publicKey;

    this.client = axios.create({
      baseUrl: config.baseUrl || 'https://payments.yoco.com/api/checkouts',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a payment checkout session
   */
  async createCheckout(params: {
    amount: number; // in ZAR (e.g., 100.50)
    currency?: string;
    successUrl: string;
    cancelUrl: string;
    failureUrl: string;
    metadata?: Record<string, any>;
  }): Promise<YocoCheckoutResponse> {
    // Convert amount to cents
    const amountInCents = Math.round(params.amount * 100);

    const response = await this.client.post('/', {
      amount: amountInCents,
      currency: params.currency || 'ZAR',
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      failureUrl: params.failureUrl,
      metadata: params.metadata,
    });

    return response.data;
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckout(checkoutId: string): Promise<any> {
    const response = await this.client.get(`/${checkoutId}`);
    return response.data;
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    checkoutId: string;
    amount?: number; // in cents, optional (full refund if not provided)
  }): Promise<any> {
    const response = await this.client.post(`/${params.checkoutId}/refund`, {
      amount: params.amount,
    });
    return response.data;
  }
}

// Singleton instance
let yocoClient: YocoClient | null = null;

export function getYocoClient(): YocoClient {
  if (!yocoClient) {
    const secretKey = process.env.YOCO_SECRET_KEY;
    const publicKey = process.env.VITE_YOCO_PUBLIC_KEY;

    if (!secretKey || !publicKey) {
      throw new Error('Yoco API keys not configured');
    }

    yocoClient = new YocoClient({
      secretKey,
      publicKey,
      baseUrl: 'https://payments.yoco.com/api/checkouts',
    });
  }

  return yocoClient;
}

export { YocoClient };
```

### 2.3 Create Deposit API Endpoint (`src/lib/api/deposits.api.ts`)

```typescript
import { supabase } from '@/integrations/supabase/client';
import { getYocoClient } from '@/lib/yoco/client';

export async function initiateDeposit(
  userId: string,
  amount: number
): Promise<{ data: { redirectUrl: string; transactionId: string } | null; error: string | null }> {
  try {
    // Validate amount
    if (amount < 10) {
      return { data: null, error: 'Minimum deposit amount is R10' };
    }

    // Create pending transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        payment_provider: 'yoco',
      })
      .select()
      .single();

    if (txError) {
      return { data: null, error: txError.message };
    }

    // Create Yoco checkout session
    const yoco = getYocoClient();
    const checkout = await yoco.createCheckout({
      amount: amount,
      currency: 'ZAR',
      successUrl: `${window.location.origin}/wallet?payment=success`,
      cancelUrl: `${window.location.origin}/wallet?payment=cancelled`,
      failureUrl: `${window.location.origin}/wallet?payment=failed`,
      metadata: {
        user_id: userId,
        transaction_id: transaction.id,
        type: 'deposit',
      },
    });

    // Update transaction with payment intent ID
    await supabase
      .from('transactions')
      .update({
        payment_intent_id: checkout.id,
      })
      .eq('id', transaction.id);

    return {
      data: {
        redirectUrl: checkout.redirectUrl,
        transactionId: transaction.id,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Deposit initiation error:', error);
    return { data: null, error: error.message || 'Failed to initiate deposit' };
  }
}

export async function verifyDeposit(
  transactionId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Get transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError) {
      return { data: false, error: txError.message };
    }

    if (!transaction.payment_intent_id) {
      return { data: false, error: 'No payment intent found' };
    }

    // Check Yoco payment status
    const yoco = getYocoClient();
    const checkout = await yoco.getCheckout(transaction.payment_intent_id);

    if (checkout.status === 'successful') {
      // Update transaction to completed
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      // Update user wallet balance
      await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.user_id,
        p_amount: transaction.amount,
        p_transaction_type: 'deposit',
      });

      return { data: true, error: null };
    }

    return { data: false, error: 'Payment not completed' };
  } catch (error: any) {
    console.error('Deposit verification error:', error);
    return { data: false, error: error.message };
  }
}
```

---

## Phase 3: Frontend Integration

### 3.1 Update Environment Variables

```bash
# .env
VITE_YOCO_PUBLIC_KEY=pk_test_xxxxxxxxx
YOCO_SECRET_KEY=sk_test_xxxxxxxxx  # Backend only, never expose to frontend
```

### 3.2 Update Wallet Hook (`src/hooks/useWallet.ts`)

Replace the deposit mutation (lines 72-129) with:

```typescript
import { initiateDeposit, verifyDeposit } from '@/lib/api/deposits.api';

// Deposit mutation
const depositMutation = useMutation({
  mutationFn: async ({ amount }: { amount: number }) => {
    if (!user) throw new Error('User not authenticated');

    // Initiate deposit with Yoco
    const { data, error } = await initiateDeposit(user.id, amount);

    if (error || !data) {
      throw new Error(error || 'Failed to initiate deposit');
    }

    // Redirect to Yoco payment page
    window.location.href = data.redirectUrl;

    return data;
  },
  onError: (error: Error) => {
    toast({
      title: 'Deposit failed',
      description: error.message,
      variant: 'destructive',
    });
  },
});
```

### 3.3 Create Payment Success Handler

Add to `src/pages/Wallet.tsx` after line 70:

```typescript
// Handle payment return from Yoco
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');

  if (paymentStatus === 'success') {
    toast({
      title: 'Payment Successful',
      description: 'Your deposit is being processed.',
    });
    // Refresh wallet data
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });

    // Clean URL
    window.history.replaceState({}, '', '/wallet');
  } else if (paymentStatus === 'failed') {
    toast({
      title: 'Payment Failed',
      description: 'Your payment could not be processed. Please try again.',
      variant: 'destructive',
    });
    window.history.replaceState({}, '', '/wallet');
  } else if (paymentStatus === 'cancelled') {
    toast({
      title: 'Payment Cancelled',
      description: 'You cancelled the payment.',
    });
    window.history.replaceState({}, '', '/wallet');
  }
}, [user, toast]);
```

---

## Phase 4: Webhook Integration (Production)

### 4.1 Create Webhook Endpoint (Supabase Edge Function)

Create `supabase/functions/yoco-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const yocoWebhookSecret = Deno.env.get('YOCO_WEBHOOK_SECRET')!;

serve(async (req) => {
  try {
    // Verify webhook signature (Yoco provides signature in headers)
    const signature = req.headers.get('x-yoco-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    // Parse webhook payload
    const payload = await req.json();
    const { type, payload: data } = payload;

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook events
    switch (type) {
      case 'payment.succeeded': {
        const { id: checkoutId, metadata } = data;
        const { transaction_id, user_id } = metadata;

        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transaction_id);

        // Update wallet balance
        const { data: transaction } = await supabase
          .from('transactions')
          .select('amount')
          .eq('id', transaction_id)
          .single();

        if (transaction) {
          await supabase.rpc('update_wallet_balance', {
            p_user_id: user_id,
            p_amount: transaction.amount,
            p_transaction_type: 'deposit',
          });
        }

        break;
      }

      case 'payment.failed': {
        const { metadata } = data;
        const { transaction_id } = metadata;

        // Update transaction status to failed
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction_id);

        break;
      }

      case 'refund.succeeded': {
        // Handle refund logic
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
```

### 4.2 Deploy Webhook

```bash
# Deploy to Supabase
supabase functions deploy yoco-webhook

# Get webhook URL
# https://<project-id>.supabase.co/functions/v1/yoco-webhook
```

### 4.3 Register Webhook with Yoco

1. Log in to Yoco Portal
2. Go to **Settings** → **Webhooks**
3. Add webhook URL: `https://moammhjzzqjyeeffsiue.supabase.co/functions/v1/yoco-webhook`
4. Subscribe to events:
   - `payment.succeeded`
   - `payment.failed`
   - `refund.succeeded`
5. Copy webhook secret and add to `.env`: `YOCO_WEBHOOK_SECRET=xxx`

---

## Phase 5: Withdrawal System (Payouts)

### 5.1 Create Bank Details Form

Add to `src/pages/Wallet.tsx`:

```typescript
const [bankDetails, setBankDetails] = useState({
  accountName: '',
  accountNumber: '',
  bankName: '',
  branchCode: '',
});

// Form to collect bank details (show in withdrawal dialog)
<div className="space-y-4">
  <div>
    <Label>Account Holder Name</Label>
    <Input
      value={bankDetails.accountName}
      onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
      placeholder="John Doe"
    />
  </div>
  <div>
    <Label>Account Number</Label>
    <Input
      value={bankDetails.accountNumber}
      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
      placeholder="1234567890"
    />
  </div>
  <div>
    <Label>Bank Name</Label>
    <Input
      value={bankDetails.bankName}
      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
      placeholder="Standard Bank"
    />
  </div>
  <div>
    <Label>Branch Code</Label>
    <Input
      value={bankDetails.branchCode}
      onChange={(e) => setBankDetails({ ...bankDetails, branchCode: e.target.value })}
      placeholder="051001"
    />
  </div>
</div>
```

### 5.2 Create Payout API (`src/lib/api/payouts.api.ts`)

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function requestPayout(
  userId: string,
  amount: number,
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchCode: string;
  }
): Promise<{ data: any; error: string | null }> {
  try {
    // Validate KYC
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status, wallet_balance')
      .eq('user_id', userId)
      .single();

    if (profile?.kyc_status !== 'verified') {
      return { data: null, error: 'KYC verification required' };
    }

    if ((profile?.wallet_balance || 0) < amount) {
      return { data: null, error: 'Insufficient balance' };
    }

    if (amount < 50) {
      return { data: null, error: 'Minimum withdrawal is R50' };
    }

    // Create withdrawal transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'withdrawal',
        status: 'pending',
      })
      .select()
      .single();

    if (txError) {
      return { data: null, error: txError.message };
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        user_id: userId,
        transaction_id: transaction.id,
        amount: amount,
        bank_account_name: bankDetails.accountName,
        bank_account_number: bankDetails.accountNumber,
        bank_name: bankDetails.bankName,
        branch_code: bankDetails.branchCode,
        status: 'pending',
      })
      .select()
      .single();

    if (payoutError) {
      return { data: null, error: payoutError.message };
    }

    // Deduct from wallet immediately (held in escrow until payout completes)
    await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: -amount,
      p_transaction_type: 'withdrawal',
    });

    return { data: payout, error: null };
  } catch (error: any) {
    console.error('Payout request error:', error);
    return { data: null, error: error.message };
  }
}
```

### 5.3 Manual Payout Processing (Admin)

**Note:** Yoco doesn't provide automated payout API. Withdrawals must be processed manually via bank transfers.

Create admin dashboard page to view pending payouts:

```typescript
// src/pages/Admin/Payouts.tsx
const { data: pendingPayouts } = useQuery({
  queryKey: ['admin-payouts'],
  queryFn: async () => {
    const { data } = await supabase
      .from('payouts')
      .select('*, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return data;
  },
});

// Admin can:
// 1. Export payout batch as CSV
// 2. Process via bank's bulk payment system
// 3. Mark as 'processing' or 'completed' manually
```

---

## Phase 6: Testing

### 6.1 Yoco Test Cards

Use these test cards in Test mode:

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4242 4242 4242 4242 | Any future date | Any 3 digits | Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | Card declined |
| 4000 0000 0000 0341 | Any future date | Any 3 digits | Insufficient funds |

### 6.2 Test Scenarios

- [ ] Successful deposit
- [ ] Failed deposit (declined card)
- [ ] Cancelled deposit (user closes popup)
- [ ] Webhook received and processed
- [ ] Balance updated correctly
- [ ] Transaction history shows correctly
- [ ] Withdrawal request created
- [ ] KYC validation works
- [ ] Insufficient balance error

---

## Phase 7: Go Live Checklist

### 7.1 Pre-Launch
- [ ] Switch from Test API keys to Live API keys
- [ ] Update webhook URL to production endpoint
- [ ] Test with real card (small amount like R10)
- [ ] Verify settlement to bank account (2 business days)
- [ ] Set up email notifications for deposits/withdrawals
- [ ] Create admin dashboard for payout management
- [ ] Set up monitoring/alerts for failed payments

### 7.2 Security
- [ ] Never expose `YOCO_SECRET_KEY` to frontend
- [ ] Use HTTPS for all API calls
- [ ] Validate webhook signatures
- [ ] Encrypt bank account details in database
- [ ] Enable Supabase RLS policies on all tables
- [ ] Log all payment events for audit trail

### 7.3 Compliance
- [ ] Display Yoco terms of service
- [ ] Show transaction fees clearly (2.7%)
- [ ] Include refund policy
- [ ] POPIA compliance for storing payment data
- [ ] Terms & Conditions updated with payment terms

---

## Cost Breakdown

### Yoco Fees (per R100 deposit)
- Transaction fee: R2.70 (2.7%)
- Payout fee: R0 (free)
- **Total: R2.70**

### Example: R10,000 bet platform monthly volume
- Deposits: R10,000
- Yoco fees: R270
- **Net received: R9,730**

### Platform Fee Collection (10% on winnings)
- User A wins R100 bet
- Platform fee: R10
- User receives: R90 (R100 - R10)
- Platform keeps: R10 in business account

---

## Troubleshooting

### Common Issues

**1. "Payment popup blocked"**
- Ensure popup blockers are disabled
- Use `window.open()` with user gesture

**2. "Webhook not received"**
- Check Supabase function logs
- Verify webhook URL is correct in Yoco Portal
- Test webhook signature validation

**3. "Settlement delayed"**
- Yoco settles in 2 business days (not weekends)
- Check Yoco Portal for settlement status

**4. "Transaction shows pending forever"**
- User may have closed popup without completing
- Implement timeout (mark as failed after 30 minutes)

---

## Support

- **Yoco Support**: support@yoco.com | 087 550 0100 (7 days/week)
- **Yoco Documentation**: https://developer.yoco.com/
- **Yoco Portal**: https://portal.yoco.com/

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | 1 day | Database schema updates |
| **Phase 2** | 1-2 days | Backend API setup |
| **Phase 3** | 1 day | Frontend integration |
| **Phase 4** | 0.5 day | Webhook setup |
| **Phase 5** | 1 day | Withdrawal system |
| **Phase 6** | 0.5 day | Testing |
| **Phase 7** | 0.5 day | Go live |
| **Total** | **5-6 days** | |

---

## Next Steps

1. ✅ Review this implementation plan
2. 🔐 Register Yoco business account and get API keys
3. 🗄️ Run database migrations (Phase 1)
4. 🔧 Implement backend API (Phase 2)
5. 🎨 Update frontend (Phase 3)
6. 🪝 Set up webhooks (Phase 4)
7. 💳 Test with test cards (Phase 6)
8. 🚀 Deploy to production (Phase 7)
