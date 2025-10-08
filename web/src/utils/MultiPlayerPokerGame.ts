// Multi-Player Poker Game (4-6 players)
// @ts-ignore
import { Hand } from 'pokersolver';
import { playWinPot, playFold, playCheck, playChipBet, playRaise, audioSystem } from './audioSystem';

export interface Player {
  seat: number;
  stack: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  isMe?: boolean;
  name?: string;
  avatar?: string;
  isDealer?: boolean;
  hasActed?: boolean;
  cards?: number[];
  lastAction?: {
    type: 'fold' | 'check' | 'call' | 'raise' | 'bet' | 'allin';
    text: string;
    amount?: number;
  };
  timeouts?: number; // Consecutive timeouts (0-2)
  timeoutWarning?: boolean; // Show warning on next timeout
}

export interface MultiPlayerGameState {
  players: Player[];
  communityCards: number[];
  pot: number;
  sidePots?: Array<{ amount: number; eligiblePlayers: number[] }>; // Side pots for all-in situations
  street: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentPlayer: number; // seat number
  dealerButton: number; // seat number
  smallBlind: number;
  bigBlind: number;
  currentBet: number; // highest bet this street
  gameLog: Array<{ action: string; type: string; timestamp: number }>;
  rake: number;
  totalRakeCollected: number;
  showdown: boolean;
  winningHand?: string;
  flopDealt: boolean;
}

export class MultiPlayerPokerGame {
  private state: MultiPlayerGameState;
  private onStateUpdate: (state: MultiPlayerGameState) => void;
  private onTurnStart?: (seatNumber: number) => void;
  private onHandComplete?: (handData: { handNumber: number; winner: string; handType: string; potSize: number; timestamp: number }) => void;
  private deck: number[];
  private playerCount: number;
  private humanPlayerSeat: number;
  private lastRaiseAmount: number = 0;
  private handCount: number = 0;
  private isHandActive: boolean = false; // Track if we're in an active hand
  private pendingAIActions: NodeJS.Timeout[] = []; // Track AI action timeouts

  constructor(
    humanPlayerSeat: number,
    playerCount: number, // 4, 5, or 6
    onStateUpdate: (state: MultiPlayerGameState) => void,
    onTurnStart?: (seatNumber: number) => void,
    onHandComplete?: (handData: { handNumber: number; winner: string; handType: string; potSize: number; timestamp: number }) => void
  ) {
    this.humanPlayerSeat = humanPlayerSeat;
    this.playerCount = Math.min(Math.max(playerCount, 4), 6); // Clamp to 4-6
    this.onStateUpdate = onStateUpdate;
    this.onTurnStart = onTurnStart;
    this.onHandComplete = onHandComplete;
    this.deck = [];

    // AI names and avatars
    const aiNames = [
      { name: 'AI Alpha', avatar: '🤖' },
      { name: 'AI Beta', avatar: '🎮' },
      { name: 'AI Gamma', avatar: '👾' },
      { name: 'AI Delta', avatar: '🎯' },
      { name: 'AI Epsilon', avatar: '🎲' }
    ];

    // Create players array - fill seats dynamically based on human seat and player count
    const players: Player[] = [];
    let aiIndex = 0;

    // First, add the human player at their chosen seat
    players.push({
      seat: humanPlayerSeat,
      stack: 100000,
      bet: 0,
      folded: false,
      allIn: false,
      isMe: true,
      isDealer: humanPlayerSeat === 1,
      hasActed: false,
      cards: [],
      timeouts: 0,
      timeoutWarning: false
    });

    // Then fill remaining seats with AI (playerCount - 1 AI players)
    const totalSeats = 6; // Maximum table seats
    let aiPlayersAdded = 0;
    const aiPlayersNeeded = this.playerCount - 1; // Total players minus human

    for (let seat = 1; seat <= totalSeats && aiPlayersAdded < aiPlayersNeeded; seat++) {
      if (seat !== humanPlayerSeat) {
        // Add AI player
        players.push({
          seat,
          stack: 100000,
          bet: 0,
          folded: false,
          allIn: false,
          isMe: false, // Mark as AI player
          name: aiNames[aiIndex % aiNames.length].name,
          avatar: aiNames[aiIndex % aiNames.length].avatar,
          isDealer: seat === 1 && humanPlayerSeat !== 1,
          hasActed: false,
          cards: [],
          timeouts: 0,
          timeoutWarning: false
        });
        aiIndex++;
        aiPlayersAdded++;
      }
    }

    // Randomize starting dealer button from actual player seats
    const playerSeats = players.map(p => p.seat);
    const randomIndex = Math.floor(Math.random() * playerSeats.length);
    const randomDealer = playerSeats[randomIndex];
    
    // Set isDealer flag for the chosen dealer
    const dealerPlayer = players.find(p => p.seat === randomDealer);
    if (dealerPlayer) {
      dealerPlayer.isDealer = true;
    }

    this.state = {
      players,
      communityCards: [],
      pot: 0,
      street: 'preflop',
      currentPlayer: 1,
      dealerButton: randomDealer,
      smallBlind: 5000,
      bigBlind: 10000,
      currentBet: 0,
      gameLog: [],
      rake: 0,
      totalRakeCollected: 0,
      showdown: false,
      flopDealt: false
    };
  }

