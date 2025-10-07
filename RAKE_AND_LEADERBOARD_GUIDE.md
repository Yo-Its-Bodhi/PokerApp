# 🎰 Shido Poker - Rake System & Leaderboard

## 🏆 Features Implemented

### 1. Professional Rake System
Based on industry-standard poker rake policies with transparent, fair calculations.

#### Rake Policy Rules

**When Rake Applies:**
- ✅ Rake is collected ONLY if the flop is dealt (at least one community card phase)
- ❌ NO rake if hand ends pre-flop (everyone folds, or BB wins unopposed)

**Rake Calculation:**
- **Rate:** 5% (500 basis points)
- **Cap:** 2× Big Blind (2000 chips default)
- **Minimum Pot:** 1× Big Blind (1000 chips) - pots below this threshold are not raked

**Formula:**
```javascript
if (!flopDealt) {
  rake = 0  // Pre-flop fold - no rake
} else if (pot < minPotForRake) {
  rake = 0  // Pot too small
} else {
  rakeRaw = floor((pot × 500) / 10000)  // 5% in basis points
  rake = min(rakeRaw, MAX_RAKE)          // Apply cap
}

netPot = pot - rake
```

**Transparency:**
- Rake amount shown in game log for every hand
- Running total displayed in header
- Clear messaging when no rake applies
- Breakdown in hand recap

#### Rake Implementation Details

**Constants:**
```typescript
RAKE_BPS = 500              // 5% = 500 basis points
MAX_RAKE = bigBlind × 2     // Cap at 2BB (2000 chips)
MIN_POT_FOR_RAKE = bigBlind // Don't rake pots below 1BB
```

**All-In Scenarios:**
- Pre-flop all-in with runout → Rake applies (flop was dealt)
- Pre-flop fold → No rake (hand ended before flop)

**Side Pots (Future Enhancement):**
- Rake computed on total pot (main + all side pots)
- Single rake calculation before winner distribution
- Proportional payouts after rake deduction

### 2. Epic Leaderboard System 🏆

A beautiful, interactive leaderboard tracking player performance across multiple categories.

#### Leaderboard Categories

**💰 Most Won**
- Total SHIDO won across all hands
- Top earners ranked by gross winnings

**💸 Most Lost**
- Total SHIDO lost in play
- Shows both whales and learning players

**🎮 Most Played**
- Number of hands participated in
- Measures engagement and experience

**🎯 Best Win Rate**
- Win percentage (requires minimum 50 hands)
- Shows skill and consistency
- Formula: `(handsWon / handsPlayed) × 100`

**💎 Biggest Pot**
- Largest single pot ever won
- Highlights legendary hands

#### Player Stats Tracked

```typescript
interface PlayerStats {
  address: string;        // Wallet address
  alias: string;          // Player nickname
  avatar: string;         // Selected emoji/avatar
  totalWon: number;       // Cumulative winnings
  totalLost: number;      // Cumulative losses
  handsPlayed: number;    // Total hands participated
  handsWon: number;       // Hands won at showdown
  biggestPot: number;     // Largest pot won
  totalRakePaid: number;  // Total rake contributed
  winRate: number;        // Win percentage
}
```

#### Leaderboard Features

**Visual Design:**
- 🥇🥈🥉 Medal system for top 3 players
- Gradient backgrounds for top performers
- "YOU" badge highlighting current player
- Color-coded rankings by performance
- Animated hover effects

**Tabbed Navigation:**
- Easy switching between categories
- Active tab highlights
- Smooth transitions
- Responsive design

**Footer Stats Panel:**
- Net Profit (Won - Lost)
- Win Rate percentage
- Total Rake paid
- Hands played count
- Color-coded performance indicators

**Real-Time Updates:**
- Stats update automatically after each hand
- Live tracking of performance
- Session persistence (can be enhanced with localStorage)

### 3. Game Integration

#### Demo Mode Enhancements

**Automatic Stats Tracking:**
- Hands played counter increments each hand
- Win/loss tracking with stack differential
- Rake contribution logged per hand
- Biggest pot detection and recording

**UI Improvements:**
- 🏆 Leaderboard button in header (gold gradient)
- Rake display in header when > 0
- Clear game log messages for rake
- Beautiful modal overlay for leaderboard

**Performance Optimizations:**
- Stats calculated efficiently in game state callback
- Minimal re-renders with proper state management
- Smooth animations without lag

## 🎮 How to Use

### Accessing the Leaderboard

1. **Connect Wallet or Start Demo Mode**
2. **Click the 🏆 LEADERBOARD button** in the header
3. **Browse different categories** using the tabs
4. **View your stats** in the footer panel
5. **Close modal** with the × button

### Understanding Your Stats

**Net Profit:**
- Green = Profitable session
- Red = Losing session
- Shows: Total Won - Total Lost

**Win Rate:**
- Above 50% = Beating opponents
- Below 50% = Need strategy adjustment
- Shows: (Hands Won / Hands Played) × 100

**Rake Impact:**
- Total rake paid across all hands
- Averages 5% of pots where flop was dealt
- Track your contribution to the house

