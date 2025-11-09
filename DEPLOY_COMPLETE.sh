#!/bin/bash

# Betcha App - Complete Deployment Script
# This will deploy your app in 10 minutes

echo "🚀 BETCHA APP - COMPLETE DEPLOYMENT"
echo "===================================="
echo ""

# Change to project directory
cd "/Users/mac/Documents/Betcha App"

echo "✅ Step 1: Login to Supabase"
echo "----------------------------"
echo "Opening browser for login..."
supabase login

echo ""
echo "✅ Step 2: Link Supabase Project"
echo "---------------------------------"
echo "Linking to your Supabase project..."
supabase link --project-ref dhwflpfbrevztlolqgbq

echo ""
echo "✅ Step 3: Push Database Migrations"
echo "------------------------------------"
echo "Creating all database tables..."
supabase db push

echo ""
echo "✅ Step 4: Verify Database"
echo "--------------------------"
echo "Checking tables were created..."
supabase db remote ls

echo ""
echo "✅ Step 5: Install Vercel CLI"
echo "-----------------------------"
npm install -g vercel

echo ""
echo "✅ Step 6: Deploy to Vercel"
echo "----------------------------"
echo "Deploying your app..."
vercel --prod

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "Your app is now LIVE on the internet!"
echo ""
echo "Next steps:"
echo "1. Test sign up and login on your live URL"
echo "2. Add payment provider keys (optional)"
echo "3. Share with users!"
echo ""
echo "📚 See DEPLOY_NOW.md for more details"