  public getState(): MultiPlayerGameState {
    return this.state;
  }

  // Add chips to a player's stack (for rebuys)
  public addChips(seatNumber: number, amount: number): void {
    const player = this.state.players.find(p => p.seat === seatNumber);
    if (player) {
      player.stack += amount;
      console.log(`[addChips] Added ${amount} chips to seat ${seatNumber}. New stack: ${player.stack}`);
    } else {
      console.error(`[addChips] Player at seat ${seatNumber} not found`);
    }
  }

  // Calculate side pots when players are all-in
  private calculateSidePots(): void {
    const activePlayers = this.state.players.filter(p => !p.folded);
    const allInPlayers = activePlayers.filter(p => p.allIn);
    
    // If no all-in players, no side pots needed
    if (allInPlayers.length === 0) {
      this.state.sidePots = [];
      return;
    }

    // Create array of all player contributions (total bet including current street)
    const contributions = activePlayers.map(p => ({
      seat: p.seat,
      totalBet: p.bet,
      folded: p.folded,
      allIn: p.allIn
    }));

    // Sort by total bet amount (ascending)
    contributions.sort((a, b) => a.totalBet - b.totalBet);

    const sidePots: Array<{ amount: number; eligiblePlayers: number[] }> = [];
    let previousLevel = 0;

    // Process each bet level
    for (let i = 0; i < contributions.length; i++) {
      const currentLevel = contributions[i].totalBet;
      
      if (currentLevel > previousLevel) {
        // Calculate pot for this level
        const eligiblePlayers = contributions
          .slice(i) // All players who contributed at least this much
          .filter(p => !p.folded)
          .map(p => p.seat);
        
        if (eligiblePlayers.length > 0) {
          // Amount each player contributes to this pot level
          const contributionPerPlayer = currentLevel - previousLevel;
          const potAmount = contributionPerPlayer * (contributions.length - i + contributions.slice(0, i).filter(p => !p.folded).length);
          
          sidePots.push({
            amount: potAmount,
            eligiblePlayers
          });
        }
        
        previousLevel = currentLevel;
      }
    }

    this.state.sidePots = sidePots;
    console.log('[Side Pots] Calculated:', sidePots);
  }

  // Update state and calculate side pots
  private updateState(): void {
    this.calculateSidePots();
    this.onStateUpdate(this.state);
  }

  // Get next active seat (not folded, still has chips)
  private getNextSeat(currentSeat: number): number {
    let nextSeat = currentSeat;
    let attempts = 0;

    do {
      nextSeat = (nextSeat % this.playerCount) + 1;
      attempts++;
      
      const player = this.state.players.find(p => p.seat === nextSeat);
      if (player && !player.folded && player.stack > 0) {
        return nextSeat;
      }
    } while (attempts < this.playerCount);

    return currentSeat; // Fallback
  }

  // Check if betting round is complete
  private isBettingRoundComplete(): boolean {
    const activePlayers = this.state.players.filter(p => !p.folded && p.stack > 0);
    
    // Everyone except one player folded
    if (activePlayers.length <= 1) {
      return true;
    }

    // All active players have acted and all bets are equal
    const allActed = activePlayers.every(p => p.hasActed);
    const allBetsEqual = activePlayers.every(p => p.bet === this.state.currentBet || p.allIn);
    
    return allActed && allBetsEqual;
  }

