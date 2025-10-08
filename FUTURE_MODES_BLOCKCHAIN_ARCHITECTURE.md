# Future Game Modes Architecture & Blockchain Deployment Prep

## Overview
This document outlines the architecture needed for:
1. **Tournament Mode** (Multi-table tournaments with blind increases)
2. **Heads-Up 1v1 Mode** (Direct player vs player)
3. **Blockchain Deployment** (Smart contract integration)

**Status:** Planning Document - To be implemented before blockchain deployment

---

## Current Game Modes (Implemented)

### ✅ Multi-Player Poker (4-6 players)
- **File:** `MultiPlayerPokerGame.ts`
- **Features:** 
  - 4-6 player cash game
  - Individual timeout tracking
  - AI opponent logic
  - Rake collection
  - Session stats tracking

### ✅ Heads-Up Demo (AI opponent)
- **File:** `HeadsUpPokerGame.ts`
- **Features:**
  - 1v1 vs AI
  - Basic game flow
  - Timeout system

---

## 🎯 Planned: Tournament Mode

### Core Features Needed

#### 1. **Tournament Structure Interface**
```typescript
export interface Tournament {
  tournamentId: string;
  name: string;
  buyIn: number;
  prizePool: number;
  startingChips: number;
  players: TournamentPlayer[];
  tables: TournamentTable[];
  blindSchedule: BlindLevel[];
  currentLevel: number;
  status: 'registration' | 'running' | 'completed';
  startTime: number;
  maxPlayers: number;
  registeredPlayers: number;
}

export interface TournamentPlayer {
  address: string;
  alias: string;
  avatar: string;
  chips: number;
  tableId: string;
  seatNumber: number;
  bustedOut: boolean;
  finishPosition?: number;
  prize?: number;
}

export interface TournamentTable {
  tableId: string;
  players: TournamentPlayer[];
  game: MultiPlayerPokerGame;
  status: 'active' | 'paused' | 'completed';
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  duration: number; // minutes
}
```

#### 2. **Blind Schedule System**
```typescript
class TournamentBlindManager {
  private currentLevel: number = 0;
  private levelStartTime: number = 0;
  private blindSchedule: BlindLevel[] = [
    { level: 1, smallBlind: 25, bigBlind: 50, duration: 10 },
    { level: 2, smallBlind: 50, bigBlind: 100, duration: 10 },
    { level: 3, smallBlind: 75, bigBlind: 150, duration: 10 },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 10 },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 10 },
    // ... progressive increases
  ];

  advanceLevel(): void;
  getCurrentBlinds(): { small: number; big: number; ante?: number };
  getTimeUntilNextLevel(): number;
}
```

#### 3. **Table Balancing**
When players bust out, tables need rebalancing:
```typescript
class TableBalancer {
  balanceTables(tournament: Tournament): void {
    // Move players from full tables to short tables
    // Merge tables when < 6 players remain per table
    // Break tables when only 1-2 tables remain
  }

  mergeTables(table1: TournamentTable, table2: TournamentTable): TournamentTable;
  breakTable(table: TournamentTable, targetTables: TournamentTable[]): void;
}
```

#### 4. **Prize Distribution**
```typescript
interface PrizeStructure {
  positions: number; // Number of paid positions
  percentages: number[]; // Percentage of pool for each position
}

// Example: 100-player tournament
const standardPrizeStructure: PrizeStructure = {
  positions: 10,
  percentages: [40, 20, 12, 8, 6, 4, 3, 2.5, 2.5, 2] // Adds to 100%
};

class PrizeManager {
  calculatePrizes(prizePool: number, structure: PrizeStructure): number[];
  distributePrizes(tournament: Tournament): void;
}
```

#### 5. **Tournament Lobby**
New component needed:
```typescript
// TournamentLobby.tsx
interface TournamentLobbyProps {
  availableTournaments: Tournament[];
  onRegister: (tournamentId: string, buyIn: number) => void;
  onUnregister: (tournamentId: string) => void;
}
```

#### 6. **Files to Create**
- `TournamentManager.ts` - Core tournament logic
- `TournamentBlindManager.ts` - Blind progression
- `TableBalancer.ts` - Table rebalancing
- `PrizeDistributor.ts` - Prize calculations
- `TournamentLobby.tsx` - Tournament selection UI
- `TournamentTable.tsx` - Tournament-specific table UI
- `BlindTimer.tsx` - Countdown to next blind level

