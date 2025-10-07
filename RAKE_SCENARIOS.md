# 💰 Rake System - Visual Examples & Test Cases

## 🎯 Quick Reference

| Scenario | Flop Dealt? | Pot Size | Rake Applied | Net to Winner | Notes |
|----------|-------------|----------|--------------|---------------|-------|
| Pre-flop fold | ❌ | 1,500 | 0 | 1,500 | No rake - hand ended pre-flop |
| Small post-flop | ✅ | 800 | 0 | 800 | Below minimum (1 BB) |
| Standard hand | ✅ | 10,000 | 500 | 9,500 | 5% rake applied |
| Big pot | ✅ | 60,000 | 2,000 | 58,000 | Rake capped at 2× BB |
| All-in pre-flop | ✅ | 50,000 | 2,000 | 48,000 | Flop dealt for equity, rake applies |

## 📊 Detailed Scenarios

### Scenario 1: Pre-Flop Fold (ZERO RAKE) ✅

```
BLINDS: 500/1000

ACTION:
Pre-flop: 
  - Small Blind posts 500
  - Big Blind posts 1000
  - SB raises to 2000
  - BB folds

RESULT:
  Pot: 3,000 SHIDO
  Flop Dealt: NO ❌
  Rake: 0 SHIDO
  Winner gets: 3,000 SHIDO

GAME LOG:
  "💰 No rake (hand ended pre-flop)"
  "🎉 You won 3,000 SHIDO!"
```

**Why no rake?**
- Hand ended before flop was dealt
- Rake only applies if community cards are shown

---

### Scenario 2: Tiny Pot (BELOW MINIMUM) ✅

```
BLINDS: 500/1000

ACTION:
Pre-flop: Both check
Flop: [K♠ 7♥ 2♦]
  - Player 1 checks
  - Player 2 checks
Turn: [9♣]
  - Player 1 checks
  - Player 2 checks
River: [A♠]
  - Player 1 checks
  - Player 2 checks

RESULT:
  Pot: 800 SHIDO (below blinds from partial action)
  Flop Dealt: YES ✅
  Pot < 1000: YES ❌
  Rake: 0 SHIDO
  Winner gets: 800 SHIDO

GAME LOG:
  "💰 No rake (pot below minimum)"
  "🎉 You won 800 SHIDO!"
```

**Why no rake?**
- Even though flop was dealt, pot is below minimum (1 BB = 1000)
- Prevents raking dust pots

---

### Scenario 3: Standard Hand (5% RAKE) ✅

```
BLINDS: 500/1000

ACTION:
Pre-flop:
  - SB posts 500
  - BB posts 1000
  - SB calls 500
Flop: [A♠ K♥ Q♦]
  - BB bets 2000
  - SB calls 2000
Turn: [J♣]
  - BB bets 3000
  - SB calls 3000
River: [10♠]
  - BB checks
  - SB checks

RESULT:
  Final Pot: 12,000 SHIDO
  Flop Dealt: YES ✅
  Pot > 1000: YES ✅
  Raw Rake: 12,000 × 5% = 600
  Cap Check: 600 < 2000 ✅
  Rake: 600 SHIDO
  Winner gets: 11,400 SHIDO

GAME LOG:
  "💰 Rake: 600 SHIDO (5% of pot, cap: 2,000)"
  "🎉 You won 11,400 SHIDO!"
  "🏆 You win with Royal Flush!"
```

---

### Scenario 4: Large Pot (RAKE CAPPED) ⚠️

```
BLINDS: 500/1000

ACTION:
Pre-flop:
  - SB raises to 3000
  - BB re-raises to 9000
  - SB calls 6000
Flop: [K♠ K♥ K♦]
  - BB bets 15,000
  - SB raises to 40,000 (all-in)
  - BB calls 25,000 (all-in)

RESULT:
  Final Pot: 80,000 SHIDO
  Flop Dealt: YES ✅
  Pot > 1000: YES ✅
  Raw Rake: 80,000 × 5% = 4,000
  Cap Check: 4,000 > 2000 ❌
  Rake: 2,000 SHIDO (CAPPED!)
  Winner gets: 78,000 SHIDO

GAME LOG:
  "💰 Rake: 2,000 SHIDO (5% of pot, cap: 2,000)"
  "🎉 You won 78,000 SHIDO!"
  "🏆 You win with Four of a Kind, Kings!"
```

**Why capped?**
- Raw rake would be 4,000 (5% of 80k)
- Cap is 2× BB = 2,000
- Protects players in big pots

---

### Scenario 5: All-In Pre-Flop (FLOP RUNS OUT) ✅

```
BLINDS: 500/1000

ACTION:
Pre-flop:
  - SB raises to 3000
  - BB re-raises to 10,000
  - SB goes all-in 50,000
  - BB calls 40,000 (all-in)

BOARD RUNS OUT:
  Flop: [A♠ K♥ Q♦] ← FLOP DEALT
  Turn: [J♣]
  River: [10♠]

RESULT:
  Final Pot: 100,000 SHIDO
  Flop Dealt: YES ✅ (for equity resolution)
  Pot > 1000: YES ✅
  Raw Rake: 100,000 × 5% = 5,000
  Cap Check: 5,000 > 2000 ❌
  Rake: 2,000 SHIDO (CAPPED)
  Winner gets: 98,000 SHIDO

GAME LOG:
  "💰 Rake: 2,000 SHIDO (5% of pot, cap: 2,000)"
  "🎉 You won 98,000 SHIDO!"
  "🏆 You win with Royal Flush!"
```

