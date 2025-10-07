# Show/Muck Feature & Opponent Card Positioning

## Feature 1: Show or Muck Cards After Fold

### Overview
When a player folds, they now get the option to either **SHOW** their cards (revealing their hand to opponents) or **MUCK** them (keep them hidden). This adds strategic depth and psychological gameplay elements to poker.

### Implementation

#### 1. Game State Updates
**File**: `HeadsUpPokerGame.ts`

Added two new state properties:
```typescript
interface DemoGameState {
  // ... existing properties
  awaitingShowMuckDecision: boolean; // Waiting for player to show or muck after fold
  showMyCardsAfterFold: boolean; // Whether to reveal player's cards after folding
}
```

#### 2. Fold Action Modified
**File**: `HeadsUpPokerGame.ts` lines 475-488

**Before**:
```typescript
case 'fold':
  playerFolded = true;
  this.endHand(false); // Opponent wins immediately
  return;
```

**After**:
```typescript
case 'fold':
  playerFolded = true;
  
  // Set state to await show/muck decision
  this.state.awaitingShowMuckDecision = true;
  this.state.gameLog.push({
    action: 'You folded',
    type: 'action',
    timestamp: Date.now()
  });
  this.onStateUpdate(this.state);
  return; // Don't end hand yet - wait for decision
```

#### 3. New Public Method
**File**: `HeadsUpPokerGame.ts` lines 130-161

```typescript
public handleShowMuckDecision(showCards: boolean) {
  if (!this.state.awaitingShowMuckDecision) return;
  
  this.state.awaitingShowMuckDecision = false;
  this.state.showMyCardsAfterFold = showCards;
  
  if (showCards) {
    this.state.gameLog.push({
      action: '🃏 You chose to SHOW your cards',
      type: 'info',
      timestamp: Date.now()
    });
  } else {
    this.state.gameLog.push({
      action: '🙈 You chose to MUCK your cards',
      type: 'info',
      timestamp: Date.now()
    });
  }
  
  this.onStateUpdate(this.state);
  
  // End hand after short delay
  setTimeout(() => {
    this.endHand(false); // Opponent wins
  }, 1500);
}
```

#### 4. Actions Component UI
**File**: `Actions.tsx` lines 39-72

Added new UI section that appears when `awaitingShowMuckDecision` is true:

```tsx
{/* Show/Muck Decision - After Fold */}
{awaitingShowMuckDecision && onShowMuck && (
  <div className="space-y-3">
    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50">
      <p className="text-purple-300 text-center font-bold text-lg mb-1">
        🃏 You Folded
      </p>
      <p className="text-slate-300 text-center text-sm">
        Do you want to show your cards or muck them?
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <button onClick={() => onShowMuck(true)} className="...">
        🃏 SHOW
      </button>
      
      <button onClick={() => onShowMuck(false)} className="...">
        🙈 MUCK
      </button>
    </div>

    <p className="text-slate-400 text-xs text-center">
      Showing your cards reveals your play style. Mucking keeps them hidden.
    </p>
  </div>
)}
```

**Visual Design**:
- 🃏 **SHOW button**: Green gradient with emerald highlights
- 🙈 **MUCK button**: Red/orange gradient
- Purple-pink themed notification banner
- Helpful tooltip about strategic implications

#### 5. App.tsx Integration
**File**: `App.tsx`

Added handler function (lines 590-595):
```typescript
const handleShowMuck = (showCards: boolean) => {
  if (demoMode && demoGameRef.current) {
    console.log('[ShowMuck] Player chose to', showCards ? 'SHOW' : 'MUCK', 'cards');
    demoGameRef.current.handleShowMuckDecision(showCards);
  }
};
```

Updated Actions component props (lines 1142-1149):
```tsx
<Actions 
  onAction={handleAction} 
  onStandUp={handleStandUp}
  onRebuy={handleRebuy}
  onShowMuck={handleShowMuck}  // NEW
  // ... other props
  awaitingShowMuckDecision={demoMode ? 
    (demoGame?.getState().awaitingShowMuckDecision || false) : 
    false
  }
/>
```

### User Flow