---

## 🎯 Planned: Heads-Up 1v1 Mode (Real Players)

### Core Features Needed

#### 1. **Matchmaking System**
```typescript
interface HeadsUpMatch {
  matchId: string;
  player1: string; // wallet address
  player2: string; // wallet address
  buyIn: number;
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  createdAt: number;
}

class MatchmakingQueue {
  private queue: Map<number, string[]> = new Map(); // buyIn -> [addresses]
  
  joinQueue(address: string, buyIn: number): void;
  leaveQueue(address: string): void;
  findMatch(address: string, buyIn: number): HeadsUpMatch | null;
}
```

#### 2. **Real-time P2P Communication**
Currently using Socket.IO for chat. Need to extend for game state sync:

```typescript
// Socket events to add
socket.on('headsup:match_found', (match: HeadsUpMatch) => {});
socket.on('headsup:opponent_action', (action: PlayerAction) => {});
socket.on('headsup:opponent_disconnected', () => {});
socket.on('headsup:opponent_timeout', () => {});

socket.emit('headsup:join_queue', { buyIn: 10000 });
socket.emit('headsup:action', { type: 'raise', amount: 500 });
```

#### 3. **Heads-Up Specific Game Engine**
Enhance existing `HeadsUpPokerGame.ts`:
```typescript
class RealPlayerHeadsUpGame extends HeadsUpPokerGame {
  private opponentAddress: string;
  private socket: Socket;
  
  // Override AI logic with socket-based opponent actions
  handleOpponentAction(action: PlayerAction): void;
  syncGameState(): void;
  handleDisconnection(): void;
}
```

#### 4. **Files to Create/Modify**
- `MatchmakingQueue.ts` - Queue management
- `HeadsUpMatchmaking.tsx` - UI for finding matches
- `RealPlayerHeadsUpGame.ts` - P2P game engine
- Enhance `HeadsUpPokerGame.ts` - Support real players

---

## 🔗 Blockchain Integration Architecture

### Smart Contract Requirements

#### 1. **Poker Table Contract**
```solidity
// PokerTable.sol
contract PokerTable {
    struct Table {
        uint256 tableId;
        uint256 minBuyIn;
        uint256 maxBuyIn;
        uint256 smallBlind;
        uint256 bigBlind;
        address[] players;
        mapping(address => uint256) balances;
        uint256 rake; // Rake percentage (e.g., 5 = 5%)
        uint256 totalRakeCollected;
    }
    
    function sitDown(uint256 tableId, uint256 buyIn) external payable;
    function standUp(uint256 tableId) external;
    function collectRake(uint256 tableId, uint256 amount) external;
    function withdrawWinnings(uint256 tableId, uint256 amount) external;
}
```

#### 2. **Tournament Contract**
```solidity
// PokerTournament.sol
contract PokerTournament {
    struct TournamentData {
        uint256 tournamentId;
        uint256 buyIn;
        uint256 prizePool;
        uint256 startingChips;
        uint256 maxPlayers;
        uint256 registeredPlayers;
        address[] players;
        mapping(address => bool) registered;
        TournamentStatus status;
        uint256 startTime;
    }
    
    enum TournamentStatus { Registration, Running, Completed }
    
    function registerForTournament(uint256 tournamentId) external payable;
    function unregisterFromTournament(uint256 tournamentId) external;
    function startTournament(uint256 tournamentId) external;
    function distributePrizes(uint256 tournamentId, address[] calldata winners, uint256[] calldata amounts) external;
}
```

#### 3. **Provably Fair Contract**
```solidity
// ProvablyFair.sol
contract ProvablyFair {
    struct DeckData {
        bytes32 serverSeedHash; // Hashed before hand
        bytes32 clientSeed;     // Player provides
        bytes32 combinedHash;   // Used for shuffling
        uint256 timestamp;
    }
    
    function submitServerSeedHash(bytes32 hash) external;
    function submitClientSeed(bytes32 seed) external;
    function revealServerSeed(bytes32 seed) external;
    function verifyDeck(bytes32 serverSeed, bytes32 clientSeed) external view returns (bool);
}
```

