# Auto-Actions Fixed ✅

## Summary
Fixed the auto-action checkboxes to work correctly with proper logic.

## Changes Made

### 1. Renamed `autoCall` → `autoCheck`
- Changed all references throughout `App.tsx` and `Actions.tsx`
- Updated props, state variables, and function names

### 2. Fixed Logic

#### **Auto-Fold** (unchanged)
- ✅ Folds when facing **any bet** (currentBet > 0)
- Triggers on timer expiry if checkbox is enabled

#### **Auto-Check** (corrected behavior)
- ✅ Only checks when **no bet is required** (currentBet === 0)
- ❌ Will **NOT** call any bet amount (prevents accidental all-ins)
- Triggers on timer expiry or when turn starts if checkbox is enabled

### 3. Implementation Details

**Timer Expiry Logic (lines 999-1020 & 1032-1053):**
```typescript
if (autoFold && currentBet > 0) {
  // Auto-fold when facing any bet
  demoGameRef.current.handlePlayerAction('fold');
} else if (autoCheck && currentBet === 0) {
  // Auto-check when no bet (won't call any amount)
  demoGameRef.current.handlePlayerAction('check');
} else {
  // Default timeout behavior
  demoGameRef.current.handleTimerExpiry(seat);
}
```

**Turn Start Logic (line 1124):**
```typescript
if (autoCheck && currentBet === 0 && demoGameRef.current) {
  // Auto-check immediately when it becomes your turn and no bet
  demoGameRef.current.handlePlayerAction('check');
}
```

### 4. UI Updates

**Overlay Mode (after ALL IN button):**
- Label changed: "Auto-Call" → "Auto-Check"
- Cyan themed checkbox with uppercase tracking

**Compact Mode (side panel):**
- Label changed: "Check" (was already correct)
- Red checkbox for "Fold", Blue checkbox for "Check"

## Usage

### Auto-Fold
✅ **When to use:** When you want to automatically fold if someone bets
- Useful when you have a weak hand and don't want to waste time
- Safe - won't lose chips unless there's a bet

### Auto-Check  
✅ **When to use:** When you want to see free cards
- Only checks when you CAN check (no bet)
- Safe - will never call a bet (prevents going all-in accidentally)
- If someone bets, you'll get the timer to make a decision

## Example Scenarios

| Scenario | Auto-Fold Enabled | Auto-Check Enabled | Result |
|----------|-------------------|---------------------|---------|
| No bet (can check) | ❌ | ✅ | Auto-checks |
| Small bet (100) | ✅ | ❌ | Auto-folds |
| Big bet (5000) | ✅ | ❌ | Auto-folds |
| No bet (can check) | ✅ | ✅ | Auto-checks (check takes priority) |
| Any bet | ❌ | ✅ | Timer runs, no auto-action |

## Files Modified
1. `web/src/App.tsx` - State management and logic
2. `web/src/components/Actions.tsx` - UI and props

## Testing
✅ Auto-fold triggers when facing a bet
✅ Auto-check triggers only when no bet required
✅ Auto-check won't call any amount
✅ Both checkboxes work independently
✅ Labels updated correctly in both UI modes
