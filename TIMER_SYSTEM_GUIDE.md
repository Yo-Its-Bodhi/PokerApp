# POKER TIMER SYSTEM - INTEGRATION GUIDE

## Overview
This guide shows how to integrate the comprehensive timer system into your Shido poker application.

## Files Created

1. **`server/src/timer-system.ts`** - Core timer logic engine
2. **`web/src/components/PlayerTimer.tsx`** - Dual-ring timer UI component  
3. **`web/src/components/PreAction.tsx`** - Pre-action checkbox interface

## Timer System Features

### ✅ Implemented Features

- **Per-Action Turn Timer**: 12-16s base depending on street
- **Time Bank System**: 75s per player, +5s every 15 hands, cap 90s
- **Dual-Ring Visualization**: Outer = base time, Inner = time bank
- **Auto-Actions**: Check/fold when timer expires
- **Pre-Action Queue**: Fold to any, Check/Fold, Call, Raise
- **Disconnect Handling**: 5s grace period
- **Auto Sit-Out**: After 2 timeouts in 3 hands
- **All-In Pause**: 2s mandatory pause
- **Street Resets**: Timer resets on new streets
- **Smooth Animations**: 100ms tick intervals, pulsing effects
- **Time Bank Button**: "+TIME" button when available
- **Visual Feedback**: Color transitions (cyan → yellow → orange → red)

## Integration Steps

### Step 1: Server-Side Setup

Add to your `server/src/server.ts`:

```typescript
import { PokerTimerSystem, DEFAULT_TIMER_CONFIG } from './timer-system';

// Initialize timer system
const timerSystem = new PokerTimerSystem(DEFAULT_TIMER_CONFIG);

// Listen for timer events
timerSystem.onEvent((event) => {
  console.log('Timer event:', event);
  
  switch (event.type) {
    case 'timer_start':
      // Broadcast to all clients that timer started
      io.to(tableId).emit('timer-update', {
        playerId: event.playerId,
        baseTimeMs: event.remainingMs,
        baseMaxMs: DEFAULT_TIMER_CONFIG.baseTurnTimerMs,
        timeBankMs: event.timeBankMs,
        timeBankMaxMs: DEFAULT_TIMER_CONFIG.timeBankCapMs,
        usingTimeBank: false
      });
      break;
      
    case 'timer_tick':
      // Broadcast remaining time
      io.to(tableId).emit('timer-tick', {
        playerId: event.playerId,
        remainingMs: event.remainingMs
      });
      break;
      
    case 'action_forced':
      // Player timed out - force action
      handlePlayerAction(event.playerId, event.forcedAction);
      break;
      
    case 'timebank_start':
      // Player is now using time bank
      io.to(tableId).emit('timer-update', {
        playerId: event.playerId,
        baseTimeMs: 0,
        baseMaxMs: DEFAULT_TIMER_CONFIG.baseTurnTimerMs,
        timeBankMs: event.timeBankMs,
        timeBankMaxMs: DEFAULT_TIMER_CONFIG.timeBankCapMs,
        usingTimeBank: true
      });
      break;
  }
});

// When a player's turn starts
function startPlayerTurn(playerId: string, street: string, isHeadsUp: boolean) {
  const streetType = street === 'PREFLOP' ? 'preflop' : 'postflop';
  timerSystem.startTurnTimer(playerId, streetType, isHeadsUp);
}

// On player action
socket.on('player-action', ({ action, amount }) => {
  timerSystem.stopTimer();
  // ... process action
});

// On new hand
function startNewHand() {
  timerSystem.onNewHand();
  // ... rest of hand logic
}

// On new street
function advanceToNextStreet() {
  timerSystem.onNewStreet();
  // ... deal community cards
}

// When player requests time bank
socket.on('request-timebank', () => {
  const success = timerSystem.consumeTimeBank(playerId);
  if (!success) {
    socket.emit('error', { message: 'No time bank available' });
  }
});

// Pre-action queueing
socket.on('queue-preaction', ({ action, amount }) => {
  timerSystem.queuePreAction(playerId, {
    type: action,
    raiseAmount: amount
  });
});

// Disconnect handling
socket.on('disconnect', () => {
  timerSystem.onPlayerDisconnect(playerId);
});

socket.on('reconnect', () => {
  timerSystem.onPlayerReconnect(playerId);
});

// Initialize player when they join
socket.on('sit-down', ({ seat, alias, avatarIndex }) => {
  timerSystem.initPlayer(playerId);
  // ... rest of sit-down logic
});
```

### Step 2: Client-Side Setup

Add to your `web/src/App.tsx`:

```typescript
import PreAction from './components/PreAction';

const [timerState, setTimerState] = useState<any>(null);
const [queuedAction, setQueuedAction] = useState<string | null>(null);

// Listen for timer updates
useEffect(() => {
  if (!socket) return;
  
  socket.on('timer-update', (state) => {
    setTimerState(state);
  });
  
  socket.on('timer-tick', ({ playerId, remainingMs }) => {
    if (timerState && timerState.playerId === playerId) {
      setTimerState(prev => ({
        ...prev,
        [prev.usingTimeBank ? 'timeBankMs' : 'baseTimeMs']: remainingMs
      }));
    }
  });
  
  return () => {
    socket.off('timer-update');
    socket.off('timer-tick');
  };
}, [socket, timerState]);

// Request time bank
const handleRequestTimeBank = () => {
  if (socket) {
    socket.emit('request-timebank');
  }
};

// Queue pre-action
const handleSetPreAction = (action: string, amount?: number) => {
  if (action === 'clear') {
    setQueuedAction(null);
    if (socket) socket.emit('queue-preaction', { action: null });
  } else {
    setQueuedAction(action);
    if (socket) socket.emit('queue-preaction', { action, amount });
  }
};
```

