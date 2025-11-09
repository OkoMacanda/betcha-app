# Betcha Deployment Guide

Complete step-by-step guide to deploying the Betcha platform from development to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Payment Provider Setup](#payment-provider-setup)
5. [Database Migration](#database-migration)
6. [Edge Functions Deployment](#edge-functions-deployment)
7. [Frontend Deployment](#frontend-deployment)
8. [Environment Variables](#environment-variables)
9. [Post-Deployment Checklist](#post-deployment-checklist)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts

- ✅ **Supabase Account** (Free tier available)
- ✅ **Payment Provider** (Paystack, Flutterwave, or Stripe)
- ✅ **Git** (for version control)
- ✅ **Node.js 18+** (LTS recommended)
- ✅ **npm or bun** (package manager)

### Optional Services

- KYC Provider (Jumio or Onfido)
- YouTube/TikTok/Instagram Developer Accounts (for streaming features)
- Vercel/Netlify account (for frontend hosting)

---

## Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd "Betcha App"
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Copy Environment Template

```bash
cp .env.example .env
```

### 4. Install Supabase CLI

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase  # macOS
```

### 5. Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:5173`

---

## Supabase Configuration

### 1. Create New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization
4. Fill in project details:
   - **Name:** Betcha
   - **Database Password:** (generate strong password)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (start) or Pro (production)

### 2. Get Project Credentials

After project creation, go to **Settings → API**:

```bash
# Copy these values
Project URL: https://your-project-id.supabase.co
API Key (anon, public): eyJhbGci...
```

### 3. Update .env File

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 4. Link Local Project to Supabase

```bash
supabase link --project-ref your-project-id
```

Enter database password when prompted.

---

## Payment Provider Setup

### Option A: Paystack (Recommended for Africa)

#### 1. Create Account

1. Go to [https://paystack.com](https://paystack.com)
2. Sign up
3. Verify business information

#### 2. Get API Keys

**Dashboard → Settings → API Keys**

```bash
# Test Mode (for development)
Test Public Key: pk_test_xxxxx
Test Secret Key: sk_test_xxxxx

# Live Mode (for production)
Live Public Key: pk_live_xxxxx
Live Secret Key: sk_live_xxxxx
```

#### 3. Configure Webhooks

**Dashboard → Settings → Webhooks**

Add webhook URL:
```
https://your-project-id.supabase.co/functions/v1/payment-webhook
```

Select events:
- `charge.success`
- `transfer.success`
- `transfer.failed`

#### 4. Update .env

```bash
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

---

### Option B: Stripe (Global)

#### 1. Create Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up
3. Verify business

#### 2. Get API Keys

**Dashboard → Developers → API Keys**

```bash
# Test Mode
Publishable Key: pk_test_xxxxx
Secret Key: sk_test_xxxxx

# Live Mode
Publishable Key: pk_live_xxxxx
Secret Key: sk_live_xxxxx
```

#### 3. Configure Webhooks

**Dashboard → Developers → Webhooks**

Add endpoint:
```
https://your-project-id.supabase.co/functions/v1/payment-webhook
```

Select events:
- `payment_intent.succeeded`
- `payout.paid`
- `payout.failed`

#### 4. Update .env

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

---

## Database Migration

### 1. Review Migration Files

```bash
ls supabase/migrations/
# Should see:
# - 20251007080008_e7897044-85e3-4860-bc4f-2124ce5eafc6.sql  (initial)
# - 20251008_betcha_core_features.sql                          (new tables)
# - 20251008_seed_game_rules.sql                              (game rules)
```

### 2. Run Migrations

```bash
# Apply all migrations to remote database
supabase db push
```

**Expected output:**
```
Applying migration 20251007080008...
Applying migration 20251008_betcha_core_features...
Applying migration 20251008_seed_game_rules...
✓ All migrations applied successfully
```

### 3. Verify Tables Created

Go to Supabase Dashboard → Table Editor

You should see:
- ✅ profiles
- ✅ bets
- ✅ escrow_holds
- ✅ evidence_submissions
- ✅ ref_decisions
- ✅ disputes
- ✅ teams
- ✅ team_members
- ✅ live_streams
- ✅ stream_bets
- ✅ kyc_verifications
- ✅ transactions
- ✅ game_rules
- ✅ banners
- ✅ user_roles

### 4. Seed Initial Data

```bash
# Seed game rules (if not already done by migration)
supabase db seed
```

### 5. Test Database Functions

```sql
-- Test in SQL Editor
SELECT deduct_from_wallet('user-uuid', 10.00);
SELECT add_to_wallet('user-uuid', 20.00);
```

---

## Edge Functions Deployment

### 1. Review Edge Functions

```bash
ls supabase/functions/
# Should see:
# - escrow-manager/
```

### 2. Set Environment Secrets

```bash
# For Edge Functions to access secrets
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 3. Deploy Edge Functions

```bash
# Deploy escrow-manager
supabase functions deploy escrow-manager

# Expected output:
# Deploying escrow-manager...
# ✓ Deployed successfully
```

### 4. Test Edge Function

```bash
# Test endpoint
curl -X POST \
  'https://your-project-id.supabase.co/functions/v1/escrow-manager' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "lock_funds",
    "betId": "test-uuid",
    "creatorId": "user1-uuid",
    "opponentId": "user2-uuid",
    "betAmount": 50.00
  }'
```

### 5. View Function Logs

```bash
supabase functions logs escrow-manager
```

Or in Dashboard → Edge Functions → escrow-manager → Logs

---

## Frontend Deployment

### Option A: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Build Project

```bash
npm run build
```

#### 4. Deploy

```bash
vercel --prod
```

#### 5. Add Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
# ... (all VITE_ prefixed variables)
```

#### 6. Redeploy

```bash
vercel --prod
```

---

### Option B: Netlify

#### 1. Build Project

```bash
npm run build
```

#### 2. Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### 3. Login

```bash
netlify login
```

#### 4. Deploy

```bash
netlify deploy --prod --dir=dist
```

#### 5. Add Environment Variables

Netlify Dashboard → Site → Site settings → Environment variables

---

### Option C: Custom Server (VPS)

#### 1. Build Project

```bash
npm run build
```

#### 2. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 3. Configure Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/betcha/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4. Deploy Files

```bash
scp -r dist/* user@yourserver:/var/www/betcha/dist/
```

#### 5. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables

### Complete .env Configuration

```bash
# ============================================
# SUPABASE
# ============================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=your-project-id

# ============================================
# PAYMENT PROVIDER (Choose one)
# ============================================

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxx

# OR Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# ============================================
# KYC PROVIDER (Optional)
# ============================================
JUMIO_API_TOKEN=your_token
JUMIO_API_SECRET=your_secret

# ============================================
# LIVE STREAMING (Optional)
# ============================================
VITE_YOUTUBE_API_KEY=your_key
YOUTUBE_WEBHOOK_SECRET=your_secret

VITE_TIKTOK_APP_ID=your_app_id
TIKTOK_APP_SECRET=your_secret

VITE_INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_secret

# ============================================
# APPLICATION SETTINGS
# ============================================
VITE_APP_URL=https://betcha.com
VITE_API_URL=https://your-project-id.supabase.co

# Platform Configuration
VITE_PLATFORM_FEE_PERCENTAGE=10
VITE_MIN_BET_AMOUNT=1
VITE_MAX_BET_AMOUNT=10000
VITE_MIN_WITHDRAWAL_AMOUNT=10

# Feature Flags
VITE_ENABLE_LIVE_STREAMING=true
VITE_ENABLE_TEAM_BETS=true
VITE_ENABLE_STREAM_BETTING=true

# Environment
VITE_USE_PAYMENT_SANDBOX=false  # Set to false in production!
VITE_ENABLE_DEBUG_MODE=false
```

---

## Post-Deployment Checklist

### Security

- [ ] Enable RLS on all tables
- [ ] Verify API keys are not exposed in frontend code
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable 2FA for admin accounts

### Functionality

- [ ] Test user registration
- [ ] Test wallet deposit (sandbox mode first)
- [ ] Create test bet
- [ ] Lock funds in escrow
- [ ] Submit evidence
- [ ] Test REF evaluation
- [ ] Release funds to winner
- [ ] Verify 10% fee collected
- [ ] Test refund flow
- [ ] Test dispute filing

### Payment Provider

- [ ] Verify webhooks are receiving events
- [ ] Test in sandbox mode thoroughly
- [ ] Switch to live mode ONLY when ready
- [ ] Verify payouts work
- [ ] Test refunds

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Enable Supabase metrics
- [ ] Create alert rules for critical errors

### Legal & Compliance

- [ ] Terms of Service live
- [ ] Privacy Policy live
- [ ] KYC process active
- [ ] Age verification enabled
- [ ] Responsible gambling notices
- [ ] Comply with local gambling laws

---

## Monitoring & Maintenance

### Supabase Dashboard

Monitor from Dashboard:

**Database:**
- Table sizes
- Query performance
- Active connections

**Edge Functions:**
- Invocations count
- Error rate
- Response times

**Auth:**
- Active users
- Sign-ups
- Auth errors

### Logs

**View Edge Function Logs:**
```bash
supabase functions logs escrow-manager --tail
```

**Database Logs:**
Dashboard → Logs → Postgres Logs

### Backups

Supabase Pro automatically backs up database daily.

**Manual backup:**
```bash
supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Updates

**Update Supabase CLI:**
```bash
npm update -g supabase
```

**Database Migrations:**
```bash
# Create new migration
supabase migration new add_new_feature

# Apply migration
supabase db push
```

**Edge Function Updates:**
```bash
# Redeploy after changes
supabase functions deploy escrow-manager
```

### Performance Optimization

**Add indexes for slow queries:**
```sql
CREATE INDEX idx_custom ON table_name(column_name);
```

**Monitor slow queries:**
Dashboard → Database → Query Performance

**Enable caching:**
Use Supabase Realtime for live updates instead of polling.

---

## Troubleshooting

### Common Issues

#### Migration Fails

```bash
# Check current migration status
supabase migration list

# Repair if needed
supabase db reset
supabase db push
```

#### Edge Function Not Working

```bash
# Check logs
supabase functions logs escrow-manager

# Verify environment secrets
supabase secrets list

# Redeploy
supabase functions deploy escrow-manager
```

#### Payment Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check firewall/CORS settings
4. Test with payment provider's webhook tester

#### Database Connection Issues

1. Check Supabase project is not paused
2. Verify connection string
3. Check RLS policies not blocking queries
4. Review database quotas (free tier limits)

---

## Scaling Considerations

### Database

**Free Tier Limits:**
- 500 MB database size
- Pauses after 1 week inactivity

**Pro Tier ($25/month):**
- 8 GB database size
- Daily backups
- Point-in-time recovery

**Scaling:**
- Add read replicas for read-heavy workloads
- Use connection pooling
- Implement caching (Redis)

### Edge Functions

**Limits:**
- Free: 500,000 invocations/month
- Pro: 2 million invocations/month

**Optimization:**
- Batch operations
- Use database functions for complex logic
- Cache frequently accessed data

### Frontend

**CDN:** Use Vercel/Netlify CDN for global performance

**Image Optimization:**
- Use Supabase Storage
- Enable image transformations
- Lazy load images

---

## Production Checklist

Before going live:

- [ ] All environment variables set to production values
- [ ] Payment sandbox mode DISABLED
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Error tracking enabled
- [ ] Monitoring dashboards set up
- [ ] Backup strategy confirmed
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Legal compliance verified
- [ ] Support email/chat ready
- [ ] Documentation updated
- [ ] Team trained on admin tools

---

## Support

### Resources

- **Supabase Docs:** https://supabase.com/docs
- **Paystack Docs:** https://paystack.com/docs
- **Stripe Docs:** https://stripe.com/docs

### Getting Help

- Check error logs first
- Review documentation
- Search GitHub issues
- Contact Supabase support (Pro tier)
- Community forums

---

**Last Updated:** 2025-10-08

**Deployment Version:** 1.0.0
