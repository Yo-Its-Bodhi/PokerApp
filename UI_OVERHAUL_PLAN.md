# Poker UI Overhaul Implementation Plan

## Overview
Massive UI redesign to create a modern, immersive poker experience with:
- Glass morphism design
- Realistic chip stacks
- Advanced animations
- Better game state visibility

## Phase 1: Critical Fixes + Foundation (START HERE)
**Time Estimate: 2-3 hours**

### 1.1 Fix Timer Bug ✅ PRIORITY
- [ ] Fix: Game stops after 2nd timer expiry
- [ ] Ensure AI continues after human timeout
- [ ] Test: Timer forces action and game continues

### 1.2 Folded Player Fading ⭐ HIGH IMPACT
- [ ] Add `opacity-40` to folded players
- [ ] Grayscale filter on folded player cards
- [ ] Subtle red tint on fold
- [ ] Keep chip stack visible but faded

### 1.3 Last Action Labels
- [ ] Add action state to player object
- [ ] Display under each player:
  - "RAISED $60" (yellow)
  - "CALLED" (green)  
  - "FOLDED" (red, faded)
  - "CHECKED" (gray)
- [ ] Clear on new betting round

### 1.4 Better Dealer Button
- [ ] Make dealer chip glow
- [ ] Add subtle animation/pulse
- [ ] Increase size slightly
- [ ] Add gold/yellow accent

---

## Phase 2: Visual Chip System
**Time Estimate: 3-4 hours**

### 2.1 Create ChipStack Component
```typescript
interface ChipStackProps {
  amount: number; // Player's stack
  position: 'front' | 'bet'; // In front of player or in betting area
}
```

### 2.2 Chip Denominations & Colors
- White chips: $100
- Red chips: $500
- Green chips: $1,000
- Black chips: $5,000

### 2.3 Visual Stack Height
- Calculate chip count by denomination
- Stack vertically with slight offset
- Max 10 chips per stack, then start new column
- 3D perspective with shadows

### 2.4 Bet Area Chips
- Smaller chip stacks in front of each player
- Shows current bet in round
- Different from main stack

---

## Phase 3: Card Display Redesign
**Time Estimate: 2-3 hours**

### 3.1 Angled Card Display
- [ ] Rotate cards -5° and +5° for overlap effect
- [ ] Add perspective transform
- [ ] Subtle shadow underneath
- [ ] Cards appear "held" not flat

### 3.2 Player Info Layout
```
 ┌─────────────┐
 │   🂡  🂱    │  ← Angled cards (largest)
 │             │
 │  PlayerName │  ← Name (medium)
 │   $12,450   │  ← Stack (smaller)
 │   RAISED $60│  ← Last action (smallest, colored)
 └─────────────┘
```

### 3.3 Card Back Logo Display
- [ ] Ensure logo visible during shuffling
- [ ] Add rotation during deal animation
- [ ] Logo should be prominent

---

## Phase 4: Animations System
**Time Estimate: 4-5 hours**

### 4.1 Card Deal Animation
- [ ] Cards "fly" from dealer position
- [ ] Stagger timing (150ms between cards)
- [ ] Rotation during flight
- [ ] Landing "thunk" effect
- [ ] Logo visible on card backs during deal

### 4.2 Community Card Flip
- [ ] 3D flip animation
- [ ] Sound effect on flip
- [ ] Slight bounce on land
- [ ] Flop: Deal face-down, then flip all 3
- [ ] Turn/River: Deal face-down, immediate flip

### 4.3 Chip Bet Animations
- [ ] Chips slide from player stack to bet area
- [ ] Stack collapses as chips move
- [ ] Sound effect (chip clink)
- [ ] Smooth easing function

### 4.4 Pot Collection Animation
- [ ] All chips slide to winner
- [ ] Confetti/particles on big wins
- [ ] "+$X" popup text
- [ ] Winner stack grows

### 4.5 Winning Hand Highlight
- [ ] Glow effect on winning cards
- [ ] Pulse animation
- [ ] Golden border

---

## Phase 5: Action Buttons Redesign
**Time Estimate: 2-3 hours**

### 5.1 Glass Morphism Buttons
```css
backdrop-filter: blur(10px);
background: rgba(0, 0, 0, 0.3);
border: 1px solid rgba(255, 255, 255, 0.18);
```

### 5.2 Integrated Slider in Raise Button
- [ ] Raise button expands on click
- [ ] Slider appears as overlay
- [ ] Shows: "RAISE TO $2,500"
- [ ] Smooth transitions
- [ ] Quick bet buttons: 1/3, 1/2, 3/4, Pot, 2x

### 5.3 Button States
- [ ] Hover: Slight scale + glow
- [ ] Active: Press down effect
- [ ] Disabled: Low opacity
- [ ] Sound on click

---

## Phase 6: Side Pots & Advanced Features
**Time Estimate: 3-4 hours**

### 6.1 Side Pot Visualization
```
       ┌──────────┐
       │ Side Pot │ ← $500 (Player A & B eligible)
       │   $500   │
       └──────────┘
       ┌──────────┐
       │ Main Pot │ ← $1,200 (All eligible)
       │  $1,200  │
       └──────────┘
```

### 6.2 Showdown Comparison
- [ ] Side-by-side hand display
- [ ] Highlight winning cards
- [ ] Show hand rankings
- [ ] "Your PAIR OF 7s beats ACE HIGH"

### 6.3 Player Stats Tooltip
Hover overlay:
```
┌──────────────────────┐
│ AI Alpha 🤖          │
│ ──────────────────── │
│ Hands: 45            │
│ Win Rate: 31%        │
│ Style: Aggressive    │
│ Biggest Pot: $3,200  │
└──────────────────────┘
```

---

## Phase 7: Chat & Layout
**Time Estimate: 1-2 hours**

### 7.1 Chat Repositioning
- [ ] Move to bottom-right corner
- [ ] 4 rows high max
- [ ] Glass morphism background
- [ ] Auto-hide after 10s of inactivity
- [ ] Expand on hover

### 7.2 Sound Control Panel
- [ ] Add speaker icon in header
- [ ] Click to open volume panel
- [ ] Individual sliders:
  - Master volume
  - Card sounds
  - Chip sounds
  - Turn notifications
  - Button clicks
  - Win celebrations
- [ ] Mute all button

---

## Phase 8: Sit Out & Polish
**Time Estimate: 2 hours**

### 8.1 Sit Out Feature
- [ ] "SIT OUT NEXT HAND" checkbox
- [ ] Player grayed out when sitting out
- [ ] Auto-post blinds
- [ ] Kick after 10 consecutive sit-outs
- [ ] "Sitting Out (3/10)" indicator

### 8.2 Final Polish
- [ ] Test all animations
- [ ] Performance optimization
- [ ] Mobile responsiveness check
- [ ] Accessibility (keyboard nav)
- [ ] Error handling

---

## Total Estimated Time: 20-26 hours

## Implementation Order (Strict):
1. Fix timer bug (CRITICAL)
2. Folded player fading (Quick win)
3. Last action labels (Quick win)
4. Better dealer button (Quick win)
5. Chip stack component
6. Card display redesign  
7. Basic animations (deal, bet, win)
8. Glass morphism buttons
9. Side pots
10. Advanced features
11. Chat/sound/polish

## Success Metrics:
- ✅ Game feels like sitting at real poker table
- ✅ Game state instantly clear at a glance
- ✅ Satisfying, professional animations
- ✅ Modern, sleek UI
- ✅ No performance issues