  // Start new hand
  public startNewHand() {
    console.log('[startNewHand] Starting new hand, clearing previous state');
    
    // Clear any pending AI actions from previous hand
    this.pendingAIActions.forEach(timeout => clearTimeout(timeout));
    this.pendingAIActions = [];
    
    // Mark hand as active
    this.isHandActive = true;
    
    this.deck = this.shuffleDeck();
    this.lastRaiseAmount = this.state.bigBlind;

    // Reset game state for new hand
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.state.street = 'preflop';
    this.state.communityCards = [];
    this.state.showdown = false;
    this.state.flopDealt = false;

    // Reset players (but keep timeout counters)
    this.state.players = this.state.players.map(p => ({
      ...p,
      bet: 0,
      folded: false,
      allIn: false,
      hasActed: false,
      cards: [],
      isDealer: false, // Clear dealer flag
      // Keep timeouts and timeoutWarning - they persist across hands
    }));

    // Rotate dealer button - use actual player seats array for proper rotation
    const activeSeats = this.state.players.map(p => p.seat).sort((a, b) => a - b);
    const currentDealerIndex = activeSeats.indexOf(this.state.dealerButton);
    const nextDealerIndex = (currentDealerIndex + 1) % activeSeats.length;
    this.state.dealerButton = activeSeats[nextDealerIndex];

    // Set new dealer
    const dealerPlayer = this.state.players.find(p => p.seat === this.state.dealerButton);
    if (dealerPlayer) {
      dealerPlayer.isDealer = true;
    }

    // Determine blinds (left of dealer = SB, left of SB = BB)
    // Use actual seat array rotation instead of assuming sequential seats
    const sbIndex = (nextDealerIndex + 1) % activeSeats.length;
    const bbIndex = (nextDealerIndex + 2) % activeSeats.length;
    const sbSeat = activeSeats[sbIndex];
    const bbSeat = activeSeats[bbIndex];

    // Post blinds
    const sbPlayer = this.state.players.find(p => p.seat === sbSeat);
    const bbPlayer = this.state.players.find(p => p.seat === bbSeat);

    if (sbPlayer && sbPlayer.stack > 0) {
      const sbAmount = Math.min(this.state.smallBlind, sbPlayer.stack);
      sbPlayer.bet = sbAmount;
      sbPlayer.stack -= sbAmount;
      this.state.pot += sbAmount;
      if (sbPlayer.stack === 0) {
        sbPlayer.allIn = true;
      }
    }

    if (bbPlayer && bbPlayer.stack > 0) {
      const bbAmount = Math.min(this.state.bigBlind, bbPlayer.stack);
      bbPlayer.bet = bbAmount;
      bbPlayer.stack -= bbAmount;
      this.state.pot += bbAmount;
      if (bbPlayer.stack === 0) {
        bbPlayer.allIn = true;
      }
    }

    this.state.currentBet = this.state.bigBlind;

    // Deal hole cards
    this.dealHoleCards();

    // First to act is left of BB (UTG position) - use array rotation
    const firstPlayerIndex = (bbIndex + 1) % activeSeats.length;
    this.state.currentPlayer = activeSeats[firstPlayerIndex];
    this.state.street = 'preflop';
    this.state.communityCards = [];

    this.state.gameLog.push({
      action: `🎲 NEW HAND - Dealer: Seat ${this.state.dealerButton}, SB: Seat ${sbSeat}, BB: Seat ${bbSeat}`,
      type: 'system',
      timestamp: Date.now()
    });

    this.updateState();

    // Start timer for first player
    if (this.onTurnStart) {
      this.onTurnStart(this.state.currentPlayer);
    }

    // If first player is AI, make them act
    const firstPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
    if (firstPlayer && !firstPlayer.isMe) {
      setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
    }
  }

  private shuffleDeck(): number[] {
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  private dealHoleCards() {
    let cardIndex = 0;
    for (const player of this.state.players) {
      player.cards = [this.deck[cardIndex], this.deck[cardIndex + 1]];
      cardIndex += 2;
    }
  }

  // Handle player action
  public async handlePlayerAction(action: string, amount: number = 0) {
    const player = this.state.players.find(p => p.seat === this.state.currentPlayer && p.isMe);
    if (!player) return;

    // Reset timeout counter when player takes action
    if (player.timeouts !== undefined && player.timeouts > 0) {
      player.timeouts = 0;
      player.timeoutWarning = false;
    }

    player.hasActed = true;

    switch (action) {
      case 'fold':
        player.folded = true;
        player.lastAction = { type: 'fold', text: 'FOLDED' };
        this.state.gameLog.push({
          action: 'You fold',
          type: 'action',
          timestamp: Date.now()
        });
        break;

      case 'check':
        player.lastAction = { type: 'check', text: 'CHECKED' };
        this.state.gameLog.push({
          action: 'You check',
          type: 'action',
          timestamp: Date.now()
        });
        break;

      case 'call':
        const callAmount = this.state.currentBet - player.bet;
        const actualCall = Math.min(callAmount, player.stack);
        player.bet += actualCall;
        player.stack -= actualCall;
        this.state.pot += actualCall;
        player.lastAction = { type: 'call', text: 'CALLED', amount: actualCall };
        
        if (player.stack === 0) {
          player.allIn = true;
        }

        this.state.gameLog.push({
          action: `You call ${actualCall}`,
          type: 'action',
          timestamp: Date.now()
        });
        break;

      case 'bet':
      case 'raise':
        const raiseAmount = amount || this.state.bigBlind * 2;
        const totalNeeded = this.state.currentBet + raiseAmount;
        const additionalBet = totalNeeded - player.bet;
        const actualRaise = Math.min(additionalBet, player.stack);
        
        player.bet += actualRaise;
        player.stack -= actualRaise;
        this.state.pot += actualRaise;
        this.state.currentBet = player.bet;
        this.lastRaiseAmount = raiseAmount;
        player.lastAction = { type: action === 'bet' ? 'bet' : 'raise', text: `RAISED $${player.bet}`, amount: player.bet };

        if (player.stack === 0) {
          player.allIn = true;
        }

        // Reset hasActed for all other players who haven't folded
        this.state.players.forEach(p => {
          if (!p.folded && p.seat !== player.seat) {
            p.hasActed = false;
          }
        });

        this.state.gameLog.push({
          action: `You ${action} to ${player.bet}`,
          type: 'action',
          timestamp: Date.now()
        });
        break;

      case 'allin':
        const allInAmount = player.stack;
        player.bet += allInAmount;
        player.stack = 0;
        player.allIn = true;
        this.state.pot += allInAmount;
        player.lastAction = { type: 'allin', text: 'ALL IN', amount: allInAmount };

        if (player.bet > this.state.currentBet) {
          this.state.currentBet = player.bet;
          this.lastRaiseAmount = player.bet - this.state.currentBet;
          // Reset hasActed for others
          this.state.players.forEach(p => {
            if (!p.folded && p.seat !== player.seat) {
              p.hasActed = false;
            }
          });
        }

        this.state.gameLog.push({
          action: `You go ALL-IN for ${allInAmount}`,
          type: 'action',
          timestamp: Date.now()
        });
        break;
    }

    this.updateState();

    // Check if hand is over (everyone folded except one)
    const activePlayers = this.state.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      await this.endHand();
      return;
    }

    // Check if betting round complete
    if (this.isBettingRoundComplete()) {
      await this.advanceStreet();
      return;
    }

    // Move to next player
    this.state.currentPlayer = this.getNextSeat(this.state.currentPlayer);
    this.updateState();

    // Start timer for next player
    if (this.onTurnStart) {
      this.onTurnStart(this.state.currentPlayer);
    }

    // If next player is AI, make them act
    const nextPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
    if (nextPlayer && !nextPlayer.isMe) {
      setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
    }
  }

