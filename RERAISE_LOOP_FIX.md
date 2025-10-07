# Re-Raise Loop Prevention & Timer Turn Flow Fix

## Date: October 6, 2025 - 11:55 PM

## Issues Fixed

### 1. ❌ INFINITE RE-RAISE LOOP
**Problem**: 
- Player raises → AI calls → Player can raise again → AI calls → infinite loop
- The game didn't recognize that a CALL resolves a raise

**Poker Rule**: 
When someone calls a raise, the betting round action is "resolved" for that player. The raiser cannot re-raise immediately unless the caller raises again.

**Example of Correct Flow**:
```
Player 1 bets 1000
Player 2 raises to 3000 (lastAggressor = P2)
Player 1 calls 2000    (lastAggressor = null - RESOLVED)
→ Betting round complete, advance to next street

NOT:
Player 1 calls 2000    (lastAggressor still = P2)
Player 1 can raise again ❌ WRONG
```

**Fix Applied**:

1. **When PLAYER calls**:
```typescript
case 'call':
  const callAmount = Math.min(this.state.opponentBet - this.state.myBet, myPlayer.stack);
  newMyBet += callAmount;
  newMyStack -= callAmount;
  newPot += callAmount;
  // Clear lastAggressor when calling - this resolves the raise
  this.lastAggressor = null;  // ← NEW LINE
  break;
```

2. **When AI calls**:
```typescript
action = 'call';
const callAmount = Math.min(betDifference, opponent.stack);
this.state.opponentBet += callAmount;
opponent.stack -= callAmount;
this.state.pot += callAmount;
// Clear lastAggressor when AI calls - this resolves the raise
this.lastAggressor = null;  // ← NEW LINE
```

### 2. ❌ TIMER NOT SWITCHING TURNS PROPERLY
**Problem**: 
- Timer expires → player auto-checks → turn doesn't switch to opponent
- Game would stall waiting for action

**Rule**: 
After any action (including timeout auto-actions), turn should switch to the next player and their timer should start.

**Fix Applied**:
```typescript
else {
  // Simulate opponent check
  this.opponentHasActed = true;
  this.state.currentPlayer = this.playerSeat; // Switch turn back to player
  this.onStateUpdate(this.state);
  
  // Check if round is complete (both acted, bets equal)
  if (this.playerHasActed && this.opponentHasActed && 
      this.state.myBet === this.state.opponentBet) {
    this.advanceStreet();
  } else if (this.onTurnStart) {
    // Start timer for player's next action  ← NEW LINES
    this.onTurnStart(this.playerSeat);
  }
}
```

## Betting Round Completion Logic

A betting round is complete when:
1. ✅ Both players have acted (`playerHasActed && opponentHasActed`)
2. ✅ Bets are equal (`myBet === opponentBet`)
3. ✅ No outstanding raises (`lastAggressor === null` or resolved by call)

**Example Scenarios**:

### Scenario 1: Simple Bet & Call
```
Street: Flop
Player bets 2000        (playerHasActed = true, lastAggressor = player)
AI calls 2000           (opponentHasActed = true, lastAggressor = null)
→ Round complete, advance to Turn
```

### Scenario 2: Raise & Call
```
Street: Turn
Player bets 3000        (playerHasActed = true, lastAggressor = player)
AI raises to 8000       (opponentHasActed = true, lastAggressor = AI, playerHasActed = false)
Player calls 5000       (playerHasActed = true, lastAggressor = null)
→ Round complete, advance to River
```

### Scenario 3: Re-Raise & Call
```
Street: River
Player bets 5000        (lastAggressor = player)
AI raises to 12000      (lastAggressor = AI, playerHasActed = false)
Player re-raises to 20000 (lastAggressor = player, opponentHasActed = false)
AI calls 8000           (lastAggressor = null)
→ Round complete, go to Showdown
```

### Scenario 4: Timeout Auto-Action
```
Street: Flop
Player's timer expires
→ Auto-check (playerHasActed = true)
→ Turn switches to AI
→ AI timer starts
→ AI acts (calls/bets/checks)
→ If bets equal and both acted: advance street
```

## Testing Checklist

- [x] Player raises, AI calls → Street advances (no re-raise option)
- [x] AI raises, Player calls → Street advances (no re-raise option)
- [x] Multiple raises are allowed until someone CALLS
- [x] Timer expires → auto-check/fold → turn switches properly
- [x] Timer starts for next player after timeout action
- [x] lastAggressor clears when raise is called
- [x] Betting round completes correctly in all scenarios

## Code Changes Summary

**Files Modified**: 
- `web/src/utils/HeadsUpPokerGame.ts`

**Lines Changed**:
1. Line ~388: Added `this.lastAggressor = null;` in player call action
2. Line ~575: Added `this.lastAggressor = null;` in AI call action
3. Line ~184: Added timer restart after opponent timeout check

**Impact**: 
- ✅ Prevents infinite re-raise loops
- ✅ Ensures proper turn flow after timeouts
- ✅ Maintains correct poker betting round rules
- ✅ Game never stalls waiting for action

---

**Status**: ✅ FIXED - Betting rounds now complete correctly
**Last Updated**: October 6, 2025 - 11:55 PM
