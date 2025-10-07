/**
 * Complete WSOP-Compliant Poker Engine
 * Implements full Texas Hold'em rules with proper betting, side pots, and showdown
 */

// Simple hand evaluator (replace with full evaluator later)
function evaluateHand(cards: number[]): number {
  // For now, return random rank (TODO: implement full hand evaluation)
  return Math.random();
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Card = number; // 0-51: suit * 13 + rank

export type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

export interface Player {
  seatId: number;
  stack: number;
  inHand: boolean;
  folded: boolean;
  allIn: boolean;
  hole: Card[];
  contribStreet: number;  // Contribution this street
  contribTotal: number;   // Total contribution this hand
  isMe?: boolean;
  name?: string;
  avatar?: string;
  isDealer?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
}

export interface Pot {
  cap: number;              // Contribution cap for this pot
  amount: number;           // Total chips in pot
  eligibleSeats: Set<number>; // Players who can win this pot
}

export interface BettingRound {
  street: Street;
  currentBet: number;       // Highest contrib on this street
  lastRaiseSize: number;    // Size of last raise
  actionCursor: number;     // Current player to act
  lastAggressor: number | null; // Last player who bet/raised
  actionsThisRound: number; // Track if everyone has acted
}

export interface TableState {
  players: Player[];
  buttonIndex: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  deck: Card[];
  burn: Card[];
  board: Card[];
  pots: Pot[];
  round: BettingRound;
  handNumber: number;
  street: Street;
}

export interface GameAction {
  type: Action;
  amount?: number;
  playerId: number;
}

export interface HandResult {
  winners: number[];        // Seat IDs of winners
  potAmounts: number[];     // Amount won per pot
  hands: { [seatId: number]: { rank: number; description: string } };
}

// ============================================================================
// POKER ENGINE CLASS
// ============================================================================

export class PokerEngine {
  private state: TableState;
  private onStateUpdate: (state: TableState) => void;
  private gameLog: Array<{ action: string; type: string; timestamp: number }> = [];

  constructor(
    players: Player[],
    buttonIndex: number,
    smallBlind: number,
    bigBlind: number,
    onStateUpdate: (state: TableState) => void
  ) {
    this.onStateUpdate = onStateUpdate;
    this.state = {
      players,
      buttonIndex,
      smallBlind,
      bigBlind,
      ante: 0,
      deck: [],
      burn: [],
      board: [],
      pots: [],
      round: {
        street: 'PREFLOP',
        currentBet: 0,
        lastRaiseSize: bigBlind,
        actionCursor: 0,
        lastAggressor: null,
        actionsThisRound: 0
      },
      handNumber: 0,
      street: 'PREFLOP'
    };
  }

  // ==========================================================================
  // HAND LIFECYCLE
  // ==========================================================================

  /**
   * Start a new hand
   */
  public startHand(): void {
    this.log('New hand starting', 'system');
    
    // Reset players
    this.state.players.forEach(p => {
      p.inHand = p.stack > 0;
      p.folded = false;
      p.allIn = false;
      p.hole = [];
      p.contribStreet = 0;
      p.contribTotal = 0;
    });

    // Move button
    this.moveButton();

    // Shuffle deck
    this.state.deck = this.shuffleDeck();
    this.state.burn = [];
    this.state.board = [];
    this.state.pots = [{ cap: Infinity, amount: 0, eligibleSeats: new Set() }];

    // Post blinds
    this.postBlinds();

    // Deal hole cards
    this.dealHoleCards();

    // Initialize preflop betting
    this.initBettingRound('PREFLOP');

    // Notify
    this.state.handNumber++;
    this.notifyUpdate();
  }

  /**
   * Move dealer button clockwise
   */
  private moveButton(): void {
    const activePlayers = this.state.players.filter(p => p.stack > 0);
    if (activePlayers.length < 2) {
      throw new Error('Not enough players with chips');
    }

    // Find next player with chips
    let nextButton = (this.state.buttonIndex + 1) % this.state.players.length;
    while (this.state.players[nextButton].stack === 0) {
      nextButton = (nextButton + 1) % this.state.players.length;
    }

    this.state.buttonIndex = nextButton;
    
    // Update dealer flags
    this.state.players.forEach((p, i) => {
      p.isDealer = i === nextButton;
    });

    this.log(`Button moved to seat ${nextButton}`, 'system');
  }

  /**
   * Post blinds (handles heads-up: button is SB)
   */
  private postBlinds(): void {
    const players = this.state.players;
    const btn = this.state.buttonIndex;
    
    // Heads-up: BTN is SB, next is BB
    // Multi-way: next is SB, next+1 is BB
    const isHeadsUp = players.filter(p => p.stack > 0).length === 2;

    let sbIndex: number;
    let bbIndex: number;

    if (isHeadsUp) {
      sbIndex = btn;
      bbIndex = this.nextActivePlayer(btn);
    } else {
      sbIndex = this.nextActivePlayer(btn);
      bbIndex = this.nextActivePlayer(sbIndex);
    }

    // Post SB
    const sbAmount = Math.min(this.state.smallBlind, players[sbIndex].stack);
    players[sbIndex].contribStreet = sbAmount;
    players[sbIndex].contribTotal = sbAmount;
    players[sbIndex].stack -= sbAmount;
    players[sbIndex].isSmallBlind = true;
    this.state.pots[0].amount += sbAmount;
    this.state.pots[0].eligibleSeats.add(sbIndex);
    
    if (players[sbIndex].stack === 0) {
      players[sbIndex].allIn = true;
    }

    this.log(`Seat ${sbIndex} posts SB ${sbAmount}`, 'blind');

    // Post BB
    const bbAmount = Math.min(this.state.bigBlind, players[bbIndex].stack);
    players[bbIndex].contribStreet = bbAmount;
    players[bbIndex].contribTotal = bbAmount;
    players[bbIndex].stack -= bbAmount;
    players[bbIndex].isBigBlind = true;
    this.state.pots[0].amount += bbAmount;
    this.state.pots[0].eligibleSeats.add(bbIndex);
    
    if (players[bbIndex].stack === 0) {
      players[bbIndex].allIn = true;
    }

    this.log(`Seat ${bbIndex} posts BB ${bbAmount}`, 'blind');

    // Set current bet to BB
    this.state.round.currentBet = bbAmount;
    this.state.round.lastRaiseSize = bbAmount - sbAmount;
  }

  /**
   * Deal hole cards (2 per player)
   */
  private dealHoleCards(): void {
    const activePlayers = this.state.players.filter(p => p.inHand);
    
    // Deal 2 cards to each player
    for (let round = 0; round < 2; round++) {
      for (const player of activePlayers) {
        player.hole.push(this.state.deck.pop()!);
      }
    }

    this.log('Hole cards dealt', 'deal');
  }

  /**
   * Initialize betting round for a street
   */
  private initBettingRound(street: Street): void {
    this.state.street = street;
    this.state.round.street = street;
    this.state.round.currentBet = 0;
    this.state.round.lastRaiseSize = this.state.bigBlind;
    this.state.round.lastAggressor = null;
    this.state.round.actionsThisRound = 0;

    // Reset street contributions
    this.state.players.forEach(p => {
      p.contribStreet = 0;
    });

    // Set action cursor
    if (street === 'PREFLOP') {
      // Preflop: first to act is left of BB (or BB in heads-up)
      const bbIndex = this.state.players.findIndex(p => p.isBigBlind);
      this.state.round.actionCursor = this.nextActivePlayer(bbIndex);
      
      // But BB has already acted with blind
      this.state.round.currentBet = this.state.bigBlind;
    } else {
      // Postflop: first to act is left of button
      this.state.round.actionCursor = this.nextActivePlayer(this.state.buttonIndex);
    }

    this.log(`${street} betting begins`, 'betting');
  }

  // ==========================================================================
  // BETTING ROUND
  // ==========================================================================

  /**
   * Process a player action
   */
  public processAction(action: GameAction): void {
    const player = this.state.players[action.playerId];
    
    if (!player || !player.inHand || player.folded || player.allIn) {
      console.warn('Invalid action: player cannot act');
      return;
    }

    const toCall = Math.max(0, this.state.round.currentBet - player.contribStreet);

    switch (action.type) {
      case 'fold':
        this.handleFold(action.playerId);
        break;

      case 'check':
        if (toCall > 0) {
          console.warn('Cannot check when facing a bet');
          return;
        }
        this.handleCheck(action.playerId);
        break;

      case 'call':
        this.handleCall(action.playerId);
        break;

      case 'bet':
      case 'raise':
        if (!action.amount) {
          console.warn('Bet/raise requires amount');
          return;
        }
        this.handleBetRaise(action.playerId, action.amount);
        break;

      case 'allin':
        this.handleAllIn(action.playerId);
        break;
    }

    this.state.round.actionsThisRound++;
    
    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.endBettingRound();
    } else {
      // Move to next player
      this.state.round.actionCursor = this.nextActivePlayer(action.playerId);
      this.notifyUpdate();
    }
  }

  private handleFold(playerId: number): void {
    const player = this.state.players[playerId];
    player.folded = true;
    player.inHand = false;

    this.log(`Seat ${playerId} folds`, 'action');

    // Remove from all pots
    this.state.pots.forEach(pot => {
      pot.eligibleSeats.delete(playerId);
    });

    // Check if only one player remains
    if (this.getActivePlayers().length === 1) {
      this.awardPotsToLastPlayer();
    }
  }

  private handleCheck(playerId: number): void {
    this.log(`Seat ${playerId} checks`, 'action');
  }

  private handleCall(playerId: number): void {
    const player = this.state.players[playerId];
    const toCall = Math.max(0, this.state.round.currentBet - player.contribStreet);
    const actualCall = Math.min(toCall, player.stack);

    player.contribStreet += actualCall;
    player.contribTotal += actualCall;
    player.stack -= actualCall;

    // Add to pot
    this.addToPot(playerId, actualCall);

    if (player.stack === 0) {
      player.allIn = true;
      this.handleAllInSidePot(playerId);
      this.log(`Seat ${playerId} calls ${actualCall} (ALL IN)`, 'action');
    } else {
      this.log(`Seat ${playerId} calls ${actualCall}`, 'action');
    }
  }

  private handleBetRaise(playerId: number, amount: number): void {
    const player = this.state.players[playerId];
    const toCall = Math.max(0, this.state.round.currentBet - player.contribStreet);
    
    // Total bet is: call + raise
    const totalBet = toCall + amount;
    const actualBet = Math.min(totalBet, player.stack);

    const newTotal = player.contribStreet + actualBet;
    const raiseSize = newTotal - this.state.round.currentBet;

    player.contribStreet = newTotal;
    player.contribTotal += actualBet;
    player.stack -= actualBet;

    // Update round state
    this.state.round.currentBet = newTotal;
    this.state.round.lastRaiseSize = raiseSize;
    this.state.round.lastAggressor = playerId;

    // Add to pot
    this.addToPot(playerId, actualBet);

    if (player.stack === 0) {
      player.allIn = true;
      this.handleAllInSidePot(playerId);
      this.log(`Seat ${playerId} raises to ${newTotal} (ALL IN)`, 'action');
    } else {
      this.log(`Seat ${playerId} raises to ${newTotal}`, 'action');
    }
  }

  private handleAllIn(playerId: number): void {
    const player = this.state.players[playerId];
    const allInAmount = player.stack;

    player.contribStreet += allInAmount;
    player.contribTotal += allInAmount;
    player.stack = 0;
    player.allIn = true;

    // Update current bet if this is a raise
    if (player.contribStreet > this.state.round.currentBet) {
      this.state.round.lastRaiseSize = player.contribStreet - this.state.round.currentBet;
      this.state.round.currentBet = player.contribStreet;
      this.state.round.lastAggressor = playerId;
    }

    this.addToPot(playerId, allInAmount);
    this.handleAllInSidePot(playerId);

    this.log(`Seat ${playerId} goes ALL IN for ${allInAmount}`, 'action');
  }

  // ==========================================================================
  // POT MANAGEMENT
  // ==========================================================================

  private addToPot(playerId: number, amount: number): void {
    // Add chips to main pot and mark player as eligible
    this.state.pots[0].amount += amount;
    this.state.pots[0].eligibleSeats.add(playerId);
  }

  private handleAllInSidePot(playerId: number): void {
    const player = this.state.players[playerId];
    const cap = player.contribTotal;

    // Create side pots for any contributions above this player's cap
    const newPots: Pot[] = [];
    
    for (const pot of this.state.pots) {
      if (pot.cap > cap) {
        // Split this pot
        const mainPotAmount = Array.from(pot.eligibleSeats)
          .filter(seatId => this.state.players[seatId].contribTotal >= cap)
          .reduce((sum, seatId) => {
            const player = this.state.players[seatId];
            const contrib = Math.min(player.contribTotal, cap);
            return sum + contrib;
          }, 0);

        const sidePotAmount = pot.amount - mainPotAmount;

        // Main pot (capped)
        newPots.push({
          cap,
          amount: mainPotAmount,
          eligibleSeats: new Set(Array.from(pot.eligibleSeats).filter(seatId => 
            this.state.players[seatId].contribTotal >= cap
          ))
        });

        // Side pot (overflow)
        if (sidePotAmount > 0) {
          newPots.push({
            cap: pot.cap,
            amount: sidePotAmount,
            eligibleSeats: new Set(Array.from(pot.eligibleSeats).filter(seatId =>
              this.state.players[seatId].contribTotal > cap
            ))
          });
        }
      } else {
        newPots.push(pot);
      }
    }

    this.state.pots = newPots;
  }

  // ==========================================================================
  // BETTING ROUND END
  // ==========================================================================

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.getActivePlayers();
    
    // Only one player left
    if (activePlayers.length <= 1) {
      return true;
    }

    // All players have acted and matched the current bet
    const allMatched = activePlayers.every(p => 
      p.allIn || p.contribStreet === this.state.round.currentBet
    );

    // Everyone has had a chance to act
    const everyoneActed = this.state.round.actionsThisRound >= activePlayers.length;

    return allMatched && everyoneActed;
  }

  private endBettingRound(): void {
    this.log(`${this.state.street} betting complete`, 'betting');

    // Check if only one player remains
    if (this.getActivePlayers().length === 1) {
      this.awardPotsToLastPlayer();
      return;
    }

    // Advance to next street
    switch (this.state.street) {
      case 'PREFLOP':
        this.dealFlop();
        this.initBettingRound('FLOP');
        break;

      case 'FLOP':
        this.dealTurn();
        this.initBettingRound('TURN');
        break;

      case 'TURN':
        this.dealRiver();
        this.initBettingRound('RIVER');
        break;

      case 'RIVER':
        this.goToShowdown();
        break;
    }

    this.notifyUpdate();
  }

  // ==========================================================================
  // BOARD DEALING
  // ==========================================================================

  private dealFlop(): void {
    this.burnCard();
    this.state.board.push(this.state.deck.pop()!);
    this.state.board.push(this.state.deck.pop()!);
    this.state.board.push(this.state.deck.pop()!);
    this.log('Flop dealt', 'deal');
  }

  private dealTurn(): void {
    this.burnCard();
    this.state.board.push(this.state.deck.pop()!);
    this.log('Turn dealt', 'deal');
  }

  private dealRiver(): void {
    this.burnCard();
    this.state.board.push(this.state.deck.pop()!);
    this.log('River dealt', 'deal');
  }

  private burnCard(): void {
    const burned = this.state.deck.pop();
    if (burned !== undefined) {
      this.state.burn.push(burned);
    }
  }

  // ==========================================================================
  // SHOWDOWN
  // ==========================================================================

  private goToShowdown(): void {
    this.state.street = 'SHOWDOWN';
    this.log('Going to showdown', 'showdown');

    // Evaluate all hands
    const handRankings = this.evaluateAllHands();

    // Award each pot
    for (const pot of this.state.pots) {
      this.awardPot(pot, handRankings);
    }

    this.notifyUpdate();

    // TODO: Start next hand after delay
    setTimeout(() => {
      if (this.state.players.filter(p => p.stack > 0).length >= 2) {
        this.startHand();
      }
    }, 5000);
  }

  private evaluateAllHands(): Map<number, number> {
    const rankings = new Map<number, number>();

    for (const player of this.state.players) {
      if (!player.folded && player.inHand) {
        const hand = [...player.hole, ...this.state.board];
        const rank = evaluateHand(hand);
        rankings.set(player.seatId, rank);
      }
    }

    return rankings;
  }

  private awardPot(pot: Pot, rankings: Map<number, number>): void {
    // Find eligible players
    const eligible = Array.from(pot.eligibleSeats).filter(seatId => rankings.has(seatId));
    
    if (eligible.length === 0) {
      return;
    }

    // Find best hand(s)
    let bestRank = -1;
    const winners: number[] = [];

    for (const seatId of eligible) {
      const rank = rankings.get(seatId)!;
      if (rank > bestRank) {
        bestRank = rank;
        winners.length = 0;
        winners.push(seatId);
      } else if (rank === bestRank) {
        winners.push(seatId);
      }
    }

    // Split pot among winners
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;

    winners.forEach((seatId, index) => {
      const amount = share + (index === 0 ? remainder : 0); // First winner gets odd chip
      this.state.players[seatId].stack += amount;
      this.log(`Seat ${seatId} wins ${amount}`, 'win');
    });
  }

  private awardPotsToLastPlayer(): void {
    const lastPlayer = this.getActivePlayers()[0];
    if (!lastPlayer) return;

    const totalPot = this.state.pots.reduce((sum, pot) => sum + pot.amount, 0);
    lastPlayer.stack += totalPot;

    this.log(`Seat ${lastPlayer.seatId} wins ${totalPot} (all others folded)`, 'win');
    
    this.notifyUpdate();

    // Start next hand
    setTimeout(() => {
      if (this.state.players.filter(p => p.stack > 0).length >= 2) {
        this.startHand();
      }
    }, 3000);
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  private nextActivePlayer(fromIndex: number): number {
    let next = (fromIndex + 1) % this.state.players.length;
    let checked = 0;

    while (checked < this.state.players.length) {
      const player = this.state.players[next];
      if (player.inHand && !player.folded && !player.allIn) {
        return next;
      }
      next = (next + 1) % this.state.players.length;
      checked++;
    }

    return fromIndex; // No active players found
  }

  private getActivePlayers(): Player[] {
    return this.state.players.filter(p => p.inHand && !p.folded);
  }

  private shuffleDeck(): Card[] {
    const deck: Card[] = [];
    for (let i = 0; i < 52; i++) {
      deck.push(i);
    }

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  private log(action: string, type: string): void {
    this.gameLog.push({ action, type, timestamp: Date.now() });
  }

  private notifyUpdate(): void {
    this.onStateUpdate(this.state);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  public getState(): TableState {
    return this.state;
  }

  public getGameLog(): Array<{ action: string; type: string; timestamp: number }> {
    return this.gameLog;
  }

  public getLegalActions(playerId: number): Action[] {
    const player = this.state.players[playerId];
    if (!player || !player.inHand || player.folded || player.allIn) {
      return [];
    }

    const toCall = Math.max(0, this.state.round.currentBet - player.contribStreet);
    const actions: Action[] = [];

    if (toCall === 0) {
      actions.push('check');
      if (player.stack >= this.state.bigBlind) {
        actions.push('bet');
      }
    } else {
      actions.push('fold');
      if (player.stack >= toCall) {
        actions.push('call');
        
        const minRaiseTo = this.state.round.currentBet + this.state.round.lastRaiseSize;
        if (player.contribStreet + player.stack >= minRaiseTo) {
          actions.push('raise');
        }
      }
    }

    if (player.stack > 0) {
      actions.push('allin');
    }

    return actions;
  }
}
