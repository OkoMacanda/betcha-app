# 🔄 Backend Migration Plan
**Keep UI/UX → Replace Backend Infrastructure**

---

## 🎯 Strategy

### What Stays The Same (Frontend)
✅ All React components (72 components)
✅ All pages (21 pages)
✅ UI/UX design
✅ Betcha branding and logo
✅ Game rules (100 games)
✅ User flows
✅ Component library (Shadcn/ui)

### What Changes (Backend)
🔄 Supabase → Python FastAPI microservices
🔄 Supabase Auth → Custom JWT auth service
🔄 Supabase Database → PostgreSQL with HA
🔄 Supabase Storage → MinIO (S3-compatible)
🔄 Supabase Realtime → Redis + WebSockets

---

## 📊 Current Frontend API Structure

Let me analyze your existing API to ensure compatibility:

### Current API Modules (src/lib/api/)
1. `auth.api.ts` - Supabase Auth
2. `bets.api.ts` - Bet operations
3. `wallet.api.ts` - Wallet/transactions
4. `groups.api.ts` - Group management
5. `groupBetting.api.ts` - Group bets
6. `contacts.api.ts` - Contact management
7. `invites.api.ts` - Invitations
8. `scores.api.ts` - Score tracking
9. `disputes.api.ts` - Dispute resolution
10. `evidence.api.ts` - Evidence uploads
11. `kyc.api.ts` - KYC verification
12. `settings.api.ts` - User settings

---

## 🏗️ Migration Architecture

```
┌─────────────────────────────────────────────────┐
│         FRONTEND (No Changes)                   │
│   React + TypeScript + Shadcn/ui               │
│   All 21 pages, 72 components                  │
│   Betcha branding, game rules                  │
└──────────────┬──────────────────────────────────┘
               │
               │ Same API calls
               │ (just different endpoint)
               │
┌──────────────▼──────────────────────────────────┐
│      API COMPATIBILITY LAYER                    │
│   Maps Supabase API → FastAPI endpoints       │
│   /rest/v1/* → /api/v1/*                       │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│         NEW BACKEND (Enterprise)                │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Auth   │  │ Betting  │  │  Wallet  │     │
│  │ Service  │  │ Service  │  │ Service  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  ┌──────────┐  ┌──────────┐                   │
│  │ Payment  │  │   KYC    │                   │
│  │ Service  │  │ Service  │                   │
│  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: API Compatibility Layer (Week 1)
Create a FastAPI service that mimics Supabase API structure

**Goals:**
- Frontend code requires ZERO changes
- Same request/response formats
- Same authentication flow
- Same error messages

**Implementation:**
```python
# api_compatibility_layer/main.py
# Translates Supabase REST API to internal microservices

@app.post("/auth/v1/signup")
async def supabase_signup_compat(request: SignUpRequest):
    # Translate to internal auth service
    result = await auth_service.register(request)
    # Return in Supabase format
    return format_supabase_response(result)

@app.get("/rest/v1/bets")
async def supabase_bets_compat(filters: str):
    # Parse Supabase query syntax
    query = parse_supabase_filters(filters)
    # Call internal service
    result = await betting_service.get_bets(query)
    # Return in Supabase format
    return format_supabase_response(result)
```

### Phase 2: Database Migration (Week 2)
Copy existing Supabase schema to PostgreSQL

**Steps:**
1. Export current Supabase schema
2. Create equivalent tables in PostgreSQL
3. Migrate existing data (if any)
4. Keep same table/column names
5. Preserve all relationships

**No Changes Needed:**
- Table names stay the same
- Column names stay the same
- Relationships preserved
- Just moving from Supabase → Self-hosted PostgreSQL

### Phase 3: Service Implementation (Weeks 3-6)
Build microservices that work with existing schema

**Auth Service:**
```python
# Provides same endpoints as Supabase Auth
POST /auth/v1/signup
POST /auth/v1/token (login)
POST /auth/v1/logout
GET /auth/v1/user
# Returns JWT tokens that frontend already expects
```

**Betting Service:**
```python
# Uses existing bets table schema
# Same CRUD operations
# Same business logic as current implementation
```

**Wallet Service:**
```python
# Uses existing wallets, transactions, escrow tables
# Same operations frontend already calls
```

### Phase 4: Frontend Configuration (Week 7)
**Only change needed:** Update API endpoint

```typescript
// src/lib/supabase.ts
// OLD:
const supabaseUrl = process.env.VITE_SUPABASE_URL

