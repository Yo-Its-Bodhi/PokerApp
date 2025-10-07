# UI/UX Improvements Implementation Plan

## Priority 1: Critical Fixes (Implementing Now)

### 1. ✅ Turn Notification Sound - DONE
- Changed from E5->C6 (659/1046 Hz) to C4->G4 (261/392 Hz)
- Much warmer, less trebly sound

### 2. Show/Muck Auto-Dismiss (3 seconds)
- Add useEffect with 3-second timeout
- Auto-muck if no decision made

### 3. Auto-Fold / Auto-Call Checkboxes
- Add to Actions component
- Persist in state
- Apply on timer timeout

### 4. Kicker Information in Game Log
- Update HeadsUpPokerGame.ts to show kicker cards
- Format: "Opponent wins with Two Pair, J's & 2's (K kicker)"

## Priority 2: Visual/Layout Fixes

### 5. Dealer/SB/BB Chip Position (Seat 4 Only)
- Move chips to bottom of player name box
- Only for opponent seat

### 6. Timer Padding Adjustment
- Seats 2,3,5,6: Increase top padding
- Keep seat 1,4 as-is

### 7. Button Styling Consistency
- All buttons match Leaderboard/Deposit/Disconnect style
- Consistent color themes

### 8. Panel Theme Changes
- Panels adapt to selected theme
- Light theme: Off-white or pale sky blue with dark blue outlines

## Priority 3: New Theme - Executive Black & Gold

### 9. Black & Gold Theme
- Base: Deep black (#0a0a0a, #121212)
- Accents: Metallic gold (#D4AF37, #FFD700)
- Highlights: Subtle gold borders and glows
- Executive, deluxe feel
- Applied to: panels, table, backgrounds

## Priority 4: Typography & Layout

### 10. Chat/Game Log Improvements
- Increase font size
- 5 rows height
- Better readability

### 11. Player List Display Fix
- Show seated players correctly
- Display proper names
- Fix empty seat display

## Implementation Status

### Completed:
- [x] Lower turn notification pitch

### In Progress:
- [ ] Show/Muck auto-dismiss (3 seconds)
- [ ] Auto-fold/auto-call checkboxes
- [ ] Kicker display in game log

### Queued:
- [ ] Dealer chip positioning (seat 4)
- [ ] Timer padding
- [ ] Button styling
- [ ] Theme updates
- [ ] Black & gold theme
- [ ] Chat/log typography
- [ ] Player list fixes

## Files to Modify

1. **audioSystem.ts** - ✅ Sound fixed
2. **Actions.tsx** - Auto-fold/call checkboxes, show/muck timeout
3. **HeadsUpPokerGame.ts** - Kicker information
4. **Table.tsx** - Dealer chip position, timer padding, theme updates
5. **App.tsx** - Theme state, player list
6. **index.css** - Black & gold theme, button styles
7. **Chat.tsx** - Typography
8. **GameLog.tsx** - Typography

## Notes

- Using local dev server: http://localhost:5173
- Can preview changes in real-time
- Deploy after testing each batch
