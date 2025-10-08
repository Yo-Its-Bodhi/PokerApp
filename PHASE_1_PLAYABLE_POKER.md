# 🎰 Phase 1: Playable Poker (No Web3)

## 🎯 GOAL
Create a fully functional, play-money poker game where users can:
- Log in with just an alias (no wallet)
- Choose 1-5 AI opponents
- Play actual poker with proper rules
- Track stats locally
- Deploy to a public URL for testing

---

## ✅ PRIORITY CHECKLIST

### 1. Remove Web3 Requirements ❌ NOT STARTED
- [ ] Remove wallet connection logic
- [ ] Remove ethers.js dependencies from UI
- [ ] Remove MetaMask integration
- [ ] Remove "Connect Wallet" button
- [ ] Remove wallet address display
- [ ] Simplify to alias-only login
- [ ] Update LoginScreen to only ask for alias + avatar

### 2. Fix Chip Distribution & Stakes 💰 NOT STARTED
- [ ] Change starting stack: **1,000,000 chips** (1M)
- [ ] Update blinds to match chip stack:
  - Small Blind: **5,000** (0.5% of stack)
  - Big Blind: **10,000** (1% of stack)
- [ ] Update default bet slider ranges
- [ ] Update min/max bet limits
- [ ] Update UI to show larger numbers properly
- [ ] Test rebuy system with new amounts

### 3. AI Opponent Selector 🤖 NOT STARTED
- [ ] Create opponent count selector (1-5 AI players)
- [ ] Add to lobby screen or game setup
- [ ] Visual selector: buttons/slider to choose count
- [ ] Update MultiPlayerPokerGame to handle 2-6 total players
- [ ] Generate AI player profiles dynamically
- [ ] Assign AI avatars and names automatically
- [ ] Test with different AI counts (2, 3, 4, 5, 6 players)

### 4. Local Stats Tracking 📊 NOT STARTED
- [ ] Implement localStorage for session stats
- [ ] Track per-session:
  - Hands played
  - Hands won
  - Biggest pot won
  - Total chips won/lost
  - Win rate %
  - All-in success rate
- [ ] Show stats in UI (modal or panel)
- [ ] Clear stats button
- [ ] Export stats to JSON option

### 5. Polish & Testing 🎨 NOT STARTED
- [ ] Test full game flow from login to hand completion
- [ ] Verify all-in logic works correctly
- [ ] Test with different AI opponent counts
- [ ] Verify blinds post correctly
- [ ] Test rebuy system
- [ ] Check all animations work
- [ ] Verify sound effects play
- [ ] Test sit-out functionality
- [ ] Mobile responsive check
- [ ] Cross-browser testing

### 6. Deployment 🚀 NOT STARTED
- [ ] Build production version (`npm run build`)
- [ ] Choose hosting platform:
  - Netlify (recommended - free, easy)
  - Vercel (alternative)
  - GitHub Pages
  - Surge.sh
- [ ] Deploy to public URL
- [ ] Test deployed version
- [ ] Get shareable link
- [ ] Share with testers

---

## 📋 DETAILED IMPLEMENTATION PLAN

### Step 1: Remove Web3 (Wallet-Free Login)

**Files to Modify:**
- `App.tsx` - Remove wallet connection logic
- `LoginScreen.tsx` - Simplify to alias + avatar only
- `package.json` - Remove ethers.js (optional, can keep for Phase 2)

**Changes in App.tsx:**
```typescript
// REMOVE these states:
const [walletConnected, setWalletConnected] = useState(false);
const [walletAddress, setWalletAddress] = useState('');
const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
const [signer, setSigner] = useState<ethers.Signer | null>(null);
const [chainId, setChainId] = useState<number | null>(null);

// REMOVE connectWallet() function
// REMOVE checkWalletConnection() function

// UPDATE appState flow:
// SPLASH -> LOGIN -> LOBBY -> GAME
// Skip wallet connection step entirely

// UPDATE header buttons:
// Only show: Sound Settings, Help, Leave Table (no wallet info)
```

**Changes in LoginScreen.tsx:**
```typescript
// REMOVE wallet connection button
// Only show:
// - Alias input field
// - Avatar selector
// - "PLAY POKER" button (starts demo mode automatically)
```

---

### Step 2: Fix Chip Distribution & Stakes

**Current Values:**
- Starting stack: 1,000,000 SHIDO
- Small Blind: 500
- Big Blind: 1,000

**New Values (Better Proportion):**
- Starting stack: **1,000,000 chips**
- Small Blind: **5,000** (200 BB deep)
- Big Blind: **10,000**

**Files to Modify:**
- `App.tsx` - Update initial balance
- `HeadsUpPokerGame.ts` - Update blind amounts
- `MultiPlayerPokerGame.ts` - Update blind amounts
- `RealisticTable.tsx` - Update blind display

**Changes:**
```typescript
// App.tsx
const [balance, setBalance] = useState(1000000); // ✅ Already correct!

// HeadsUpPokerGame.ts (line ~50-60)
SMALL_BLIND: 5000  // Change from 500
BIG_BLIND: 10000   // Change from 1000

// MultiPlayerPokerGame.ts (line ~50-60)
SMALL_BLIND: 5000
BIG_BLIND: 10000

// Update bet slider ranges
MIN_BET: 10000      // One BB
MAX_BET: 1000000    // All-in
```