#### 4. **Heads-Up Match Contract**
```solidity
// HeadsUpMatch.sol
contract HeadsUpMatch {
    struct Match {
        uint256 matchId;
        address player1;
        address player2;
        uint256 buyIn;
        address winner;
        MatchStatus status;
        uint256 startTime;
        uint256 endTime;
    }
    
    enum MatchStatus { Waiting, Active, Completed, Cancelled }
    
    function createMatch(uint256 buyIn) external payable returns (uint256 matchId);
    function joinMatch(uint256 matchId) external payable;
    function completeMatch(uint256 matchId, address winner) external;
    function cancelMatch(uint256 matchId) external;
}
```

### Frontend Integration Points

#### 1. **Web3 Provider Setup**
```typescript
// web3Provider.ts
import { ethers } from 'ethers';

export class Web3Provider {
  private provider: ethers.BrowserProvider;
  private signer: ethers.Signer;
  
  async connect(): Promise<string> {
    // Connect to MetaMask or other wallet
  }
  
  async getBalance(address: string): Promise<bigint> {
    // Get SHIDO balance
  }
  
  async approveToken(spender: string, amount: bigint): Promise<void> {
    // Approve token spending
  }
}
```

#### 2. **Contract Interaction Layer**
```typescript
// contracts/PokerTableContract.ts
export class PokerTableContract {
  private contract: ethers.Contract;
  
  async sitDown(tableId: number, buyIn: number): Promise<ethers.TransactionResponse> {
    return await this.contract.sitDown(tableId, ethers.parseEther(buyIn.toString()));
  }
  
  async standUp(tableId: number): Promise<ethers.TransactionResponse> {
    return await this.contract.standUp(tableId);
  }
  
  async collectRake(tableId: number, amount: number): Promise<ethers.TransactionResponse> {
    return await this.contract.collectRake(tableId, ethers.parseEther(amount.toString()));
  }
}
```

#### 3. **State Synchronization**
```typescript
// syncManager.ts
class BlockchainSyncManager {
  // Listen to contract events
  subscribeToTableEvents(tableId: number): void {
    this.contract.on('PlayerJoined', (player, buyIn) => {
      // Update UI
    });
    
    this.contract.on('RakeCollected', (amount) => {
      // Update rake display
    });
  }
  
  // Sync game state to blockchain periodically
  async syncGameState(tableId: number, state: MultiPlayerGameState): Promise<void> {
    // Store critical state on-chain
  }
}
```

### Files to Create

#### Smart Contracts (Solidity)
- `contracts/PokerTable.sol`
- `contracts/PokerTournament.sol`
- `contracts/HeadsUpMatch.sol`
- `contracts/ProvablyFair.sol`
- `contracts/RakeCollector.sol`
- `contracts/LeaderboardRegistry.sol`

#### Web3 Integration (TypeScript)
- `web3/Web3Provider.ts`
- `web3/contracts/PokerTableContract.ts`
- `web3/contracts/TournamentContract.ts`
- `web3/contracts/MatchContract.ts`
- `web3/contracts/FairnessContract.ts`
- `web3/BlockchainSyncManager.ts`
- `web3/TransactionQueue.ts`
- `web3/GasEstimator.ts`

---

## 🔧 Infrastructure Needed

### Backend Server Requirements

#### 1. **Game State Authority**
```typescript
// server/GameStateAuthority.ts
class GameStateAuthority {
  // Authoritative game state validation
  validateAction(tableId: string, action: PlayerAction): boolean;
  
  // Prevent cheating
  detectInvalidActions(gameState: MultiPlayerGameState): boolean;
  
  // Sync state to blockchain
  commitStateToBlockchain(tableId: string): Promise<void>;
}
```

#### 2. **Match Server**
```typescript
// server/MatchServer.ts
class MatchServer {
  private activeMatches: Map<string, HeadsUpMatch> = new Map();
  private matchmakingQueue: MatchmakingQueue;
  
  handlePlayerAction(matchId: string, playerId: string, action: PlayerAction): void;
  broadcastGameState(matchId: string): void;
  handleDisconnection(playerId: string): void;
}
```