### Step 3: Update Table Component

Modify `web/src/components/Table.tsx`:

```typescript
import PlayerTimer from './PlayerTimer';

interface TableProps {
  // ... existing props
  timerState?: {
    playerId: string;
    baseTimeMs: number;
    baseMaxMs: number;
    timeBankMs: number;
    timeBankMaxMs: number;
    usingTimeBank: boolean;
  };
  onRequestTimeBank?: () => void;
}

// In the player rendering section, add timer above active player:
{player ? (
  <div className="relative">
    {/* Timer - shows when it's this player's turn */}
    {isActive && timerState && timerState.playerId === player.id && (
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-40">
        <PlayerTimer
          playerId={player.id}
          isActive={true}
          baseTimeMs={timerState.baseTimeMs}
          baseMaxMs={timerState.baseMaxMs}
          timeBankMs={timerState.timeBankMs}
          timeBankMaxMs={timerState.timeBankMaxMs}
          usingTimeBank={timerState.usingTimeBank}
          onRequestTimeBank={isMe ? onRequestTimeBank : undefined}
        />
      </div>
    )}
    
    {/* Avatar and player card... */}
  </div>
) : (
  // Empty seat...
)}
```

### Step 4: Add Pre-Action Interface

In your actions area:

```typescript
<PreAction
  onSetPreAction={handleSetPreAction}
  currentBet={currentBet}
  playerChips={balance}
  disabled={!isSeated || currentPlayer === myPlayerIndex}
/>
```

## Configuration

Default settings (modify in `timer-system.ts`):

```typescript
{
  baseTurnTimerMs: 15000,        // 15s default
  preflopTimerMs: 12000,         // 12s preflop
  postflopTimerMs: 16000,        // 16s postflop
  headsUpTimerMs: 10000,         // 10s heads-up
  initialTimeBankMs: 75000,      // 75s starting bank
  timeBankCapMs: 90000,          // 90s maximum
  timeBankAccrualMs: 5000,       // +5s per accrual
  timeBankAccrualHands: 15,      // Every 15 hands
  allInPauseMs: 2000,            // 2s all-in pause
  showdownWindowMs: 4000,        // 4s showdown
  disconnectGraceMs: 5000,       // 5s grace period
  autoSitOutTimeouts: 2,         // 2 timeouts
  autoSitOutHandsWindow: 3,      // In 3 hands window
  minActionDelayMs: 800,         // 0.8s min delay
  maxStreetDwellMs: 90000        // 90s per street max
}
```

## UI Components

### PlayerTimer Component

**Visual Design:**
- Dual concentric rings (SVG-based)
- Outer ring: Base turn timer (cyan → yellow → orange)
- Inner ring: Time bank (magenta → red)
- Center: Large countdown number
- Flash red border when switching to time bank
- "+TIME" button appears when base < 3s

**Props:**
- `playerId`: Player identifier
- `isActive`: Whether timer is running
- `baseTimeMs`: Remaining base time
- `baseMaxMs`: Maximum base time (for progress calculation)
- `timeBankMs`: Remaining time bank
- `timeBankMaxMs`: Maximum time bank
- `usingTimeBank`: Whether currently using time bank
- `onRequestTimeBank`: Callback for +TIME button

### PreAction Component

**Features:**
- 4 action buttons: Fold to Any, Check/Fold, Call, Raise
- Visual checkbox selection
- Raise amount input
- Queued action indicator with lightning bolt
- Auto-enables/disables based on game state

**Props:**
- `onSetPreAction`: Callback for action selection
- `currentBet`: Current bet to match
- `playerChips`: Player's chip stack
- `disabled`: Whether pre-actions are allowed

## Testing Checklist

- [ ] Timer starts when player's turn begins
- [ ] Timer counts down smoothly (100ms intervals)
- [ ] Color transitions at 50% and 25% remaining
- [ ] Time bank activates when base timer expires
- [ ] "+TIME" button works to manually activate time bank
- [ ] Auto-check/fold when timer fully expires
- [ ] Pre-actions queue and execute correctly
- [ ] Timer resets on new streets
- [ ] Time bank accrues every 15 hands
- [ ] Disconnect grace period works
- [ ] Auto sit-out after repeated timeouts
- [ ] All-in pause prevents instant actions
- [ ] Timer syncs across multiple clients

## Performance Notes

- Timer uses 100ms tick intervals for smooth UI
- Server-side authoritative - client just displays
- Minimal bandwidth (1 event per 100ms during active turn)
- Optimized SVG rendering with CSS animations
- No React re-renders except on actual time changes

## Future Enhancements

- Tournament mode with hand-for-hand
- Configurable presets per table type
- Sound effects for timer warnings
- Haptic feedback on mobile
- Timer statistics/analytics
- Multi-language support
- Accessibility improvements

## Support

The timer system is fully self-contained and can be dropped into any poker application. All state is managed server-side for security and consistency.

For questions or issues, refer to the inline documentation in:
- `server/src/timer-system.ts` (400+ lines, fully commented)
- `web/src/components/PlayerTimer.tsx` (200+ lines)
- `web/src/components/PreAction.tsx` (150+ lines)
