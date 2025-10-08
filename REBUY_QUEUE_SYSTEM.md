# 💰 Rebuy Queue System

## Overview
Players **cannot** add chips during an active hand. Chips purchased during gameplay are **queued** and automatically added at the start of the next hand.

---

## How It Works

### 1️⃣ Player Busted (0 Chips)
**Immediate Add + New Hand:**
- Player has 0 chips at table
- Clicks "Add Chips" (100K)
- Chips added **immediately**
- New hand starts automatically after 1.5 seconds
- Message: `"💰 Added 100,000 CHIPS! Starting new hand..."`

### 2️⃣ Hand In Progress
**Queue for Next Hand:**
- Community cards are dealt OR
- Players have active bets OR
- Not at preflop start
- Chips are **queued** (not added yet)
- Message: `"⏳ 100,000 CHIPS queued! Will be added at start of next hand."`
- Balance shows: `+100,000 queued ⏳` (animated pulse)

### 3️⃣ Between Hands (Waiting)
**Immediate Add:**
- No community cards on table
- At preflop (waiting for new hand)
- No active bets
- Chips added **immediately**
- Message: `"💰 Added 100,000 CHIPS to your table stack!"`

### 4️⃣ New Hand Starts
**Auto-Apply Queued Chips:**
- Game detects new hand (preflop, no cards)
- Checks if `pendingRebuy > 0`
- Adds queued chips to player's stack
- Clears queue
- Message: `"💰 100,000 CHIPS added to your stack!"`

---

## State Management

### New State Variable
```tsx
const [pendingRebuy, setPendingRebuy] = useState<number>(0);
```

### Hand Detection
```tsx
const handInProgress = 
  currentState.communityCards.length > 0 ||  // Cards on table
  currentState.street !== 'preflop' ||        // Not at preflop
  currentState.players.some((p: any) => p.bet > 0); // Bets placed
```

---

## Code Flow

### handleRebuy Function (Lines ~800-840)
```tsx
if (wasBusted) {
  // Busted: Add immediately + start hand
  demoGameRef.current.addChips(myPlayer.seat, amount);
  setTimeout(() => demoGameRef.current.startNewHand(), 1500);
  
} else if (handInProgress) {
  // Hand active: Queue chips
  setPendingRebuy(prev => prev + amount);
  setGameMessage("⏳ Chips queued for next hand");
  
} else {
  // Between hands: Add immediately
  demoGameRef.current.addChips(myPlayer.seat, amount);
  setPendingRebuy(0); // Clear any pending
}
```

### Game State Callback (Lines ~1366-1375)
```tsx
// At start of new hand (preflop, no cards)
if (gameState.street === 'preflop' && 
    gameState.communityCards.length === 0 && 
    pendingRebuy > 0) {
  
  const myPlayer = gameState.players.find((p: any) => p.isMe);
  if (myPlayer && demoGameRef.current) {
    demoGameRef.current.addChips(myPlayer.seat, pendingRebuy);
    setGameMessage(`💰 ${pendingRebuy.toLocaleString()} CHIPS added!`);
    setPendingRebuy(0);
  }
}
```

### UI Display (Lines ~2065-2072)
```tsx
<div className="balance-display">
  <span>{balance.toLocaleString()}</span>
  <span>CHIPS</span>
  {pendingRebuy > 0 && (
    <div className="text-cyan-400 animate-pulse">
      +{pendingRebuy.toLocaleString()} queued ⏳
    </div>
  )}
</div>
```

---

## User Experience

### Visual Feedback

**Balance Display (Normal):**
```
┌─────────────────┐
│  250,000 CHIPS  │
└─────────────────┘
```

**Balance Display (With Queue):**
```
┌─────────────────┐
│  250,000 CHIPS  │
│ +100,000 queued⏳│ ← Pulsing cyan text
└─────────────────┘
```

### Message Timeline

**During Hand (Queue):**
```
1. Player clicks "Add Chips" (100K)
2. Balance deducted: 1,000,000 → 900,000
3. Message: "⏳ 100,000 CHIPS queued! Will be added at start of next hand."
4. UI shows: "+100,000 queued ⏳" (animated)
5. Hand continues normally
```

**New Hand Starts (Auto-Apply):**
```
1. Previous hand ends (showdown/winner)
2. 5-second delay
3. New hand starts (preflop detected)
4. System checks: pendingRebuy = 100,000
5. Chips added to player's stack
6. Message: "💰 100,000 CHIPS added to your stack!"
7. Queue cleared: pendingRebuy = 0
8. UI updated: Queue indicator disappears
```

**When Busted (Immediate):**
```
1. Player stack = 0
2. Player clicks "Add Chips" (100K)
3. Balance deducted: 900,000 → 800,000
4. Chips added immediately
5. Message: "💰 Added 100,000 CHIPS! Starting new hand..."
6. Wait 1.5 seconds
7. New hand starts
8. Message: "🃏 New hand started! Good luck! 🍀"
```

---

## Rules & Constraints

