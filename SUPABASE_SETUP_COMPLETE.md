# ✅ Supabase Configuration Updated

## Configuration Details

Your Betcha app is now connected to the correct Supabase project:

### Project Information
- **Project ID:** `dhwflpfbrevztlolqgbq`
- **Project URL:** `https://dhwflpfbrevztlolqgbq.supabase.co`
- **API Key:** Configured ✅
- **Environment:** Development

### Files Updated
1. **`.env`** - Updated with new credentials
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`

2. **Supabase Client** - Already configured correctly
   - Location: `src/integrations/supabase/client.ts`
   - Auto-reads from environment variables

## 🌐 Application Links

### View Your App:
- **Local:** http://localhost:8080
- **Network:** http://192.168.1.51:8080

### Supabase Dashboard:
- **Project Dashboard:** https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq
- **SQL Editor:** https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/sql
- **Table Editor:** https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/editor
- **Authentication:** https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/auth/users

## 📋 Next Steps

### 1. Run Database Migration (REQUIRED)
You need to run the SQL migration to create all the tables for social features:

**Steps:**
1. Go to: https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/sql
2. Click "New Query"
3. Copy the SQL from: `supabase/migrations/20250115000000_social_and_group_betting.sql`
4. Paste into SQL Editor
5. Click "Run" (or press Cmd+Enter)

**What it creates:**
- ✅ 6 tables: contacts, friend_groups, group_members, challenge_invites, challenge_participants, challenge_teams
- ✅ 1 table: platform_wallet
- ✅ 3 functions: complete_group_individual_challenge, complete_team_challenge_two_teams, complete_tournament_challenge
- ✅ Updates to existing bets and profiles tables

### 2. Test the Connection
Open your app at http://localhost:8080 and:
- Try creating an account
- Check if authentication works
- Verify database connection is working

### 3. Optional: Add Payment Keys
Once you have Yoco account:
```env
# Add to .env file
VITE_YOCO_PUBLIC_KEY=pk_test_xxxxx
YOCO_SECRET_KEY=sk_test_xxxxx
YOCO_WEBHOOK_SECRET=whsec_xxxxx
```

## 🔍 Verify Configuration

### Check Environment Variables
Your app should now be using:
```
Project: dhwflpfbrevztlolqgbq
URL: https://dhwflpfbrevztlolqgbq.supabase.co
```

### Test Database Connection
1. Open browser console (F12)
2. Navigate to: http://localhost:8080
3. Check for any Supabase connection errors
4. Should connect successfully if migration is run

## 🚨 Troubleshooting

### Issue: "relation does not exist"
**Cause:** Database migration not run yet
**Solution:** Run the SQL migration (see step 1 above)

### Issue: "Invalid API key"
**Cause:** Wrong API key in .env
**Solution:** Double-check the key matches your Supabase dashboard

### Issue: "CORS error"
**Cause:** Incorrect project URL
**Solution:** Verify URL is `https://dhwflpfbrevztlolqgbq.supabase.co`

### Issue: App not reflecting changes
**Cause:** Server needs restart
**Solution:** 
```bash
# Stop server (Ctrl+C in terminal)
# Start again
npm run dev
```

## ✅ Configuration Summary

| Setting | Status | Value |
|---------|--------|-------|
| Supabase URL | ✅ Configured | https://dhwflpfbrevztlolqgbq.supabase.co |
| API Key | ✅ Configured | eyJhbGciOiJIUzI1... |
| Project ID | ✅ Configured | dhwflpfbrevztlolqgbq |
| Client Setup | ✅ Ready | Auto-configured |
| Dev Server | ✅ Running | http://localhost:8080 |
| Migration | ⏳ Pending | Run SQL in dashboard |

---

**Status:** Configuration Complete ✅  
**Next Action:** Run database migration  
**Then:** Test the app at http://localhost:8080
