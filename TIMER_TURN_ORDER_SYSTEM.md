# Timer and Turn Order System

## Overview
Implements proper poker turn order and automatic timeout handling to prevent game stalling.

## Turn Order Rules (Heads-Up Texas Hold'em)

### Preflop
- **Small Blind acts FIRST** (must act before Big Blind)
- Big Blind acts second

### Post-Flop (Flop, Turn, River)
- **Small Blind ALWAYS acts FIRST** on every street
- This is consistent across all post-flop streets

### Position Tracking
```typescript
// Players are marked with:
isSmallBlind: boolean  // Acts first on all streets
isBigBlind: boolean    // Acts second preflop, second post-flop
isDealer: boolean      // Button position
```

### Dealer Button Rotation
- After each hand, dealer button moves to the other player
- In heads-up: Dealer = Big Blind, Non-dealer = Small Blind

## Timer System

### Timeout Counters
Each player has a timeout counter tracked in game state:
```typescript
playerTimeouts: number;    // 0-2
opponentTimeouts: number;  // 0-2
```

### Auto-Actions on Timer Expiry

When timer hits 0:

1. **If there's a bet to call:**
   - Player automatically **FOLDS**
   - Log: "⏰ [Player] timed out (1/2)"
   - Log: "[Player] auto-fold (timed out with bet to call)"

2. **If no bet to call:**
   - Player automatically **CHECKS**
   - Log: "⏰ [Player] timed out (1/2)"
   - Log: "[Player] auto-check (timed out, no bet)"

### Timeout Counter Reset

Timeout counter resets to 0 when:
- Player makes ANY valid action (check, call, raise, fold, all-in)
- Counter is reset BEFORE processing the action

### Two-Strike Removal

After **2 consecutive timeouts**:
- Player is removed from the table
- Log: "🚫 [Player] has been removed from the table (2 consecutive timeouts)"
- Game ends or resets

### Usage in App.tsx

The timer component should call this method when timer expires:
```typescript
// When timer hits 0
demoGame.handleTimerExpiry(seatNumber);
```

## Current Player Tracking

### State Management
```typescript
currentPlayer: number;  // Seat number of player whose turn it is
```

### Turn Switching
- After player action: `currentPlayer` switches to opponent seat
- After opponent action: `currentPlayer` switches back to player seat
- After advancing street: `currentPlayer` set to Small Blind seat

### Turn Validation
Before processing any action:
```typescript
if (this.state.currentPlayer !== this.playerSeat) {
  console.warn('Not your turn!');
  return;
}
```

## Implementation Details

### handleTimerExpiry(seat: number)
```typescript
public handleTimerExpiry(seat: number) {
  // 1. Identify if it's player or opponent
  const isPlayer = seat === this.playerSeat;
  
  // 2. Check if there's a bet to call
  const hasBetToCall = /* check bet difference */;
  
  // 3. Increment timeout counter
  this.state.playerTimeouts++ or opponentTimeouts++;
  
  // 4. Check for removal (>= 2 timeouts)
  if (timeouts >= 2) {
    // Remove from table
    return;
  }
  
  // 5. Auto-action
  if (hasBetToCall) {
    // Auto-fold
  } else {
    // Auto-check
  }
}
```

### advanceStreet()
Ensures Small Blind acts first on every new street:
```typescript
// Find Small Blind player
const sbPlayer = this.state.players.find(p => p.isSmallBlind);
const sbSeat = sbPlayer?.seat;

// Set as current player
this.state.currentPlayer = sbSeat;

// Start timer for Small Blind
if (this.onTurnStart) {
  this.onTurnStart(sbSeat);
}
```

### dealNewHand()
Sets Small Blind to act first on preflop:
```typescript
const sbPlayer = this.state.players.find(p => p.isSmallBlind);
this.state.currentPlayer = sbPlayer?.seat;
```

## Game Flow Example

### Hand Start
1. Dealer button assigned
2. Blinds posted (SB = 500, BB = 1000)
3. Cards dealt
4. **Current player = Small Blind seat**
5. Timer starts for Small Blind

### Preflop Action
1. SB acts (call/raise/fold)
   - Timeout counter reset to 0
   - Current player = BB seat
2. BB acts (check/raise/fold)
   - Timeout counter reset to 0
   - Current player = SB seat
3. Repeat until betting round complete

### Flop
1. Flop cards dealt
2. Bets reset to 0
3. **Current player = Small Blind seat** (always first)
4. Timer starts for Small Blind
5. Betting round proceeds

### Timeout Scenario
```
Turn 1: Player acts normally → timeout counter = 0
Turn 2: Timer expires (no bet) → auto-check → timeout counter = 1
Turn 3: Player acts normally → timeout counter = 0
Turn 4: Timer expires (facing bet) → auto-fold → timeout counter = 1
Turn 5: Timer expires again → timeout counter = 2 → REMOVED
```

## Testing Checklist

- [ ] Small Blind acts first preflop
- [ ] Small Blind acts first on flop
- [ ] Small Blind acts first on turn
- [ ] Small Blind acts first on river
- [ ] Timer starts for correct player each street
- [ ] Timeout auto-checks when no bet
- [ ] Timeout auto-folds when facing bet
- [ ] First timeout increments counter (1/2)
- [ ] Second timeout removes player (2/2)
- [ ] Successful action resets timeout counter
- [ ] Turn tracking prevents out-of-turn actions
- [ ] Dealer button rotates each hand
- [ ] Blinds correctly assigned after rotation

## Notes

- **Small Blind = First to Act** on ALL streets (preflop, flop, turn, river)
- **Big Blind** only acts last on preflop, then second on all post-flop streets
- Timeout system prevents infinite stalling
- Two-strike rule balances between preventing abuse and allowing connection issues

---

**Last Updated**: October 6, 2025  
**Version**: 1.0.0
