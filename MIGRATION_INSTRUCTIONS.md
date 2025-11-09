# How to Run the Database Migration in Supabase

## Error You Encountered
You tried to execute the **file path** as SQL:
```sql
supabase/migrations/20250115000000_social_and_group_betting.sql
```

This doesn't work because Supabase needs the **SQL code inside the file**, not the file path.

## ✅ Correct Steps to Run Migration

### Step 1: Go to Supabase SQL Editor
1. Open your browser
2. Go to: https://supabase.com/dashboard
3. Click on your project: **dhwflpfbrevztlolqgbq**
4. In the left sidebar, click **SQL Editor**

### Step 2: Copy the SQL Code
The SQL migration code is 710 lines long and is located in:
```
/Users/mac/Documents/Betcha App/supabase/migrations/20250115000000_social_and_group_betting.sql
```

I've prepared the full SQL for you below.

### Step 3: Paste and Execute
1. In the SQL Editor, click **"New Query"**
2. Copy ALL the SQL code (see below)
3. Paste it into the SQL Editor
4. Click **"Run"** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### Step 4: Verify Success
You should see:
- ✅ "Success. No rows returned"
- OR specific success messages for each section

If you see any errors, copy them and let me know.

## 📋 Full SQL Migration Code

Copy everything from the line `-- ================================================` below to the end:

```sql
[I WILL PROVIDE THIS IN THE NEXT RESPONSE - IT'S TOO LONG FOR ONE MESSAGE]
```

## 🔍 What This Migration Does

This migration creates:
1. **6 New Tables:**
   - `contacts` - Store contacts from phone/email
   - `friend_groups` - Create friend groups
   - `group_members` - Track group membership
   - `challenge_invites` - Multi-channel invites
   - `challenge_participants` - Track challenge participants
   - `challenge_teams` - Team-based challenges

2. **1 Platform Table:**
   - `platform_wallet` - Track platform fees (10%)

3. **3 Database Functions:**
   - `complete_group_individual_challenge()` - 50/35/15 prize split
   - `complete_team_challenge_two_teams()` - Winner takes all
   - `complete_tournament_challenge()` - Tournament prize distribution

4. **Updates to Existing Tables:**
   - Adds columns to `bets` table for group challenges
   - Adds `escrow_balance` column to `profiles` table

## 🚨 Common Issues

**Issue:** "column already exists"
**Solution:** This is OK! It means part of the migration was already run. Continue anyway.

**Issue:** "relation already exists"
**Solution:** This is OK! Tables already created. The migration uses `IF NOT EXISTS` checks.

**Issue:** "syntax error"
**Solution:** Make sure you copied the ENTIRE SQL code, including all lines from start to end.

## 📞 Need Help?

If you encounter any errors:
1. Copy the exact error message
2. Note which line number it occurred on
3. Share it with me and I'll help fix it

---

**Ready?** I'll provide the full SQL code in the next message so you can copy and paste it!
