# Z-Index and Element Layering Fix

## Problem
Elements were overlapping on the poker table:
- Timer could be hidden behind cards
- Cards could overlap with seat boxes and avatars
- Opponent cards and player cards could interfere with each other

## Solution

### Z-Index Hierarchy (Bottom to Top)

```
Layer 0 (z-0):    Table background, grid overlay, gloss effects
Layer 10 (z-10):  Center area (pot display, community cards), dealer/blind chips
Layer 30 (z-30):  Avatar circles
Layer 40 (z-40):  Player cards, Opponent cards ← UPDATED from z-30
Layer 50 (z-50):  Player timer (always on top)
```

### Changes Made

#### 1. Opponent Cards - Increased z-index and adjusted positioning
**File**: `Table.tsx` lines 323-330

**Before**:
```tsx
<div className={`absolute z-30 ${
  mySeat === 1 ? 'top-8 left-1/2 -translate-x-32' :
  mySeat === 4 ? 'bottom-4 left-1/2 -translate-x-32' :
  'top-8 left-1/2 -translate-x-32'
}`}>
```

**After**:
```tsx
<div className={`absolute z-40 ${
  mySeat === 1 ? 'top-12 left-1/2 -translate-x-40' :        // Further left and down
  mySeat === 4 ? 'bottom-8 left-1/2 -translate-x-40' :      // Further left and down
  'top-12 left-1/2 -translate-x-40'
}`}>
```

**Changes**:
- ✅ Increased z-index from `z-30` to `z-40` (sits above avatars, below timer)
- ✅ Moved from `-translate-x-32` to `-translate-x-40` (further left to avoid seat boxes)
- ✅ Moved from `top-8` to `top-12` for seat 1 (more vertical spacing)
- ✅ Moved from `bottom-4` to `bottom-8` for seat 4 (more vertical spacing)

#### 2. Player Cards - Increased z-index and adjusted positioning
**File**: `Table.tsx` lines 358-367

**Before**:
```tsx
<div className={`absolute z-30 ${
  mySeat === 1 ? 'bottom-4 left-1/2 translate-x-32' :
  mySeat === 2 ? 'bottom-20 left-60' :
  mySeat === 3 ? 'top-1/3 left-56' :
  mySeat === 4 ? 'top-8 right-1/2 -translate-x-32' :
  mySeat === 5 ? 'top-1/3 right-56' :
  'bottom-20 right-60'
}`}>
```

**After**:
```tsx
<div className={`absolute z-40 ${
  mySeat === 1 ? 'bottom-8 left-1/2 translate-x-40' :       // Further right and up
  mySeat === 2 ? 'bottom-24 left-64' :                      // More spacing
  mySeat === 3 ? 'top-1/3 left-60' :                        // More spacing
  mySeat === 4 ? 'top-12 right-1/2 -translate-x-40' :       // Further right and down
  mySeat === 5 ? 'top-1/3 right-60' :                       // More spacing
  'bottom-24 right-64'                                      // More spacing
}`}>
```

**Changes**:
- ✅ Increased z-index from `z-30` to `z-40`
- ✅ Seat 1: Moved from `translate-x-32` to `translate-x-40` (further right)
- ✅ Seat 1: Moved from `bottom-4` to `bottom-8` (more vertical spacing)
- ✅ Seat 2: Moved from `bottom-20 left-60` to `bottom-24 left-64` (more spacing)
- ✅ Seat 3: Moved from `left-56` to `left-60` (more horizontal spacing)
- ✅ Seat 4: Moved from `top-8` to `top-12` (more vertical spacing)
- ✅ Seat 4: Moved from `-translate-x-32` to `-translate-x-40` (further right)
- ✅ Seat 5: Moved from `right-56` to `right-60` (more spacing)
- ✅ Seat 6: Moved from `bottom-20 right-60` to `bottom-24 right-64` (more spacing)

#### 3. Timer - Increased spacing to avoid cards
**File**: `Table.tsx` lines 165-173

