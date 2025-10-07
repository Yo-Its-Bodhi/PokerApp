# Negative Stack & Blind Posting Fix

## Problem
Players were posting blinds even when they had insufficient chips, causing **negative stacks** and **negative pots**.

### Example Error:
```
[AI Pot Validation] myBet: 1000, opponentBet: -1000, pot: 0
AI Opponent won -2,000 SHIDO
```

## Root Cause
In `startNewHand()` → `dealNewHand()`, blinds were posted without checking if players had enough chips:

```typescript
// OLD CODE (BUGGY):
if (p.isSmallBlind) {
  return { ...p, stack: p.stack - smallBlindAmount, bet: smallBlindAmount };
}
```

If `p.stack < smallBlindAmount`, this created a negative stack!

## Solution Implemented

### 1. **Game Over Check**
Before posting blinds, check if either player has 0 or negative chips:
```typescript
if (sbPlayer && sbPlayer.stack <= 0) {
  console.log('[Game Over] Small Blind has no chips remaining');
  this.endHand(false); // SB loses
  return { myCards: [], communityCards: [] };
}
```

### 2. **All-In Blind Posting**
When posting blinds, use `Math.min()` to cap at player's stack:
```typescript
if (p.isSmallBlind) {
  const actualSB = Math.min(p.stack, smallBlindAmount);
  console.log(`[Blind] Small Blind: ${p.isMe ? 'You' : 'Opponent'} posting ${actualSB} (stack: ${p.stack})`);
  return { ...p, stack: p.stack - actualSB, bet: actualSB, allIn: actualSB === p.stack };
}
```

### 3. **Accurate Pot Calculation**
Calculate pot from actual posted blinds, not expected blinds:
```typescript
const actualSBBet = sbPlayerUpdated?.bet || smallBlindAmount;
const actualBBBet = bbPlayerUpdated?.bet || bigBlindAmount;
const actualPot = actualSBBet + actualBBBet;
```

### 4. **Prevent Actions with 0 Stack**
Added validation in `handlePlayerAction()`:
```typescript
if (myPlayer.stack === 0 && action !== 'check' && action !== 'fold') {
  console.warn('Cannot bet/raise/call when stack is 0 (already all-in)');
  return;
}
```

### 5. **UI Button Disabling**
In `Actions.tsx`, disable bet/raise/call buttons when `playerStack === 0`:
```typescript
const isAllIn = playerStack === 0;
disabled={!isMyTurn || isAllIn}
```

## What You'll See Now

### When opponent has insufficient chips for blinds:
```
[Blind] Small Blind: Opponent posting 250 (stack: 250)
[Blind] Big Blind: You posting 1000 (stack: 100000)
Pot: 1250 (not 1500!)
```

### When opponent has 0 chips:
```
[Game Over] Small Blind has no chips remaining
🎉 You won the match!
```

### When you're all-in:
- Orange banner: "💥 You're ALL-IN! Waiting for opponent..."
- CALL, BET/RAISE, ALL-IN buttons grayed out
- Only CHECK/FOLD available

## Files Modified
1. `web/src/utils/HeadsUpPokerGame.ts` - Blind posting logic with all-in handling
2. `web/src/components/Actions.tsx` - Button disabling when all-in

## Testing Scenarios
✅ Opponent has 250 chips, posts 250 SB (all-in blind)
✅ Opponent has 0 chips → Game over
✅ You go all-in → Can't bet again
✅ Side pot: Excess returned when opponent can't match
✅ No negative stacks or pots possible

## Related Issues Fixed
- Side pot logic (returns excess when opponent all-in for less)
- Timer expiry (uses useRef to avoid stale closures)
- All-in protection (Math.min ensures correct pot sizes)
