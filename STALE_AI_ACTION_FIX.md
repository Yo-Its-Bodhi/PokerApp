# CRITICAL FIX: Stale AI Action Bug

## Date: October 7, 2025 - 12:30 AM

## THE BUG - Race Condition with Multiple AI Actions

### Root Cause:
When a new street is dealt and AI is Small Blind, `advanceStreet()` schedules an AI action with `setTimeout(() => this.aiAction(), 500)`. 

**But if the player acts BEFORE that setTimeout fires**, the player's action triggers ANOTHER `aiAction()` call. This creates TWO pending AI actions:

1. **Stale Action** (from setTimeout): Uses OLD state where bets are 0
2. **Fresh Action** (from player bet): Uses NEW state where player bet exists

The stale action often fires first, causing AI to see `myBet: 0, opponentBet: 0` even though player just bet!

### Example Timeline:
```
00:00 - TURN dealt
00:00 - advanceStreet() resets bets to 0
00:00 - advanceStreet() schedules setTimeout(aiAction, 500)  ← Stale
00:01 - Player bets 50,000
00:01 - handlePlayerAction() updates state: myBet = 50,000
00:01 - handlePlayerAction() calls aiAction()  ← Fresh (but...)
00:05 - setTimeout fires with STALE state (myBet = 0, opponentBet = 0)
00:05 - AI sees no bet difference, checks ❌ BUG!
```

### Console Evidence:
```
━━━ 🃏 TURN DEALT ━━━
You bet 50000
[AI Decision] myBet: 0, opponentBet: 0, betDifference: 0  ← STALE!
[AI] Bets are even - AI can check or bet
AI Opponent check  ← WRONG!
```

## The Fix

### 1. Track Pending AI Actions
```typescript
private aiActionTimeout: NodeJS.Timeout | null = null;
```

### 2. Store setTimeout Reference
```typescript
// In advanceStreet():
this.aiActionTimeout = setTimeout(() => this.aiAction(), 500);

// In dealNewHand():
this.aiActionTimeout = setTimeout(() => this.aiAction(), 100);
```

### 3. Cancel Stale Actions Before New One
```typescript
// In handlePlayerAction(), before calling aiAction():
if (this.aiActionTimeout) {
  console.log('[AI Action] Clearing stale AI action timeout');
  clearTimeout(this.aiActionTimeout);
  this.aiActionTimeout = null;
}
await this.aiAction(); // Only the fresh action runs
```

## How It Works Now

### Correct Timeline:
```
00:00 - TURN dealt, setTimeout(aiAction, 500) scheduled
00:01 - Player bets 50,000
00:01 - handlePlayerAction() updates myBet = 50,000
00:01 - handlePlayerAction() CANCELS the setTimeout ✅
00:01 - handlePlayerAction() calls aiAction() with FRESH state
00:01 - AI sees myBet: 50,000, opponentBet: 0
00:01 - AI must call/raise/fold (cannot check) ✅
```

### Protection Against:
✅ **Duplicate AI actions** - Only one AI action can be pending at a time  
✅ **Stale state reads** - Stale timeouts are cancelled before they fire  
✅ **Race conditions** - Fresh action always overrides scheduled action  
✅ **Incorrect checks** - AI always sees current bet state  

## Testing Checklist

- [x] New street dealt, AI is SB, player bets immediately → AI sees player's bet
- [x] AI scheduled action cancelled when player acts
- [x] No duplicate AI actions
- [x] AI never checks when facing a bet
- [x] Console logs show "[AI Action] Clearing stale AI action timeout" when needed
- [x] betDifference calculation always uses fresh state

## Code Changes

**File**: `web/src/utils/HeadsUpPokerGame.ts`

**Lines Modified**:
1. Line 54: Added `private aiActionTimeout` property declaration
2. Line 355: Store setTimeout reference in dealNewHand
3. Lines 548-552: Clear stale timeout before new AI action
4. Line 867: Store setTimeout reference in advanceStreet

**Impact**:
- Eliminates race condition between scheduled and immediate AI actions
- Ensures AI always reads current game state
- Prevents AI from checking when player has bet
- Maintains proper poker rules enforcement

---

**Status**: ✅ FIXED - AI actions now always use fresh state
**Last Updated**: October 7, 2025 - 12:30 AM

## Key Insight

**The problem wasn't the betting logic - it was correct!**  
**The problem was WHEN the logic ran - with stale data!**

By tracking and cancelling pending setTimeout calls, we ensure AI always sees the most recent game state when making decisions.

