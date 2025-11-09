# 🚀 Run Database Migrations - Quick Guide

**Your Supabase is already configured!** Just need to run the migrations.

---

## ⚡ Super Fast Method (5 minutes)

### Option 1: Run All Migrations at Once (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/moammhjzzqjyeeffsiue

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste Entire Migration File**
   - Open the file: `supabase/ALL_MIGRATIONS.sql`
   - Select ALL content (Cmd+A / Ctrl+A)
   - Copy (Cmd+C / Ctrl+C)
   - Paste into Supabase SQL Editor

4. **Run the Query**
   - Click "Run" button (or press Cmd+Enter / Ctrl+Enter)
   - Wait 5-10 seconds for completion

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - This is CORRECT! It means tables were created successfully

---

## ✅ Verify Everything Worked

### Check Tables Were Created

1. Click **"Table Editor"** in left sidebar
2. You should see these 7 tables:
   - ✅ profiles
   - ✅ bets
   - ✅ escrow
   - ✅ transactions
   - ✅ evidence
   - ✅ disputes
   - ✅ kyc_verifications

### Check Storage Buckets

1. Click **"Storage"** in left sidebar
2. You should see these 2 buckets:
   - ✅ kyc-documents
   - ✅ evidence

---

## 🧪 Test the App

### Step 1: Start Dev Server

```bash
cd "/Users/mac/Documents/Betcha App"
npm install
npm run dev
```

### Step 2: Open Browser

- Go to: http://localhost:5173
- You should see the Betcha homepage

### Step 3: Create Test Account

1. Click **"Sign Up"**
2. Enter:
   - Email: test@example.com
   - Password: TestPassword123!
3. Click **"Sign Up"**
4. You should be redirected to the app

### Step 4: Verify Database

1. Go back to Supabase Dashboard
2. Click **"Table Editor"** → **"profiles"**
3. You should see your test user profile with:
   - user_id: (your user's UUID)
   - email: test@example.com
   - balance: 0.00
   - kyc_status: not_started

---

## 🎯 Your Current Setup Status

✅ **Supabase Project:** Created
- Project ID: moammhjzzqjyeeffsiue
- Region: Configured
- Status: Active

✅ **Environment Variables:** Configured
- VITE_SUPABASE_URL: ✅ Set
- VITE_SUPABASE_PUBLISHABLE_KEY: ✅ Set
- File: `.env` in project root

⏳ **Database Migrations:** Ready to run
- All 9 migrations ready in `supabase/ALL_MIGRATIONS.sql`
- Takes 10 seconds to run
- Just copy-paste into SQL Editor

⏳ **Testing:** Ready after migrations

---

## 🔥 Alternative: Run Individual Migrations

If you prefer to run migrations one by one (takes 10 minutes):

### Migration 1: Profiles
- File: `supabase/migrations/20250101000000_create_profiles.sql`
- Creates: profiles table + auto-signup trigger

### Migration 2: Bets
- File: `supabase/migrations/20250101000001_create_bets.sql`
- Creates: bets table

### Migration 3: Escrow
- File: `supabase/migrations/20250101000002_create_escrow.sql`
- Creates: escrow table

### Migration 4: Transactions
- File: `supabase/migrations/20250101000003_create_transactions.sql`
- Creates: transactions table

### Migration 5: Evidence
- File: `supabase/migrations/20250101000004_create_evidence.sql`
- Creates: evidence table

### Migration 6: Disputes
- File: `supabase/migrations/20250101000005_create_disputes.sql`
- Creates: disputes table

### Migration 7: KYC
- File: `supabase/migrations/20250101000006_create_kyc_verifications.sql`
- Creates: kyc_verifications table

### Migration 8: Storage
- File: `supabase/migrations/20250101000007_create_storage_buckets.sql`
- Creates: kyc-documents and evidence buckets

### Migration 9: Functions
- File: `supabase/migrations/20250101000008_create_functions.sql`
- Creates: update_wallet_balance, complete_bet, refund_bet functions

**To run individually:**
- Open each file
- Copy contents
- Paste into Supabase SQL Editor → New query
- Click "Run"
- Move to next file

---

## ❌ Common Issues

### "Success. No rows returned" - Is this an error?
**NO!** This is the CORRECT result for CREATE TABLE statements.

### Migration fails with "already exists"
**SKIP IT** - table already created. Move to next migration.

### Can't see storage buckets after migration 8
**Wait 30 seconds** then refresh the Storage page.

### App shows "Invalid API key"
**Restart dev server** - Vite needs restart after .env changes.

---

## 📞 Next Steps After Migrations

Once migrations are complete:

1. ✅ Test signup/login
2. ✅ Browse games page
3. ✅ Try creating a bet (will need second test account)
4. ✅ Check profile in Supabase Table Editor

---

## 🎉 You're Almost Done!

**Time to completion:** 5 minutes (migrations) + 2 minutes (testing) = **7 minutes total**

**Ready?** Go to Supabase Dashboard and run `ALL_MIGRATIONS.sql` now!

---

**Dashboard Link:** https://supabase.com/dashboard/project/moammhjzzqjyeeffsiue/editor