### ✅ Allowed
- **Buy chips when busted** (0 stack) → Immediate + new hand
- **Buy chips between hands** → Immediate add
- **Queue multiple rebuys** → They stack (e.g., 100K + 100K = 200K queued)
- **Play out current hand** → Queue doesn't affect gameplay

### ❌ Not Allowed
- **Use queued chips in current hand** → Must wait for next hand
- **Cancel queued chips** → Chips already deducted from balance
- **Rebuy during all-in** → Must wait for hand to finish

---

## Benefits

### For Fair Play
✅ **No mid-hand advantage** - Can't add chips to escape bad position  
✅ **Consistent rules** - Same as live poker (wait for next hand)  
✅ **Transparent** - Clear messaging about when chips are added  

### For User Experience
✅ **Never locked out** - Busted players restart immediately  
✅ **Visual feedback** - Queue amount shown with animation  
✅ **Automatic** - No need to manually add when hand starts  
✅ **Multiple rebuys** - Can queue multiple times, they stack  

---

## Example Scenarios

### Scenario 1: Mid-Hand Rebuy
```
Hand State: Flop dealt, betting in progress
Player Stack: 25,000
Player Action: Clicks "Add Chips" (100K)

Result:
- Balance: 900,000 → 800,000 ✅
- Stack: 25,000 (unchanged) ⏳
- Queue: 100,000 ⏳
- Message: "⏳ 100,000 CHIPS queued!"
- UI: Shows "+100,000 queued ⏳"

Next Hand:
- Stack: 25,000 → 125,000 ✅
- Queue: 100,000 → 0 ✅
- Message: "💰 100,000 CHIPS added!"
```

### Scenario 2: Busted Player
```
Hand State: Hand finished, player lost all chips
Player Stack: 0
Player Action: Clicks "Add Chips" (100K)

Result:
- Balance: 800,000 → 700,000 ✅
- Stack: 0 → 100,000 ✅ (immediate)
- Queue: 0 (no queue needed)
- Message: "💰 Added 100,000 CHIPS! Starting new hand..."
- Wait 1.5 seconds
- New hand starts
- Message: "🃏 New hand started! Good luck! 🍀"
```

### Scenario 3: Between Hands
```
Hand State: Waiting for new hand (preflop, no cards)
Player Stack: 50,000
Player Action: Clicks "Add Chips" (100K)

Result:
- Balance: 700,000 → 600,000 ✅
- Stack: 50,000 → 150,000 ✅ (immediate)
- Queue: 0 (no queue needed)
- Message: "💰 Added 100,000 CHIPS to your table stack!"
```

### Scenario 4: Multiple Queued Rebuys
```
Hand State: Turn dealt, betting continues
Player Stack: 10,000
Player Action: Clicks "Add Chips" twice (100K each)

First Click:
- Queue: 0 → 100,000 ⏳
- UI: "+100,000 queued ⏳"

Second Click:
- Queue: 100,000 → 200,000 ⏳
- UI: "+200,000 queued ⏳"

Next Hand:
- Stack: 10,000 → 210,000 ✅
- Queue: 200,000 → 0 ✅
- Message: "💰 200,000 CHIPS added!"
```

---

## Technical Details

### Detection Logic
```tsx
const handInProgress = 
  currentState.communityCards.length > 0 ||      // Flop/turn/river dealt
  currentState.street !== 'preflop' ||            // Not at preflop
  currentState.players.some((p: any) => p.bet > 0); // Active bets

const isNewHandStart = 
  gameState.street === 'preflop' &&               // At preflop
  gameState.communityCards.length === 0;          // No cards dealt
```

### State Persistence
- `pendingRebuy` stored in React state (not localStorage)
- Resets on page refresh (chips remain in balance)
- Multiple rebuys accumulate: `setPendingRebuy(prev => prev + amount)`

### Timing
- **Busted restart**: 1.5 second delay before new hand
- **Queue apply**: Instant when new hand detected
- **Message clear**: 3 seconds after showing

---

## Files Modified

1. **App.tsx** (Lines ~140-145, ~800-845, ~1366-1375, ~2065-2072)
   - Added `pendingRebuy` state
   - Updated `handleRebuy` logic (3 scenarios)
   - Added queue application in game callback
   - Added queue indicator in balance UI

2. **MultiPlayerPokerGame.ts** (Previously added)
   - `addChips(seatNumber, amount)` method

---

## Testing Checklist

- [ ] Rebuy when busted (0 chips) adds immediately
- [ ] Rebuy when busted starts new hand after 1.5s
- [ ] Rebuy during flop queues chips (doesn't add)
- [ ] Rebuy during turn queues chips
- [ ] Rebuy during river queues chips
- [ ] Queue indicator shows in balance display
- [ ] Queue indicator animates (pulse)
- [ ] Multiple rebuys accumulate in queue
- [ ] Queue applies at start of next hand
- [ ] Queue indicator disappears after application
- [ ] Message shows "queued" during hand
- [ ] Message shows "added" when applied
- [ ] Balance deducts immediately
- [ ] Stack updates only when appropriate
- [ ] Rebuy between hands adds immediately

---

**Status**: ✅ **FULLY IMPLEMENTED**

**Last Updated**: October 8, 2025