1. **Player Folds** → Click FOLD button
2. **Decision UI Appears** → Purple banner: "🃏 You Folded"
3. **Choose Action**:
   - **SHOW**: Reveals cards to opponent, logs "🃏 You chose to SHOW your cards"
   - **MUCK**: Keeps cards hidden, logs "🙈 You chose to MUCK your cards"
4. **Hand Ends** → After 1.5 second delay, opponent wins pot
5. **Next Hand** → New hand starts automatically

### Strategic Considerations

**When to SHOW**:
- ✅ Bluffing successfully - intimidate opponent
- ✅ Strong fold - show discipline
- ✅ Build table image
- ✅ Mental game advantage

**When to MUCK**:
- ✅ Weak hand - don't reveal weaknesses
- ✅ Keep strategy hidden
- ✅ Avoid giving reads
- ✅ Professional standard play

---

## Feature 2: Opponent Card Positioning for Seat 4

### Problem
When the player sits at seat 4 (top seat), opponent cards at showdown were positioned to the RIGHT (`translate-x-32`), which made them appear in an awkward position.

### Solution
**File**: `Table.tsx` lines 323-330

**Before**:
```tsx
mySeat === 4 ? 'bottom-4 left-1/2 translate-x-32' :  // Wrong - to the RIGHT
```

**After**:
```tsx
mySeat === 4 ? 'bottom-4 left-1/2 -translate-x-32' :  // Correct - to the LEFT
```

### Positioning Logic

```tsx
{showOpponentCards && opponentCards && opponentCards.length > 0 && (
  <div className={`absolute z-30 ${
    // Position opposite to player's seat
    mySeat === 1 ? 'top-8 left-1/2 -translate-x-32' :        // Opponent at TOP-LEFT
    mySeat === 4 ? 'bottom-4 left-1/2 -translate-x-32' :     // Opponent at BOTTOM-LEFT ✅
    'top-8 left-1/2 -translate-x-32'                         // Default (TOP-LEFT)
  }`}>
```

**Visual Layout**:
```
Seat 4 (Player at TOP):
┌─────────────────────────────────┐
│  Player Cards      [Opponent]   │  ← Opponent at BOTTOM-LEFT
│                                  │
│         Community Cards          │
│                                  │
│      [Player]                    │  ← Player at TOP
└─────────────────────────────────┘

Seat 1 (Player at BOTTOM):
┌─────────────────────────────────┐
│      [Opponent]                  │  ← Opponent at TOP-LEFT
│                                  │
│         Community Cards          │
│                                  │
│  Opponent Cards    [Player]      │  ← Player at BOTTOM
└─────────────────────────────────┘
```

### Opponent Card Display Features
- ✅ Red "OPPONENT'S HAND" label
- ✅ Flip animation when revealed
- ✅ Positioned to the left of seat boxes
- ✅ Only shown at showdown (`showOpponentCards = true`)

---

## Testing Scenarios

### Show/Muck Feature
1. ✅ **Pre-flop fold** → Shows decision UI → Choose SHOW → Cards stay visible, game log updates
2. ✅ **Post-flop fold** → Shows decision UI → Choose MUCK → Cards hidden, game log updates
3. ✅ **Busted player** → Rebuy UI takes priority over show/muck
4. ✅ **Normal actions hidden** → Only show/muck buttons visible during decision

### Opponent Card Positioning
1. ✅ **Seat 1 (player at bottom)** → Opponent cards appear at TOP-LEFT
2. ✅ **Seat 4 (player at top)** → Opponent cards appear at BOTTOM-LEFT
3. ✅ **Showdown required** → Cards only show when `showOpponentCards = true`
4. ✅ **Flip animation** → Cards flip face-up smoothly

---

## Benefits

### Show/Muck Feature
- 🎭 **Psychological Warfare**: Choose when to reveal information
- 🎯 **Strategic Depth**: Adds layer of decision-making after fold
- 📊 **Table Image**: Control how opponents perceive your play
- 🎮 **Professional Feel**: Standard poker practice implemented

### Opponent Card Positioning
- 👁️ **Clear Visibility**: Opponent cards easy to see at showdown
- 🎨 **Better Layout**: Cards positioned logically relative to seats
- 🎯 **No Overlap**: Cards don't interfere with player seat boxes
- ✨ **Smooth UX**: Consistent positioning across all seat configurations
