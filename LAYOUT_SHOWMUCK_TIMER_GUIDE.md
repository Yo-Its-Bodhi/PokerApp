# 🎯 Layout Update + Show/Muck System + Enhanced Timer - Implementation Guide

## ✅ Layout Changes - COMPLETED

### New Layout Structure:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (Wallet, Balance, Leaderboard, etc.)           │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────┬───────────────────────┐
│                                 │  ACTIONS PANEL        │
│                                 │  (Bet, Raise, Fold)   │
│                                 ├───────────────────────┤
│   POKER TABLE                   │                       │
│   (Full Height)                 │  PLAYER LIST /        │
│                                 │  FAIRNESS PANE        │
│                                 │  (Scrollable)         │
│                                 │                       │
└─────────────────────────────────┴───────────────────────┘
┌─────────────────────────────────┬───────────────────────┐
│  CHAT                           │  GAME LOG             │
│  (Messages)                     │  (Auto-scroll)        │
└─────────────────────────────────┴───────────────────────┘
```

### Changes Made:
- ✅ Actions panel moved to TOP RIGHT
- ✅ Player list below actions
- ✅ Game log moved next to chat at BOTTOM
- ✅ Table now full height on left side
- ✅ Game log has overflow-y-auto for scrolling

---

## 📋 Action Popup Component - TO IMPLEMENT

### Requirements:
- Show last action in small text box near table (top right corner)
- Display: "Player_Name: ACTION (amount)"
- Auto-fade after 3 seconds
- Examples:
  - "You: RAISE 50,000"
  - "AI Opponent: CALL 50,000"
  - "You: FOLD"

### Component Structure:

```typescript
// ActionPopup.tsx
interface ActionPopupProps {
  playerName: string;
  action: string;
  amount?: number;
  visible: boolean;
}

const ActionPopup: React.FC<ActionPopupProps> = ({ playerName, action, amount, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute top-4 right-4 z-50 glass-card px-4 py-2 border-2 border-brand-cyan/50 animate-fade-in">
      <div className="text-sm font-bold text-brand-cyan">
        {playerName}: <span className="text-brand-electric">{action.toUpperCase()}</span>
        {amount && <span className="text-brand-gold"> {amount.toLocaleString()}</span>}
      </div>
    </div>
  );
};
```

### Integration:
```typescript
// App.tsx
const [lastAction, setLastAction] = useState<{player: string, action: string, amount?: number} | null>(null);

const handleAction = (action: string, amount?: number) => {
  setLastAction({ player: 'You', action, amount });
  setTimeout(() => setLastAction(null), 3000);
  // ... existing action logic
};

// In render:
{lastAction && (
  <ActionPopup 
    playerName={lastAction.player}
    action={lastAction.action}
    amount={lastAction.amount}
    visible={!!lastAction}
  />
)}
```

---

## 🎲 Show/Muck System - COMPREHENSIVE IMPLEMENTATION

### Core Logic:

#### 1. When MUST Show (Mandatory Reveal):

```typescript
// ShowdownLogic.ts
interface ShowdownRules {
  allInCalled: boolean;        // Any all-in was called
  riverBetCalled: boolean;     // River bet was called
  isLastAggressor: boolean;    // Player who bet/raised last
  sidePotEligible: boolean;    // Eligible for side pot
}

function mustShow(player: Player, rules: ShowdownRules): boolean {
  // All-in with call - EVERYONE shows
  if (rules.allInCalled) return true;
  
  // River bet called - last aggressor must show first
  if (rules.riverBetCalled && rules.isLastAggressor) return true;
  
  // Side pot resolution - must show to claim
  if (rules.sidePotEligible) return true;
  
  return false;
}
```

#### 2. When CAN Muck (Optional):

```typescript
function canMuck(player: Player, gameState: GameState): boolean {
  // Folded - auto muck (no choice)
  if (player.folded) return true;
  
  // River checked through - may muck if beaten
  if (gameState.riverCheckedThrough && !gameState.isFirstToShow) return true;
  
  // Called river bet but aggressor showed winner - may muck
  if (gameState.riverBetCalled && !gameState.isLastAggressor && gameState.aggressorShowed) return true;
  
  return false;
}
```

### UI Component:

```typescript
// ShowMuckButtons.tsx
interface ShowMuckButtonsProps {
  mustShow: boolean;
  canMuck: boolean;
  onShow: () => void;
  onMuck: () => void;
}