**Special Case:**
- Even though all-in was pre-flop, board ran out
- Flop was dealt to resolve equity
- Therefore, rake applies!

---

## 🧮 Rake Calculator

### Formula Breakdown

```javascript
function calculateRake(pot, flopDealt, bigBlind) {
  const RAKE_BPS = 500;           // 5%
  const MAX_RAKE = bigBlind * 2;  // 2000 chips
  const MIN_POT = bigBlind;       // 1000 chips
  
  // Step 1: Check if flop dealt
  if (!flopDealt) {
    return 0; // NO RAKE
  }
  
  // Step 2: Check minimum pot size
  if (pot < MIN_POT) {
    return 0; // NO RAKE
  }
  
  // Step 3: Calculate raw rake (5%)
  const rakeRaw = Math.floor((pot * RAKE_BPS) / 10000);
  
  // Step 4: Apply cap
  const rake = Math.min(rakeRaw, MAX_RAKE);
  
  // Step 5: Return final rake
  return rake;
}
```

### Examples

```javascript
// Example 1: Pre-flop fold
calculateRake(3000, false, 1000)
// Returns: 0

// Example 2: Small pot
calculateRake(800, true, 1000)
// Returns: 0

// Example 3: Normal hand
calculateRake(10000, true, 1000)
// Returns: 500

// Example 4: Large pot (capped)
calculateRake(100000, true, 1000)
// Returns: 2000 (not 5000)
```

## 📈 Rake Impact Analysis

### Average Hand Examples (1000 BB blinds)

| Pot Size | No Cap Rake (5%) | Actual Rake | Saved by Cap | % Saved |
|----------|------------------|-------------|--------------|---------|
| 2,000 | 100 | 100 | 0 | 0% |
| 5,000 | 250 | 250 | 0 | 0% |
| 10,000 | 500 | 500 | 0 | 0% |
| 20,000 | 1,000 | 1,000 | 0 | 0% |
| 40,000 | 2,000 | 2,000 | 0 | 0% |
| 50,000 | 2,500 | 2,000 | 500 | 20% |
| 100,000 | 5,000 | 2,000 | 3,000 | 60% |
| 200,000 | 10,000 | 2,000 | 8,000 | 80% |

**Key Insight:**
- Cap protects players in big pots
- Savings increase dramatically for large pots
- Maximum rake never exceeds 2× BB

## 🎮 Testing Checklist

### Test Case 1: Pre-Flop Fold ✅
- [ ] Start new hand
- [ ] Raise pre-flop
- [ ] Opponent folds
- [ ] Check game log for "No rake (hand ended pre-flop)"
- [ ] Verify full pot awarded

### Test Case 2: Flop See ✅
- [ ] Start new hand
- [ ] Call to see flop
- [ ] Flop dealt
- [ ] Bet and opponent folds
- [ ] Check game log for rake amount
- [ ] Verify rake deducted from pot

### Test Case 3: Showdown ✅
- [ ] Play hand to river
- [ ] Both players check
- [ ] Showdown occurs
- [ ] Check rake calculation
- [ ] Verify winner gets pot minus rake

### Test Case 4: All-In ✅
- [ ] Go all-in pre-flop
- [ ] Board runs out
- [ ] Flop dealt = YES
- [ ] Verify rake applied
- [ ] Check if cap applied (if pot > 40k)

### Test Case 5: Micro Pot ✅
- [ ] Both players check all streets
- [ ] Pot stays at blinds (1500)
- [ ] Flop dealt
- [ ] But pot < 1000 threshold
- [ ] Verify no rake taken

## 🏆 Rake Transparency Features

### In-Game Display
```
Header:
  "House Rake: 2,500"  ← Running total

Game Log:
  "💰 Rake: 500 SHIDO (5% of pot, cap: 2,000)"
  "💰 No rake (hand ended pre-flop)"
  "💰 No rake (pot below minimum)"
```

### Leaderboard Stats
```
Footer Panel:
  Total Rake: 2.5K ← Total rake paid across all hands
```

## 💡 Pro Tips

### Minimizing Rake
1. **Fold pre-flop** more often (no rake!)
2. **Avoid marginal flop calls** (rake on every flop seen)
3. **Value bet correctly** (don't inflate pots unnecessarily)
4. **Play big pots** when advantageous (cap limits rake)

### Rake-Adjusted Strategy
- Pre-flop aggression is more valuable (can win pot with no rake)
- Post-flop play costs 5% per street
- Big pots are relatively cheaper due to cap
- Micro pots (<1 BB) have no rake tax

---

**Built for Shido Poker - Fair, Transparent, Professional**

🎰 Test these scenarios in Demo Mode to see the rake system in action! 🎰
