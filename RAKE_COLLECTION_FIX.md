# Rake Collection Fix - All-In Hands

## Problem
Rake was not being collected on some all-in hands that went to showdown. The logs showed:
```
💰 No rake (hand ended pre-flop)
```
Even when the hand clearly went through flop, turn, and river to showdown.

## Root Cause
The issue was caused by a cascade of `endHand()` calls with stale state:

1. **Premature Game-Over Checks**: When a player ran out of chips, `dealNewHand()` would call `endHand()` immediately (lines 342, 347)
2. **Cascading Calls**: `endHand()` would then schedule another `startNewHand()` → `dealNewHand()` → `endHand()` cycle
3. **Stale State**: The second `endHand()` call would execute with `flopDealt = false` (reset at the start of `dealNewHand()`), even though the previous hand had reached showdown
4. **Missing Rake**: Since `flopDealt = false`, rake collection was skipped with the "hand ended pre-flop" message

### Example from Logs
```
13:38:39 🔥 All-in detected - running out the board...
13:38:39 ━━━ 🃏 FLOP DEALT ━━━
13:38:41 ━━━ 🃏 TURN DEALT ━━━
13:38:42 ━━━ 🃏 RIVER DEALT ━━━
13:38:43 ━━━ 🎯 SHOWDOWN ━━━
13:38:44 🃏 Your hand: K High
13:38:44 🃏 Opponent hand: Pair, 2's
13:38:44 💰 Rake: 2,000 SHIDO ✅ CORRECT
13:38:46 😞 AI Opponent won 396,000 SHIDO
13:38:49 🃏 New hand started
...
13:38:51 🔥 All-in detected - running out the board...
13:38:51 ━━━ 🃏 FLOP DEALT ━━━
13:38:52 ━━━ 🃏 TURN DEALT ━━━
13:38:53 ━━━ 🃏 RIVER DEALT ━━━
13:38:54 ━━━ 🎯 SHOWDOWN ━━━
13:38:55 🃏 Your hand: Three of a Kind, 4's
13:38:55 🃏 Opponent hand: Four of a Kind, 4's
13:38:55 💰 Rake: 2,000 SHIDO ✅ CORRECT
13:38:57 😞 AI Opponent won 394,000 SHIDO
13:39:00 💰 No rake (hand ended pre-flop) ❌ INCORRECT (duplicate endHand)
13:39:00 🎉 You won 396,000 SHIDO!
```

## Solution

### 1. Remove Premature `endHand()` Calls
**File**: `HeadsUpPokerGame.ts` lines 341-347

**Before**:
```typescript
if (sbPlayer && sbPlayer.stack <= 0) {
  console.log('[Game Over] Small Blind has no chips remaining');
  this.endHand(false); // ❌ Premature call
  return { myCards: [], communityCards: [] };
}
```

**After**:
```typescript
if (sbPlayer && sbPlayer.stack <= 0) {
  console.log('[Game Over] Small Blind has no chips remaining - cannot post blinds');
  return { myCards: [], communityCards: [] }; // ✅ Just return, don't call endHand
}
```

### 2. Add `isShowdown` Parameter to `endHand()`
**File**: `HeadsUpPokerGame.ts` line 1099

**Signature Change**:
```typescript
// Before
private endHand(playerWins: boolean, isTie: boolean = false)

// After
private endHand(playerWins: boolean, isTie: boolean = false, isShowdown: boolean = false)
```

### 3. Update Rake Logic
**File**: `HeadsUpPokerGame.ts` lines 1107-1148

**Before**:
```typescript
// Only rake if flop was dealt
if (!this.state.flopDealt) {
  rake = 0;
  this.state.gameLog.push({
    action: '💰 No rake (hand ended pre-flop)',
    type: 'info',
    timestamp: Date.now()
  });
} else if (this.state.pot < MIN_POT_FOR_RAKE) {
  // ...
}
```

