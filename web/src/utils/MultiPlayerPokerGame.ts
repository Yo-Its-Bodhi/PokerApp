// Multi-Player Poker Game (4-6 players)
// @ts-ignore
import { Hand } from 'pokersolver';
import { playWinPot } from './audioSystem';

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
}

export interface MultiPlayerGameState {
  players: Player[];
  communityCards: number[];
  pot: number;
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
  private deck: number[];
  private playerCount: number;
  private humanPlayerSeat: number;
  private lastRaiseAmount: number = 0;

  constructor(
    humanPlayerSeat: number,
    playerCount: number, // 4, 5, or 6
    onStateUpdate: (state: MultiPlayerGameState) => void,
    onTurnStart?: (seatNumber: number) => void
  ) {
    this.humanPlayerSeat = humanPlayerSeat;
    this.playerCount = Math.min(Math.max(playerCount, 4), 6); // Clamp to 4-6
    this.onStateUpdate = onStateUpdate;
    this.onTurnStart = onTurnStart;
    this.deck = [];

    // AI names and avatars
    const aiNames = [
      { name: 'AI Alpha', avatar: '🤖' },
      { name: 'AI Beta', avatar: '🎮' },
      { name: 'AI Gamma', avatar: '👾' },
      { name: 'AI Delta', avatar: '🎯' },
      { name: 'AI Epsilon', avatar: '🎲' }
    ];

    // Create players array
    const players: Player[] = [];
    let aiIndex = 0;

    for (let seat = 1; seat <= this.playerCount; seat++) {
      if (seat === humanPlayerSeat) {
        // Human player
        players.push({
          seat,
          stack: 100000,
          bet: 0,
          folded: false,
          allIn: false,
          isMe: true,
          isDealer: seat === 1,
          hasActed: false,
          cards: []
        });
      } else {
        // AI player
        players.push({
          seat,
          stack: 100000,
          bet: 0,
          folded: false,
          allIn: false,
          name: aiNames[aiIndex].name,
          avatar: aiNames[aiIndex].avatar,
          isDealer: seat === 1 && humanPlayerSeat !== 1,
          hasActed: false,
          cards: []
        });
        aiIndex++;
      }
    }

    // Randomize starting dealer button
    const randomDealer = Math.floor(Math.random() * this.playerCount) + 1;

    this.state = {
      players,
      communityCards: [],
      pot: 0,
      street: 'preflop',
      currentPlayer: 1,
      dealerButton: randomDealer,
      smallBlind: 500,
      bigBlind: 1000,
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
    this.deck = this.shuffleDeck();
    this.lastRaiseAmount = this.state.bigBlind;

    // Reset game state for new hand
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.state.street = 'preflop';
    this.state.communityCards = [];
    this.state.showdown = false;
    this.state.flopDealt = false;

    // Reset players
    this.state.players = this.state.players.map(p => ({
      ...p,
      bet: 0,
      folded: false,
      allIn: false,
      hasActed: false,
      cards: [],
      isDealer: false // Clear dealer flag
    }));

    // Rotate dealer button
    this.state.dealerButton = (this.state.dealerButton % this.playerCount) + 1;

    // Set new dealer
    const dealerPlayer = this.state.players.find(p => p.seat === this.state.dealerButton);
    if (dealerPlayer) {
      dealerPlayer.isDealer = true;
    }

    // Determine blinds (left of dealer = SB, left of SB = BB)
    // For 4+ players: dealer -> SB -> BB -> UTG
    const sbSeat = this.state.dealerButton === this.playerCount ? 1 : this.state.dealerButton + 1;
    const bbSeat = sbSeat === this.playerCount ? 1 : sbSeat + 1;

    // Post blinds
    const sbPlayer = this.state.players.find(p => p.seat === sbSeat);
    const bbPlayer = this.state.players.find(p => p.seat === bbSeat);

    if (sbPlayer) {
      sbPlayer.bet = this.state.smallBlind;
      sbPlayer.stack -= this.state.smallBlind;
      this.state.pot += this.state.smallBlind;
    }

    if (bbPlayer) {
      bbPlayer.bet = this.state.bigBlind;
      bbPlayer.stack -= this.state.bigBlind;
      this.state.pot += this.state.bigBlind;
    }

    this.state.currentBet = this.state.bigBlind;

    // Deal hole cards
    this.dealHoleCards();

    // First to act is left of BB (UTG position)
    this.state.currentPlayer = bbSeat === this.playerCount ? 1 : bbSeat + 1;
    this.state.street = 'preflop';
    this.state.communityCards = [];

    this.state.gameLog.push({
      action: `🎲 NEW HAND - Dealer: Seat ${this.state.dealerButton}, SB: Seat ${sbSeat}, BB: Seat ${bbSeat}`,
      type: 'system',
      timestamp: Date.now()
    });

    this.onStateUpdate(this.state);

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

    this.onStateUpdate(this.state);

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
    this.onStateUpdate(this.state);

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

  // AI decision making
  private async aiAction(seatNumber: number) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const player = this.state.players.find(p => p.seat === seatNumber);
    if (!player || player.folded || player.allIn) return;

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

    // Set last action for AI player
    if (action === 'fold') {
      player.lastAction = { type: 'fold', text: 'FOLDED' };
    } else if (action === 'check') {
      player.lastAction = { type: 'check', text: 'CHECKED' };
    } else if (action === 'call') {
      player.lastAction = { type: 'call', text: 'CALLED', amount };
    } else if (action === 'raise' || action === 'bet') {
      player.lastAction = { type: action, text: `RAISED $${player.bet}`, amount: player.bet };
    } else if (action === 'allin') {
      player.lastAction = { type: 'allin', text: 'ALL IN', amount };
    }

    this.state.gameLog.push({
      action: `${player.name || `Seat ${player.seat}`} ${action}${amount ? ` ${amount}` : ''}`,
      type: 'action',
      timestamp: Date.now()
    });

    this.onStateUpdate(this.state);

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
    this.onStateUpdate(this.state);

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

  // Advance to next street
  private async advanceStreet() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reset bets, hasActed flags, and lastAction for new betting round
    this.state.players.forEach(p => {
      p.bet = 0;
      p.hasActed = false;
      p.lastAction = undefined; // Clear last action for new round
    });
    this.state.currentBet = 0;

    let nextStreet: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' = 'showdown';
    
    // Calculate card index: playerCount * 2 (hole cards) + community cards dealt
    let cardIndex = (this.playerCount * 2) + this.state.communityCards.length;

    switch (this.state.street) {
      case 'preflop':
        // Deal flop (3 cards)
        this.state.communityCards = [
          this.deck[cardIndex],
          this.deck[cardIndex + 1],
          this.deck[cardIndex + 2]
        ];
        nextStreet = 'flop';
        this.state.flopDealt = true;
        break;

      case 'flop':
        // Deal turn (1 card)
        this.state.communityCards.push(this.deck[cardIndex]);
        nextStreet = 'turn';
        break;

      case 'turn':
        // Deal river (1 card)
        this.state.communityCards.push(this.deck[cardIndex]);
        nextStreet = 'river';
        break;

      case 'river':
        // Showdown
        await this.showdown();
        return;
    }

    this.state.street = nextStreet;
    this.state.gameLog.push({
      action: `━━━ 🃏 ${nextStreet.toUpperCase()} ━━━`,
      type: 'street-change',
      timestamp: Date.now()
    });

    // First to act is left of dealer
    this.state.currentPlayer = (this.state.dealerButton % this.playerCount) + 1;
    this.onStateUpdate(this.state);

    // Start timer
    if (this.onTurnStart) {
      this.onTurnStart(this.state.currentPlayer);
    }

    // If first player is AI, make them act
    const firstPlayer = this.state.players.find(p => p.seat === this.state.currentPlayer);
    if (firstPlayer && !firstPlayer.isMe) {
      setTimeout(() => this.aiAction(this.state.currentPlayer), 1500);
    }
  }

  // Showdown
  private async showdown() {
    this.state.showdown = true;
    
    const activePlayers = this.state.players.filter(p => !p.folded);
    
    // Evaluate all hands
    let bestHand: any = null;
    let winners: Player[] = [];

    for (const player of activePlayers) {
      const allCards = [...(player.cards || []), ...this.state.communityCards];
      const formattedCards = this.cardsToPokersolverFormat(allCards);
      const hand = Hand.solve(formattedCards);

      if (!bestHand || hand.rank > bestHand.rank) {
        bestHand = hand;
        winners = [player];
      } else if (hand.rank === bestHand.rank) {
        winners.push(player);
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

    this.state.winningHand = bestHand?.descr || 'High Card';
    
    this.state.gameLog.push({
      action: `🏆 ${winners.map(w => w.isMe ? 'You' : w.name).join(', ')} win ${winAmount} with ${this.state.winningHand}`,
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

    this.onStateUpdate(this.state);
    playWinPot();

    // Start new hand after delay
    setTimeout(() => this.startNewHand(), 5000);
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

    this.onStateUpdate(this.state);
    playWinPot();

    // Start new hand
    setTimeout(() => this.startNewHand(), 5000);
  }

  // Timer expiry handler
  public async handleTimerExpiry(seatNumber: number) {
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

    this.onStateUpdate(this.state);

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
    this.onStateUpdate(this.state);

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
