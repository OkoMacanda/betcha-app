# 🔌 Backend Access Guide - How Frontend Connects to Microservices

**Complete guide on how your React/React Native frontend accesses the NestJS/Python backend**

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   USER DEVICES                          │
│   Web Browser  │  iOS App  │  Android App  │  Admin    │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
     ┌───────────────┐
     │  Cloudflare   │  (CDN, DDoS Protection)
     │      CDN      │
     └───────┬───────┘
             │
             ↓
     ┌───────────────┐
     │    Traefik    │  (Load Balancer, SSL, Routing)
     │ Load Balancer │  Port 80/443
     └───────┬───────┘
             │
             ├─────────────────────────────────────────┐
             │                                         │
   ┌─────────▼─────────┐                    ┌─────────▼─────────┐
   │   Static Assets   │                    │  API Gateway      │
   │  betcha.com       │                    │  api.betcha.com   │
   │  (React Web App)  │                    │  (Microservices)  │
   └───────────────────┘                    └─────────┬─────────┘
                                                      │
              ┌───────────────────────────────────────┼──────────────┐
              │                                       │              │
    ┌─────────▼─────────┐              ┌─────────────▼───────┐      │
    │   Auth Service    │              │  Wallet Service     │      │
    │  /auth/*          │              │  /wallet/*          │      │
    │  Port 3000        │              │  Port 3000          │      │
    └───────────────────┘              └─────────────────────┘      │
                                                                    │
    ┌───────────────────┐              ┌─────────────────────┐      │
    │  Betting Service  │              │  Payment Service    │      │
    │  /bets/*          │              │  /payments/*        │      │
    │  Port 3000        │              │  Port 3000          │      │
    └───────────────────┘              └─────────────────────┘      │
                                                                    │
    ┌───────────────────┐              ┌─────────────────────┐      │
    │  REF AI Service   │              │  Rewards Service    │      │
    │  /ref-ai/*        │              │  /rewards/*         │      │
    │  Port 8000        │              │  Port 3000          │      │
    └───────────────────┘              └─────────────────────┘
              │
              ↓
    ┌─────────────────────────────────────────┐
    │         Data Layer                      │
    │  PostgreSQL  │  Redis  │ Elasticsearch  │
    └─────────────────────────────────────────┘
```

---

## 🌐 API Endpoints & Routing

### **Base URLs**

**Development (Local):**
```bash
WEB_APP_URL=http://localhost:5173
API_BASE_URL=http://localhost/api
# OR directly to services:
AUTH_API=http://localhost:3000
WALLET_API=http://localhost:3001
BETTING_API=http://localhost:3002
```

**Production:**
```bash
WEB_APP_URL=https://betcha.com
API_BASE_URL=https://api.betcha.com
ADMIN_URL=https://admin.betcha.com
GRAFANA_URL=https://grafana.betcha.com
```

### **Traefik Routing Rules**

All requests to `api.betcha.com` are routed by **Traefik** based on URL path:

| Path Pattern | Service | Port | Description |
|--------------|---------|------|-------------|
| `/auth/*` | auth-service | 3000 | Authentication, login, register, 2FA |
| `/wallet/*` | wallet-service | 3000 | Balance, deposits, withdrawals, escrow |
| `/bets/*` | betting-service | 3000 | Create/accept bets, challenges |
| `/payments/*` | payment-service | 3000 | Stripe, Paystack, webhooks |
| `/ref-ai/*` | ref-ai-service | 8000 | Rule evaluation, evidence verification |
| `/rewards/*` | rewards-service | 3000 | Points, badges, leaderboards |
| `/streaming/*` | streaming-service | 3000 | Live streams, RTMP, webhooks |

**Example Request Flow:**
```
User → https://api.betcha.com/auth/login
  → Traefik (load balancer)
    → auth-service:3000/auth/login
      → PostgreSQL (betcha_auth database)
        → Response back to user
```

---

## 💻 Frontend Configuration

### **1. Environment Variables**

Create `.env` file in your React app:

```bash
# .env (Development)
VITE_API_URL=http://localhost/api
VITE_WS_URL=ws://localhost/api/ws
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# .env.production
VITE_API_URL=https://api.betcha.com
VITE_WS_URL=wss://api.betcha.com/ws
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### **2. API Client Setup**

Currently, your frontend uses **Supabase client**. We'll create a **compatibility layer** that drops in seamlessly.

**Option A: Minimal Changes (Recommended)**

Create `src/lib/backend/client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

class BackendClient {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh it
          await this.refreshToken();
          // Retry original request
          return this.api.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  // Supabase-compatible auth methods
  auth = {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await this.api.post('/auth/register', { email, password });
      this.accessToken = data.access_token;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return { data: { user: data.user, session: data }, error: null };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await this.api.post('/auth/login', { email, password });
      this.accessToken = data.access_token;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return { data: { user: data.user, session: data }, error: null };
    },

    signOut: async () => {
      await this.api.post('/auth/logout');
      this.accessToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { error: null };
    },

    getSession: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return { data: { session: null }, error: null };

      this.accessToken = token;
      const { data } = await this.api.get('/auth/me');
      return { data: { session: { user: data.user } }, error: null };
    },
  };

  // Supabase-compatible database methods
  from(table: string) {
    return {
      select: (columns = '*') => this.queryBuilder(table, 'select', columns),
      insert: (data: any) => this.mutationBuilder(table, 'insert', data),
      update: (data: any) => this.mutationBuilder(table, 'update', data),
      delete: () => this.mutationBuilder(table, 'delete'),
    };
  }

  private queryBuilder(table: string, method: string, columns: string) {
    const chain: any = {
      eq: (column: string, value: any) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, operator: 'eq', value });
        return chain;
      },
      in: (column: string, values: any[]) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, operator: 'in', value: values });
        return chain;
      },
      or: (conditions: string) => {
        chain._or = conditions;
        return chain;
      },
      order: (column: string, options?: { ascending: boolean }) => {
        chain._order = { column, ascending: options?.ascending ?? true };
        return chain;
      },
      limit: (count: number) => {
        chain._limit = count;
        return chain;
      },
      single: () => {
        chain._single = true;
        return chain;
      },
      maybeSingle: () => {
        chain._maybeSingle = true;
        return chain;
      },
    };

    // Execute query
    chain.then = async (resolve: any, reject: any) => {
      try {
        const endpoint = this.tableToEndpoint(table);
        const params: any = {};

        if (chain._filters) {
          chain._filters.forEach((f: any) => {
            params[f.column] = f.operator === 'eq' ? f.value : JSON.stringify(f.value);
          });
        }

        if (chain._order) {
          params.orderBy = chain._order.column;
          params.order = chain._order.ascending ? 'asc' : 'desc';
        }

        if (chain._limit) params.limit = chain._limit;

        const { data } = await this.api.get(endpoint, { params });

        const result = chain._single || chain._maybeSingle ? data[0] : data;
        resolve({ data: result, error: null });
      } catch (error: any) {
        resolve({ data: null, error: error.message });
      }
    };

    return chain;
  }

  private mutationBuilder(table: string, method: string, data?: any) {
    const chain: any = { _method: method, _data: data };

    chain.eq = (column: string, value: any) => {
      chain._filters = chain._filters || [];
      chain._filters.push({ column, value });
      return chain;
    };

    chain.select = () => {
      chain._select = true;
      return chain;
    };

    chain.single = () => {
      chain._single = true;
      return chain;
    };

    chain.then = async (resolve: any, reject: any) => {
      try {
        const endpoint = this.tableToEndpoint(table);
        let result;

        if (method === 'insert') {
          const { data: response } = await this.api.post(endpoint, chain._data);
          result = response;
        } else if (method === 'update') {
          const id = chain._filters?.[0]?.value;
          const { data: response } = await this.api.patch(`${endpoint}/${id}`, chain._data);
          result = response;
        } else if (method === 'delete') {
          const id = chain._filters?.[0]?.value;
          await this.api.delete(`${endpoint}/${id}`);
          result = null;
        }

        resolve({ data: result, error: null });
      } catch (error: any) {
        resolve({ data: null, error: error.message });
      }
    };

    return chain;
  }

  // Map Supabase table names to backend endpoints
  private tableToEndpoint(table: string): string {
    const mapping: Record<string, string> = {
      'bets': '/bets',
      'profiles': '/auth/users',
      'wallets': '/wallet/balance',
      'transactions': '/wallet/transactions',
      'escrow': '/wallet/escrow',
      'challenge_invites': '/bets/invites',
      'disputes': '/bets/disputes',
      'evidence': '/bets/evidence',
      'kyc': '/auth/kyc',
      'rewards': '/rewards/points',
      'badges': '/rewards/badges',
      'leaderboards': '/rewards/leaderboards',
    };

    return mapping[table] || `/${table}`;
  }

  // RPC calls (Supabase stored procedures → Backend endpoints)
  async rpc(functionName: string, params: any) {
    const rpcMapping: Record<string, { method: string; endpoint: string }> = {
      'update_wallet_balance': { method: 'POST', endpoint: '/wallet/update-balance' },
      'complete_bet': { method: 'POST', endpoint: '/bets/complete' },
      'refund_bet': { method: 'POST', endpoint: '/bets/refund' },
      'lock_funds': { method: 'POST', endpoint: '/wallet/escrow/lock' },
      'release_funds': { method: 'POST', endpoint: '/wallet/escrow/release' },
    };

    const rpc = rpcMapping[functionName];
    if (!rpc) throw new Error(`RPC function ${functionName} not implemented`);

    const { data } = await this.api.request({
      method: rpc.method,
      url: rpc.endpoint,
      data: params,
    });

    return { data, error: null };
  }

  private async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const { data } = await this.api.post('/auth/refresh', { refresh_token: refreshToken });
    this.accessToken = data.access_token;
    localStorage.setItem('access_token', data.access_token);
  }
}

export const backendClient = new BackendClient();

// Export as supabase for drop-in replacement
export { backendClient as supabase };
```

### **3. Update API Files (One-Line Change)**

In `src/lib/api/bets.api.ts` (and all other API files):

```typescript
// OLD:
import { supabase } from '@/integrations/supabase/client'

// NEW:
import { backendClient as supabase } from '@/lib/backend/client'
```

**That's it!** Your entire frontend now uses the NestJS backend instead of Supabase. 🎉

---

## 📱 Mobile App Access

### **React Native Configuration**

`mobile/.env`:
```bash
API_URL=https://api.betcha.com
WS_URL=wss://api.betcha.com/ws
```

`mobile/src/lib/api.ts`:
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await SecureStore.setItemAsync('access_token', data.access_token);
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

// Example usage
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  getProfile: () => api.get('/auth/me'),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  deposit: (amount: number, paymentMethodId: string) =>
    api.post('/wallet/deposit', { amount, paymentMethodId }),
};

export const betsAPI = {
  create: (betData: any) => api.post('/bets', betData),
  accept: (betId: string) => api.post(`/bets/${betId}/accept`),
  list: () => api.get('/bets'),
};
```

---

## 🔐 Authentication Flow

### **1. Login**

```typescript
// Frontend (React/React Native)
const login = async (email: string, password: string) => {
  const response = await fetch('https://api.betcha.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  /*
    Response:
    {
      access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      refresh_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      user: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        full_name: "John Doe"
      }
    }
  */

  // Store tokens
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
};
```

### **2. Authenticated Requests**

```typescript
const getWalletBalance = async () => {
  const token = localStorage.getItem('access_token');

  const response = await fetch('https://api.betcha.com/wallet/balance', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  // { balance: 1000, locked_balance: 50, available_balance: 950 }
};
```

### **3. Token Refresh**

```typescript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetch('https://api.betcha.com/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
};
```

---

## 🎯 Complete API Reference

### **Auth Service** (`/auth/*`)

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/auth/register` | POST | Create account | `{ email, password, phone }` | `{ access_token, refresh_token, user }` |
| `/auth/login` | POST | Login | `{ email, password }` | `{ access_token, refresh_token, user }` |
| `/auth/logout` | POST | Logout | - | `{ success: true }` |
| `/auth/refresh` | POST | Refresh token | `{ refresh_token }` | `{ access_token }` |
| `/auth/me` | GET | Get profile | - | `{ user }` |
| `/auth/2fa/enable` | POST | Enable 2FA | - | `{ qr_code, secret }` |
| `/auth/2fa/verify` | POST | Verify 2FA | `{ code }` | `{ success: true }` |

### **Wallet Service** (`/wallet/*`)

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/wallet/balance` | GET | Get balance | - | `{ balance, locked_balance }` |
| `/wallet/deposit` | POST | Deposit funds | `{ amount, payment_method_id }` | `{ transaction_id }` |
| `/wallet/withdraw` | POST | Withdraw funds | `{ amount, bank_account }` | `{ transaction_id }` |
| `/wallet/transactions` | GET | Transaction history | `?limit=20&offset=0` | `[{ id, amount, type, created_at }]` |
| `/wallet/escrow/lock` | POST | Lock funds | `{ bet_id, creator_id, opponent_id, amount }` | `{ escrow_id }` |
| `/wallet/escrow/release` | POST | Release to winner | `{ bet_id, winner_id, escrow_id }` | `{ payout }` |

### **Betting Service** (`/bets/*`)

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/bets` | GET | List bets | `?status=active&limit=20` | `[{ id, game_name, bet_amount, status }]` |
| `/bets` | POST | Create bet | `{ game_name, bet_amount, opponent_email }` | `{ id, status }` |
| `/bets/:id` | GET | Get bet details | - | `{ id, creator, opponent, status }` |
| `/bets/:id/accept` | POST | Accept bet | - | `{ success: true }` |
| `/bets/:id/reject` | POST | Reject bet | - | `{ success: true }` |
| `/bets/:id/complete` | POST | Complete bet | `{ winner_id }` | `{ payout }` |
| `/bets/:id/evidence` | POST | Upload evidence | `FormData(file)` | `{ evidence_id, url }` |
| `/bets/:id/dispute` | POST | Open dispute | `{ reason }` | `{ dispute_id }` |

### **Payment Service** (`/payments/*`)

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/payments/methods` | GET | List payment methods | - | `[{ id, type, last4 }]` |
| `/payments/methods` | POST | Add payment method | `{ stripe_token }` | `{ id, type }` |
| `/payments/deposit` | POST | Create deposit | `{ amount, method_id }` | `{ payment_intent_id }` |
| `/payments/webhooks/stripe` | POST | Stripe webhook | - | `{ received: true }` |
| `/payments/webhooks/paystack` | POST | Paystack webhook | - | `{ received: true }` |

### **REF AI Service** (`/ref-ai/*`)

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/ref-ai/rules` | GET | List rules | - | `[{ id, name, conditions }]` |
| `/ref-ai/rules/:id` | GET | Get rule | - | `{ id, name, conditions }` |
| `/ref-ai/evaluate` | POST | Evaluate evidence | `{ rule_id, evidence }` | `{ verdict, confidence }` |
| `/ref-ai/verify` | POST | Auto-verify bet | `{ bet_id }` | `{ verified, winner_id, confidence }` |

### **Rewards Service** (`/rewards/*`)

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/rewards/points` | GET | Get user points | - | `{ total_points, level }` |
| `/rewards/badges` | GET | Get user badges | - | `[{ id, name, earned_at }]` |
| `/rewards/leaderboard` | GET | Global leaderboard | `?limit=100` | `[{ rank, user_id, points }]` |

---

## 🔄 WebSocket Connections

For real-time updates (live bets, notifications):

```typescript
import io from 'socket.io-client';

const socket = io('wss://api.betcha.com', {
  auth: {
    token: localStorage.getItem('access_token'),
  },
});

// Subscribe to bet updates
socket.on('bet:updated', (bet) => {
  console.log('Bet updated:', bet);
});

// Subscribe to wallet updates
socket.on('wallet:balance_changed', (balance) => {
  console.log('New balance:', balance);
});

// Join bet room
socket.emit('bet:join', { betId: '123e4567-e89b-12d3-a456-426614174000' });
```

---

## 🚀 Migration Checklist

To switch your existing frontend from Supabase to the new backend:

### **Step 1: Create Backend Client** (15 minutes)
- [ ] Create `src/lib/backend/client.ts` (copy code above)
- [ ] Test auth methods work
- [ ] Test database queries work

### **Step 2: Update API Files** (30 minutes)
- [ ] Replace Supabase imports in all `src/lib/api/*.ts` files
- [ ] Test each API function still works
- [ ] Update any Supabase-specific queries

### **Step 3: Update Components** (1 hour)
- [ ] Update auth context/hooks
- [ ] Update wallet hooks
- [ ] Update bet hooks
- [ ] Test all user flows

### **Step 4: Deploy Backend** (1 day)
- [ ] Start Docker Compose stack
- [ ] Run database migrations
- [ ] Test all endpoints with Postman
- [ ] Deploy to production

### **Step 5: Update Environment Variables**
- [ ] Update `VITE_API_URL` in frontend
- [ ] Update mobile `API_URL`
- [ ] Deploy frontend

---

## ✅ Testing the Connection

### **1. Test Backend is Running**

```bash
# Health check
curl https://api.betcha.com/auth/health
# Expected: { "status": "ok", "timestamp": "2025-01-08T12:00:00Z" }

# Test auth
curl -X POST https://api.betcha.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Test with token
curl https://api.betcha.com/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **2. Test Frontend Connection**

Open browser console:

```javascript
// Test API connection
fetch('https://api.betcha.com/auth/health')
  .then(r => r.json())
  .then(console.log);

// Test CORS
fetch('https://api.betcha.com/bets', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(console.log);
```

---

## 🎉 Summary

**How Backend is Accessed:**

1. **User opens app** → React/React Native loads
2. **App makes API call** → `https://api.betcha.com/bets`
3. **Cloudflare CDN** → Routes request, provides DDoS protection
4. **Traefik Load Balancer** → SSL termination, rate limiting, routes to service
5. **NestJS Service** → `/bets/*` routes to betting-service
6. **Service processes request** → Validates JWT, queries PostgreSQL
7. **Response returned** → JSON data back to frontend
8. **Frontend updates UI** → React components re-render

**Key Files to Update:**
- ✅ `src/lib/backend/client.ts` - New backend client (300 lines)
- ✅ `src/lib/api/*.ts` - Change import (1 line per file, 12 files)
- ✅ `.env` - Update API URL (1 line)

**Total Changes:** < 50 lines of code to migrate from Supabase to NestJS backend!

Your beautiful UI stays the same, but now powered by enterprise microservices. 🚀