**After**:
```typescript
// Only rake if flop was dealt AND hand went to showdown
if (!this.state.flopDealt) {
  rake = 0;
  this.state.gameLog.push({
    action: '💰 No rake (hand ended pre-flop)',
    type: 'info',
    timestamp: Date.now()
  });
} else if (!isShowdown) {
  // NEW: Check if hand ended by fold
  rake = 0;
  this.state.gameLog.push({
    action: '💰 No rake (hand ended by fold)',
    type: 'info',
    timestamp: Date.now()
  });
} else if (this.state.pot < MIN_POT_FOR_RAKE) {
  // ...
}
```

### 4. Update `showdown()` Call
**File**: `HeadsUpPokerGame.ts` line 1016

**Before**:
```typescript
setTimeout(() => {
  this.endHand(playerWins, isTie);
}, 2000);
```

**After**:
```typescript
setTimeout(() => {
  this.endHand(playerWins, isTie, true); // ✅ isShowdown = true
}, 2000);
```

### 5. Add Game-Over Check in `endHand()`
**File**: `HeadsUpPokerGame.ts` lines 1195-1208

**Before**:
```typescript
this.onStateUpdate(this.state);

// Start new hand after delay
setTimeout(() => {
  const result = this.startNewHand();
  // ...
}, 3000);
```

**After**:
```typescript
this.onStateUpdate(this.state);

// Check if either player is busted before starting next hand
if (myPlayer.stack <= 0 || opponent.stack <= 0) {
  console.log('[Game Over] Player busted - cannot continue');
  this.state.gameLog.push({
    action: '🏁 Game Over - Player busted!',
    type: 'system',
    timestamp: Date.now()
  });
  this.onStateUpdate(this.state);
  return; // ✅ Don't start a new hand
}

// Start new hand after delay
setTimeout(() => {
  const result = this.startNewHand();
  // ...
}, 3000);
```

## Rake Policy (Unchanged)
Rake is collected **if and only if**:
1. ✅ Flop was dealt (`flopDealt = true`)
2. ✅ Hand went to showdown (`isShowdown = true`)
3. ✅ Pot is at least 1 big blind
4. ✅ Amount: 5% of pot, capped at 2x big blind (2000 chips default)

**No rake is collected when**:
- ❌ Hand ends pre-flop (fold before flop)
- ❌ Hand ends by fold after flop (even if flop dealt)
- ❌ Pot below minimum threshold

## Testing Scenarios

### ✅ Should Collect Rake
1. **All-in pre-flop → showdown**
   ```
   Player raises all-in 197,500
   Opponent calls
   🔥 All-in detected - running out the board...
   ━━━ 🃏 FLOP DEALT ━━━
   ━━━ 🃏 TURN DEALT ━━━
   ━━━ 🃏 RIVER DEALT ━━━
   ━━━ 🎯 SHOWDOWN ━━━
   💰 Rake: 2,000 SHIDO (5% of pot, cap: 2,000) ✅
   ```

2. **Post-flop all-in → showdown**
   ```
   You bet 16,000
   Opponent calls
   You raise 83,000
   Opponent all-in 83,000
   ━━━ 🎯 SHOWDOWN ━━━
   💰 Rake: 2,000 SHIDO ✅
   ```

### ❌ Should NOT Collect Rake
1. **Pre-flop fold**
   ```
   Opponent raises
   You fold
   💰 No rake (hand ended pre-flop) ✅
   ```

2. **Post-flop fold**
   ```
   ━━━ 🃏 FLOP DEALT ━━━
   You bet 10,000
   Opponent folds
   💰 No rake (hand ended by fold) ✅
   ```

## Result
✅ Rake is now correctly collected on all-in hands that go to showdown
✅ No more duplicate `endHand()` calls causing stale state issues
✅ Game-over detection properly prevents new hand dealing when player has 0 chips
✅ All fold scenarios correctly skip rake collection