## 🚀 Technical Implementation

### Files Modified/Created

**New Files:**
- `web/src/components/Leaderboard.tsx` - Full leaderboard UI component

**Modified Files:**
- `web/src/utils/HeadsUpPokerGame.ts` - Rake logic + flop tracking
- `web/src/App.tsx` - Stats tracking + leaderboard integration

### Key Code Segments

**Rake Calculation (HeadsUpPokerGame.ts):**
```typescript
private endHand(playerWins: boolean) {
  const RAKE_BPS = 500;
  const MAX_RAKE = this.state.bigBlind * 2;
  const MIN_POT_FOR_RAKE = this.state.bigBlind;
  
  let rake = 0;
  
  if (!this.state.flopDealt) {
    rake = 0; // Pre-flop fold
  } else if (this.state.pot < MIN_POT_FOR_RAKE) {
    rake = 0; // Pot too small
  } else {
    const rakeRaw = Math.floor((this.state.pot * RAKE_BPS) / 10000);
    rake = Math.min(rakeRaw, MAX_RAKE);
  }
  
  const potAfterRake = this.state.pot - rake;
  winner.stack += potAfterRake;
  
  this.state.rake = rake;
  this.state.totalRakeCollected += rake;
}
```

**Stats Tracking (App.tsx):**
```typescript
// Update player stats when hand completes
if (gameState.street === 'preflop' && gameState.communityCards.length === 0) {
  setPlayerStats(prev => {
    const stackChange = currentStack - prevStack;
    
    let newTotalWon = prev.totalWon;
    let newTotalLost = prev.totalLost;
    let newHandsWon = prev.handsWon;
    
    if (stackChange > 0) {
      newTotalWon += stackChange;
      newHandsWon += 1;
      if (stackChange > prev.biggestPot) {
        newBiggestPot = stackChange;
      }
    } else if (stackChange < 0) {
      newTotalLost += Math.abs(stackChange);
    }
    
    const newWinRate = (newHandsWon / newHandsPlayed) * 100;
    
    return { ...prev, totalWon: newTotalWon, ... };
  });
}
```

## 🔮 Future Enhancements

### Backend Integration
- **Persistent Leaderboard:** Store stats in database
- **Global Rankings:** Cross-session player rankings
- **Historical Data:** Track performance over time
- **API Endpoints:** REST API for leaderboard data

### Additional Features
- **Rakeback System:** Return X% of rake to players weekly
- **VIP Tiers:** Reduced rake for high-volume players
- **Achievements System:** Badges for milestones
- **Hand History Export:** Download complete history
- **Advanced Analytics:** Graphs and trends
- **Tournament Mode:** Special rake rules for tournaments

### Blockchain Integration
- **On-Chain Rake Tracking:** Transparent rake on Shido Network
- **NFT Achievements:** Mint badges for top performers
- **Token Rewards:** SHIDO rewards for top leaderboard players
- **Provably Fair:** Cryptographic verification of rake

## 📊 Example Rake Scenarios

### Scenario 1: Standard Post-Flop Hand
```
Blinds: 500/1000
Pre-flop: Player bets 2000, Opponent calls
Pot: 4000
Flop dealt: ✅
Turn dealt
River dealt
Final Pot: 10,000

Rake Calculation:
- Flop was dealt: ✅
- Pot > 1000: ✅
- Raw rake: 10,000 × 5% = 500
- Cap (2000): Not reached
- Final Rake: 500 SHIDO
- Net Pot: 9,500 SHIDO
```

### Scenario 2: Pre-Flop Fold (No Rake)
```
Blinds: 500/1000
Pre-flop: Player raises 3000, Opponent folds
Final Pot: 4,500

Rake Calculation:
- Flop was dealt: ❌
- Final Rake: 0 SHIDO
- Net Pot: 4,500 SHIDO (no rake!)
```

### Scenario 3: Large Pot with Cap
```
Blinds: 500/1000
All-in showdown
Final Pot: 100,000

Rake Calculation:
- Flop was dealt: ✅
- Raw rake: 100,000 × 5% = 5,000
- Cap (2000): Applied! ⚠️
- Final Rake: 2,000 SHIDO (capped)
- Net Pot: 98,000 SHIDO
```

### Scenario 4: Small Pot (Below Minimum)
```
Blinds: 500/1000
Pre-flop: Small pot
Final Pot: 800

Rake Calculation:
- Flop was dealt: ✅
- Pot < 1000: ❌ (below minimum)
- Final Rake: 0 SHIDO
- Net Pot: 800 SHIDO (too small to rake)
```

## 🎯 Key Takeaways

1. **Fair & Transparent:** Industry-standard 5% rake with clear caps
2. **Player-Friendly:** No rake on pre-flop folds or micro pots
3. **Professional UX:** Beautiful leaderboard with comprehensive stats
4. **Real-Time Tracking:** Live updates as you play
5. **Competitive Spirit:** Multiple categories to compete in
6. **Full Integration:** Seamless with existing demo mode

---

**Built with ❤️ for the Shido Poker Community**

🎰 Deal, Bet, Win, Dominate the Leaderboard! 🏆
