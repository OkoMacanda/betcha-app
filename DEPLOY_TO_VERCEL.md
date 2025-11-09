# 🚀 DEPLOY TO VERCEL - Simple Guide

**Get your app live on the internet in 10 minutes!**

---

## Prerequisites

✅ Database set up (see EASY_DATABASE_SETUP.md)
✅ Dev server working on http://localhost:8083/

---

## Step 1: Install Vercel CLI

Open Terminal and run:

```bash
npm install -g vercel
```

**Wait for it to finish installing...**

---

## Step 2: Build Your App Locally (Test)

```bash
cd "/Users/mac/Documents/Betcha App"
npm run build
```

**This tests if your app builds correctly before deploying.**

If you see errors, we'll fix them. If it succeeds, continue!

---

## Step 3: Deploy to Vercel

```bash
vercel
```

**Follow the prompts:**

1. **"Set up and deploy?"** → Press **Enter** (Yes)
2. **"Which scope?"** → Press **Enter** (your account)
3. **"Link to existing project?"** → Type **n** and press **Enter** (No)
4. **"What's your project's name?"** → Type **betcha-app** and press **Enter**
5. **"In which directory?"** → Press **Enter** (current directory)
6. **"Want to override settings?"** → Type **n** and press **Enter** (No)

**Vercel will now build and deploy your app!**

This takes about 2-3 minutes...

---

## Step 4: Add Environment Variables

After deployment, you need to add your Supabase credentials:

```bash
vercel env add VITE_SUPABASE_URL production
```

When prompted, paste:
```
https://dhwflpfbrevztlolqgbq.supabase.co
```

```bash
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
```

When prompted, paste:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod2ZscGZicmV2enRsb2xxZ2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzI5NTcsImV4cCI6MjA3NjA0ODk1N30.ZhXDbc7UBPTz9_ftSgwQyGfE8CAmqtLaIDJKzrp99Qo
```

---

## Step 5: Deploy Again with Environment Variables

```bash
vercel --prod
```

**This redeploys with the environment variables.**

---

## ✅ YOU'RE LIVE!

After deployment completes, you'll see:

```
✅ Production: https://betcha-app.vercel.app
```

**Copy that URL and open it in your browser!**

---

## Step 6: Test Your Live App

1. **Open:** https://betcha-app.vercel.app (or your URL)
2. **Click "Sign Up"**
3. **Create an account**
4. **Check your email** for verification
5. **Sign in and test!**

---

## 🎉 Congratulations!

Your Betcha app is now:
- ✅ **LIVE on the internet**
- ✅ **Accessible from any device**
- ✅ **Ready for users**
- ✅ **Connected to your database**

---

## 📱 Next Steps (Optional)

### Add Payment Provider (Later)

When ready to accept real money:

**For South Africa (Yoco):**
```bash
vercel env add VITE_YOCO_PUBLIC_KEY production
# Paste your Yoco public key when prompted
vercel --prod
```

**For Nigeria/Africa (Paystack):**
```bash
vercel env add VITE_PAYSTACK_PUBLIC_KEY production
# Paste your Paystack public key when prompted
vercel --prod
```

### Add Custom Domain (Optional)

1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Go to "Settings" → "Domains"
4. Add your custom domain (e.g., betcha.co.za)
5. Follow the DNS setup instructions

---

## 🐛 Troubleshooting

### Problem: "Build failed"

**Solution:**
```bash
# Check what the error is
npm run build

# If you see TypeScript errors, we can fix them
# Share the error message
```

### Problem: "Sign up not working on live site"

**Solution:**
1. Check if you added environment variables (Step 4)
2. Verify at: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
3. Make sure you redeployed with `vercel --prod` after adding variables

### Problem: "Page not found (404)"

**Solution:**
This is a routing issue. Run:
```bash
vercel --prod
```
This will fix the routing.

### Problem: "Can't find my deployed URL"

**Solution:**
```bash
# List your deployments
vercel list

# Or visit
https://vercel.com/dashboard
```

---

## 📊 Monitor Your App

**Vercel Dashboard:** https://vercel.com/dashboard

Here you can see:
- 📈 Traffic and usage
- 🐛 Build logs
- ⚙️ Environment variables
- 📊 Performance metrics

---

## 💰 Costs

**Vercel Free Tier includes:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic SSL certificates
- ✅ Global CDN

**This is MORE than enough for your initial launch!**

When you grow beyond this, Vercel Pro is $20/month.

---

## 🎯 Your URLs

**Local Development:**
- http://localhost:8083/

**Production (Live):**
- https://betcha-app.vercel.app (or your custom URL)

**Supabase Dashboard:**
- https://supabase.com/dashboard/project/dhwflpfbrevztlolqgbq

**Vercel Dashboard:**
- https://vercel.com/dashboard

---

## ✅ Deployment Checklist

- [ ] Installed Vercel CLI
- [ ] Built app locally (npm run build)
- [ ] Deployed to Vercel (vercel)
- [ ] Added environment variables
- [ ] Redeployed with variables (vercel --prod)
- [ ] Tested sign up on live site
- [ ] Tested sign in on live site
- [ ] Shared URL with friends!

---

**You did it! Your app is LIVE!** 🎉🚀

Share your URL and start getting users!