const ShowMuckButtons: React.FC<ShowMuckButtonsProps> = ({ mustShow, canMuck, onShow, onMuck }) => {
  if (mustShow) {
    // Only show button (no muck option)
    return (
      <div className="glass-card p-4 border-2 border-yellow-500">
        <p className="text-yellow-400 text-sm mb-2">You must show your hand</p>
        <button 
          className="btn btn-primary w-full"
          onClick={onShow}
        >
          🃏 SHOW CARDS
        </button>
      </div>
    );
  }
  
  if (canMuck) {
    // Both options
    return (
      <div className="glass-card p-4 border-2 border-brand-cyan">
        <p className="text-brand-cyan text-sm mb-2">Showdown - Your Choice</p>
        <div className="flex gap-2">
          <button 
            className="btn btn-primary flex-1"
            onClick={onShow}
          >
            🃏 SHOW
          </button>
          <button 
            className="btn btn-secondary flex-1"
            onClick={onMuck}
          >
            🚫 MUCK
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};
```

### Game State Extensions:

```typescript
// HeadsUpPokerGame.ts - Add showdown state
interface DemoGameState {
  // ... existing fields
  showdownPhase: 'none' | 'awaiting-show' | 'complete';
  lastAggressor: 'player' | 'opponent' | null;
  allInOccurred: boolean;
  riverBetCalled: boolean;
  handsRevealed: {
    player: boolean;
    opponent: boolean;
  };
}

private async handleShowdown() {
  this.state.showdownPhase = 'awaiting-show';
  
  // Check if all-in occurred
  if (this.state.allInOccurred) {
    // Auto-reveal all hands
    this.revealAllHands();
    this.determineWinner();
    return;
  }
  
  // Check if river bet was called
  if (this.state.riverBetCalled) {
    // Last aggressor must show first
    if (this.state.lastAggressor === 'player') {
      this.state.gameLog.push({
        action: '⏳ Waiting for you to show or muck your hand...',
        type: 'system',
        timestamp: Date.now()
      });
      // Wait for player action (show/muck)
      return;
    } else {
      // AI shows first
      this.revealHand('opponent');
      this.state.gameLog.push({
        action: '🃏 Opponent shows their hand',
        type: 'action',
        timestamp: Date.now()
      });
      // Now player can muck or show
      return;
    }
  }
  
  // River checked through - first left of button shows
  const sbPlayer = this.state.players.find(p => p.isSmallBlind);
  if (sbPlayer?.isMe) {
    this.state.gameLog.push({
      action: '⏳ Checked to showdown - you show first or concede',
      type: 'system',
      timestamp: Date.now()
    });
  } else {
    // AI shows first
    this.revealHand('opponent');
  }
}

public playerShow() {
  this.revealHand('player');
  this.state.handsRevealed.player = true;
  
  this.state.gameLog.push({
    action: '🃏 You show your hand',
    type: 'action',
    timestamp: Date.now()
  });
  
  // If opponent already showed, determine winner
  if (this.state.handsRevealed.opponent) {
    this.determineWinner();
  } else if (this.state.lastAggressor === 'opponent') {
    // Opponent is last aggressor, must show
    this.revealHand('opponent');
    this.determineWinner();
  }
  
  this.onStateUpdate(this.state);
}

public playerMuck() {
  this.state.gameLog.push({
    action: '🚫 You muck your hand (concede)',
    type: 'action',
    timestamp: Date.now()
  });
  
  // Opponent wins by default
  this.awardPot('opponent', 'Player mucked - opponent wins');
  this.onStateUpdate(this.state);
}
```

---

## ⏱️ Enhanced Timer System - IMPLEMENTATION

### Requirements:
1. Timer ONLY shows for active player
2. Timer restarts on every turn
3. AI gets timer but no action buttons
4. Red glow when time bank active
5. Authoritative server-side (future)

### Current Implementation Status:

✅ **Already Implemented:**
- Timer callback system (`onTurnStart`)
- Timer restarts after AI action
- Timer restarts on new street
- Red glow for time bank
- Timer state passed to Table component

🔄 **To Enhance:**

```typescript
// PlayerTimer.tsx - Add "active player only" logic
interface PlayerTimerProps {
  playerId: string;
  isActive: boolean;
  isMyTurn: boolean;  // NEW: Only show timer if this is the current player
  baseTimeMs: number;
  baseMaxMs: number;
  timeBankMs: number;
  timeBankMaxMs: number;
  usingTimeBank: boolean;
  onRequestTimeBank?: () => void;
}

const PlayerTimer: React.FC<PlayerTimerProps> = ({
  playerId,
  isActive,
  isMyTurn,  // NEW
  baseTimeMs,
  baseMaxMs,
  timeBankMs,
  timeBankMaxMs,
  usingTimeBank,
  onRequestTimeBank
}) => {
  // Only render if it's this player's turn
  if (!isActive || !isMyTurn) return null;
  
  // ... existing timer logic
};
```

### Table.tsx Integration:

```typescript
// Only show timer for currentPlayer
<PlayerTimer
  playerId={player.seat.toString()}
  isActive={currentPlayer === player.seat}
  isMyTurn={currentPlayer === player.seat}  // NEW: Only active seat gets timer
  baseTimeMs={timerState?.baseTimeMs || 0}
  baseMaxMs={timerState?.baseMaxMs || 0}
  timeBankMs={timerState?.timeBankMs || 0}
  timeBankMaxMs={timerState?.timeBankMaxMs || 0}
  usingTimeBank={timerState?.usingTimeBank || false}
  onRequestTimeBank={onRequestTimeBank}
/>
```

### Action Button Gating:

```typescript
// Actions.tsx - Disable buttons when not your turn
interface ActionsProps {
  onAction: (action: string, amount?: number) => void;
  onStandUp: () => void;
  currentBet: number;
  playerStack: number;
  myBet: number;
  isMyTurn: boolean;  // NEW: Only enable buttons when it's your turn
}

const Actions: React.FC<ActionsProps> = ({
  onAction,
  onStandUp,
  currentBet,
  playerStack,
  myBet,
  isMyTurn  // NEW
}) => {
  // Disable all buttons if not my turn
  const buttonsDisabled = !isMyTurn;
  
  return (
    <div className="glass-card p-4 space-y-3">
      {!isMyTurn && (
        <div className="text-center text-sm text-gray-400 mb-3">
          ⏳ Waiting for other players...
        </div>
      )}
      
      <button 
        onClick={() => onAction('check')}
        disabled={buttonsDisabled || facingBet || isAllIn}
        className="btn btn-primary w-full"
      >
        CHECK
      </button>
      {/* ... other buttons with buttonsDisabled check */}
    </div>
  );
};
```

---

## 📊 Implementation Priority

### Phase 1: Layout (✅ DONE)
- [x] Actions panel to top right
- [x] Player list below actions
- [x] Game log next to chat
- [x] Table full height

### Phase 2: Action Popup (HIGH PRIORITY)
- [ ] Create ActionPopup component
- [ ] Add state tracking for last action
- [ ] Position in top-right of table
- [ ] Auto-fade after 3 seconds

### Phase 3: Show/Muck System (MEDIUM PRIORITY)
- [ ] Add showdown state to GameState
- [ ] Implement mustShow/canMuck logic
- [ ] Create ShowMuckButtons component
- [ ] Add show/muck handlers to HeadsUpPokerGame
- [ ] Update showdown() method
- [ ] Test all scenarios

### Phase 4: Enhanced Timer (LOW PRIORITY - Mostly Done)
- [x] Timer callback system
- [x] Red glow for time bank
- [ ] Hide timer for non-active players
- [ ] Add "waiting" message when not your turn
- [ ] Disable buttons when not your turn

### Phase 5: Authoritative Server (FUTURE)
- [ ] Server-side timer enforcement
- [ ] Turn sequence validation
- [ ] Clock skew compensation
- [ ] AI turn scheduling
- [ ] Timeout default actions

---

## 🧪 Testing Checklist

### Layout Testing:
- [x] Actions panel visible top right
- [x] Player list scrollable below actions
- [x] Game log auto-scrolls
- [x] Chat at bottom left
- [x] Table renders properly full height

### Action Popup Testing:
- [ ] Popup shows on player action
- [ ] Popup shows on AI action
- [ ] Popup fades after 3 seconds
- [ ] Multiple actions queue properly

### Show/Muck Testing:
- [ ] All-in scenario → auto-reveal (no muck)
- [ ] River bet called → aggressor must show
- [ ] River checked through → SB shows first
- [ ] Muck option when beaten
- [ ] Show option always available

### Timer Testing:
- [x] Timer starts on player turn
- [x] Timer hidden when not player's turn
- [x] AI turn shows timer but no buttons
- [x] Time bank triggers red glow
- [ ] Buttons disabled when not your turn

---

## Status Summary

**✅ COMPLETED:**
- Layout restructuring
- Timer callback system
- Red glow for time bank
- Game log scrolling

**🔄 IN PROGRESS:**
- Action popup component

**📋 PLANNED:**
- Show/Muck system
- Enhanced timer gating
- Authoritative server

---

## Next Steps

1. **Create ActionPopup component** - Quick win, high visibility
2. **Add "Not your turn" messaging** - Improves UX clarity
3. **Implement Show/Muck logic** - Core poker rules
4. **Test all scenarios** - Ensure no edge cases