// NEW:
const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000'

// Update API calls
// OLD: supabase.from('bets').select()
// NEW: fetch(`${apiUrl}/api/v1/bets`)
```

### Phase 5: Testing (Week 8)
- Test all user flows with new backend
- Verify all components work
- Check all game rules load
- Ensure branding displays correctly
- Performance testing

---

## 📋 Database Schema Preservation

### Use Existing Supabase Schema

I'll analyze your current schema and recreate it exactly:

```sql
-- Your existing tables (from supabase/migrations/)
CREATE TABLE profiles (same structure);
CREATE TABLE bets (same structure);
CREATE TABLE wallets (same structure);
CREATE TABLE transactions (same structure);
CREATE TABLE evidence (same structure);
CREATE TABLE disputes (same structure);
CREATE TABLE contacts (same structure);
CREATE TABLE groups (same structure);
CREATE TABLE group_bets (same structure);
-- etc.

-- Same indexes, constraints, relationships
-- Just running on self-hosted PostgreSQL instead of Supabase
```

---

## 🎨 Frontend Changes Required

### Minimal Changes (2-3 hours work)

**1. Update API Client (src/lib/api/client.ts)**
```typescript
// Create new API client that points to FastAPI instead of Supabase

// OLD:
import { supabase } from '@/lib/supabase'

// NEW:
import { apiClient } from '@/lib/api-client'

// Same methods, different implementation
export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return response.json();
  },
  // ... other methods
}
```

**2. Update Environment Variables**
```bash
# .env
# OLD:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx

# NEW:
VITE_API_URL=http://localhost:8000
# OR in production:
VITE_API_URL=https://api.betcha.com
```

**3. Update Auth Context (src/hooks/useAuth.tsx)**
```typescript
// Update to use new auth endpoints
// Same interface, different backend

const login = async (email: string, password: string) => {
  // OLD: await supabase.auth.signInWithPassword(...)
  // NEW: await apiClient.post('/auth/login', { email, password })

  // Store JWT token
  // Rest of the logic stays the same
}
```

**That's it! Everything else stays the same.**

---

## 🔄 Migration Steps (Detailed)

### Step 1: Analyze Current Frontend API Calls
```bash
# I'll scan your codebase to find all API calls
cd "/Users/mac/Documents/Betcha App"

# Find all Supabase API calls
grep -r "supabase\." src/lib/api/
grep -r "supabase\." src/pages/
grep -r "supabase\." src/components/

# Document all endpoints being used
# Create compatibility mapping
```

### Step 2: Build Compatible Backend
```python
# backend/services/compatibility/main.py
# FastAPI app that mimics Supabase exactly

from fastapi import FastAPI, Request
from typing import Any, Dict

app = FastAPI()

# Supabase-compatible auth endpoints
@app.post("/auth/v1/signup")
async def signup(email: str, password: str) -> Dict[str, Any]:
    """Same response format as Supabase"""
    user = await create_user(email, password)
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at
        },
        "session": {
            "access_token": create_jwt(user),
            "refresh_token": create_refresh_token(user)
        }
    }

# Supabase-compatible data endpoints
@app.get("/rest/v1/{table}")
async def get_table_data(table: str, request: Request):
    """Parse Supabase query syntax"""
    # Parse filters from query params
    # Call internal service
    # Return in Supabase format
    pass
```

### Step 3: Run Both Backends in Parallel
```yaml
# docker-compose.yml
services:
  # Keep Supabase temporarily
  supabase:
    # ... existing setup

  # Add new backend
  new-backend:
    # ... FastAPI services

  # Frontend can switch between them
  frontend:
    environment:
      - API_MODE=supabase  # or 'fastapi'
