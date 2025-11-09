# 🎯 EASY DATABASE SETUP - No CLI Required!

**Since the Supabase CLI has permissions issues, we'll use the web dashboard instead.**

**Time required: 5 minutes**

---

## Step 1: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/sql/new**
2. You should see a blank SQL editor

---

## Step 2: Run the Database Setup

1. **Open the file:** `SETUP_DATABASE.sql` (in this project folder)
2. **Copy ALL the contents** (Cmd+A, then Cmd+C)
3. **Paste into the Supabase SQL Editor**
4. **Click "RUN"** button (bottom right)

**This will create all 19 tables in about 30 seconds!**

---

## Step 3: Verify Tables Were Created

After running the SQL:

1. Go to: **https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/editor**
2. You should now see these tables on the left sidebar:
   - ✅ profiles
   - ✅ bets
   - ✅ escrow
   - ✅ transactions
   - ✅ evidence
   - ✅ disputes
   - ✅ kyc_verifications
   - ✅ contacts
   - ✅ groups
   - ✅ group_members
   - ✅ notifications
   - ✅ activities
   - ✅ And more...

---

## Step 4: Test the Connection

1. **Open your browser:** http://localhost:8083/
2. **Click "Sign Up"**
3. **Create a test account:**
   - Email: your-email@example.com
   - Password: Test123!
   - Username: testuser

4. **Check your email** for the verification link
5. **Click the verification link**
6. **Try to sign in!**

---

## ✅ That's It!

Your database is now set up! The app should now work properly.

**Next step:** Deploy to Vercel (see DEPLOY_TO_VERCEL.md)

---

## 🐛 Troubleshooting

### Problem: "RUN button is grayed out"
**Solution:** Make sure you pasted the SQL content into the editor

### Problem: "Error executing SQL"
**Solution:**
1. Clear the SQL editor
2. Go back to Step 2 and try again
3. Make sure you copied the ENTIRE file

### Problem: "Some tables already exist"
**Solution:** The SQL will skip existing tables automatically - this is fine!

### Problem: "Still can't sign up"
**Solution:**
1. Check browser console (F12) for errors
2. Verify tables exist in: https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/editor
3. Try clearing browser cache and reloading http://localhost:8083/

---

**Need help?** Check the browser console (F12) for error messages and share them.
