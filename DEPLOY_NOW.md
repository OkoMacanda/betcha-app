# 🚀 DEPLOY YOUR BETCHA APP NOW - Step by Step

**Follow these exact steps to get your app live in 30 minutes!**

---

## ✅ Step 1: Test Localhost (5 minutes)

Your dev server is running! Access it here:

**👉 http://localhost:8083/ 👈**

Open your browser and go to that URL. You should see your Betcha homepage!

---

## ✅ Step 2: Set Up Supabase Database (10 minutes)

### **2.1 Login to Supabase CLI**

```bash
cd "/Users/mac/Documents/Betcha App"
supabase login
```

This will open your browser. Log in with your Supabase account.

### **2.2 Link Your Project**

```bash
supabase link --project-ref dhwflpfbrevztlolqgbq
```

When prompted for database password, get it from:
1. Go to https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/settings/database
2. Copy your database password
3. Paste it when prompted

### **2.3 Push All Migrations**

```bash
supabase db push
```

This will create all the tables (profiles, bets, escrow, transactions, etc.)

### **2.4 Verify Database**

Go to https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/editor

You should see these tables:
- ✅ profiles
- ✅ bets
- ✅ escrow
- ✅ transactions
- ✅ evidence
- ✅ disputes
- ✅ kyc_verifications
- ✅ contacts
- ✅ groups
- ✅ And more...

---

## ✅ Step 3: Deploy to Vercel (5 minutes)

### **3.1 Install Vercel CLI**

```bash
npm install -g vercel
```

### **3.2 Deploy**

```bash
cd "/Users/mac/Documents/Betcha App"
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → betcha-app (or your choice)
- **Directory?** → ./ (press Enter)
- **Override settings?** → No

### **3.3 Add Environment Variables**

After deploy, run:

```bash
vercel env add VITE_SUPABASE_URL
```
Paste: `https://dhwflpfbrevztlolqgbq.supabase.co`

```bash
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
```
Paste: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod2ZscGZicmV2enRsb2xxZ2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzI5NTcsImV4cCI6MjA3NjA0ODk1N30.ZhXDbc7UBPTz9_ftSgwQyGfE8CAmqtLaIDJKzrp99Qo`

### **3.4 Redeploy with Variables**

```bash
vercel --prod
```

---

## ✅ Step 4: Test Your Live App! (5 minutes)

After deployment, Vercel will give you a URL like:
**https://betcha-app.vercel.app**

1. **Open the URL** in your browser
2. **Click "Sign Up"**
3. **Create an account** with your email
4. **Check your email** for verification link
5. **Log in** and test the app!

---

## ✅ Step 5: Add Payment Provider (Optional - 15 minutes)

### **For South Africa - Use Yoco**

1. **Sign up at https://www.yoco.com/za/online-payments/**
2. **Get your test API keys:**
   - Go to Business Portal → Developers
   - Copy Public Key and Secret Key

3. **Add to Vercel:**
```bash
vercel env add VITE_YOCO_PUBLIC_KEY
```
Paste your Yoco public key

4. **Redeploy:**
```bash
vercel --prod
```

### **For Nigeria/Africa - Use Paystack**

1. **Sign up at https://paystack.com**
2. **Get API keys:** Settings → API Keys & Webhooks
3. **Add to Vercel:**
```bash
vercel env add VITE_PAYSTACK_PUBLIC_KEY
```

4. **Redeploy:**
```bash
vercel --prod
```

---

## 🎉 YOU'RE LIVE!

Your app is now:
- ✅ Running on Vercel
- ✅ Connected to Supabase database
- ✅ Ready for users to sign up
- ✅ Ready for bets and challenges
- ✅ Payment integration ready (once you add keys)

---

## 🐛 Troubleshooting

### **Problem: "Cannot connect to Supabase"**

**Solution:**
```bash
# Check your .env file
cat .env

# Make sure these are set:
VITE_SUPABASE_URL=https://dhwflpfbrevztlolqgbq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

### **Problem: "Sign up not working"**

**Solution:**
1. Go to https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq/auth/users
2. Check if Email Auth is enabled
3. Disable email confirmation for testing:
   - Settings → Auth → Email Auth → Disable "Confirm email"

### **Problem: "localhost:8083 not loading"**

**Solution:**
```bash
# Kill all node processes
pkill -f node

# Restart dev server
cd "/Users/mac/Documents/Betcha App"
npm run dev

# Access at: http://localhost:8083
```

### **Problem: "Vercel deployment failed"**

**Solution:**
```bash
# Build locally first to check for errors
npm run build

# If successful, deploy again
vercel --prod
```

---

## 📋 Quick Command Reference

```bash
# Start local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Push database migrations
supabase db push

# Check Supabase status
supabase status

# View logs
vercel logs
```

---

## 🎯 What's Next?

### **Immediate (Today)**
1. ✅ Deploy to Vercel (DONE after step 3)
2. ✅ Test sign up and login
3. ✅ Create a test bet
4. ⏳ Add payment provider keys

### **This Week**
1. ⏳ Get Yoco/Paystack approved for production
2. ⏳ Set up custom domain (optional)
3. ⏳ Enable KYC provider (Jumio/Onfido)
4. ⏳ Add SMS notifications (Twilio)

### **This Month**
1. ⏳ Launch marketing campaign
2. ⏳ Get first 100 users
3. ⏳ Collect feedback
4. ⏳ Deploy mobile apps

---

## 💡 Pro Tips

**1. Use Test Mode First**
- Use test API keys from payment providers
- Test with small amounts
- Switch to live keys only when ready

**2. Monitor Your App**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Check error logs regularly

**3. Backup Your Database**
```bash
supabase db dump -f backup.sql
```

**4. Update Environment Variables**
- Always redeploy after adding new variables
- Use `vercel env pull` to sync locally

---

## 📞 Need Help?

**Documentation:**
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Your Deployment Guide](QUICKSTART_DEPLOYMENT.md)

**Your App URLs:**
- **Local:** http://localhost:8083/
- **Live:** https://betcha-app.vercel.app (after deployment)
- **Supabase:** https://dhwflpfbrevztlolqgbq.supabase.co

---

## ✅ Deployment Checklist

- [x] Dev server running locally
- [x] Supabase configured
- [ ] Supabase migrations pushed
- [ ] Deployed to Vercel
- [ ] Environment variables added
- [ ] Sign up tested
- [ ] Payment keys added (optional)
- [ ] Custom domain configured (optional)

---

**START NOW: Run these 3 commands to deploy!**

```bash
# 1. Login to Supabase
supabase login

# 2. Push database migrations
supabase db push

# 3. Deploy to Vercel
vercel --prod
```

**Your app will be live in 10 minutes!** 🚀