```

### Step 4: Gradual Migration
1. Week 1: Auth service migrated
2. Week 2: Betting service migrated
3. Week 3: Wallet service migrated
4. Week 4: All services migrated
5. Week 5: Turn off Supabase

---

## 📦 What You Keep vs What You Build

### Keep (No Work Required)
✅ **Frontend (100%)**
- All React components
- All pages
- All styling (Tailwind CSS)
- All UI/UX flows
- Betcha logo and branding
- Game rules (100 games in constants)
- shadcn/ui component library
- Form validations
- Error handling UI
- Loading states
- Toast notifications

✅ **Data Models**
- Same database schema
- Same relationships
- Same business logic
- Same validation rules

✅ **Assets**
- Images
- Icons
- Logos
- Fonts

### Build New (Backend Only)
🔨 **Infrastructure**
- Docker containers
- Kubernetes manifests
- Load balancers
- Monitoring stack

🔨 **Services**
- Python FastAPI microservices
- API compatibility layer
- Authentication service
- Business logic services

🔨 **DevOps**
- CI/CD pipeline
- Deployment automation
- Scaling configuration
- Backup systems

---

## 💾 Database Migration Script

```python
# migration/migrate_from_supabase.py

import asyncio
from supabase import create_client
from sqlalchemy import create_engine

async def migrate_data():
    """
    Copy data from Supabase to new PostgreSQL
    Preserves all data, relationships, and schema
    """

    # Connect to Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Connect to new PostgreSQL
    engine = create_engine(NEW_DATABASE_URL)

    tables = [
        'profiles',
        'bets',
        'bet_participants',
        'wallets',
        'transactions',
        'escrow',
        'evidence',
        'disputes',
        'contacts',
        'groups',
        'group_members',
        'group_bets',
        'kyc_verifications',
        # ... all tables
    ]

    for table in tables:
        print(f"Migrating {table}...")

        # Get all data from Supabase
        data = supabase.table(table).select("*").execute()

        # Insert into new database
        # (with proper error handling, batching, etc.)
        await insert_batch(engine, table, data.data)

        print(f"✓ Migrated {len(data.data)} records from {table}")

    print("Migration complete!")
```

---

## 🎯 Benefits of This Approach

### 1. **Zero Frontend Risk**
- UI stays exactly the same
- No regression bugs in UI
- Users see no difference
- All branding preserved

### 2. **Gradual Migration**
- Migrate one service at a time
- Easy rollback if issues
- Test each piece thoroughly
- Low risk deployment

### 3. **Best of Both Worlds**
- Keep working UI/UX (proven)
- Get enterprise backend (scalable)
- Maintain brand consistency
- Achieve compliance goals

### 4. **Cost Effective**
- Reuse all frontend work (hundreds of hours)
- Only build backend (focused effort)
- No design/UX work needed
- Faster time to enterprise

---

## 📅 Timeline

### 8-Week Migration (vs 16-week full rebuild)

**Week 1:** API compatibility layer
**Week 2:** Database migration + Auth service
**Week 3:** Betting service
**Week 4:** Wallet service
**Week 5:** Payment + KYC services
**Week 6:** Integration testing
**Week 7:** Performance testing
**Week 8:** Production deployment

**Result:** Same great UI + Enterprise backend in HALF the time

---

## 🚀 Next Steps

### Immediate Actions (Today)

1. **Analyze current API calls**
   - Document all Supabase endpoints used
   - Map to new backend structure
   - Create compatibility matrix

2. **Setup local environment**
   - Start PostgreSQL
   - Copy Supabase schema
   - Test connection

3. **Build first service (Auth)**
   - Match Supabase auth API
   - Test with existing frontend
   - Verify all flows work

### This Week

1. Complete Auth service
2. Update frontend to support both backends
3. Test user registration/login flows
4. Deploy to staging

---

## ✅ Success Criteria

Migration is complete when:
- ✅ Frontend code has < 10 lines changed (only config)
- ✅ All UI components work identically
- ✅ All game rules display correctly
- ✅ Betcha branding looks the same
- ✅ User flows work exactly as before
- ✅ Performance is same or better
- ✅ Backend is enterprise-grade
- ✅ Can scale to millions

---

**This approach lets you keep your beautiful UI and proven UX while getting the enterprise backend you need for scale and compliance.**

**Ready to start? I'll build the compatibility layer and Auth service first.**
