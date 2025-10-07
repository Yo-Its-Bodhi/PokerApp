# Remaining Tasks for Poker Game

## ✅ COMPLETED
1. ✅ Realistic oval poker table with wood rail
2. ✅ Green felt on all themes
3. ✅ Seats positioned outside table rail
4. ✅ Seat labels (SEAT 1, SEAT 2, etc.)
5. ✅ Button click sounds (Check/Call/Raise/All-In/Fold/Show/Muck)
6. ✅ Slider tick sounds for raise amount
7. ✅ Dealer button properly labeled "DEALER"
8. ✅ SB/BB chips visible
9. ✅ 4-player demo game (you + 3 AI opponents)
10. ✅ Timeout removal fix (forced stand up after 2 consecutive timeouts)

---

## 🔄 IN PROGRESS / TO DO

### **Batch 1: Panels & Hand Tracking** (30 min)
- [ ] **Winning Hands Panel** - Show last 10 winning hands from this table
- [ ] **Resize Fairness Panel** - Make it half the width (50%)
- [ ] **Side-by-side layout** - Fairness panel | Winning Hands panel
- [ ] **Hand tracking logic** - Populate recentWinningHands state on hand completion
- [ ] **Update on completion** - Add winner, hand type, pot size to list

### **Batch 2: Auto-Actions** (15 min)
- [ ] **Auto-fold checkbox** - Add to Actions component UI
- [ ] **Auto-call checkbox** - Add to Actions component UI
- [ ] **Wire checkboxes** - Connect to autoFold/autoCall state in App.tsx
- [ ] **Implement auto-action logic** - Execute on timer expiration
- [ ] **Test scenarios** - Timer runs out with auto-fold/call checked

### **Batch 3: Kicker Display** (20 min)
- [ ] **Update evaluateHands()** - Extract kicker cards from pokersolver
- [ ] **Format game log** - Show "Two Pair, J's & 2's (K kicker)"
- [ ] **Handle multiple kickers** - e.g., "High Card A (K, Q, J kickers)"
- [ ] **Test scenarios** - Various hand matchups with kickers
- [ ] **Edge cases** - Full house, quads, etc. (no kickers needed)

### **Batch 4: Layout Polish** (30 min)
- [ ] **Dealer chip position** - Move to bottom for seat 4 only (currently shows above)
- [ ] **Timer padding** - Increase padding for seats 2,3,5,6 (not overlapping cards)
- [ ] **Button styling consistency** - Make all buttons match Leaderboard/Deposit style
- [ ] **Chat/Log font size** - Increase font size (currently too small)
- [ ] **Chat/Log height** - Resize to 5 rows visible
- [ ] **Custom scrollbar** - Add custom styling to scrollbars

### **Batch 5: Theme Adjustments** (15 min)
- [ ] **Light theme colors** - Change to pale sky blue (#E0F2FE) with dark blue borders
- [ ] **Panel theme adaptation** - Ensure all panels adapt to selected theme
- [ ] **Test all themes** - Dark, Classic, Light, Executive consistency
- [ ] **Color contrast** - Ensure readability across all themes

### **Batch 6: Leave/Reset Functionality** (10 min)
- [ ] **Clear demo game state** - Reset all state on "Leave Table"
- [ ] **Return to lobby** - Show lobby screen after leaving
- [ ] **Prevent resuming** - Don't allow old game to continue
- [ ] **Test flow** - Leave → Join → New game (not old game)

### **Batch 7: Multi-Player AI Logic** (45 min) 🆕
- [ ] **AI decision making** - Implement for 3 AI players (not just 1 opponent)
- [ ] **Betting rounds** - Handle multiple players betting in order
- [ ] **Folding logic** - Remove folded players from action rotation
- [ ] **Side pots** - Calculate when players go all-in with different stacks
- [ ] **Showdown** - Compare all remaining players' hands
- [ ] **Dealer button rotation** - Rotate through all 4 seats properly

### **Batch 8: Timeout System Enhancement** (15 min) 🆕
- [ ] **Individual timeout tracking** - Track timeouts per player (not just you vs opponent)
- [ ] **AI timeout handling** - Auto-fold/check for AI players who timeout
- [ ] **Timeout reset** - Reset counter after any action taken
- [ ] **Visual feedback** - Show timeout warning on player avatars

### **Batch 9: Additional Features** (TBD)
- [ ] **Sound volume control** - Slider to adjust game sounds
- [ ] **Mute button** - Quick toggle for all sounds
- [ ] **Animation speed** - Option to speed up/slow down animations
- [ ] **Hand history export** - Download last 50 hands as CSV/JSON
- [ ] **Player notes** - Add notes on opponent tendencies
- [ ] **Table statistics** - Average pot size, hands per hour, etc.

---

## 🚀 NEXT STEPS

**Priority Order:**
1. **Multi-Player AI Logic** (Batch 7) - Critical for 4-player demo
2. **Winning Hands Panel** (Batch 1) - User requested
3. **Auto-Actions** (Batch 2) - User requested
4. **Kicker Display** (Batch 3) - User requested
5. **Layout Polish** (Batch 4) - Quality of life
6. **Other batches** - As time permits

---

## 📝 NOTES

- Dev server runs on **http://10.88.111.25:5173** (network IP, not localhost)
- Use `npx vite --host` in `web` directory to start
- Button sounds use `playButtonClick()` from audioSystem
- Slider sounds use `playSliderTick()` with throttling
- All themes now have green felt center
- Seats positioned at 56%/52% ellipse radii (outside table rail)

---

**Last Updated:** October 7, 2025
