# 🚨 URGENT: Supabase Project Connection Failed

## Problem Detected

Your Supabase project **cannot be reached**. Error:
```
Could not resolve host: dhwflpfbrevztlolqgbq.supabase.co
```

This means the Supabase project is either:
- ⏸️ **Paused** (most likely - Supabase pauses free projects after 7 days)
- 🗑️ **Deleted**
- ❌ **Never existed** (template credentials)

---

## 🔧 Fix Instructions

### STEP 1: Check Project Status

1. Go to: **https://supabase.com/dashboard**
2. Sign in with your account
3. Look for project: `dhwflpfbrevztlolqgbq`

### STEP 2A: If Project is PAUSED ⏸️

1. Click the project name
2. You'll see a banner saying **"Project Paused"**
3. Click **"Restore Project"** or **"Resume"**
4. Wait 2-3 minutes for the project to come online
5. Verify it's online: https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq
6. **Refresh your browser** at http://localhost:8080
7. The app should now work!

### STEP 2B: If Project DOESN'T EXIST 🗑️

You'll need to create a new Supabase project:

#### 1. Create New Project

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `Betcha App` (or any name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to South Africa (e.g., `Africa (Cape Town)`)
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

#### 2. Get New Credentials

Once project is created:

1. Go to **Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxxx.supabase.co`)
   - **Project API Key** (under "Project API keys" → "anon public")
   - **Project Reference ID** (under "Project Settings" → "Reference ID")

#### 3. Update .env File

Replace the values in your `.env` file:

```bash
# Open .env file and update these three lines:
VITE_SUPABASE_PROJECT_ID="<your-new-project-id>"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-new-anon-key>"
VITE_SUPABASE_URL="<your-new-project-url>"
```

**Example:**
```bash
VITE_SUPABASE_PROJECT_ID="xyzabc123456"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://xyzabc123456.supabase.co"
```

#### 4. Run Database Migrations

After updating `.env`:

1. **Restart the dev server:**
   ```bash
   # In your terminal, press Ctrl+C to stop
   # Then run:
   npm run dev
   ```

2. **Run SQL migrations** in Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/<your-new-project-id>/sql
   - Click **"New Query"**
   - Copy SQL from: `supabase/migrations/` (start with earliest file)
   - Run each migration file in order:
     1. `20250115000000_social_and_group_betting.sql`
     2. `20250115000005_create_user_settings.sql`
     3. Any other files in the migrations folder
   - Click **"Run"** for each file

#### 5. Test the App

1. Go to: http://localhost:8080
2. Try creating an account
3. Should work now! ✅

---

## 🎯 Quick Checklist

- [ ] Checked Supabase dashboard for project status
- [ ] If paused: Restored the project
- [ ] If deleted: Created new project
- [ ] Updated `.env` file with new credentials
- [ ] Restarted dev server (`npm run dev`)
- [ ] Ran database migrations in SQL editor
- [ ] Tested app at http://localhost:8080

---

## 📞 Need Help?

If project shows as ACTIVE but still can't connect:
1. Wait 5 minutes (DNS propagation)
2. Try from different network
3. Check Supabase status: https://status.supabase.com/

If you created NEW project:
1. Make sure you copied ALL THREE values correctly
2. No spaces or quotes around values in `.env`
3. Restart dev server after updating `.env`

---

**Current Status:** 🔴 **Action Required**
**Next Step:** Check Supabase dashboard now!