  // Handle player timeout
  public async handleTimeout(seatNumber: number) {
    const player = this.state.players.find(p => p.seat === seatNumber);
    if (!player || player.folded || player.allIn) return;

    // Initialize timeout counter if undefined
    if (player.timeouts === undefined) {
      player.timeouts = 0;
    }

    // Increment timeout counter
    player.timeouts++;

    // Log timeout
    const playerName = player.isMe ? 'You' : (player.name || `Seat ${player.seat}`);
    this.state.gameLog.push({
      action: `${playerName} timed out (${player.timeouts}/2)`,
      type: 'warning',
      timestamp: Date.now()
    });

    // Check if player should be removed (2 consecutive timeouts)
    if (player.timeouts >= 2) {
      player.folded = true;
      player.lastAction = { type: 'fold', text: 'REMOVED (TIMEOUT)' };
      
      this.state.gameLog.push({
        action: `${playerName} removed from hand due to inactivity`,
        type: 'error',
        timestamp: Date.now()
      });

      // Remove player from game if they have no chips or timed out twice
      player.stack = 0;
    } else {
      // Set warning flag for next timeout
      player.timeoutWarning = true;

      // Auto-fold or auto-check based on situation
      const callAmount = this.state.currentBet - player.bet;
      if (callAmount > 0) {
        // Facing a bet - auto-fold
        player.folded = true;
        player.lastAction = { type: 'fold', text: 'FOLDED (TIMEOUT)' };
        
        this.state.gameLog.push({
          action: `${playerName} auto-folded`,
          type: 'action',
          timestamp: Date.now()
        });
      } else {
        // No bet - auto-check
        player.hasActed = true;
        player.lastAction = { type: 'check', text: 'CHECKED (TIMEOUT)' };
        
        this.state.gameLog.push({
          action: `${playerName} auto-checked`,
          type: 'action',
          timestamp: Date.now()
        });
      }
    }

    this.updateState();

    // Check if hand is over
    const activePlayers = this.state.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      await this.endHand();
      return;
    }

    // Check if betting round complete
    if (this.isBettingRoundComplete()) {
      await this.advanceStreet();
      return;
    }

    // Move to next player
    this.state.currentPlayer = this.getNextSeat(this.state.currentPlayer);
    this.updateState();

    // Start timer for next player
    if (this.onTurnStart) {
      this.onTurnStart(this.state.currentPlayer);
    }

