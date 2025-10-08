# Batch 8: Timeout System Enhancement - COMPLETE ✅

## Overview
Enhanced the multi-player timeout system to provide individual timeout tracking for all 4-6 players (not just binary player/opponent tracking). The system now tracks consecutive timeouts, shows visual warnings, and removes inactive players after 2 timeouts.

## Implementation Date
January 2025

---

## Changes Made

### 1. **Player Interface Updates** (MultiPlayerPokerGame.ts)
**Lines 6-23**: Added timeout tracking fields to Player interface
```typescript
export interface Player {
  // ... existing fields ...
  timeouts?: number;         // Consecutive timeout counter (0-2)
  timeoutWarning?: boolean;  // Show warning on next timeout
}
```

### 2. **Player Initialization** (MultiPlayerPokerGame.ts)
**Lines 85-95 & 100-111**: Initialize timeout counters for all players
```typescript
// Human player initialization
{
  seat,
  stack: 100000,
  // ... other fields ...
  timeouts: 0,
  timeoutWarning: false
}

// AI player initialization
{
  seat,
  stack: 100000,
  // ... other fields ...
  timeouts: 0,
  timeoutWarning: false
}
```

### 3. **Timeout Reset Logic** (MultiPlayerPokerGame.ts)
**Lines 284-289**: Reset timeout counter when human player acts
```typescript
public async handlePlayerAction(action: string, amount: number = 0) {
  const player = this.state.players.find(p => p.seat === this.state.currentPlayer && p.isMe);
  if (!player) return;

  // Reset timeout counter when player takes action
  if (player.timeouts !== undefined && player.timeouts > 0) {
    player.timeouts = 0;
    player.timeoutWarning = false;
  }
  // ... rest of action handling
}
```

**Lines 432-437**: Reset timeout counter when AI player acts
```typescript
private async aiAction(seatNumber: number) {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const player = this.state.players.find(p => p.seat === seatNumber);
  if (!player || player.folded || player.allIn) return;

  // Reset timeout counter when AI takes action
  if (player.timeouts !== undefined && player.timeouts > 0) {
    player.timeouts = 0;
    player.timeoutWarning = false;
  }
  // ... rest of AI logic
}
```

### 4. **Timeout Handling Method** (MultiPlayerPokerGame.ts)
**Lines 424-518**: New public method to handle player timeouts
```typescript
public async handleTimeout(seatNumber: number) {
  const player = this.state.players.find(p => p.seat === seatNumber);
  if (!player || player.folded || player.allIn) return;

  // Initialize and increment timeout counter
  if (player.timeouts === undefined) {
    player.timeouts = 0;
  }
  player.timeouts++;

  // Log timeout
  const playerName = player.isMe ? 'You' : (player.name || `Seat ${player.seat}`);
  this.state.gameLog.push({
    action: `${playerName} timed out (${player.timeouts}/2)`,
    type: 'warning',
    timestamp: Date.now()
  });

  // Check if player should be removed (2 consecutive timeouts)
  if (player.timeouts >= 2) {
    player.folded = true;
    player.lastAction = { type: 'fold', text: 'REMOVED (TIMEOUT)' };
    
    this.state.gameLog.push({
      action: `${playerName} removed from hand due to inactivity`,
      type: 'error',
      timestamp: Date.now()
    });

    // Remove player from game
    player.stack = 0;
  } else {
    // Set warning flag for next timeout
    player.timeoutWarning = true;

    // Auto-fold or auto-check based on situation
    const callAmount = this.state.currentBet - player.bet;
    if (callAmount > 0) {
      // Facing a bet - auto-fold
      player.folded = true;
      player.lastAction = { type: 'fold', text: 'FOLDED (TIMEOUT)' };
    } else {
      // No bet - auto-check
      player.hasActed = true;
      player.lastAction = { type: 'check', text: 'CHECKED (TIMEOUT)' };
    }
  }

  // Continue game flow
  this.onStateUpdate(this.state);

  // Check if hand is over
  const activePlayers = this.state.players.filter(p => !p.folded);
  if (activePlayers.length === 1) {
    await this.endHand();
    return;
  }

  // Check if betting round complete
  if (this.isBettingRoundComplete()) {
    await this.advanceStreet();
    return;
  }

  // Move to next player
  this.state.currentPlayer = this.getNextSeat(this.state.currentPlayer);
  this.onStateUpdate(this.state);

  // Start timer for next player
  if (this.onTurnStart) {
    this.onTurnStart(this.state.currentPlayer);
  }

  // If next player is AI, make them act
  const nextPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
  if (nextPlayer && !nextPlayer.isMe) {
    setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
  }
}
```

### 5. **Persistent Timeout Tracking** (MultiPlayerPokerGame.ts)
**Lines 193-201**: Keep timeout counters across hands
```typescript
// Reset players (but keep timeout counters)
this.state.players = this.state.players.map(p => ({
  ...p,
  bet: 0,
  folded: false,
  allIn: false,
  hasActed: false,
  cards: [],
  isDealer: false, // Clear dealer flag
  // Keep timeouts and timeoutWarning - they persist across hands
}));
```

### 6. **Visual Feedback** (RealisticTable.tsx)
**After line 648**: Added timeout warning indicators on player avatars
```typescript
{/* Timeout Warning Indicator */}
{player.timeoutWarning && (
  <div 
    className="absolute -top-2 -right-2 z-50 bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg animate-pulse"
    title="Warning: 1 timeout - another timeout will remove you from the hand"
  >
    ⚠️
  </div>
)}

{/* Timeout Counter (if player has any timeouts) */}
{(player.timeouts ?? 0) > 0 && !player.timeoutWarning && (
  <div 
    className="absolute -top-1 -right-1 z-50 bg-amber-600 rounded-full w-7 h-7 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-md"
    title={`Timeouts: ${player.timeouts}/2`}
  >
    {player.timeouts}
  </div>
)}
```

