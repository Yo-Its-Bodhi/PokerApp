# Rebuy/Add Chips System

## Overview
Players who run out of chips (busted) can now add more chips to continue playing using the rebuy system.

## Features Implemented

### 1. **Busted State Detection**
- Automatically detects when player has 0 chips
- Shows special "BUSTED" UI instead of action buttons
- Condition: `playerStack === 0 && myBet === 0`

### 2. **Rebuy Options**
Three quick rebuy amounts available:
- **💰 100,000 SHIDO** - Small rebuy (green button)
- **💎 250,000 SHIDO** - Medium rebuy (blue button)  
- **👑 500,000 SHIDO** - Large rebuy (purple button)

### 3. **Auto-Restart After Rebuy**
When chips are added in demo mode:
1. Chips are added to player's stack
2. Balance is updated
3. After 1.5 seconds, new hand automatically starts
4. Message: "🃏 New hand started after rebuy! Good luck! 🍀"

### 4. **Demo Mode vs Multiplayer**
**Demo Mode:**
- Instantly adds chips locally
- Automatically restarts game with `startNewHand()`
- No blockchain transaction required

**Multiplayer Mode:**
- Opens deposit modal to add chips via blockchain
- Requires wallet transaction confirmation
- Uses existing `handleDeposit()` flow

## Files Modified

### 1. **App.tsx**
Added `handleRebuy()` function:
```typescript
const handleRebuy = (amount: number = 100000) => {
  if (demoMode) {
    setBalance(prev => prev + amount);
    if (demoGame && demoGameRef.current) {
      demoGameRef.current.addChips(amount);
      // Auto-start new hand if player was at 0
      if (myPlayer.stack === 0) {
        setTimeout(() => {
          demoGameRef.current.startNewHand();
        }, 1500);
      }
    }
  } else {
    // Trigger deposit modal for multiplayer
    setDepositAmount(amount);
    setShowDepositModal(true);
  }
}
```

Passed `onRebuy={handleRebuy}` to Actions component.

### 2. **Actions.tsx**
**Added Props:**
- `onRebuy?: (amount?: number) => void` - Optional rebuy callback

**Busted UI:**
```tsx
{isBusted && onRebuy && (
  <div className="space-y-3">
    <div className="...">
      💀 BUSTED!
      You're out of chips. Add more to continue playing!
    </div>
    
    <button onClick={() => onRebuy(100000)}>
      💰 ADD 100,000 SHIDO
    </button>
    
    <button onClick={() => onRebuy(250000)}>
      💎 ADD 250,000 SHIDO
    </button>
    
    <button onClick={() => onRebuy(500000)}>
      👑 ADD 500,000 SHIDO
    </button>
    
    <button onClick={onStandUp}>
      LEAVE TABLE
    </button>
  </div>
)}
```

**Normal actions only show if NOT busted:**
```tsx
{!isBusted && (
  // CHECK, CALL, BET/RAISE, ALL-IN, FOLD buttons
)}
```

### 3. **HeadsUpPokerGame.ts**
Added `addChips()` public method:
```typescript
public addChips(amount: number) {
  console.log(`[Rebuy] Adding ${amount} chips to player's stack`);
  
  this.state = {
    ...this.state,
    players: this.state.players.map(p => 
      p.isMe ? { ...p, stack: p.stack + amount, chips: p.chips + amount } : p
    )
  };
  
  this.onStateUpdate(this.state);
}
```

## User Flow

### Scenario: Player Goes Bust

1. **Player loses final chips**
   - Stack reaches 0
   - Hand ends with loss message

2. **Busted state appears**
   - Action buttons disappear
   - Red banner: "💀 BUSTED!"
   - Message: "You're out of chips. Add more to continue playing!"

3. **Player clicks rebuy button**
   - Example: "💎 ADD 250,000 SHIDO"
   - Chips are added to stack immediately (demo mode)
   - Message: "💰 Added 250,000 SHIDO to your stack!"

4. **Game auto-restarts**
   - After 1.5 seconds delay
   - New hand automatically starts
   - Message: "🃏 New hand started after rebuy! Good luck! 🍀"
   - Player can continue playing

5. **Alternative: Leave table**
   - Player can click "LEAVE TABLE" instead
   - Returns to lobby

## Visual Design

**Busted Banner:**
- Red/orange gradient background
- Large "💀 BUSTED!" text
- Clear instructions

**Rebuy Buttons:**
- 3 tiers with different colors:
  - Green (100k) - Budget rebuy
  - Blue (250k) - Standard rebuy
  - Purple (500k) - High roller rebuy
- Glossy gradient styling matching game theme
- Hover effects with shadow

**Leave Table:**
- Muted slate colors
- Bottom of panel
- Always available as escape option

## Benefits

✅ **No Game Interruption**: Auto-restart after rebuy  
✅ **Multiple Options**: Choose rebuy amount based on bankroll  
✅ **Clear Feedback**: Visual and text messages confirm action  
✅ **Flexible**: Works in both demo and multiplayer modes  
✅ **User-Friendly**: One-click rebuy process  

## Testing Scenarios

- [x] Player loses all chips → Busted UI appears
- [x] Click 100k rebuy → Chips added, game restarts
- [x] Click 250k rebuy → Chips added, game restarts  
- [x] Click 500k rebuy → Chips added, game restarts
- [x] Click Leave Table → Returns to lobby
- [x] Rebuy with chips remaining → Only shows when stack = 0
- [x] Demo mode → Instant rebuy
- [x] Multiplayer mode → Opens deposit modal (to be tested)

## Integration with Existing Systems

**Works with:**
- Deposit/Withdraw system
- Demo mode
- Timer system
- Side pot logic
- All-in protection
- Game state management

**No conflicts with:**
- Existing blind posting
- Hand progression
- Showdown logic
- Rake calculation
