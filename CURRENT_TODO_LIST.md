# 🎯 Current TODO List - October 7, 2025

## ✅ RECENTLY COMPLETED
- ✅ Realistic oval poker table with player layout refinement
- ✅ Cards positioned above avatar (larger, spread, tilted)
- ✅ Avatar enlarged to w-20 h-20
- ✅ Name overlaps avatar bottom
- ✅ Betting animations integrated (chips slide, action boxes, pot pulse)
- ✅ Folded player fade effect (opacity-30)
- ✅ Static hexagon background (animates only when timer active)
- ✅ Community cards scaled smaller (90%)

---

## 🔥 HIGH PRIORITY (Next 2-3 hours)

### **1. Glass Morphism Action Buttons** 🔥 TOP PRIORITY
**Status:** HIGH IMPACT - User Experience
**Time:** 2-3 hours

**Needs:**
- Replace current action buttons with glass morphism design
- Semi-transparent overlay buttons at bottom of table
- Frosted glass effect with subtle glow
- Hover animations and modern styling
- CHECK/CALL/RAISE/FOLD/ALL-IN button redesign
- Modern, professional poker interface

**Why First:** Biggest visual impact, modernizes entire interface

---

### **2. Panels & Hand Tracking** 🎯 QUICK WIN
**Status:** User Requested
**Time:** 30 minutes

**Needs:**
- Winning Hands Panel - Show last 10 winning hands from this table
- Resize Fairness Panel - Make it half width (50%)
- Side-by-side layout - Fairness | Winning Hands panels
- Hand tracking logic - Populate recentWinningHands on hand completion
- Update on each hand completion with winner, hand type, pot size

---

### **3. Auto-Actions** ⚡ QUICK WIN
**Status:** User Requested
**Time:** 15 minutes

**Needs:**
- Auto-fold checkbox - Add to Actions component UI
- Auto-call checkbox - Add to Actions component UI
- Wire to state - Connect to autoFold/autoCall in App.tsx
- Timer expiration logic - Execute auto-actions
- Test scenarios with timer running out

---

## 🟡 MEDIUM PRIORITY (Next Session)

### **4. Layout Polish** 🎨
**Time:** 30 minutes

**Needs:**
- Fix dealer chip position for seat 4 (move to bottom)
- Increase timer padding for seats 2,3,5,6 (not overlapping cards)
- Standardize button styling (match Leaderboard/Deposit style)
- Chat/Log improvements - Larger font, better height, custom scrollbar

---

### **5. Multi-Player AI Logic** 🤖 CRITICAL
**Status:** Important for 4-player demo
**Time:** 45 minutes

**Needs:**
- AI decision making - Implement for 3 AI players
- Betting rounds - Handle multiple players in order
- Folding logic - Remove folded players from rotation
- Dealer button rotation - Proper 4-seat rotation
- Side pots for all-ins
- Showdown with multiple players

---

## 🟢 LOW PRIORITY (Future Sessions)

### **6. Kicker Display** 🏆
**Time:** 20 minutes

**Needs:**
- Update hand evaluation to show kickers
- Format: "Two Pair, J's & 2's (K kicker)"
- Handle multiple kickers: "High Card A (K, Q, J kickers)"
- Show in game log and winning hand display

---

### **7. Theme Adjustments** 🎨
**Time:** 15 minutes