#### 3. **Tournament Server**
```typescript
// server/TournamentServer.ts
class TournamentServer {
  private activeTournaments: Map<string, Tournament> = new Map();
  
  advanceBlindLevels(): void;
  balanceTables(): void;
  handlePlayerElimination(tournamentId: string, playerId: string): void;
  distributePrizes(tournamentId: string): Promise<void>;
}
```

### Database Schema

#### PostgreSQL Tables Needed
```sql
-- Tables
CREATE TABLE poker_tables (
    table_id VARCHAR(36) PRIMARY KEY,
    min_buy_in BIGINT NOT NULL,
    max_buy_in BIGINT NOT NULL,
    small_blind BIGINT NOT NULL,
    big_blind BIGINT NOT NULL,
    rake_percent DECIMAL(5,2),
    max_players INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tournaments
CREATE TABLE tournaments (
    tournament_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    buy_in BIGINT NOT NULL,
    prize_pool BIGINT DEFAULT 0,
    starting_chips BIGINT NOT NULL,
    max_players INTEGER NOT NULL,
    registered_players INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'registration',
    start_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches (Heads-Up)
CREATE TABLE headsup_matches (
    match_id VARCHAR(36) PRIMARY KEY,
    player1_address VARCHAR(42) NOT NULL,
    player2_address VARCHAR(42),
    buy_in BIGINT NOT NULL,
    winner_address VARCHAR(42),
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Player Stats
CREATE TABLE player_stats (
    address VARCHAR(42) PRIMARY KEY,
    alias VARCHAR(50),
    total_hands_played INTEGER DEFAULT 0,
    total_hands_won INTEGER DEFAULT 0,
    total_won BIGINT DEFAULT 0,
    total_lost BIGINT DEFAULT 0,
    biggest_pot BIGINT DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hand History (for replay/verification)
CREATE TABLE hand_history (
    hand_id VARCHAR(36) PRIMARY KEY,
    table_id VARCHAR(36) REFERENCES poker_tables(table_id),
    hand_number INTEGER NOT NULL,
    players JSONB NOT NULL,
    community_cards JSONB NOT NULL,
    pot INTEGER NOT NULL,
    winner_address VARCHAR(42),
    winning_hand VARCHAR(100),
    played_at TIMESTAMP DEFAULT NOW(),
    blockchain_tx VARCHAR(66)
);
```

---

## 📋 Implementation Checklist

### Phase 1: Tournament Mode Foundation
- [ ] Create `Tournament` and `TournamentTable` interfaces
- [ ] Implement `TournamentBlindManager`
- [ ] Build `TournamentLobby.tsx` component
- [ ] Create `BlindTimer.tsx` component
- [ ] Add blind level advancement logic
- [ ] Implement table balancing algorithm
- [ ] Build prize distribution system
- [ ] Add tournament registration flow
- [ ] Test multi-table gameplay
- [ ] Test table merging/breaking

### Phase 2: Heads-Up Real Player Mode
- [ ] Create `MatchmakingQueue.ts`
- [ ] Build `HeadsUpMatchmaking.tsx` UI
- [ ] Implement `RealPlayerHeadsUpGame.ts`
- [ ] Add socket events for P2P actions
- [ ] Handle opponent disconnections
- [ ] Add reconnection logic
- [ ] Implement match cancellation
- [ ] Test P2P gameplay
- [ ] Add spectator mode

### Phase 3: Blockchain Smart Contracts
- [ ] Write `PokerTable.sol`
- [ ] Write `PokerTournament.sol`
- [ ] Write `HeadsUpMatch.sol`
- [ ] Write `ProvablyFair.sol`
- [ ] Write `RakeCollector.sol`
- [ ] Deploy to testnet
- [ ] Audit smart contracts (security)
- [ ] Deploy to mainnet

### Phase 4: Web3 Integration
- [ ] Create `Web3Provider.ts`
- [ ] Build contract interaction layer
- [ ] Implement `BlockchainSyncManager.ts`
- [ ] Add transaction queue system
- [ ] Handle gas estimation
- [ ] Add wallet connection flow
- [ ] Implement deposit/withdraw UI
- [ ] Add transaction history
- [ ] Test on testnet
- [ ] Optimize gas usage

