# 🎰 QUICK START GUIDE - Shido Poker

## 🚀 Start Playing in 3 Steps

### Step 1: Launch Game
```
✅ Frontend already running at: http://localhost:5173
✅ Backend running at: http://localhost:3001 (optional)
```

### Step 2: Enter Demo Mode
```
1. Click "🎮 DEMO MODE" button
2. Choose a seat (1 or 4)
3. Enter your nickname
4. Pick an avatar
5. Click "SIT DOWN 🪑"
```

### Step 3: Play Poker!
```
• Cards dealt automatically
• Use buttons: CHECK, CALL, RAISE, FOLD
• AI opponent plays realistically
• Win chips, climb leaderboard!
```

---

## 🎮 Controls

### Betting Actions
| Button | When to Use | Effect |
|--------|-------------|--------|
| ✅ CHECK | No bet to call | Pass turn, stay in hand |
| 📞 CALL | Facing a bet | Match bet, stay in hand |
| ⬆️ RAISE | Want to increase | Bet more, opponent must respond |
| ❌ FOLD | Bad hand | Surrender, opponent wins |
| 🔥 ALL-IN | Go big or go home | Bet entire stack |

---

## 🏆 Leaderboard

### View Rankings
```
Click "🏆 LEADERBOARD" button in header
```

### Five Categories
1. **💰 Most Won** - Total SHIDO earned
2. **💸 Most Lost** - Biggest losses
3. **🎮 Most Played** - Total hands
4. **🎯 Best Win Rate** - Win percentage
5. **💎 Biggest Pot** - Largest win

### Your Stats
```
Footer shows:
• Net Profit (Green = winning, Red = losing)
• Win Rate %
• Total Rake paid
• Hands played
```

---

## 💰 Rake System

### How It Works
```
✅ 5% of pot (if flop is dealt)
✅ Capped at 2× BB (2000 chips max)
✅ No rake on pre-flop folds
✅ No rake on tiny pots (<1000)
```

### Examples
| Scenario | Pot | Rake | You Get |
|----------|-----|------|---------|
| Pre-flop fold | 3,000 | 0 | 3,000 |
| Small pot | 800 | 0 | 800 |
| Normal hand | 10,000 | 500 | 9,500 |
| Big pot | 80,000 | 2,000 | 78,000 |

---

## 🃏 Hand Rankings (Best to Worst)

1. **Royal Flush** - A♠ K♠ Q♠ J♠ 10♠
2. **Straight Flush** - 9♥ 8♥ 7♥ 6♥ 5♥
3. **Four of a Kind** - K♠ K♥ K♦ K♣ 7♠
4. **Full House** - J♠ J♥ J♦ 3♠ 3♥
5. **Flush** - A♦ K♦ 8♦ 5♦ 2♦
6. **Straight** - 10♠ 9♥ 8♦ 7♣ 6♠
7. **Three of a Kind** - 8♠ 8♥ 8♦ K♠ 4♥
8. **Two Pair** - Q♠ Q♥ 7♦ 7♣ A♠
9. **One Pair** - A♠ A♥ K♦ 9♣ 5♠
10. **High Card** - A♠ K♦ Q♣ 8♥ 3♠

---

## 📖 Game Flow

### Each Hand
```
1. Blinds Posted
   SB: 500  |  BB: 1000

2. Hole Cards Dealt
   You: [?, ?]  |  Opponent: [hidden]

3. Pre-Flop Betting
   → Check/Bet/Call/Raise/Fold

4. Flop (3 cards)
   → [?, ?, ?] → Betting round

5. Turn (1 card)
   → [?, ?, ?, ?] → Betting round

6. River (1 card)
   → [?, ?, ?, ?, ?] → Final betting

7. Showdown
   → Best hand wins!
   → Rake deducted (if flop dealt)
   → New hand starts
```

---

## 💡 Pro Tips

### Maximize Winnings
1. **Fold pre-flop often** - No rake on folds before flop!
2. **Play strong hands** - Don't chase every pot
3. **Observe AI patterns** - Learn opponent tendencies
4. **Manage your stack** - Don't go broke too fast
5. **Use position** - Act last when possible

### Minimize Rake
- Fold marginal hands pre-flop (no rake!)
- Go big or go home (rake is capped)
- Avoid small pots post-flop (still pay 5%)

### Climb Leaderboard
- Play consistently (Most Played category)
- Win more than you lose (Net Profit)
- Aim for 55%+ win rate (Best Win Rate)
- Go for big pots (Biggest Pot)

---

## 🎯 Key Features

### Texas Hold'em ✅
- Proper dealer button rotation
- Correct blind posting
- Valid betting actions
- Four streets (pre-flop, flop, turn, river)
- Accurate hand evaluation

### Rake System ✅
- 5% industry standard
- Flop-based (fair)
- Capped at 2× BB
- Transparent display

### Leaderboard ✅
- 5 competitive categories
- Real-time stats
- Beautiful rankings
- Medal system

### AI Opponent ✅
- Hand-strength aware
- Realistic decisions
- Challenging but beatable
- Engaging gameplay

---

## 🐛 Troubleshooting

### Page Not Loading?
```
1. Check terminal: npm run dev should be running
2. Visit: http://localhost:5173
3. Clear browser cache if needed
```

### Cards Not Showing?
```
• Refresh page (F5)
• Make sure you clicked "SIT DOWN"
• Check browser console for errors
```

### Buttons Not Working?
```
• You must be seated at table
• Wait for your turn (your seat highlighted)
• Can't CHECK when facing a bet
• Can't bet more than your stack
```

---

## 📚 More Info

### Full Documentation
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Everything
- `TEXAS_HOLDEM_VERIFICATION.md` - Rules details
- `RAKE_AND_LEADERBOARD_GUIDE.md` - Rake & stats
- `RAKE_SCENARIOS.md` - Visual examples

### Code Structure
- `web/src/App.tsx` - Main application
- `web/src/utils/HeadsUpPokerGame.ts` - Game engine
- `web/src/components/Leaderboard.tsx` - Rankings UI
- `web/src/components/Table.tsx` - Game table

---

## 🎉 You're Ready!

**Everything is working:**
✅ Texas Hold'em rules 100% compliant
✅ Professional rake system
✅ Beautiful leaderboard
✅ Smart AI opponent
✅ Demo mode ready to play

**Just open http://localhost:5173 and start winning!**

---

🎰 **Good luck at the tables!** 🎰
**May the cards be in your favor!** 🃏

*Built for Shido Network • Professional Poker • Fair Play*