**Needs:**
- Light theme pale sky blue colors (#E0F2FE)
- Panel theme adaptation
- Color contrast improvements
- Test all themes for readability

---

## 🔧 Bug Fixes & Enhancements

### **12. Leave/Reset Functionality**
**Needs:**
- Clear all demo game state on "Leave Table"
- Return to lobby view
- Prevent old game from resuming
- Test join → play → leave → join flow

**Time:** 10 minutes

---

### **13. Timeout System Enhancement**
**Needs:**
- Track timeouts per player (not just 2 players)
- Auto-fold/check for AI players who timeout
- Reset counter after any action
- Visual timeout warning on avatars

**Time:** 15 minutes

---

### **14. Timer Integration**
**Status:** Timer shows but doesn't enforce limits
**Needs:**
- Auto-fold on timeout if no action
- Time bank enforcement
- Visual warning when time running low
- Sound effect for low time

**Time:** 20 minutes

---

## 🔮 NICE TO HAVE (Future)

### **15. Telegram Chat Integration** 💬🚀
**Time:** 2-3 hours
**Impact:** HIGH - Massive social/community feature

**What You Get:**
- Players chat via Telegram bot
- Bidirectional sync (game ↔ Telegram)
- **Rich media support:**
  - GIFs from Giphy/Tenor library
  - Telegram stickers (thousands available)
  - Memes and images
  - Videos and voice messages
  - Full emoji support
- Link wallet addresses to Telegram usernames
- Notifications (your turn, big pots, wins)
- Mobile chat without being in game

**Implementation Steps:**
1. Create Telegram bot via @BotFather (10 min)
2. Backend API endpoints for Telegram webhook (30 min)
3. Message sync between game chat and Telegram (30 min)
4. Media handling (GIFs, stickers, images) (45 min)
5. Player linking system (wallet → Telegram) (30 min)
6. Notification system for game events (15 min)

**Features:**
- Send stickers/GIFs from Telegram → show in game chat
- Game messages appear in Telegram group
- Click thumbnails in game to expand media
- Meme warfare after big bluffs 🤡
- Voice taunts after winning pots 😂
- Better than Discord - everyone has Telegram

**Technical Requirements:**
- Telegram Bot Token (free from @BotFather)
- Backend server for webhook/polling
- Image proxy for displaying Telegram media
- Rate limit handling (Telegram API limits)

**Pro tip:** Start with basic message sync, then add rich media support incrementally

---

### **16. Custom Avatar Image Upload** 🖼️
**Time:** 1-3 hours (depending on approach)

**Quick Version (1 hour):**
- File input in avatar selection modal (10 min)
- Upload to `/public/avatars/custom/` folder (20 min)
- Save filename to player state (10 min)
- Display uploaded image in circle (10 min)
- Basic validation (file size, format) (10 min)

**Full Version (2-3 hours):**
- Image preview before upload (15 min)
- Client-side crop/resize to circular format (30 min)
- Backend upload endpoint (20 min)
- Image processing (resize, compress) (20 min)
- Cloud storage integration (AWS S3/Cloudflare R2) (45 min)
- Server-side validation & security (30 min)
- AI content moderation (optional, +1 hour)

**Features:**
- Max file size: 500KB
- Auto-crop to circle
- Formats: JPG, PNG, WebP
- Preview before confirming
- Fallback to preset avatars if image fails

---

### **17. Sound Controls**
- Volume slider
- Mute toggle
- Individual sound toggles (music, effects, voice)

**Time:** 15 minutes

---

### **17. Animation Speed Control**
- Slider to adjust animation speed
- Fast/Normal/Slow presets
- Option to skip animations

**Time:** 20 minutes

---

### **17. Additional Features**
- Hand history export (CSV/JSON)
- Player notes system
- Table statistics (avg pot, hands/hour)
- Pot odds calculator display
- Range selector for hand analysis

**Time:** TBD

---

## 🚀 BACKEND INTEGRATION (Phase 2)

### **18. Professional Poker Engine**
**Status:** Complete engine exists at `server/src/poker-engine.ts`
**Needs:**
- Replace HeadsUpPokerGame with professional engine
- Support 2-10 players
- Advanced features (side pots, proper showdown, etc.)
- Integration with React frontend

**Time:** 2-3 hours

---

### **19. Real Multiplayer Server**
**Status:** Socket connection disabled
**Needs:**
- Enable socket.io connection
- Server-side game state management
- Player authentication
- Room/table management

**Time:** 4-6 hours

---

### **20. Blockchain Integration**
**Status:** Smart contract addresses not set
**Needs:**
- Deploy TableEscrow contracts
- Set contract addresses in App.tsx
- Wire up deposit/withdraw functions
- Test with real wallet

**Time:** 2-3 hours

---

## � COMEBACK LIST (Deferred Issues)

These are on hold for now:
- ⏸️ **Fanned cards display** - Cards should appear tilted/overlapping like real poker hands
- ⏸️ **Betting chip positioning** - Move betting chips up vertically (positioning changes not taking effect)
- ⏸️ **Hand Evaluation System** - Winner currently random (works for demo)
- ⏸️ **Showdown Card Reveal** - Opponent cards not shown (deferred)
- ⏸️ **Card Dealing Animation** - CSS ready but not hooked up yet

---

## 📊 PRIORITY RANKING

### **� DO FIRST** (High Impact)
1. **Glass Morphism Action Buttons** (2-3 hours) - Biggest visual upgrade
2. **Winning Hands Panel** (30 min) - User requested, quick win
3. **Auto-Action Checkboxes** (15 min) - User requested, quick win

### **🟡 DO NEXT** (Medium Impact)
4. **Layout Polish** (30 min) - UI improvements
5. **Multi-Player AI Logic** (45 min) - 4-player demo needs it

### **🟢 DO LATER** (Low Impact)
6. **Kicker Display** (20 min) - Nice detail
7. **Theme Adjustments** (15 min) - Visual polish

### **🔵 BACKLOG** (Nice to Have)
- Everything in "Comeback List"
- Sound controls
- Animation speed controls
- Hand history export

---

## 🎯 RECOMMENDED ORDER

**Session 1 (3-4 hours) - HIGHEST IMPACT:**
1. ✨ **Glass Morphism Action Buttons** (2-3 hours) - PRIORITY #1
   - Modernizes entire interface
   - Biggest visual improvement
   - Professional poker look

**Session 2 (45 min) - QUICK WINS:**
2. 🎯 **Winning Hands Panel** (30 min)
3. ⚡ **Auto-Action Checkboxes** (15 min)

**Session 3 (1.25 hours) - POLISH:**
4. 🎨 **Layout Polish** (30 min)
5. 🤖 **Multi-Player AI Logic** (45 min)

**Session 4 (35 min) - FUTURE:**
6. 🏆 **Kicker Display** (20 min)
7. 🎨 **Theme Adjustments** (15 min)

---

## 💡 RECOMMENDATION

**Start with Priority 1: Glass Morphism Action Buttons**

This is the highest impact visual improvement that will modernize the entire interface. It's a substantial task but will make the biggest difference in user experience. 

Then tackle Priority 2 & 3 (quick wins that add functional value).

**Which priority would you like to start with?**

---

## 📝 NOTES

- **Dev Server:** http://10.88.111.25:5173 (use `npx vite --host`)
- **Members Area Features:** See `MEMBERS_AREA_FEATURES.md` for future roadmap
- **All animations:** Use audioSystem for sounds
- **All themes:** Green felt center, consistent styling
- **Card dealing:** CSS ready at index.css, needs React hookup

---

**Last Updated:** October 7, 2025  
**Next Focus:** Hand evaluation system + Showdown reveal
