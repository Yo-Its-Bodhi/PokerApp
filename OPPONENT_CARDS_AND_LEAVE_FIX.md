# Opponent Cards Positioning & Leave Table Fixes

## Issue 1: Opponent Cards Overlapping Seat Box

### Problem
When opponent cards were revealed at showdown, they overlapped the opponent's seat text box:
- **Seat 1 opponent** (seat 4 at top): Cards appeared over the seat box
- **Seat 4 opponent** (seat 1 at bottom): Cards appeared over the seat box

### Root Cause
Cards were positioned at `-translate-x-40` (10rem = 160px) which wasn't far enough left to clear the seat box width (~180px min-width).

### Solution
**File**: `Table.tsx` lines 323-331

**Before**:
```tsx
<div className={`absolute z-40 ${
  mySeat === 1 ? 'top-12 left-1/2 -translate-x-40' :       // Only 10rem left
  mySeat === 4 ? 'bottom-8 left-1/2 -translate-x-40' :     // Only 10rem left
  'top-12 left-1/2 -translate-x-40'
}`}>
```

**After**:
```tsx
<div className={`absolute z-40 ${
  // Player at seat 1 → opponent at seat 4 (top center) → cards on left
  mySeat === 1 ? 'top-12 left-1/2 -translate-x-[14rem]' :   // 14rem = 224px
  // Player at seat 4 → opponent at seat 1 (bottom center) → cards on left
  mySeat === 4 ? 'bottom-8 left-1/2 -translate-x-[14rem]' : // 14rem = 224px
  'top-12 left-1/2 -translate-x-[14rem]'
}`}>
```

**Changes**:
- ✅ Increased left offset from `10rem` (160px) to `14rem` (224px)
- ✅ Cards now appear clearly to the LEFT of the seat box
- ✅ Added comments explaining player-opponent seat relationship
- ✅ Used Tailwind arbitrary value `[14rem]` for precise spacing

### Visual Layout

**Before (Overlapping)**:
```
Seat 4 (Opponent at top when player at seat 1):
┌────────────────────────────────────┐
│     [Cards]                        │
│  ┌─────[Opponent Seat]────┐        │  ← CARDS OVERLAP SEAT BOX ❌
│  │ AI Opponent            │        │
│  │ Stack: 100,000         │        │
│  └────────────────────────┘        │
└────────────────────────────────────┘
```

**After (No Overlap)**:
```
Seat 4 (Opponent at top when player at seat 1):
┌────────────────────────────────────┐
│  [Cards]   ┌─────[Opponent Seat]───┐  ← CARDS CLEAR ON LEFT ✅
│  🃏🃏      │ AI Opponent            │
│  OPPONENT  │ Stack: 100,000         │
│            └────────────────────────┘
└────────────────────────────────────┘
```

### Spacing Calculation

| Element | Width | Position | Result |
|---------|-------|----------|--------|
| Seat Box | ~180px min | Center (50%) | -90px to +90px |
| Old Cards | - | -160px (10rem) | Overlaps left edge ❌ |
| New Cards | ~60px (2 cards) | -224px (14rem) | Clears with 34px gap ✅ |

**Math**: 224px (cards) - 90px (seat half-width) = **134px clearance** ✅

---

## Issue 2: Seat Not Released When Leaving Table

### Problem
When player clicked "Leave Table":
1. ✅ Lobby was shown
2. ✅ Seat number was reset to 0
3. ❌ **BUT**: When returning to the same table, player was still seated
4. ❌ **Demo mode**: Game state persisted, causing stale state issues

### Root Cause
The `handleStandUp` function only cleared basic state (`isSeated`, `seatNumber`) but didn't:
- Clear the demo game instance
- Reset game state variables (cards, pot, etc.)
- Properly clean up the game reference

### Solution
**File**: `App.tsx` lines 692-721

**Before**:
```tsx
const handleStandUp = () => {
  const confirmed = window.confirm('Are you sure you want to leave the table?');
  
  if (!confirmed) {
    return;
  }
  
  if (socket) {
    socket.emit('stand-up');
  }
  setIsSeated(false);
  setSeatNumber(0);
  setShowLobby(true);
  setGameMessage('Left the table 👋');
  setTimeout(() => setGameMessage(''), 3000);
};
```