### Phase 5: Backend Infrastructure
- [ ] Set up Node.js + Express server
- [ ] Create PostgreSQL database
- [ ] Implement `GameStateAuthority.ts`
- [ ] Build `MatchServer.ts`
- [ ] Build `TournamentServer.ts`
- [ ] Add Redis for caching
- [ ] Implement rate limiting
- [ ] Add authentication (JWT)
- [ ] Set up monitoring (Datadog/New Relic)
- [ ] Deploy to cloud (AWS/GCP)

### Phase 6: Security & Testing
- [ ] Penetration testing
- [ ] Smart contract audit (CertiK/OpenZeppelin)
- [ ] Load testing (1000+ concurrent users)
- [ ] Fuzz testing for edge cases
- [ ] Verify provably fair system
- [ ] Test timeout/disconnection scenarios
- [ ] Bug bounty program
- [ ] Security documentation

---

## 🎮 Game Mode Selector (Future UI)

```typescript
// GameModeSelector.tsx
interface GameMode {
  id: 'cash' | 'tournament' | 'headsup';
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  available: boolean;
}

const gameModes: GameMode[] = [
  {
    id: 'cash',
    name: 'Cash Game',
    description: '4-6 player table with flexible buy-ins',
    icon: '💰',
    minPlayers: 4,
    maxPlayers: 6,
    available: true
  },
  {
    id: 'tournament',
    name: 'Tournament',
    description: 'Multi-table tournament with blind progression',
    icon: '🏆',
    minPlayers: 10,
    maxPlayers: 1000,
    available: false // Coming soon
  },
  {
    id: 'headsup',
    name: 'Heads-Up',
    description: '1v1 quick match against another player',
    icon: '🎯',
    minPlayers: 2,
    maxPlayers: 2,
    available: false // Coming soon
  }
];
```

---

## 💡 Key Considerations Before Deployment

### 1. **Legal Compliance**
- Check gambling laws in target jurisdictions
- Consider skill-based vs chance-based classification
- Implement age verification (18+/21+)
- Add responsible gaming features
- Terms of Service and Privacy Policy

### 2. **Gas Optimization**
- Batch transactions where possible
- Use Layer 2 solutions (Polygon, Arbitrum)
- Minimize on-chain storage
- Use events instead of storage for history
- Implement off-chain state with on-chain checkpoints

### 3. **Scalability**
- WebSocket server clustering
- Database read replicas
- CDN for static assets
- Load balancer for multiple servers
- Horizontal scaling strategy

### 4. **Security**
- Rate limiting on all endpoints
- DDoS protection (Cloudflare)
- Encrypted WebSocket connections (WSS)
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### 5. **User Experience**
- Mobile responsive design
- Progressive Web App (PWA)
- Offline mode for UI
- Loading states and error handling
- Tutorial/onboarding flow
- Help documentation

---

## 📊 Estimated Development Timeline

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| **Tournament Mode** | 4-6 weeks | High |
| **Heads-Up P2P** | 3-4 weeks | High |
| **Smart Contracts** | 6-8 weeks | Critical |
| **Web3 Integration** | 4-5 weeks | Critical |
| **Backend Server** | 5-6 weeks | Critical |
| **Security Audit** | 2-3 weeks | Critical |
| **Testing & QA** | 3-4 weeks | Critical |
| **Total** | **27-36 weeks** | **(~6-9 months)** |

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All smart contracts audited
- [ ] Backend server load tested
- [ ] Security penetration test passed
- [ ] Legal compliance verified
- [ ] Gas costs optimized
- [ ] Documentation complete
- [ ] Bug bounty program launched

### Deployment
- [ ] Deploy contracts to mainnet
- [ ] Verify contracts on Etherscan
- [ ] Deploy backend to production
- [ ] Set up monitoring and alerts
- [ ] Configure CDN
- [ ] Set up analytics (Google Analytics/Mixpanel)
- [ ] Launch marketing campaign

### Post-Deployment
- [ ] Monitor contract interactions
- [ ] Track gas usage
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Plan feature updates
- [ ] Community management

---

**Status:** 📝 Planning Phase - Ready for implementation when needed

**Next Steps:** 
1. Complete current stats banner implementation
2. Finalize core 4-6 player gameplay
3. Begin tournament mode development
4. Then move to blockchain integration
