#!/bin/bash

# Betcha App - Automatic Environment Variable Setup for Vercel
# This script adds Supabase credentials to all Vercel environments

echo "🔧 Setting up environment variables in Vercel..."
echo ""

SUPABASE_URL="https://dhwflpfbrevztlolqgbq.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod2ZscGZicmV2enRsb2xxZ2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzI5NTcsImV4cCI6MjA3NjA0ODk1N30.ZhXDbc7UBPTz9_ftSgwQyGfE8CAmqtLaIDJKzrp99Qo"

# Add to Production
echo "➤ Adding VITE_SUPABASE_URL to Production..."
echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production

echo "➤ Adding VITE_SUPABASE_PUBLISHABLE_KEY to Production..."
echo "$SUPABASE_KEY" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

# Add to Preview
echo "➤ Adding VITE_SUPABASE_URL to Preview..."
echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL preview

echo "➤ Adding VITE_SUPABASE_PUBLISHABLE_KEY to Preview..."
echo "$SUPABASE_KEY" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY preview

# Add to Development
echo "➤ Adding VITE_SUPABASE_URL to Development..."
echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL development

echo "➤ Adding VITE_SUPABASE_PUBLISHABLE_KEY to Development..."
echo "$SUPABASE_KEY" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY development

echo ""
echo "✅ Environment variables configured for all environments!"
echo ""
echo "🚀 Deploying to production..."
vercel --prod --force

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Your app is live with Supabase credentials configured!"