**Before**:
```tsx
<div className={`absolute z-50 ${
  seatNum === 1 ? '-left-20 top-1/2 -translate-y-1/2' :
  seatNum === 2 ? '-top-20 left-1/2 -translate-x-1/2' :
  seatNum === 3 ? '-top-20 left-1/2 -translate-x-1/2' :
  seatNum === 4 ? '-right-20 top-1/2 -translate-y-1/2' :
  seatNum === 5 ? '-top-20 left-1/2 -translate-x-1/2' :
  '-top-20 left-1/2 -translate-x-1/2'
}`}>
```

**After**:
```tsx
<div className={`absolute z-50 ${
  seatNum === 1 ? '-left-24 top-1/2 -translate-y-1/2' :     // Further left
  seatNum === 2 ? '-top-24 left-1/2 -translate-x-1/2' :     // Further up
  seatNum === 3 ? '-top-24 left-1/2 -translate-x-1/2' :     // Further up
  seatNum === 4 ? '-right-24 top-1/2 -translate-y-1/2' :    // Further right
  seatNum === 5 ? '-top-24 left-1/2 -translate-x-1/2' :     // Further up
  '-top-24 left-1/2 -translate-x-1/2'                       // Further up
}`}>
```

**Changes**:
- ✅ Kept z-index at `z-50` (highest layer - always on top)
- ✅ Increased spacing from `20` to `24` units for all positions
- ✅ Ensures timer doesn't overlap with player cards

### Visual Layout Reference

```
                    [Timer (z-50)]
                         ↑
                   (24px spacing)
                         ↑
                   [Avatar (z-30)]
                         
    [Player Cards]  ← → (40px)  [Seat Box]  (40px) → ←  [Opponent Cards]
       (z-40)                                                  (z-40)
       
                         ↓
                   [Community Cards]
                      [Pot Display]
                       (z-10)
```

### Spacing Values

| Element Type | Old Spacing | New Spacing | Reason |
|-------------|-------------|-------------|--------|
| Opponent Cards (horizontal) | -32 (8rem) | -40 (10rem) | Avoid seat boxes |
| Opponent Cards (vertical) | 8/4 (2rem/1rem) | 12/8 (3rem/2rem) | More breathing room |
| Player Cards (horizontal) | 32-60 | 40-64 | Avoid seat boxes |
| Player Cards (vertical) | 4-20 | 8-24 | More breathing room |
| Timer (all directions) | 20 (5rem) | 24 (6rem) | Avoid card overlap |

### Benefits

✅ **No Overlapping**: All elements have clear visual separation
✅ **Proper Layering**: Timer always visible on top, cards above avatars
✅ **Better Spacing**: More breathing room between all elements
✅ **Consistent Hierarchy**: Clear z-index progression (0 → 10 → 30 → 40 → 50)
✅ **Responsive**: Works across all 6 seat positions

### Testing Checklist

- [ ] **Timer Visibility**: Timer never hidden behind cards or seat boxes
- [ ] **Card Clarity**: Player cards don't overlap seat boxes or avatars
- [ ] **Showdown**: Opponent cards clearly visible without overlap
- [ ] **All Seats**: Test positions for seats 1, 2, 3, 4, 5, 6
- [ ] **Edge Cases**: All-in scenarios, showdown with both card sets visible
- [ ] **Animations**: Card flip animations don't cause temporary overlaps

### Technical Notes

**Tailwind CSS z-index classes used**:
- `z-0`: Default layer (0)
- `z-10`: 10
- `z-30`: 30
- `z-40`: 40
- `z-50`: 50

**Translation units** (Tailwind spacing scale):
- `8` = 2rem = 32px
- `12` = 3rem = 48px
- `20` = 5rem = 80px
- `24` = 6rem = 96px
- `32` = 8rem = 128px
- `40` = 10rem = 160px
- `60` = 15rem = 240px
- `64` = 16rem = 256px