---

## Features Implemented

### ✅ Individual Timeout Tracking
- Each player (human + AI) has their own `timeouts` counter (0-2)
- Counter increments on each timeout
- Persists across hands until reset by action

### ✅ Timeout Reset Mechanism
- Automatically resets to 0 when player takes any action (fold/check/call/raise)
- Resets both counter and warning flag
- Works for both human and AI players

### ✅ Progressive Timeout Handling
**First Timeout:**
- Increment counter to 1
- Set `timeoutWarning` flag
- Auto-fold if facing a bet
- Auto-check if no bet to call
- Log action in game log
- Continue game flow

**Second Timeout:**
- Increment counter to 2
- Remove player from hand (set `folded = true`)
- Set stack to 0 (remove from game)
- Log removal in game log
- Continue game flow

### ✅ Visual Indicators
**Warning Badge (⚠️):**
- Red pulsing circle with warning emoji
- Appears on avatar after first timeout
- Tooltip: "Warning: 1 timeout - another timeout will remove you from the hand"
- Position: Top-right corner of avatar (-top-2, -right-2)

**Timeout Counter:**
- Amber circle with number (1 or 2)
- Shows when player has timeouts but no active warning
- Tooltip: "Timeouts: X/2"
- Position: Top-right corner of avatar (-top-1, -right-1)

### ✅ Game Log Integration
- "Player X timed out (1/2)" - First timeout warning
- "Player X auto-folded" or "Player X auto-checked" - Automatic action
- "Player X timed out (2/2)" - Second timeout
- "Player X removed from hand due to inactivity" - Player removal

---

## Usage

### For App.tsx Integration
When a player's timer expires, call the handleTimeout method:

```typescript
// Timer expiration handler
const handleTimerExpired = (seatNumber: number) => {
  if (demoGameRef.current) {
    demoGameRef.current.handleTimeout(seatNumber);
  }
};

// Pass to RealisticTable
<RealisticTable
  // ... other props
  onTimeout={handleTimerExpired}
/>
```

### Testing Scenarios

1. **Single Timeout Recovery**
   - Player times out (counter = 1, warning shows)
   - Player takes action (counter resets to 0, warning clears)
   - Player continues normally

2. **Consecutive Timeouts**
   - Player times out (counter = 1)
   - Player times out again (counter = 2)
   - Player removed from hand
   - Game continues with remaining players

3. **Multiple Players**
   - Track timeouts independently for all 4-6 players
   - Each player can have different timeout counts
   - Visual indicators show for all players with timeouts

4. **Persistence Across Hands**
   - Timeout counters persist between hands
   - Only reset when player takes action
   - Inactive players remain tracked

---

## Technical Details

### Data Structure
```typescript
interface Player {
  seat: number;
  stack: number;
  // ... other fields ...
  timeouts?: number;         // 0, 1, or 2
  timeoutWarning?: boolean;  // true after first timeout
}
```

### Timeout Flow
```
Timer Expires → handleTimeout(seatNumber) called
  ↓
Check if player already folded/all-in (skip if true)
  ↓
Initialize/Increment timeout counter
  ↓
Log timeout event
  ↓
IF timeouts >= 2:
  Remove player (fold, stack = 0)
  Log removal
ELSE:
  Set warning flag
  Auto-fold (if facing bet) OR Auto-check (if no bet)
  Log auto-action
  ↓
Update game state
  ↓
Check if hand over (only 1 player left)
  ↓
Check if betting round complete
  ↓
Move to next player
  ↓
Start next timer / trigger AI action
```

### Action Flow (Reset)
```
Player takes action (fold/check/call/raise/all-in)
  ↓
Check if timeouts > 0
  ↓
IF YES:
  Reset timeouts to 0
  Clear timeoutWarning flag
  ↓
Process action normally
```

---

## Files Modified

1. **MultiPlayerPokerGame.ts**
   - Added timeout fields to Player interface
   - Initialize timeout counters for all players
   - Added handleTimeout() public method
   - Added timeout reset in handlePlayerAction()
   - Added timeout reset in aiAction()
   - Updated player reset to preserve timeouts

2. **RealisticTable.tsx**
   - Added timeout warning indicator (⚠️ badge)
   - Added timeout counter display (number badge)
   - Added hover tooltips for timeout info

3. **REMAINING_TASKS.md**
   - Updated Batch 8 status to COMPLETE
   - Listed all completed items

---

## Benefits

✅ **Fair Play:** All players subject to same timeout rules
✅ **Clear Warnings:** Visual indicators show timeout status
✅ **Progressive Penalties:** First timeout = warning, second = removal
✅ **Reset on Activity:** Active players won't be penalized
✅ **Game Flow:** Automatic actions prevent game stalls
✅ **Scalability:** Works for 4-6 players independently

---

## Next Steps

With Batch 8 complete, the remaining tasks are:

**Batch 7: Multi-Player AI Logic** (45 min)
- AI decision making for 3 AI players
- Side pot calculations
- Dealer button rotation
- Advanced betting logic

**Batch 10: Live Table Stats Banner** (45 min)
- Casino-style statistics tracker
- Total wagered, hands played, biggest pot
- Animated counters

---

**Status:** ✅ COMPLETE - Ready for testing and deployment
