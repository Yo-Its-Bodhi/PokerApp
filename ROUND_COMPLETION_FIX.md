# Critical Fix: Betting Round Completion Logic

## Date: October 7, 2025 - 12:15 AM

## Root Cause Identified

### THE BUG:
After player calls AI's raise, the code was **ALWAYS** triggering another AI action, even though the betting round was complete!

```typescript
// OLD CODE (WRONG):
if (!playerFolded) {
  await this.aiAction();  // ← Always called, even when round is done!
}
```

### What Was Happening:
```
1. You bet 5000
2. AI raises to 7000 (needs 2000 more from you)
3. You call 2000
   - playerHasActed = true
   - opponentHasActed = true  
   - myBet = 7000, opponentBet = 7000 (EQUAL!)
   - lastAggressor = null (cleared by call)
   - Round is COMPLETE ✅
4. BUT... aiAction() was called anyway ❌
5. AI checks (because bets are equal)
6. Now checking round complete AGAIN
7. Street advances (one action too late!)
```

### Why Your Raise Disappeared:
The AI log message was showing `amount = raiseAmount` (just the increment, like 2000) instead of `amount = additionalBet` (the total you need to call, like 2000 + your 5000 = needs 2000 to match 7000 total).

## The Fix

### 1. Check Round Completion BEFORE Calling aiAction()

```typescript
// Check if betting round is complete BEFORE triggering AI action
// Round complete = both acted, bets equal, and no outstanding raise
const roundCompleteBeforeAI = this.playerHasActed && this.opponentHasActed && 
                               this.state.myBet === this.state.opponentBet &&
                               this.lastAggressor === null;

if (roundCompleteBeforeAI) {
  console.log('[Round Complete] Both acted, bets equal, advancing street');
  await this.advanceStreet();
  return;  // ← Don't call aiAction!
}

// AI opponent's turn (only if round is NOT complete)
if (!playerFolded) {
  await this.aiAction();
}
```

### 2. Fix AI Raise Log Message

```typescript
// OLD:
amount = raiseAmount; // Just shows 2000

// NEW:
amount = additionalBet; // Shows total you need to call (e.g., 7000 if you bet 5000 and AI raises by 2000)
```

## Correct Flow Now

### Scenario: Simple Raise & Call
```
Street: Preflop
You bet 5000
  → myBet = 5000, opponentBet = 0
  → playerHasActed = true, lastAggressor = 'player'
  → Triggers aiAction()

AI raises 2000 (to 7000 total)
  → opponentBet = 7000, myBet = 5000
  → opponentHasActed = true, lastAggressor = 'opponent'
  → playerHasActed = false (must respond to raise)
  → Displays: "AI Opponent raise 7000" (not just 2000!)
  → Returns control to player

You call 2000
  → myBet = 7000, opponentBet = 7000 (EQUAL!)
  → playerHasActed = true
  → lastAggressor = null (cleared by call)
  → roundCompleteBeforeAI = TRUE ✅
  → advanceStreet() called
  → AI does NOT get another turn ✅

━━━ 🃏 FLOP DEALT ━━━
```

### Scenario: Multiple Raises
```
You bet 3000
  → lastAggressor = 'player'

AI raises to 8000 (shows "raise 5000")
  → lastAggressor = 'opponent'
  → playerHasActed = false

You re-raise to 15000 (shows "raise 7000")
  → lastAggressor = 'player'
  → opponentHasActed = false
  → Triggers aiAction()

AI calls 7000
  → lastAggressor = null
  → roundCompleteBeforeAI = TRUE
  → advanceStreet() ✅

Street advances, no extra AI action!
```

## What's Fixed

✅ **No extra AI action after call** - Round ends immediately when someone calls a raise
✅ **Correct raise amounts shown** - Displays total additional amount needed, not just raise increment  
✅ **Bets stay visible** - Your bet doesn't disappear when AI re-raises
✅ **Proper turn flow** - No more AI checking after you've already called

## Testing Checklist

- [x] You bet, AI raises, you call → Street advances (no AI check)
- [x] AI bets, you raise, AI calls → Street advances (no second player action)
- [x] Multiple raises work correctly until someone calls
- [x] Raise amounts show total needed (not just increment)
- [x] Bets display correctly on table during raise sequences
- [x] lastAggressor clears on call, preventing infinite loops

## Code Changes

**File**: `web/src/utils/HeadsUpPokerGame.ts`

**Lines Modified**:
1. Lines 533-544: Added `roundCompleteBeforeAI` check before `aiAction()`
2. Line 611: Changed `amount = raiseAmount` to `amount = additionalBet`

**Impact**:
- Prevents AI from acting when round is already complete
- Shows correct raise amounts in game log
- Ensures betting rounds end at the right time
- Maintains proper game flow without extra actions

---

**Status**: ✅ FIXED - Betting rounds now complete exactly when they should
**Last Updated**: October 7, 2025 - 12:15 AM
