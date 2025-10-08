# 💼 Session Stats Feature - Track Your Performance

## New Component Created: SessionStats.tsx

Shows real-time session performance at the top of the Players List panel.

### Features

**1. Buy-in Tracking**
- Shows initial amount brought to the table
- Displays both SHIDO and USD values

**2. Current Stack Display**
- Real-time stack amount
- Converted to USD value
- Color-coded in emerald green

**3. Profit/Loss Calculation**
- **Green** = Winning (shows with + sign)
- **Red** = Losing
- **Gray** = Break even
- Shows percentage gain/loss
- Glowing text effect for winners/losers

**4. USD Conversion**
- Default rate: 1 SHIDO = $0.00015 USD
- Can be updated with live exchange rates
- All amounts show USD equivalent

**5. Performance Indicator**
- 📈 Winning
- ➖ Break Even  
- 📉 Losing

### Visual Design

**Futuristic Styling:**
- Glass morphism with backdrop blur
- Green gradient background (emerald theme)
- Glowing green borders
- Box shadow effects
- Matches action button aesthetic

### Where It Appears

**Location:** Top of "Players at Table" panel (right side)

**Visibility:** Only shows when you have bought in (sessionBuyIn > 0)

### Example Display

```
💼 SESSION STATS
─────────────────
Buy-in:           10,000 SHIDO
                  $1.50 USD

Current Stack:    15,500 SHIDO
                  $2.33 USD
─────────────────
P/L:              +5,500 SHIDO
                  +55.0% • $0.83 USD

Performance:      📈 Winning
```

### Technical Implementation

**State Management:**
- `sessionBuyIn` - Tracks initial stack when joining
- Set once when game starts
- Persists for entire session
- Current stack pulled from player data in real-time

**Props:**
- `buyIn` - Initial amount
- `currentStack` - Current player stack
- `shidoToUsd` - Exchange rate (optional, defaults to 0.00015)

### Color Coding

- **Border/Header:** Emerald green with glow
- **Buy-in:** Neutral slate
- **Current Stack:** Emerald (money green)
- **Profit:** Bright green with glow
- **Loss:** Red with glow
- **Break Even:** Neutral gray

### Auto-calculation

- **P/L Amount:** currentStack - buyIn
- **P/L Percentage:** ((P/L / buyIn) * 100)%
- **USD Values:** SHIDO amount × exchange rate

## Files Modified

1. **SessionStats.tsx** (NEW) - Component with all stats logic
2. **PlayersList.tsx** - Added SessionStats import and display
3. **App.tsx** - Added `sessionBuyIn` state tracking

## Result

Players can now track their session performance at a glance:
✅ See how much they started with
✅ Monitor current stack in real-time
✅ Know exactly how much they're up/down
✅ View everything in both SHIDO and USD
✅ Quick visual feedback (green = winning, red = losing)

Perfect for serious players who want to track their profits! 💰📊
