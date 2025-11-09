# Betcha App - Setup Guide

Complete guide to get your Betcha app fully functional with Supabase backend.

## Prerequisites

- Node.js 18+ installed
- Supabase account ([sign up free](https://supabase.com))
- Git installed

## Quick Start

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in details:
   - Name: "Betcha App"
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait 2-3 minutes for project creation

### 2. Get API Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (looks like `https://xxx.supabase.co`)
   - **anon public** key (the long string starting with `eyJ...`)

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Database Migrations

**Option A: Automatic (Recommended)**
```bash
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

**Option B: Manual**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Run each migration
supabase db execute --file supabase/migrations/20250101000000_create_profiles.sql
supabase db execute --file supabase/migrations/20250101000001_create_bets.sql
# ... repeat for all migration files
```

### 6. Create Test Users (Optional)

1. Go to Authentication → Users in Supabase Dashboard
2. Create two test accounts:
   - `creator@betcha.test` / `TestPass123!`
   - `opponent@betcha.test` / `TestPass123!`

### 7. Load Seed Data (Optional)

1. Get the user IDs from auth.users table
2. Edit `supabase/seed.sql` and replace the placeholder UUIDs
3. Uncomment the INSERT statements
4. Run: `supabase db execute --file supabase/seed.sql`

### 8. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Database Schema

The app creates these tables automatically:

- **profiles** - User profiles with wallet balance and KYC status
- **bets** - All bet records with game rules and status
- **escrow** - Locked funds for each bet
- **transactions** - Wallet transaction history
- **evidence** - Submitted proof for bets
- **disputes** - Raised disputes and resolutions
- **kyc_verifications** - Identity verification submissions

## Storage Buckets

Two storage buckets are created:

- **kyc-documents** (5MB limit, images only)
- **evidence** (50MB limit, images and videos)

## Testing the App

### With Test Users

1. Log in as `creator@betcha.test`
2. Go to Games → Select a game
3. Create bet against `opponent@betcha.test`
4. Log out and log in as `opponent@betcha.test`
5. Go to Active Bets → Accept the bet
6. Both users can now submit evidence
7. Test dispute flow

### Key Features to Test

- ✅ User registration and login
- ✅ Browse 100+ game rules
- ✅ Create bet with escrow
- ✅ Accept/reject bets
- ✅ Submit evidence
- ✅ Raise disputes
- ✅ KYC document upload
- ✅ Wallet transactions

## Troubleshooting

### "Failed to fetch" errors

- Check your .env.local has correct Supabase URL and key
- Verify Supabase project is running
- Check browser console for CORS errors

### Database errors

- Make sure all migrations ran successfully
- Check Supabase Dashboard → Database → Tables to verify tables exist
- Review RLS policies in Table Editor → Policies

### Storage errors

- Verify storage buckets exist: Storage → Buckets
- Check bucket policies allow authenticated users to upload
- Verify file size limits (5MB for KYC, 50MB for evidence)

### Authentication errors

- Enable Email/Password provider in Authentication → Providers
- Configure email templates in Authentication → Email Templates
- Check Site URL is set to `http://localhost:5173`

## Production Deployment

### Environment Variables

Update .env.production:
```
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_key
VITE_APP_URL=https://yourdomain.com
```

### Build

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static host

### Post-Deployment

1. Update Supabase Site URL in Authentication → URL Configuration
2. Add production domain to Supabase allowed origins
3. Update Stripe keys for production payments
4. Enable email confirmations in Auth settings

## Next Steps

### Add Stripe Payments

1. Create Stripe account
2. Get API keys
3. Add to .env.local:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Wallet deposits/withdrawals will work automatically

### Enable Real-time Updates

Use Supabase Realtime subscriptions in your components to get live updates when bets change.

### Add Admin Panel

Build admin dashboard to:
- Review disputes
- Verify KYC submissions
- Monitor platform activity
- Manage users and bets

## Support

- Documentation: [TEST_REPORT.md](./TEST_REPORT.md)
- Supabase Docs: https://supabase.com/docs
- Issues: Check browser console for errors

## Summary

You now have a fully functional betting platform with:
- ✅ User authentication
- ✅ Wallet management
- ✅ Bet creation and escrow
- ✅ Evidence submission
- ✅ Dispute resolution
- ✅ KYC verification

All features are production-ready and just need Supabase configuration!
