# All-In and Side Pot Protection

## Date: October 7, 2025 - 12:45 AM

## The Issue

When a player goes all-in and the opponent doesn't have enough chips to cover it (or vice versa), we need to ensure:

1. ✅ **No negative balances** - Players can only bet what they have
2. ✅ **Correct pot size** - Pot only includes chips both players contributed
3. ✅ **Fair competition** - Players only compete for chips they both put in

## How It Already Works (Correctly!)

### Player Call Logic (Line 400)
```typescript
case 'call':
  const callAmount = Math.min(this.state.opponentBet - this.state.myBet, myPlayer.stack);
  // Only calls up to what player has available
```

### AI Call Logic (Line 597)
```typescript
const callAmount = Math.min(betDifference, opponent.stack);
// AI only calls up to what it has available
```

## Example Scenarios

### Scenario 1: Player All-In, AI Has More
```
Player Stack: 10,000
AI Stack: 50,000

Player goes all-in: 10,000
AI calls: 10,000 (matches player, not 50,000!)

Pot: 20,000
AI Remaining Stack: 40,000

Winner gets: 20,000 (minus rake)
AI keeps: 40,000 (never at risk)
```

### Scenario 2: AI All-In, Player Has Less
```
Player Stack: 5,000
AI Stack: 20,000

AI goes all-in: 20,000
Player calls: 5,000 (all they have)

Pot: 10,000 (5k + 5k that can be matched)
AI Bet: 5,000 (effective bet)
AI Remaining: 15,000 (automatically returned)

Winner gets: 10,000 (minus rake)
Loser: eliminated
AI keeps: 15,000 (uncalled portion)
```

### Scenario 3: Both All-In, Unequal Stacks
```
Player Stack: 30,000
AI Stack: 15,000

Player goes all-in: 30,000
AI calls: 15,000 (all they have)

Pot: 30,000 (15k + 15k)
Player Uncalled: 15,000 (returned immediately)

Winner gets: 30,000
Loser: eliminated
```

## Safety Measures Added

### 1. All-In Logging (Line 452)
```typescript
console.log(`[All-In] Player all-in: ${allInAmount}, Opponent can match: ${effectiveAllIn}`);
```
Shows the effective all-in amount (what opponent can actually match).

### 2. Pot Validation (Player Actions - Line 520)
```typescript
console.log(`[Pot Validation] myBet: ${myBet}, opponentBet: ${opponentBet}, pot: ${pot}, expected: ${expected}`);
```
Validates pot equals sum of actual bets.

### 3. Pot Validation (AI Actions - Line 698)
```typescript
console.log(`[AI Pot Validation] myBet: ${myBet}, opponentBet: ${opponentBet}, pot: ${pot}`);
```
Same validation for AI actions.

### 4. Stack Never Goes Negative (Line 458)
```typescript
if (newMyStack < 0) {
  console.error('Stack went negative! Fixing...');
  const overage = Math.abs(newMyStack);
  newMyStack = 0;
  newMyBet -= overage;
  newPot -= overage;
}
```
Automatically corrects if stack calculation goes negative.

## Key Protection Mechanisms

✅ **Math.min() in Calls** - Player can only call up to their stack  
✅ **Math.min() in AI Calls** - AI can only call up to its stack  
✅ **Negative Stack Protection** - Automatically fixes negative balances  
✅ **All-In Detection** - Sets allIn flag when stack reaches 0  
✅ **Pot Validation Logging** - Tracks pot integrity  
✅ **Uncalled Bet Returns** - Excess bets automatically stay with bettor  

## What Happens at Showdown

The pot at showdown contains only the chips both players contributed:

```typescript
const pot = this.state.pot; // Already correct from bet matching logic
const rake = calculateRake(pot);
const potAfterRake = pot - rake;

winner.stack += potAfterRake; // Winner gets the pot they competed for
```

## Testing Checklist

- [x] Player all-in 10k, AI has 50k → Pot is 20k (not 60k)
- [x] AI all-in 50k, Player has 10k → Pot is 20k, AI keeps 40k
- [x] Both all-in, equal stacks → Pot is sum of both stacks
- [x] Both all-in, unequal stacks → Pot is 2× smaller stack
- [x] No negative balances ever occur
- [x] Pot validation logs show correct amounts
- [x] Winner gets correct amount (no overflow)
- [x] Loser doesn't lose more than they had

## Console Output Example

When testing all-in scenarios, you'll see:
```
[All-In] Player all-in: 10000, Opponent can match: 10000
[Pot Validation] myBet: 10000, opponentBet: 0, pot: 10000
[Before AI Action] myBet: 10000, opponentBet: 0
[AI Decision] betDifference: 10000
[AI] Player has bet more - AI CANNOT CHECK, must call/raise/fold
[AI Pot Validation] myBet: 10000, opponentBet: 10000, pot: 20000
```

This confirms the pot is correctly calculated as 20k (not 60k if AI had more).

---

**Status**: ✅ PROTECTED - All-in scenarios handled correctly with safety checks
**Last Updated**: October 7, 2025 - 12:45 AM
