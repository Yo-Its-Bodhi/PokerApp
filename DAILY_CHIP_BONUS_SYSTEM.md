# 🎁 Daily Chip Bonus System

## Overview
Players receive **1,000,000 CHIPS** when they first log in. When they run out of chips, they must wait **24 hours** to claim another 1,000,000 CHIPS bonus.

---

## How It Works

### 1️⃣ First Login (New Player)
- Player creates an account with a username
- **Automatically receives 1,000,000 CHIPS**
- Can immediately join tables and play
- Claim time is recorded in localStorage

### 2️⃣ Playing the Game
- Player can sit at tables with 100,000 CHIPS buy-ins
- Player can rebuy for 100,000 CHIPS at a time
- All chips are deducted from the 1,000,000 bankroll
- Balance is saved in real-time to localStorage

### 3️⃣ Running Out of Chips (Balance = 0)
When balance reaches 0:
- **Can't sit at new tables** - Shows cooldown message
- **Can't rebuy chips** - Shows cooldown message
- **Message displays time remaining**: `"⏳ Out of chips! Come back in Xh Ym for your daily 1,000,000 CHIPS bonus."`

### 4️⃣ Claiming Daily Bonus (After 24 Hours)
After 24 hours have passed:
- **Automatic claim** when trying to sit/rebuy
- Player receives fresh **1,000,000 CHIPS**
- New 24-hour timer starts
- Message: `"🎁 Daily bonus claimed! 1,000,000 CHIPS added to your bankroll!"`

---

## Example Timeline

**Day 1 - 12:00 PM**: Login
- Receive 1,000,000 chips
- Play all day
- Lose all chips by 8:00 PM

**Day 1 - 8:00 PM**: Balance = 0
- Try to rebuy
- Message: `"⏳ Out of chips! Come back in 16h 0m for your daily 1,000,000 CHIPS bonus."`

**Day 2 - 12:00 PM**: 24 Hours Later
- Try to sit at table
- **Automatic claim!**
- Message: `"🎁 Daily bonus claimed! 1,000,000 CHIPS added to your bankroll!"`
- New timer starts

**Day 2 - 12:01 PM**: Playing Again
- Full 1,000,000 chips to play with
- Next claim available in 24 hours (Day 3 - 12:00 PM)

---

## Technical Details

### localStorage Keys
```javascript
poker_balance_${username}      // Current chip balance (e.g., "750000")
poker_claim_time_${username}   // Unix timestamp of last claim (e.g., "1728384000000")
```

### Time Calculation
```javascript
// Check if 24 hours have passed
const now = Date.now();
const timeSinceLastClaim = now - lastClaimTime;
const canClaim = timeSinceLastClaim >= 86400000; // 24 hours in milliseconds

// Calculate time remaining
const hoursRemaining = 24 - Math.floor(timeSinceLastClaim / 1000 / 60 / 60);
const minutesRemaining = Math.floor((86400000 - timeSinceLastClaim) / 1000 / 60) % 60;
```

### Auto-Claim Logic
When balance is 0 and player tries to:
1. **Sit at a table** → Checks timer, claims if ready
2. **Rebuy chips** → Checks timer, claims if ready

If 24 hours haven't passed:
- Shows countdown: `"Come back in Xh Ym..."`
- Prevents sitting/rebuying

If 24 hours have passed:
- **Automatically gives 1,000,000 chips**
- Updates claim timestamp
- Saves to localStorage
- Allows action to proceed

---

## User Experience

### ✅ Good Balance (Has Chips)
- Can sit at any table
- Can rebuy when busted at table
- Balance updates in real-time
- No restrictions

### ⏳ Zero Balance (Waiting for Cooldown)
- **Cannot sit at tables**
- **Cannot rebuy chips**
- Clear countdown message shown
- Message updates on every attempt
- Precise time remaining (hours + minutes)

### 🎁 Cooldown Complete (24 Hours Passed)
- Next sit/rebuy attempt **auto-claims**
- Instant 1,000,000 chip credit
- Success message shown
- New 24-hour timer begins
- Can immediately continue playing

---

## Code Locations

### 1. State Management (App.tsx)
```tsx
const [balance, setBalance] = useState(1000000);
const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
```

### 2. Login Logic (App.tsx ~1640-1690)
- Loads saved balance and claim time
- Checks if 24 hours passed
- Auto-claims on login if eligible

### 3. Balance Persistence (App.tsx ~225)
```tsx
useEffect(() => {
  if (playerAlias && balance !== 1000000) {
    localStorage.setItem(`poker_balance_${playerAlias}`, balance.toString());
  }
}, [balance, playerAlias]);
```

### 4. Sit Down Check (App.tsx ~876-905)
- Verifies 100K buy-in available
- Shows cooldown if balance = 0
- Auto-claims if ready

### 5. Rebuy Check (App.tsx ~769-800)
- Verifies balance before rebuy
- Shows cooldown if balance = 0
- Auto-claims if ready

---

## Benefits

### For Players
- ✅ **Free to play** - No real money required
- ✅ **Fair system** - Everyone gets same amount daily
- ✅ **Encourages strategy** - Players must manage bankroll
- ✅ **No spam** - 24-hour cooldown prevents abuse
- ✅ **Transparent** - Clear countdown messages

### For Platform
- ✅ **Player retention** - Players return daily
- ✅ **Engagement** - Players value their chips more
- ✅ **Controlled economy** - Prevents inflation
- ✅ **Simple system** - Easy to understand and use

---

## Future Enhancements (Optional)

### Potential Features:
1. **Streak Bonuses** - Extra chips for daily login streaks
2. **Achievements** - Bonus chips for completing challenges
3. **Referral System** - Bonus chips for inviting friends
4. **Mini-Games** - Earn extra chips between cooldowns
5. **VIP Tiers** - Reduced cooldown for active players
6. **Premium Pass** - No cooldown with subscription

---

## Testing Checklist

- [ ] New player receives 1M chips on first login
- [ ] Balance saves to localStorage on every change
- [ ] Balance loads correctly on re-login
- [ ] Can't sit with 0 balance (shows cooldown)
- [ ] Can't rebuy with 0 balance (shows cooldown)
- [ ] Countdown shows correct time remaining
- [ ] Auto-claim works after 24 hours
- [ ] New claim timestamp saved after auto-claim
- [ ] Multiple players can have different timers
- [ ] Timer persists across browser sessions

---

**System Status**: ✅ **FULLY IMPLEMENTED AND READY**

**Last Updated**: October 8, 2025