---

### Step 3: AI Opponent Selector

**Design:**
Add to Lobby screen before sitting at table:

```
┌────────────────────────────────────┐
│  Choose Number of AI Opponents     │
│                                    │
│  [1] [2] [3] [4] [5]              │
│                                    │
│  Total Players: You + X AI        │
│                                    │
│  [START GAME]                      │
└────────────────────────────────────┘
```

**Files to Create/Modify:**
- `Lobby.tsx` - Add opponent selector UI
- `App.tsx` - Pass AI count to game engine
- `MultiPlayerPokerGame.ts` - Handle variable player count

**Implementation:**
```typescript
// Add state in App.tsx
const [aiOpponentCount, setAiOpponentCount] = useState(1); // 1-5

// Pass to game engine when starting
const game = new MultiPlayerPokerGame(
  playerSeat,
  balance,
  aiOpponentCount + 1 // +1 for human player
);

// Update MultiPlayerPokerGame constructor
constructor(
  playerSeat: number,
  initialStack: number,
  totalPlayers: number = 2 // Default to heads-up
) {
  // Generate AI players dynamically
  for (let i = 0; i < totalPlayers; i++) {
    if (i !== playerSeat) {
      this.players[i] = {
        name: `AI Player ${i + 1}`,
        stack: initialStack,
        isAI: true,
        // ... other properties
      };
    }
  }
}
```

---

### Step 4: Local Stats Tracking

**Stats to Track:**
```typescript
interface SessionStats {
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  totalWinnings: number; // Can be negative
  allInAttempts: number;
  allInWins: number;
  foldCount: number;
  checkCount: number;
  raiseCount: number;
  startTime: number; // timestamp
}
```

**Storage:**
```typescript
// Save to localStorage after each hand
const saveStats = (stats: SessionStats) => {
  localStorage.setItem('poker_session_stats', JSON.stringify(stats));
};

// Load on app start
const loadStats = (): SessionStats => {
  const saved = localStorage.getItem('poker_session_stats');
  return saved ? JSON.parse(saved) : defaultStats;
};
```

**UI Component:**
- Create `SessionStatsModal.tsx` (already exists, needs update)
- Add "View Stats" button to header
- Show stats in clean modal
- Add "Reset Stats" button
- Add "Export Stats" button (download JSON)

---

### Step 5: Deployment Options

#### Option A: Netlify (Recommended)
```bash
# 1. Build production version
npm run build

# 2. Install Netlify CLI
npm install -g netlify-cli

# 3. Deploy
netlify deploy --prod --dir=dist

# You'll get a public URL like:
# https://shido-poker-xyz123.netlify.app
```

#### Option B: Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod

# Auto-detects Vite, deploys dist folder
```

#### Option C: GitHub Pages
```bash
# 1. Update vite.config.ts
export default defineConfig({
  base: '/Poker/', // repo name
  // ... rest of config
});

# 2. Build
npm run build

# 3. Deploy with gh-pages package
npm install -g gh-pages
gh-pages -d dist
```

#### Option D: Surge.sh (Fastest)
```bash
# 1. Install Surge
npm install -g surge

# 2. Build and deploy
npm run build
cd dist
surge

# Pick a domain like: shido-poker.surge.sh
```

---

## 🎯 SUCCESS CRITERIA

Phase 1 is complete when:
- ✅ User can log in with just an alias (no wallet)
- ✅ User can select 1-5 AI opponents
- ✅ Starting stack is 1M chips
- ✅ Blinds are 5K/10K
- ✅ Full poker game works correctly
- ✅ Stats are tracked locally
- ✅ Game is deployed to public URL
- ✅ You can share link and play immediately

---

## 📊 ESTIMATED EFFORT

| Task | Time | Complexity |
|------|------|------------|
| Remove Web3 | 30 min | Low |
| Fix Chip Amounts | 15 min | Low |
| AI Opponent Selector | 1 hour | Medium |
| Local Stats Tracking | 1 hour | Medium |
| Testing & Polish | 1 hour | Medium |
| Deployment | 30 min | Low |
| **TOTAL** | **~4.5 hours** | **Medium** |

---

## 🚀 AFTER PHASE 1

Once this is working and tested:

### Phase 2: Web3 Integration
- Add wallet connection back
- Add real-money mode toggle
- Integrate with smart contracts
- Add deposit/withdraw
- Add leaderboard on-chain

### Phase 3: Multiplayer
- Add real multiplayer support
- Multiple tables
- Tournaments
- Chat between real players

---

## 🛠️ QUICK START COMMANDS

```bash
# Navigate to project
cd "c:\Users\dj_ba\Desktop\Poker\web"

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to Surge (after build)
cd dist
surge
```

---

## 📝 NOTES

- Keep all Web3 code commented out (not deleted) for Phase 2
- Use feature flags to switch between play-money and real-money modes
- localStorage is sufficient for Phase 1 (no backend needed)
- Focus on gameplay first, polish later
- Test with different screen sizes
- Get feedback from testers before moving to Phase 2

---

**Let's fucking build this! 🎰🔥**
