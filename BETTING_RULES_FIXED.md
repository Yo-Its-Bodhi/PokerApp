# Betting Rules - Fixed Issues

## Date: October 6, 2025

## Problems Fixed

### 1. ❌ CHECK NOT ALLOWED WHEN FACING A BET
**Issue**: Players could check when opponent had placed a bet, violating poker rules.

**Rule**: When facing a bet, you MUST either:
- **CALL** (match the bet)
- **RAISE** (match + add more)
- **FOLD** (give up)

You **CANNOT CHECK** when there's a bet to call.

**Fix Applied**:
```typescript
// In handlePlayerAction - 'check' case:
case 'check':
  // Can only check if there's no bet to call
  if (this.state.opponentBet > this.state.myBet) {
    console.warn('Cannot check when facing a bet!');
    return; // Invalid action - blocked
  }
  // No change in bets
  break;
```

### 2. ❌ RAISE AMOUNT CONFUSION
**Issue**: Clarified that raise amount is ADDITIONAL, not a replacement.

**Rule**: When you RAISE:
- You must first MATCH the opponent's bet (call)
- THEN add your raise amount ON TOP

**Example**:
- Opponent bets 2000
- You raise 3000
- Your total bet = 2000 (call) + 3000 (raise) = **5000 total**
- Opponent now faces 3000 to call (difference)

**Fix Applied**:
```typescript
case 'raise':
  // Raise = must CALL opponent's bet + add raise amount on top
  const raiseAmount = amount || (this.state.bigBlind * 2);
  
  // Total bet = opponent's current bet + our raise amount
  const totalBet = this.state.opponentBet + raiseAmount;
  const additionalBet = totalBet - this.state.myBet;
  
  newMyBet = totalBet;
  newMyStack -= additionalBet;
  newPot += additionalBet;
  break;
```

### 3. ❌ AI CHECKING WHEN FACING A BET
**Issue**: AI logic had bet difference calculated correctly but was checking when it shouldn't.

**Rule**: AI follows same rules - cannot check when facing a bet.

**Fix Applied**:
```typescript
// betDifference: how much more the PLAYER bet compared to OPPONENT
const betDifference = this.state.myBet - this.state.opponentBet;

if (betDifference > 0) {
  // Player bet MORE than AI - AI is facing a bet and CANNOT CHECK
  // AI must call, fold, or raise
  
  // ... AI decision logic for call/fold/raise only
}
```

### 4. ❌ TIMER AUTO-CHECK WHEN FACING BET
**Issue**: Timer expiry was always calling `handleAction('check')`, even when facing a bet.

**Rule**: Timeout should:
- **Auto-FOLD** if there's a bet to call
- **Auto-CHECK** only if no bet to call

**Fix Applied**:
```typescript
// In App.tsx timer expiry:
if (newBaseTime === 0) {
  // Timer expired - call handleTimerExpiry to auto-fold or auto-check
  clearInterval(interval);
  if (demoGame && seat) {
    demoGame.handleTimerExpiry(seat); // Proper logic: fold if bet, check if no bet
  }
  return null;
}
```

## Betting Flow Examples

### Scenario 1: Opening Bet
```
Street: Flop
Player 1 Bet: 0
Player 2 Bet: 0
→ Player 1 can CHECK or BET (no bet to call)
```

### Scenario 2: Facing a Bet
```
Street: Flop
Player 1 Bet: 2000
Player 2 Bet: 0
→ Player 2 CANNOT CHECK
→ Player 2 options: CALL 2000, RAISE (2000 + X), or FOLD
```

### Scenario 3: Raising
```
Street: Turn
Player 1 Bet: 3000
Player 2 Bet: 0
→ Player 2 raises 4000
→ Player 2's total bet = 3000 + 4000 = 7000
→ Player 1 now faces 4000 to call (difference)
```

### Scenario 4: Re-Raising
```
Street: River
Player 1 Bet: 5000
Player 2 Bet: 12000 (raised 7000)
→ Player 1 re-raises 10000
→ Player 1's total bet = 12000 + 10000 = 22000
→ Player 2 now faces 10000 to call
```

### Scenario 5: Timeout with Bet
```
Street: Flop
Player 1 Bet: 2000
Player 2 Bet: 0
→ Player 2's timer expires
→ Auto-FOLD (cannot auto-check when facing bet)
→ Player 1 wins pot
```

### Scenario 6: Timeout without Bet
```
Street: Turn
Player 1 Bet: 5000
Player 2 Bet: 5000 (called)
→ Player 1's timer expires (new round, bets equal)
→ Auto-CHECK (no bet to call)
→ Game continues
```

## Code Validation

### Check Action Validation
```typescript
// Validates check is only allowed when bets are equal
if (this.state.opponentBet > this.state.myBet) {
  console.warn('Cannot check when facing a bet!');
  return;
}
```

### Raise Calculation
```typescript
// Calculates total bet as opponent's bet + raise amount
const totalBet = this.state.opponentBet + raiseAmount;
const additionalBet = totalBet - this.state.myBet;
```

### AI Bet Detection
```typescript
// Correctly identifies when AI is facing a bet
const betDifference = this.state.myBet - this.state.opponentBet;
if (betDifference > 0) {
  // Player bet more - AI cannot check
}
```

### Timer Auto-Action
```typescript
// Determines correct action based on bet status
const hasBetToCall = isPlayer 
  ? this.state.opponentBet > this.state.myBet 
  : this.state.myBet > this.state.opponentBet;

if (hasBetToCall) {
  // Auto-fold
} else {
  // Auto-check
}
```

## Testing Checklist

- [x] Player cannot check when opponent has bet
- [x] Raise adds to opponent's bet (not replaces)
- [x] AI cannot check when facing player's bet
- [x] Timer auto-folds when facing bet
- [x] Timer auto-checks when no bet
- [x] Bet calculations never go negative
- [x] Total pot always matches bets placed
- [x] Turn switches properly after actions
- [x] Game log shows correct amounts

## Files Modified

1. **HeadsUpPokerGame.ts**
   - Check validation in `handlePlayerAction()`
   - Raise calculation logic
   - AI bet difference logic
   - Timer expiry logic in `handleTimerExpiry()`

2. **App.tsx**
   - Timer expiry calls `demoGame.handleTimerExpiry(seat)`
   - Removed hardcoded `handleAction('check')` on timeout

---

**Status**: ✅ All betting rules now enforce proper poker gameplay
**Last Updated**: October 6, 2025 - 11:45 PM
