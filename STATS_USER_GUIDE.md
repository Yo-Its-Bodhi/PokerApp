# 🎯 HOW TO USE SESSION STATS

## Quick Start Guide

### 1️⃣ **Login**
```
┌─────────────────────────┐
│  🎰 POKER LOGIN         │
│                         │
│  Alias: [YourName]      │
│  Avatar: [😎]          │
│                         │
│     [START PLAYING]     │
└─────────────────────────┘
```
✅ Stats automatically initialize with your alias

---

### 2️⃣ **Play Hands**
```
Your cards: A♠ K♥
Community: 5♦ 9♣ 2♠

Actions: [FOLD] [CALL] [RAISE] [ALL-IN]
```
✅ Every action you take is tracked
✅ Every hand result is recorded
✅ Balance changes are captured

---

### 3️⃣ **View Stats**
Look for the 📊 button in the top-right header:

```
Header: [🔒 FAIR] [🏆] [💰 DEPOSIT] [❓] [🔊] [📊 50] [LEAVE TABLE]
                                                    ↑
                                           Stats button with badge
```

Click it to open the stats modal!

---

### 4️⃣ **Stats Modal**
```
╔══════════════════════════════════════════════════════════════╗
║                    📊 SESSION STATS                          ║
║              PlayerName • Session Duration: 15m 32s          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │           Net Profit/Loss: +125,000 CHIPS              │ ║
║  │              +2,500 chips per hand                     │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           ║
║  │🎴      │  │🏆      │  │📈      │  │💰      │           ║
║  │HANDS   │  │HANDS   │  │WIN     │  │BIGGEST │           ║
║  │PLAYED  │  │WON     │  │RATE    │  │POT     │           ║
║  │  50    │  │  28    │  │  56%   │  │ 85,000 │           ║
║  └────────┘  └────────┘  └────────┘  └────────┘           ║
║                                                              ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           ║
║  │💎      │  │📉      │  │💵      │  │📈      │           ║
║  │BIGGEST │  │BIGGEST │  │TOTAL   │  │TOTAL   │           ║
║  │WIN     │  │LOSS    │  │BETS    │  │RAISES  │           ║
║  │ 45,000 │  │ 12,000 │  │  142   │  │   38   │           ║
║  └────────┘  └────────┘  └────────┘  └────────┘           ║
║                                                              ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           ║
║  │🚫      │  │🎯      │  │✨      │  │🔥      │           ║
║  │TOTAL   │  │ALL-IN  │  │ALL-IN  │  │ALL-IN  │           ║
║  │FOLDS   │  │ATTEMPTS│  │WINS    │  │SUCCESS │           ║
║  │   28   │  │   12   │  │    9   │  │  75%   │           ║
║  └────────┘  └────────┘  └────────┘  └────────┘           ║
║                                                              ║
║  ┌────────┐  ┌────────┐  ┌────────┐                        ║
║  │👁️      │  │🎊      │  │⭐      │                        ║
║  │SHOWDOWN│  │SHOWDOWN│  │SHOWDOWN│                        ║
║  │REACHED │  │WINS    │  │SUCCESS │                        ║
║  │   15   │  │    9   │  │  60%   │                        ║
║  └────────┘  └────────┘  └────────┘                        ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │     Current Streak: 3 Wins 🔥                          │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  [📥 Export JSON]  [🗑️ Reset Stats]  [✕ Close]            ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 5️⃣ **Export Stats**
Click **📥 Export JSON** to download your stats as a file:

```json
{
  "sessionStart": 1696723200000,
  "playerAlias": "YourName",
  "handsPlayed": 50,
  "handsWon": 28,
  "biggestPot": 85000,
  "totalWinnings": 245000,
  "currentStreak": 3,
  "allInSuccessRate": 75,
  ...
}
```

Use this for:
- Analyzing your play
- Sharing with friends
- Tracking progress over time

---

### 6️⃣ **Reset Stats**
Click **🗑️ Reset Stats** to start fresh:

```
┌─────────────────────────────────────┐
│ ⚠️ Are you sure?                    │
│                                     │
│ This will reset all your stats!     │
│ This cannot be undone!              │
│                                     │
│  [Cancel]          [Yes, Reset]     │
└─────────────────────────────────────┘
```

After reset:
- All counters go to 0
- Your alias stays the same
- Current balance preserved
- Fresh start for new session

---

## 📊 What Gets Tracked

### **Automatically Tracked Actions:**
- ✅ Every fold you make
- ✅ Every call you make
- ✅ Every bet you place
- ✅ Every raise you make
- ✅ Every check you do
- ✅ Every all-in you go

### **Automatically Tracked Results:**
- ✅ Hands played
- ✅ Hands won/lost
- ✅ Amount won/lost per hand
- ✅ Pot sizes
- ✅ All-in results
- ✅ Showdown results
- ✅ Balance changes
- ✅ Win streaks

### **Calculated Metrics:**
- 📈 Win rate (hands won / hands played)
- 📈 All-in success rate
- 📈 Showdown success rate
- 💰 Profit per hand
- ⏱️ Session duration
- 📊 Net profit/loss

---

## 🎮 Pro Tips

### **Track Multiple Sessions:**
- Stats save per player alias
- Login with different names for separate sessions
- Each alias has its own stats

### **Analyze Your Play:**
1. Export stats after session
2. Check your win rate
3. Look at all-in success
4. Review action distribution
5. Identify patterns

### **Set Goals:**
- "I want 60% win rate"
- "I want to win 10 hands in a row"
- "I want to hit +500K profit"
- Check stats to track progress!

### **Share Your Success:**
- Screenshot the stats modal
- Export JSON to share with friends
- Compare your numbers
- Challenge others!

---

## 🔥 Advanced Features

### **Persistence:**
```
Login → Play → Close Browser
         ↓
Reopen → Login with same alias
         ↓
Stats automatically load! 🎉
```

### **Real-Time Updates:**
Every action updates immediately:
```
Before: Hands Played: 49
You fold
After:  Hands Played: 50 ✅
        Total Folds: 29 ✅
```

### **Smart Tracking:**
System knows:
- Did you go all-in? ✅
- Did you reach showdown? ✅
- Did you win the hand? ✅
- How much did you win/lose? ✅
- All tracked automatically!

---

## 💡 Troubleshooting

### **Stats not showing?**
- Make sure you're logged in
- Click the 📊 button in header
- If empty, play some hands first

### **Stats not saving?**
- Check browser allows localStorage
- Don't use private/incognito mode
- Try different browser if issue persists

### **Want to start over?**
- Use Reset Stats button
- Or login with different alias

### **Badge not showing count?**
- Badge appears after first hand
- Shows total hands played
- Updates live as you play

---

## 🎯 Example Session

```
1. Login as "PokerPro"
   ✅ Stats initialized

2. Play 20 hands
   ✅ Win 12, lose 8
   ✅ +50,000 chips profit
   ✅ All tracked automatically

3. Click 📊 button
   ✅ See: 20 hands, 60% win rate, +50K profit

4. Export stats
   ✅ Download JSON file

5. Play 20 more hands
   ✅ Stats update to 40 hands total

6. Close browser
   ✅ Stats saved

7. Reopen next day
   ✅ Login as "PokerPro"
   ✅ All 40 hands still tracked!
```

---

## 🎉 Enjoy!

Your poker stats are now being tracked professionally. Every action, every hand, every result - all captured automatically in a beautiful, easy-to-read interface.

**Play smart. Track your progress. Improve your game! 🎰♠️♥️♦️♣️**