    // If next player is AI, make them act
    const nextPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
    if (nextPlayer && !nextPlayer.isMe) {
      const aiTimeout = setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
      this.pendingAIActions.push(aiTimeout);
    }
  }

  // AI decision making
  private async aiAction(seatNumber: number) {
    // Check if hand is still active
    if (!this.isHandActive) {
      console.log('[aiAction] Hand no longer active, skipping AI action');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const player = this.state.players.find(p => p.seat === seatNumber);
    if (!player || player.folded || player.allIn) return;

    // Reset timeout counter when AI takes action
    if (player.timeouts !== undefined && player.timeouts > 0) {
      player.timeouts = 0;
      player.timeoutWarning = false;
    }

    player.hasActed = true;

    // Evaluate hand strength
    const handStrength = this.evaluateHandStrength(player.cards || [], this.state.communityCards);
    const random = Math.random();

    const callAmount = this.state.currentBet - player.bet;
    let action = 'check';
    let amount = 0;

    // DEBUG: Log AI decision state
    console.log(`[AI DEBUG] Seat ${seatNumber}: currentBet=${this.state.currentBet}, playerBet=${player.bet}, callAmount=${callAmount}, handStrength=${handStrength.toFixed(2)}`);

    // Facing a bet
    if (callAmount > 0) {
      // Decision thresholds based on hand strength
      const foldThreshold = handStrength < 0.3 ? 0.5 : (handStrength < 0.6 ? 0.2 : 0.05);
      const raiseThreshold = handStrength > 0.7 ? 0.4 : (handStrength > 0.5 ? 0.2 : 0.1);

      if (random < foldThreshold) {
        player.folded = true;
        action = 'fold';
      } else if (random < (1 - raiseThreshold)) {
        // Call
        const actualCall = Math.min(callAmount, player.stack);
        player.bet += actualCall;
        player.stack -= actualCall;
        this.state.pot += actualCall;
        action = 'call';
        amount = actualCall;

        if (player.stack === 0) {
          player.allIn = true;
          action = 'allin';
        }
      } else {
        // Raise
        const raiseAmount = this.state.bigBlind * 2;
        const totalNeeded = this.state.currentBet + raiseAmount;
        const additionalBet = totalNeeded - player.bet;
        const actualRaise = Math.min(additionalBet, player.stack);

        player.bet += actualRaise;
        player.stack -= actualRaise;
        this.state.pot += actualRaise;
        this.state.currentBet = player.bet;
        this.lastRaiseAmount = raiseAmount;
        action = 'raise';
        amount = actualRaise;

        // Reset hasActed for others
        this.state.players.forEach(p => {
          if (!p.folded && p.seat !== player.seat) {
            p.hasActed = false;
          }
        });

        if (player.stack === 0) {
          player.allIn = true;
          action = 'allin';
        }
      }
    } else {
      // No bet to call - can check or bet
      const betThreshold = handStrength > 0.7 ? 0.6 : (handStrength > 0.5 ? 0.4 : 0.2);

      if (random < betThreshold) {
        // Bet
        const betAmount = Math.min(this.state.bigBlind * 2, player.stack);
        player.bet += betAmount;
        player.stack -= betAmount;
        this.state.pot += betAmount;
        this.state.currentBet = player.bet;
        action = 'bet';
        amount = betAmount;

        // Reset hasActed for others
        this.state.players.forEach(p => {
          if (!p.folded && p.seat !== player.seat) {
            p.hasActed = false;
          }
        });

        if (player.stack === 0) {
          player.allIn = true;
          action = 'allin';
        }
      } else {
        action = 'check';
      }
    }

    // Set last action for AI player and play sound (only if opponent sounds not muted)
    const shouldPlaySound = !audioSystem.shouldMuteOpponents();
    
    if (action === 'fold') {
      player.lastAction = { type: 'fold', text: 'FOLDED' };
      if (shouldPlaySound) playFold();
    } else if (action === 'check') {
      player.lastAction = { type: 'check', text: 'CHECKED' };
      if (shouldPlaySound) playCheck();
    } else if (action === 'call') {
      player.lastAction = { type: 'call', text: 'CALLED', amount };
      if (shouldPlaySound) playChipBet();
    } else if (action === 'raise' || action === 'bet') {
      player.lastAction = { type: action, text: `RAISED $${player.bet}`, amount: player.bet };
      if (shouldPlaySound) playRaise();
    } else if (action === 'allin') {
      player.lastAction = { type: 'allin', text: 'ALL IN', amount };
      if (shouldPlaySound) playRaise();
    }

    this.state.gameLog.push({
      action: `${player.name || `Seat ${player.seat}`} ${action}${amount ? ` ${amount}` : ''}`,
      type: 'action',
      timestamp: Date.now()
    });

    this.updateState();

    // Check if hand is over
    const activePlayers = this.state.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      await this.endHand();
      return;
    }

    // Check if betting round complete
    if (this.isBettingRoundComplete()) {
      await this.advanceStreet();
      return;
    }

    // Move to next player
    this.state.currentPlayer = this.getNextSeat(this.state.currentPlayer);
    this.updateState();

    // Start timer
    if (this.onTurnStart) {
      this.onTurnStart(this.state.currentPlayer);
    }

    // If next player is also AI, continue
    const nextPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
    if (nextPlayer && !nextPlayer.isMe) {
      setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
    }
  }

  // Evaluate hand strength (0-1 scale)
  private evaluateHandStrength(holeCards: number[], communityCards: number[]): number {
    if (communityCards.length === 0) {
      // Pre-flop evaluation
      return this.evaluatePreFlopStrength(holeCards);
    }

    try {
      const allCards = [...holeCards, ...communityCards];
      const formattedCards = this.cardsToPokersolverFormat(allCards);
      const hand = Hand.solve(formattedCards);
      
      // Rank from 1 (high card) to 9 (straight flush)
      const rankValue = hand.rank || 1;
      return Math.min(rankValue / 9, 1);
    } catch {
      return 0.3; // Default medium strength
    }
  }

  private evaluatePreFlopStrength(holeCards: number[]): number {
    if (holeCards.length !== 2) return 0.3;

    const [card1, card2] = holeCards;
    const rank1 = card1 % 13;
    const rank2 = card2 % 13;
    const suited = Math.floor(card1 / 13) === Math.floor(card2 / 13);

    // Pocket pair
    if (rank1 === rank2) {
      if (rank1 >= 10) return 0.9; // AA, KK, QQ, JJ
      if (rank1 >= 7) return 0.75; // TT, 99, 88
      return 0.6; // Lower pairs
    }

    // High cards
    const highRank = Math.max(rank1, rank2);
    if (highRank >= 12) return suited ? 0.7 : 0.6; // Ace
    if (highRank >= 11) return suited ? 0.65 : 0.55; // King

    // Connected cards
    if (Math.abs(rank1 - rank2) <= 2) {
      return suited ? 0.5 : 0.4;
    }

    return 0.3;
  }

  private cardsToPokersolverFormat(cardNumbers: number[]): string[] {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['h', 'd', 'c', 's'];
    
    return cardNumbers.map(num => {
      const rank = ranks[num % 13];
      const suit = suits[Math.floor(num / 13)];
      return `${rank}${suit}`;
    });
  }

  // Format hand description with kickers
  private formatHandWithKickers(hand: any): string {
    if (!hand) return 'High Card';
    
    let description = hand.descr || 'High Card';
    
    // Only show kickers for certain hand types
    // Hands that use kickers: High Card, Pair, Two Pair, Three of a Kind, Four of a Kind
    const handsThatShowKickers = [1, 2, 4, 8]; // rank values from pokersolver
    
    if (hand.cards && handsThatShowKickers.includes(hand.rank)) {
      const allCardValues = hand.cards.map((card: any) => card.value);
      
      // Get the primary hand cards (the main cards that make the hand)
      let primaryCards: string[] = [];
      
      // Determine which cards are kickers based on hand type
      if (hand.rank === 8) {
        // Four of a Kind - 4 cards of same rank
        const counts = new Map<string, number>();
        allCardValues.forEach((v: string) => {
          counts.set(v, (counts.get(v) || 0) + 1);
        });
        for (const [value, count] of counts.entries()) {
          if (count === 4) {
            primaryCards = Array(4).fill(value);
          }
        }
      } else if (hand.rank === 4) {
        // Three of a Kind - 3 cards of same rank
        const counts = new Map<string, number>();
        allCardValues.forEach((v: string) => {
          counts.set(v, (counts.get(v) || 0) + 1);
        });
        for (const [value, count] of counts.entries()) {
          if (count === 3) {
            primaryCards = Array(3).fill(value);
          }
        }
      } else if (hand.rank === 2) {
        // Two Pair - 2 pairs
        const counts = new Map<string, number>();
        allCardValues.forEach((v: string) => {
          counts.set(v, (counts.get(v) || 0) + 1);
        });
        for (const [value, count] of counts.entries()) {
          if (count === 2) {
            primaryCards.push(value, value);
          }
        }
      } else if (hand.rank === 1) {
        // Pair - 2 cards of same rank
        const counts = new Map<string, number>();
        allCardValues.forEach((v: string) => {
          counts.set(v, (counts.get(v) || 0) + 1);
        });
        for (const [value, count] of counts.entries()) {
          if (count === 2) {
            primaryCards = [value, value];
          }
        }
      }
      
      // Find kickers (cards not in primary hand)
      const kickers: string[] = allCardValues.filter((v: string) => 
        !primaryCards.includes(v) || primaryCards.filter((p: string) => p === v).length < allCardValues.filter((av: string) => av === v).length
      );
      
      // For high card, all cards are kickers except the highest
      if (hand.rank === 1 && kickers.length === 0) {
        // High card case is handled by rank 1 with no pairs
        // In pokersolver, the highest card is in the description already
      }
      
      // Format kickers
      if (kickers.length > 0) {
        // Remove duplicates and convert to display format
        const uniqueKickers = Array.from(new Set(kickers));
        const kickerStr = uniqueKickers.map((k: string) => {
          // Convert pokersolver format to display format
          if (k === 'A') return 'A';
          if (k === 'K') return 'K';
          if (k === 'Q') return 'Q';
          if (k === 'J') return 'J';
          if (k === 'T') return '10';
          return k;
        }).join(', ');
        
        if (kickerStr) {
          const kickerWord = uniqueKickers.length === 1 ? 'kicker' : 'kickers';
          description += ` (${kickerStr} ${kickerWord})`;
        }
      }
    }
    
    return description;
  }

  // Advance to next street
  private async advanceStreet() {
    try {
      console.log('[advanceStreet] Starting, current street:', this.state.street);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset bets, hasActed flags, and lastAction for new betting round
      this.state.players.forEach(p => {
        p.bet = 0;
        p.hasActed = false;
        p.lastAction = undefined; // Clear last action for new round
      });
      this.state.currentBet = 0;
    } catch (error) {
      console.error('[advanceStreet] Error in reset phase:', error);
      throw error;
    }

    let nextStreet: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' = 'showdown';
    
    try {
      // Calculate card index: playerCount * 2 (hole cards) + community cards dealt
      let cardIndex = (this.playerCount * 2) + this.state.communityCards.length;
      console.log('[advanceStreet] Card index:', cardIndex, 'Deck length:', this.deck.length);

      switch (this.state.street) {
        case 'preflop':
          // Deal flop (3 cards)
          if (cardIndex + 2 >= this.deck.length) {
            console.error('[advanceStreet] Not enough cards for flop!');
            return;
          }
          this.state.communityCards = [
            this.deck[cardIndex],
            this.deck[cardIndex + 1],
            this.deck[cardIndex + 2]
          ];
          nextStreet = 'flop';
          this.state.flopDealt = true;
          console.log('[advanceStreet] Dealt flop:', this.state.communityCards);
          break;

        case 'flop':
          // Deal turn (1 card)
          if (cardIndex >= this.deck.length) {
            console.error('[advanceStreet] Not enough cards for turn!');
            return;
          }
          this.state.communityCards.push(this.deck[cardIndex]);
          nextStreet = 'turn';
          console.log('[advanceStreet] Dealt turn:', this.deck[cardIndex]);
          break;

        case 'turn':
          // Deal river (1 card)
          if (cardIndex >= this.deck.length) {
            console.error('[advanceStreet] Not enough cards for river!');
            return;
          }
          this.state.communityCards.push(this.deck[cardIndex]);
          nextStreet = 'river';
          console.log('[advanceStreet] Dealt river:', this.deck[cardIndex]);
          break;

        case 'river':
          // Showdown
          console.log('[advanceStreet] Going to showdown');
          await this.showdown();
          return;
      }

      this.state.street = nextStreet;
    } catch (error) {
      console.error('[advanceStreet] Error dealing cards:', error);
      throw error;
    }
    try {
      this.state.gameLog.push({
        action: `━━━ 🃏 ${nextStreet.toUpperCase()} ━━━`,
        type: 'street-change',
        timestamp: Date.now()
      });

      // First to act is left of dealer
      this.state.currentPlayer = (this.state.dealerButton % this.playerCount) + 1;
      console.log('[advanceStreet] First to act:', this.state.currentPlayer);
      
      this.updateState();

      // Start timer
      if (this.onTurnStart) {
        this.onTurnStart(this.state.currentPlayer);
      }

      // If first player is AI, make them act
      const firstPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
      if (firstPlayer && !firstPlayer.isMe) {
        const aiTimeout = setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
        this.pendingAIActions.push(aiTimeout);
      }
    } catch (error) {
      console.error('[advanceStreet] Error in game flow:', error);
      throw error;
    }
  }

  // Showdown
  private async showdown() {
    try {
      console.log('[showdown] Starting showdown');
      this.state.showdown = true;
      
      const activePlayers = this.state.players.filter(p => !p.folded);
      console.log('[showdown] Active players:', activePlayers.length);
    
    // Evaluate all hands using pokersolver's proper comparison
    const playerHands: { player: Player; hand: any; formattedCards: string[] }[] = [];

    for (const player of activePlayers) {
      const allCards = [...(player.cards || []), ...this.state.communityCards];
      const formattedCards = this.cardsToPokersolverFormat(allCards);
      const hand = Hand.solve(formattedCards);
      playerHands.push({ player, hand, formattedCards });
    }

    // Use pokersolver's winners() method - it properly compares hands including kickers!
    const allHands = playerHands.map(ph => ph.hand);
    const winningHands = Hand.winners(allHands);
    
    // Find which players have the winning hands
    const winners: Player[] = [];
    let bestHand: any = null;
    
    for (const ph of playerHands) {
      if (winningHands.includes(ph.hand)) {
        winners.push(ph.player);
        bestHand = ph.hand;
      }
    }

    // Calculate rake (2.5% up to 50 chips, only if flop dealt)
    let rake = 0;
    if (this.state.flopDealt && this.state.pot > 0) {
      rake = Math.min(Math.floor(this.state.pot * 0.025), 50);
      this.state.totalRakeCollected += rake;
    }

    const netPot = this.state.pot - rake;
    const winAmount = Math.floor(netPot / winners.length);

    // Award pot
    winners.forEach(winner => {
      winner.stack += winAmount;
    });

    const handDescription = this.formatHandWithKickers(bestHand);
    this.state.winningHand = handDescription;
    
    this.state.gameLog.push({
      action: `🏆 ${winners.map(w => w.isMe ? 'You' : w.name).join(', ')} win ${winAmount} with ${handDescription}`,
      type: 'system',
      timestamp: Date.now()
    });

    if (rake > 0) {
      this.state.gameLog.push({
        action: `💰 Rake: ${rake} chips`,
        type: 'system',
        timestamp: Date.now()
      });
    }

    this.updateState();
    playWinPot();

    // Track hand completion for winning hands panel
    if (this.onHandComplete) {
      this.handCount++;
      const winner = winners.length === 1 ? 
        (winners[0].isMe ? 'You' : winners[0].name || 'Opponent') : 
        'Tie';
      
      this.onHandComplete({
        handNumber: this.handCount,
        winner,
        handType: this.state.winningHand || 'High Card',
        potSize: this.state.pot,
        timestamp: Date.now()
      });
    }

    // Mark hand as inactive before starting new hand
    console.log('[showdown] Hand complete, marking as inactive');
    this.isHandActive = false;
    
    // Clear any pending AI actions
    this.pendingAIActions.forEach(timeout => clearTimeout(timeout));
    this.pendingAIActions = [];
    
    // Start new hand after delay
    setTimeout(() => this.startNewHand(), 5000);
    } catch (error) {
      console.error('[showdown] Error during showdown:', error);
      this.isHandActive = false;
    }
  }

  private async endHand() {
    const winner = this.state.players.find(p => !p.folded);
    if (!winner) return;

    // Calculate rake
    let rake = 0;
    if (this.state.flopDealt && this.state.pot > 0) {
      rake = Math.min(Math.floor(this.state.pot * 0.025), 50);
      this.state.totalRakeCollected += rake;
    }

    const netPot = this.state.pot - rake;
    winner.stack += netPot;

    this.state.gameLog.push({
      action: `🏆 ${winner.isMe ? 'You' : winner.name} win ${netPot} (all others folded)`,
      type: 'system',
      timestamp: Date.now()
    });

    if (rake > 0) {
      this.state.gameLog.push({
        action: `💰 Rake: ${rake} chips`,
        type: 'system',
        timestamp: Date.now()
      });
    }

    this.updateState();
    playWinPot();

    // Track hand completion for winning hands panel
    if (this.onHandComplete) {
      this.handCount++;
      
      this.onHandComplete({
        handNumber: this.handCount,
        winner: winner.isMe ? 'You' : (winner.name || 'Opponent'),
        handType: 'Win by fold',
        potSize: this.state.pot,
        timestamp: Date.now()
      });
    }

    // Mark hand as inactive before starting new hand
    console.log('[endHand] Hand complete, marking as inactive');
    this.isHandActive = false;
    
    // Clear any pending AI actions
    this.pendingAIActions.forEach(timeout => clearTimeout(timeout));
    this.pendingAIActions = [];

    // Start new hand
    setTimeout(() => this.startNewHand(), 5000);
  }

  // Timer expiry handler
  public async handleTimerExpiry(seatNumber: number) {
    // Check if hand is still active
    if (!this.isHandActive) {
      console.log('[handleTimerExpiry] Hand no longer active, ignoring timer expiry');
      return;
    }
    
    const player = this.state.players.find(p => p.seat === seatNumber);
    if (!player || player.folded || player.allIn) return;

    console.log('[MultiPlayerPokerGame] Timer expired for seat:', seatNumber, 'isMe:', player.isMe);

    // Only process if it's actually this player's turn
    if (this.state.currentPlayer !== seatNumber) {
      console.log('[MultiPlayerPokerGame] Not current player, ignoring');
      return;
    }

    player.hasActed = true;

    // If facing a bet, fold. Otherwise check.
    const callAmount = this.state.currentBet - player.bet;
    
    if (callAmount > 0) {
      // Fold
      player.folded = true;
      this.state.gameLog.push({
        action: `${player.isMe ? 'You' : player.name} fold (time expired)`,
        type: 'action',
        timestamp: Date.now()
      });
      console.log('[MultiPlayerPokerGame] Auto-fold');
    } else {
      // Check
      this.state.gameLog.push({
        action: `${player.isMe ? 'You' : player.name} check (time expired)`,
        type: 'action',
        timestamp: Date.now()
      });
      console.log('[MultiPlayerPokerGame] Auto-check');
    }

    this.updateState();

    // Check if hand is over (everyone folded except one)
    const activePlayers = this.state.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      await this.endHand();
      return;
    }

    // Check if betting round complete
    if (this.isBettingRoundComplete()) {
      await this.advanceStreet();
      return;
    }

    // Move to next player
    this.state.currentPlayer = this.getNextSeat(this.state.currentPlayer);
    this.updateState();

    // Start timer for next player
    if (this.onTurnStart) {
      this.onTurnStart(this.state.currentPlayer);
    }

    // If next player is AI, make them act
    const nextPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
    if (nextPlayer && !nextPlayer.isMe) {
      setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
    }
  }
}

