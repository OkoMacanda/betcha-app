# Supabase Setup Checklist

Complete each step in order. Check off items as you go.

---

## ✅ Step 1: Create Supabase Project

- [ ] Go to https://supabase.com
- [ ] Sign in or create account
- [ ] Click "New Project"
- [ ] Name: `betcha-app` (or your choice)
- [ ] Database Password: _________________ (save this!)
- [ ] Region: _________________
- [ ] Click "Create new project"
- [ ] Wait for project to initialize (2-3 minutes)

---

## ✅ Step 2: Get API Credentials

- [ ] Go to Project Settings (gear icon)
- [ ] Click "API" in left menu
- [ ] Copy Project URL: _________________________________
- [ ] Copy anon public key: _________________________________

---

## ✅ Step 3: Run Database Migrations

Run these SQL files **in order** in Supabase SQL Editor:

### Migration 1: Profiles Table
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Click "New query"
- [ ] Copy contents of `supabase/migrations/20250101000000_create_profiles.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" (or press Cmd/Ctrl + Enter)
- [ ] Verify: "Success. No rows returned"

### Migration 2: Bets Table
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000001_create_bets.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 3: Escrow Table
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000002_create_escrow.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 4: Transactions Table
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000003_create_transactions.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 5: Evidence Table
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000004_create_evidence.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 6: Disputes Table
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000005_create_disputes.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 7: KYC Verifications Table
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000006_create_kyc_verifications.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 8: Storage Buckets
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000007_create_storage_buckets.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

### Migration 9: Database Functions
- [ ] New query
- [ ] Copy contents of `supabase/migrations/20250101000008_create_functions.sql`
- [ ] Paste and Run
- [ ] Verify: Success message

**Expected Result:** All 9 migrations should show "Success" message.

---

## ✅ Step 4: Verify Tables Were Created

- [ ] Go to "Table Editor" in Supabase sidebar
- [ ] Verify these tables exist:
  - [ ] profiles
  - [ ] bets
  - [ ] escrow
  - [ ] transactions
  - [ ] evidence
  - [ ] disputes
  - [ ] kyc_verifications

- [ ] Go to "Storage" in Supabase sidebar
- [ ] Verify these buckets exist:
  - [ ] kyc-documents
  - [ ] evidence

---

## ✅ Step 5: Create .env File

- [ ] Open project in code editor
- [ ] Create new file: `.env` in project root
- [ ] Add these lines (replace with your actual values):

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

- [ ] Save the file
- [ ] Verify `.env` is in `.gitignore` (should already be there)

---

## ✅ Step 6: Test Compilation

- [ ] Open terminal in project directory
- [ ] Run: `npm install`
- [ ] Run: `npm run dev`
- [ ] Verify: No compilation errors
- [ ] Verify: Dev server starts (usually http://localhost:5173)
- [ ] Open browser to dev server URL
- [ ] Verify: App loads without errors

---

## ✅ Step 7: Test Basic Functionality

- [ ] Click "Sign Up" button
- [ ] Create test account (email + password)
- [ ] Verify: Account created successfully
- [ ] Verify: Redirected to dashboard/games page
- [ ] Check Supabase "Authentication" → "Users"
- [ ] Verify: Your test user appears in list

---

## ✅ Step 8: Test Database Connection

- [ ] In Supabase, go to "Table Editor" → "profiles"
- [ ] Verify: Your user's profile row was auto-created
- [ ] Check columns:
  - [ ] user_id (your user's UUID)
  - [ ] email (your test email)
  - [ ] balance (should be 0.00)
  - [ ] kyc_status (should be 'not_started')

---

## 🎉 Completion Checklist

All done? Verify these final items:

- [ ] Supabase project created
- [ ] All 9 migrations run successfully
- [ ] All 7 tables visible in Table Editor
- [ ] 2 storage buckets created
- [ ] .env file created with correct credentials
- [ ] App compiles without errors
- [ ] Can sign up new user
- [ ] User profile auto-created in database
- [ ] No console errors in browser

---

## ❌ Troubleshooting

### "Success. No rows returned" - is this correct?
✅ **YES!** This is the expected message for CREATE TABLE and CREATE FUNCTION statements.

### Migration fails with "relation already exists"
✅ **Skip it** - table already created. Move to next migration.

### Migration fails with permission error
❌ Make sure you're logged into the correct project
❌ Check you're running query in SQL Editor (not psql)

### App shows "Invalid API key"
❌ Check .env file has correct credentials
❌ Restart dev server after creating .env
❌ Verify no extra spaces in .env values

### Can't see storage buckets
❌ Check migration 8 ran successfully
❌ Go to Storage → Policies and verify policies exist

---

## 📞 Need Help?

If stuck, check these files:
- **SETUP.md** - Complete 500-line setup guide
- **IMPLEMENTATION_STATUS.md** - Troubleshooting section
- **START_HERE.md** - Quick reference

---

**Ready to begin?** Start with Step 1 above!