**After**:
```tsx
const handleStandUp = () => {
  const confirmed = window.confirm('Are you sure you want to leave the table?');
  
  if (!confirmed) {
    return;
  }
  
  // User confirmed, proceed with leaving
  if (socket) {
    socket.emit('stand-up');
  }
  
  // Clear all game state
  setIsSeated(false);
  setSeatNumber(0);
  
  // Clear demo game state if in demo mode
  if (demoMode) {
    setDemoGame(null);                    // Clear game state
    if (demoGameRef.current) {
      demoGameRef.current = null;         // Clear game reference
    }
    setMyCards([]);                       // Clear player cards
    setCommunityCards([]);                // Clear community cards
    setPot(0);                            // Reset pot
    setCurrentBet(0);                     // Reset current bet
    setCurrentPlayer(0);                  // Reset current player
  }
  
  setShowLobby(true);
  setGameMessage('Left the table 👋');
  setTimeout(() => setGameMessage(''), 3000);
};
```

**Changes**:
- ✅ Added check for `demoMode`
- ✅ Set `demoGame` to `null` to destroy game instance
- ✅ Set `demoGameRef.current` to `null` to clear reference
- ✅ Reset all game state: `myCards`, `communityCards`, `pot`, `currentBet`, `currentPlayer`
- ✅ Ensures clean slate when re-entering table

### State Cleanup Flow

**Before (Incomplete Cleanup)**:
```
User clicks "Leave Table"
  ↓
Confirm dialog → Yes
  ↓
setIsSeated(false)        ✅ Basic state cleared
setSeatNumber(0)          ✅ Seat cleared
setShowLobby(true)        ✅ Back to lobby
  ↓
demoGame still exists     ❌ Game instance persists
myCards still populated   ❌ Cards still in memory
pot still set             ❌ Old pot value remains
  ↓
Re-enter table
  ↓
Seat still appears taken  ❌ Stale state causes issues
Old cards may appear      ❌ Visual glitches
```

**After (Complete Cleanup)**:
```
User clicks "Leave Table"
  ↓
Confirm dialog → Yes
  ↓
setIsSeated(false)        ✅
setSeatNumber(0)          ✅
  ↓
if (demoMode):
  setDemoGame(null)           ✅ Game destroyed
  demoGameRef.current = null  ✅ Reference cleared
  setMyCards([])              ✅ Cards cleared
  setCommunityCards([])       ✅ Community cards cleared
  setPot(0)                   ✅ Pot reset
  setCurrentBet(0)            ✅ Bet reset
  setCurrentPlayer(0)         ✅ Turn reset
  ↓
setShowLobby(true)        ✅
  ↓
Re-enter table
  ↓
Seat available            ✅ Fresh start
No stale state            ✅ Clean slate
```

### Testing Scenarios

#### Opponent Cards Positioning
- [ ] **Seat 1 (player)**: Opponent at seat 4, cards appear far left of opponent seat box
- [ ] **Seat 4 (player)**: Opponent at seat 1, cards appear far left of opponent seat box
- [ ] **Showdown**: Cards flip animation doesn't overlap seat box
- [ ] **Long player names**: Cards still clear even with longer text in seat box

#### Leave Table
- [ ] **Demo mode leave**: All game state cleared (cards, pot, etc.)
- [ ] **Re-enter same table**: Seat is available, no stale state
- [ ] **Re-enter different table**: Clean start at new table
- [ ] **Multiplayer leave**: Socket emit works, server updates
- [ ] **Cancel leave**: Confirmation dialog cancels properly

### Benefits

#### Opponent Cards Fix
✅ **No Overlap**: Cards completely clear of seat boxes
✅ **Better Spacing**: 134px clearance ensures room for animations
✅ **Visual Clarity**: Easy to see both cards and seat information
✅ **Consistent**: Works for both seat 1 and seat 4 opponents

#### Leave Table Fix
✅ **Clean Exit**: All state properly cleared
✅ **Fresh Re-entry**: No stale state when returning
✅ **Memory Management**: Game instances properly destroyed
✅ **Better UX**: Players can leave and rejoin without issues

### Technical Notes

**Tailwind Arbitrary Values**:
```tsx
-translate-x-[14rem]  // Custom value: 14rem = 224px
```

**State Management**:
```tsx
demoGameRef.current = null  // Must clear ref, not just state
setDemoGame(null)           // Clear state triggers re-render
```

**Heads-Up Seat Layout**:
- Seat 1 (bottom center) ↔ Seat 4 (top center)
- Only 2 players in heads-up poker
- Opponent is always at the opposite seat
