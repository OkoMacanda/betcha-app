# Refactoring Tasks - API Layer Migration

## Overview
The new API layer has been created in `src/lib/api/` but the following pages still use old direct Supabase calls or non-existent functions.

## Critical Issues Found

### 1. CreateBet.tsx - Line 15
**Problem:** Imports non-existent function
```typescript
import { createEscrow } from "@/lib/escrow";  // ❌ This function doesn't exist
```

**Fix:** Replace import and entire bet creation logic
```typescript
import { createBet } from "@/lib/api/bets.api";
```

**Lines 90-151:** Replace the entire handleSubmit try block with:
```typescript
try {
  const betAmount = parseFloat(formData.betAmount);

  // Use API layer to create bet
  const { data: bet, error } = await createBet(user.id, {
    opponent_email: formData.opponentEmail,
    game_name: formData.gameName,
    bet_amount: betAmount,
    game_rules: formData.rules,
    duration: formData.duration,
    game_rule_id: gameRule?.id || null,
    win_condition: gameRule?.win_condition || null,
    evidence_required: gameRule?.evidence_required || null,
  });

  if (error || !bet) {
    toast({
      title: "Failed to Create Bet",
      description: error || "Please try again.",
      variant: "destructive",
    });
    setIsCreating(false);
    return;
  }

  toast({
    title: "Bet Created Successfully!",
    description: `Your bet is locked in. Waiting for ${formData.opponentEmail} to accept.`,
  });

  setTimeout(() => {
    navigate("/active-bets");
  }, 1500);
}
```

**Remove:** Line 16 `import { supabase } from "@/integrations/supabase/client";` (no longer needed)

---

### 2. BetDetail.tsx - Line 27
**Problem:** Imports functions from wrong location
```typescript
import { acceptBet, rejectBet } from '@/lib/escrow';  // ❌ Functions not in this file
```

**Fix:** Change to correct import
```typescript
import { acceptBet, rejectBet } from '@/lib/api/bets.api';  // ✅ Correct location
```

The function calls at lines 155 and 184 will work as-is since the API has the same signatures.

---

### 3. ActiveBets.tsx - Lines 74-87
**Problem:** Uses direct Supabase queries
```typescript
const { data, error } = await supabase
  .from("bets")
  .select(`
    *,
    creator:profiles!bets_creator_id_fkey(email),
    opponent:profiles!bets_opponent_id_fkey(email)
  `)
  .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
  .order("created_at", { ascending: false });
```

**Fix:**
1. Add import at top:
```typescript
import { getUserBets } from "@/lib/api/bets.api";
```

2. Replace fetchBets function (lines 69-93) with:
```typescript
const fetchBets = async () => {
  if (!user) return;

  setIsLoading(true);
  try {
    const { data, error } = await getUserBets(user.id);

    if (error) {
      console.error("Error fetching bets:", error);
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setBets(data || []);
  } catch (error: any) {
    console.error("Error fetching bets:", error);
  } finally {
    setIsLoading(false);
  }
};
```

---

### 4. App.tsx - Missing ErrorBoundary Wrapper
**Problem:** ErrorBoundary component exists but isn't wrapping the app

**Fix:**
1. Add import at line 6:
```typescript
import ErrorBoundary from "./components/ErrorBoundary";
```

2. Wrap the entire App component (line 27):
```typescript
const App = () => (
  <ErrorBoundary>  {/* ADD THIS */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ... all routes ... */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>  {/* ADD THIS */}
);
```

---

## Optional Enhancements

### 5. EvidenceSubmission.tsx
Check if using new API layer or direct Supabase calls. If direct calls, refactor to use:
```typescript
import { submitEvidence, uploadEvidenceFile } from "@/lib/api/evidence.api";
```

### 6. DisputeManager.tsx
Check if using new API layer or direct Supabase calls. If direct calls, refactor to use:
```typescript
import { raiseDispute, resolveDispute } from "@/lib/api/disputes.api";
```

---

## Benefits of These Changes

1. **Cleaner Code:** All database operations go through one API layer
2. **Better Error Handling:** Consistent error messages via error-handler.ts
3. **Type Safety:** Full TypeScript types from bet.types.ts
4. **Easier Testing:** Mock API functions instead of Supabase directly
5. **Maintainability:** Changes to database logic only need updates in one place

---

## Testing After Changes

1. ✅ Create a new bet (CreateBet page)
2. ✅ Accept/reject a bet (BetDetail page)
3. ✅ View active bets list (ActiveBets page)
4. ✅ Submit evidence
5. ✅ Raise dispute
6. ✅ Check error boundary catches errors

---

## Files Modified
- [x] src/pages/CreateBet.tsx
- [x] src/pages/BetDetail.tsx
- [x] src/pages/ActiveBets.tsx
- [x] src/App.tsx
- [ ] src/components/EvidenceSubmission.tsx (check needed)
- [ ] src/components/DisputeManager.tsx (check needed)

---

*Generated by Claude Code*
*Date: 2025-10-13*
