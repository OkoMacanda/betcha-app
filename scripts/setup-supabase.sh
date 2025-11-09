#!/bin/bash

# Betcha App - Supabase Setup Script
# This script helps you set up your Supabase database quickly

echo "🎯 Betcha App - Supabase Setup"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local not found!"
  echo "Please copy .env.example to .env.local and fill in your Supabase credentials."
  echo ""
  echo "Run: cp .env.example .env.local"
  echo "Then edit .env.local with your Supabase project URL and anon key"
  exit 1
fi

echo "✅ Found .env.local"
echo ""

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "⚠️  Supabase CLI not found!"
  echo ""
  echo "Install it with:"
  echo "  npm install -g supabase"
  echo "  or"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Prompt for project details
echo "Please enter your Supabase project details:"
echo "(Find these at: https://app.supabase.com/project/_/settings/api)"
echo ""

read -p "Project URL (https://xxx.supabase.co): " PROJECT_URL
read -p "Project ID (from URL): " PROJECT_ID
read -sp "Database Password: " DB_PASSWORD
echo ""
echo ""

# Link to Supabase project
echo "📡 Linking to Supabase project..."
supabase link --project-ref "$PROJECT_ID"

if [ $? -ne 0 ]; then
  echo "❌ Failed to link to Supabase project"
  exit 1
fi

echo "✅ Linked to Supabase project"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
echo ""

for migration in supabase/migrations/*.sql; do
  echo "  Running: $(basename $migration)"
  supabase db execute --file "$migration"

  if [ $? -ne 0 ]; then
    echo "  ❌ Failed: $(basename $migration)"
    exit 1
  fi

  echo "  ✅ Success: $(basename $migration)"
done

echo ""
echo "✅ All migrations completed successfully!"
echo ""

# Ask about seed data
read -p "Do you want to load seed data for testing? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📊 Loading seed data..."

  echo "⚠️  Important: You need to create test users first!"
  echo ""
  echo "1. Go to https://app.supabase.com/project/$PROJECT_ID/auth/users"
  echo "2. Create two users:"
  echo "   - creator@betcha.test / TestPass123!"
  echo "   - opponent@betcha.test / TestPass123!"
  echo "3. Get their user IDs from the auth.users table"
  echo "4. Update the UUIDs in supabase/seed.sql"
  echo "5. Uncomment the INSERT statements in seed.sql"
  echo ""

  read -p "Have you done this? (y/n): " -n 1 -r
  echo ""

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db execute --file "supabase/seed.sql"
    echo "✅ Seed data loaded!"
  else
    echo "⏭️  Skipping seed data. You can run it later with:"
    echo "   supabase db execute --file supabase/seed.sql"
  fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env.local has the correct Supabase credentials"
echo "2. Run: npm install"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:5173"
echo ""
echo "📚 For more information, see SETUP.md"
echo ""
