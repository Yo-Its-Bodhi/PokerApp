# 🎰 Side Pot System Implementation

## Overview
When a player goes all-in with less chips than others in the hand, side pots are automatically created to ensure fair distribution of winnings.

---

## How Side Pots Work

### Scenario: Player Goes All-In
```
Player 1: All-in with 50K
Player 2: Calls with 100K
Player 3: Calls with 100K

Result:
Main Pot: 150K (50K × 3 players)
  - Eligible: Players 1, 2, 3
  
Side Pot: 100K (50K × 2 players)
  - Eligible: Players 2, 3 only
  - Player 1 cannot win this pot
```

### Visual Display
**Main Pot** (large, center):
- Full chip stack visualization (12 stacked chips max)
- Large text showing amount
- "POT" label

**Side Pots** (smaller, below main):
- Mini chip stacks (5 chips max)
- Smaller text (text-lg vs text-3xl)
- "Side Pot 1", "Side Pot 2" labels
- Shows eligible player count
- Cyan color scheme (different from main pot's blue)

---

## Implementation Details

### 1. Game State Interface
```typescript
export interface MultiPlayerGameState {
  pot: number; // Total pot
  sidePots?: Array<{ 
    amount: number; 
    eligiblePlayers: number[] // Seat numbers
  }>;
  // ... other fields
}
```

### 2. Side Pot Calculation
**Method**: `calculateSidePots()` in `MultiPlayerPokerGame.ts`

**Logic**:
1. Find all players who are all-in
2. Sort players by bet amount (ascending)
3. Create pot for each bet level
4. Track which players are eligible for each pot

**Example Calculation**:
```typescript
// Players: 
// Seat 1: 30K (all-in)
// Seat 2: 80K (all-in)
// Seat 3: 100K
// Seat 4: 100K (folded)

// Side Pots:
[
  { amount: 120K, eligiblePlayers: [1, 2, 3] }, // Main pot (30K × 4)
  { amount: 150K, eligiblePlayers: [2, 3] },    // Side pot (50K × 3)
  { amount: 40K, eligiblePlayers: [3] }          // Side pot 2 (20K × 2)
]
```

### 3. State Update Integration
**Method**: `updateState()` in `MultiPlayerPokerGame.ts`

```typescript
private updateState(): void {
  this.calculateSidePots(); // Calculate before sending update
  this.onStateUpdate(this.state);
}
```

**Called After Every**:
- Player action (call, raise, all-in)
- Street change (flop, turn, river)
- Hand completion

### 4. Component Props Flow
```
MultiPlayerPokerGame
  ↓ (onStateUpdate)
App.tsx (demoGame.getState().sidePots)
  ↓ (prop)
RealisticTable (sidePots)
  ↓ (prop)
PotDisplay (sidePots)
```

---

## Visual Design

### Main Pot
```
      [Chip]
      [Chip]
      [Chip]
      [Chip]
    
    💎 250,000 💎
       POT
```

### With Side Pots
```
      [Chip]
      [Chip]
      [Chip]
      [Chip]
    
    💎 150,000 💎
       POT

┌──────────────┐  ┌──────────────┐
│   80,000     │  │   20,000     │
│ Side Pot 1   │  │ Side Pot 2   │
│  3 players   │  │  2 players   │
│ [==] [==]    │  │ [==]         │
└──────────────┘  └──────────────┘
```

### Styling Differences
| Feature | Main Pot | Side Pots |
|---------|----------|-----------|
| **Size** | 3xl text | lg text |
| **Chip Stacks** | Up to 12 | Up to 5 |
| **Color** | Blue gradient | Cyan gradient |
| **Border** | Blue glow | Cyan glow |
| **Label** | "POT" | "Side Pot 1" |
| **Position** | Center | Below main, flex row |

---

## Code Locations

### 1. MultiPlayerPokerGame.ts (Lines ~145-210)
```typescript
// Interface update
sidePots?: Array<{ amount: number; eligiblePlayers: number[] }>;

// Calculate method
private calculateSidePots(): void {
  // ... calculation logic
}

// Update wrapper
private updateState(): void {
  this.calculateSidePots();
  this.onStateUpdate(this.state);
}
```

### 2. RealisticTable.tsx (Lines ~14, ~43, ~455)
```typescript
// Props interface
sidePots?: Array<{ amount: number; eligiblePlayers: number[] }>;

// Component props
const RealisticTable: React.FC<RealisticTableProps> = ({
  // ...
  sidePots = [],
  // ...
})

// Pass to PotDisplay
<PotDisplay 
  mainPot={pot} 
  sidePots={sidePots?.map(sp => ({ 
    amount: sp.amount, 
    players: sp.eligiblePlayers.map(String) 
  }))} 
  shouldPulse={shouldPulsePot} 
/>
```

### 3. PotDisplay.tsx (Lines ~6, ~100-143)
```typescript
// Props
sidePots?: Array<{ amount: number; players: string[] }>;

// Render side pots
{sidePots.length > 0 && (
  <div className="mt-6 flex gap-4 justify-center">
    {sidePots.map((sidePot, index) => (
      <div className="glass-card">
        {/* Smaller display */}
      </div>
    ))}
  </div>
)}
```

### 4. App.tsx (Line ~2258)
```typescript
<RealisticTable
  pot={pot}
  sidePots={demoMode && demoGame ? demoGame.getState().sidePots : []}
  // ... other props
/>
```

---

## Edge Cases Handled

### 1. No All-In Players
- `sidePots = []`
- Only main pot displays
- No side pot UI shown

### 2. Single All-In Player
- One main pot (all players)
- One side pot (remaining players)
- Visual: Main + 1 side pot below

### 3. Multiple All-Ins (Different Amounts)
- Multiple side pots created
- Each smaller than previous
- Visual: Main + 2+ side pots in row

### 4. All-In vs All-In
- Main pot includes both all-ins
- Side pot for larger stack vs remaining
- Correct eligibility tracking

### 5. Folded Players
- Excluded from side pot calculations
- Don't affect pot amounts
- Not listed in eligiblePlayers

---

## Testing Checklist

- [ ] Player goes all-in → Main pot created
- [ ] Side pot displays smaller than main pot
- [ ] Side pot shows correct amount
- [ ] Side pot shows eligible player count
- [ ] Multiple all-ins create multiple side pots
- [ ] Side pots arranged horizontally below main
- [ ] Folded players excluded from side pots
- [ ] Main pot + side pots total equals full pot
- [ ] Side pot colors use cyan (not blue)
- [ ] Mini chip stacks display in side pots
- [ ] Side pot labels show "Side Pot 1", "Side Pot 2"
- [ ] Console logs show side pot calculation

---

## Future Enhancements

### Potential Improvements:
1. **Winner Highlighting** - Show which player won which pot
2. **Animation** - Split animation when pots divide
3. **Tooltips** - Hover to see eligible players by name
4. **Sound Effects** - Different sound for side pot creation
5. **Color Coding** - Different colors for each side pot
6. **Pot Distribution** - Show chip movement on win

---

## Example Scenarios

### Scenario 1: One All-In
```
Before Action:
Player 1 (You): 40K stack
Player 2: 100K stack  
Player 3: 100K stack
Player 4: folded

Action:
Player 1 goes all-in (40K)
Player 2 calls (40K)
Player 3 calls (40K)

Result:
Main Pot: 120K
  Eligible: Players 1, 2, 3
  
No side pots (all matched)
```

### Scenario 2: Multiple All-Ins
```
Before Action:
Player 1: 30K stack
Player 2: 80K stack
Player 3: 150K stack
Player 4: 150K stack

Actions:
Player 1 all-in (30K)
Player 2 all-in (80K)
Player 3 calls (80K)
Player 4 calls (80K)

Result:
Main Pot: 120K (30K × 4)
  Eligible: Players 1, 2, 3, 4
  
Side Pot 1: 150K (50K × 3)
  Eligible: Players 2, 3, 4
  
Side Pot 2: 140K (70K × 2)
  Eligible: Players 3, 4
  
Display:
     💎 120,000 💎
         POT

  ┌──────────┐  ┌──────────┐
  │ 150,000  │  │ 140,000  │
  │ Side 1   │  │ Side 2   │
  └──────────┘  └──────────┘
```

---

**Status**: ✅ **FULLY IMPLEMENTED**

**Last Updated**: October 8, 2025
