/**
 * Professional Texas Hold'em Poker Engine
 * Implements complete no-limit hold'em rules with side pots, min-raise logic, and showdown protocol
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type Street = 'SEATING' | 'PREP' | 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'CLEANUP';
export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';

export interface Card {
  rank: number; // 0-12 (2-A)
  suit: number; // 0-3 (♠♥♦♣)
  cardNum: number; // 0-51 unique identifier
}

export interface Player {
  seatId: number;
  playerId: string;
  stack: number;
  inHand: boolean;
  hasCards: boolean;
  hole: Card[];
  actedThisStreet: boolean;
  committedThisStreet: number;
  committedTotal: number;
  allIn: boolean;
  folded: boolean;
  sitOut: boolean;
  lastAction?: ActionType;
}

export interface Pot {
  cap: number; // Max contribution per player for this pot
  amount: number;
  eligibleSeats: number[];
}

export interface ActionLog {
  handId: string;
  seat: number;
  playerId: string;
  action: ActionType;
  amount: number;
  street: Street;
  timestamp: number;
}

export interface HandState {
  handId: string;
  street: Street;
  buttonIndex: number;
  sbIndex: number;
  bbIndex: number;
  lastAggressorSeat: number;
  currentBet: number; // Highest contribution this street
  lastRaiseSize: number;
  actionCursorSeat: number;
  firstToActSeat: number; // For tracking betting round completion
}

export interface Table {
  tableId: string;
  seats: (Player | null)[]; // Fixed size array (2-9 seats)
  maxSeats: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBet: number; // Usually = bigBlind
  deck: Card[];
  burnPile: Card[];
  board: Card[];
  pots: Pot[];
  handState: HandState;
  actionHistory: ActionLog[];
  handHistory: any[]; // Archive of completed hands
}

export interface HandRank {
  rank: number; // 0-9 (High Card to Royal Flush)
  values: number[]; // For tie-breaking (descending)
  description: string;
}

// ============================================================================
// DECK & CARD UTILITIES
// ============================================================================

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (let cardNum = 0; cardNum < 52; cardNum++) {
    deck.push({
      rank: cardNum % 13,
      suit: Math.floor(cardNum / 13),
      cardNum
    });
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function cardToString(card: Card): string {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  return ranks[card.rank] + suits[card.suit];
}

// ============================================================================
// HAND EVALUATION (7-card to best 5-card)
// ============================================================================

export function evaluateHand(cards: Card[]): HandRank {
  if (cards.length < 5) {
    return { rank: 0, values: [], description: 'Invalid Hand' };
  }

  // Generate all 5-card combinations from 7 cards
  const combos: Card[][] = [];
  if (cards.length === 5) {
    combos.push(cards);
  } else if (cards.length === 7) {
    for (let i = 0; i < 7; i++) {
      for (let j = i + 1; j < 7; j++) {
        const combo = cards.filter((_, idx) => idx !== i && idx !== j);
        combos.push(combo);
      }
    }
  }

  // Evaluate each combination and keep the best
  let bestRank: HandRank = { rank: 0, values: [], description: '' };
  
  for (const combo of combos) {
    const rank = evaluate5CardHand(combo);
    if (compareHandRanks(rank, bestRank) > 0) {
      bestRank = rank;
    }
  }

  return bestRank;
}

function evaluate5CardHand(cards: Card[]): HandRank {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);

  // Count ranks and suits
  const rankCounts = new Map<number, number>();
  const suitCounts = new Map<number, number>();
  
  ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));
  suits.forEach(s => suitCounts.set(s, (suitCounts.get(s) || 0) + 1));

  const isFlush = Array.from(suitCounts.values()).some(c => c === 5);
  const isStraight = checkStraight(ranks);
  const straightHighCard = isStraight ? getStraightHighCard(ranks) : -1;

  // Group by count
  const groups = Array.from(rankCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // Sort by count desc
      return b[0] - a[0]; // Then by rank desc
    });

  // Royal Flush (A-high straight flush)
  if (isFlush && isStraight && straightHighCard === 12) {
    return { rank: 9, values: [12], description: 'Royal Flush' };
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: 8, values: [straightHighCard], description: 'Straight Flush' };
  }

  // Four of a Kind
  if (groups[0][1] === 4) {
    return { 
      rank: 7, 
      values: [groups[0][0], groups[1][0]], 
      description: 'Four of a Kind' 
    };
  }

  // Full House
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return { 
      rank: 6, 
      values: [groups[0][0], groups[1][0]], 
      description: 'Full House' 
    };
  }

  // Flush
  if (isFlush) {
    return { rank: 5, values: ranks.slice(0, 5), description: 'Flush' };
  }

  // Straight
  if (isStraight) {
    return { rank: 4, values: [straightHighCard], description: 'Straight' };
  }

  // Three of a Kind
  if (groups[0][1] === 3) {
    const kickers = groups.slice(1).map(g => g[0]);
    return { 
      rank: 3, 
      values: [groups[0][0], ...kickers], 
      description: 'Three of a Kind' 
    };
  }

  // Two Pair
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    return { 
      rank: 2, 
      values: [groups[0][0], groups[1][0], groups[2][0]], 
      description: 'Two Pair' 
    };
  }

  // One Pair
  if (groups[0][1] === 2) {
    const kickers = groups.slice(1).map(g => g[0]);
    return { 
      rank: 1, 
      values: [groups[0][0], ...kickers], 
      description: 'One Pair' 
    };
  }

  // High Card
  return { rank: 0, values: ranks.slice(0, 5), description: 'High Card' };
}

function checkStraight(ranks: number[]): boolean {
  const unique = Array.from(new Set(ranks)).sort((a, b) => b - a);
  if (unique.length < 5) return false;

  // Check normal straight
  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) return true;
  }

  // Check A-2-3-4-5 (wheel)
  if (unique.includes(12) && unique.includes(3) && unique.includes(2) && 
      unique.includes(1) && unique.includes(0)) {
    return true;
  }

  return false;
}

function getStraightHighCard(ranks: number[]): number {
  const unique = Array.from(new Set(ranks)).sort((a, b) => b - a);
  
  // Check normal straight
  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) return unique[i];
  }

  // Check A-2-3-4-5 (wheel) - Ace is low, so high card is 5 (rank 3)
  if (unique.includes(12) && unique.includes(3) && unique.includes(2) && 
      unique.includes(1) && unique.includes(0)) {
    return 3; // 5 is the high card in wheel
  }

  return -1;
}

export function compareHandRanks(a: HandRank, b: HandRank): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  
  // Compare values array
  for (let i = 0; i < Math.max(a.values.length, b.values.length); i++) {
    const aVal = a.values[i] ?? -1;
    const bVal = b.values[i] ?? -1;
    if (aVal !== bVal) return aVal - bVal;
  }
  
  return 0; // Exact tie
}

// ============================================================================
// TABLE INITIALIZATION
// ============================================================================

export function createTable(
  tableId: string,
  maxSeats: number,
  smallBlind: number,
  bigBlind: number,
  ante: number = 0
): Table {
  return {
    tableId,
    seats: Array(maxSeats).fill(null),
    maxSeats,
    smallBlind,
    bigBlind,
    ante,
    minBet: bigBlind,
    deck: [],
    burnPile: [],
    board: [],
    pots: [],
    handState: {
      handId: '',
      street: 'SEATING',
      buttonIndex: 0,
      sbIndex: -1,
      bbIndex: -1,
      lastAggressorSeat: -1,
      currentBet: 0,
      lastRaiseSize: 0,
      actionCursorSeat: -1,
      firstToActSeat: -1
    },
    actionHistory: [],
    handHistory: []
  };
}

export function addPlayerToTable(
  table: Table,
  seatId: number,
  playerId: string,
  buyIn: number
): boolean {
  if (seatId < 0 || seatId >= table.maxSeats) return false;
  if (table.seats[seatId] !== null) return false;

  table.seats[seatId] = {
    seatId,
    playerId,
    stack: buyIn,
    inHand: false,
    hasCards: false,
    hole: [],
    actedThisStreet: false,
    committedThisStreet: 0,
    committedTotal: 0,
    allIn: false,
    folded: false,
    sitOut: false
  };

  return true;
}

export function removePlayerFromTable(table: Table, seatId: number): boolean {
  if (seatId < 0 || seatId >= table.maxSeats) return false;
  table.seats[seatId] = null;
  return true;
}

// ============================================================================
// HAND LIFECYCLE - STATE MACHINE
// ============================================================================

export function startNewHand(table: Table): void {
  // Move button
  moveButton(table);

  // Enter PREP state
  table.handState.street = 'PREP';
  table.handState.handId = `hand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Reset all player states
  for (const player of table.seats) {
    if (player && !player.sitOut && player.stack > 0) {
      player.inHand = true;
      player.hasCards = false;
      player.hole = [];
      player.actedThisStreet = false;
      player.committedThisStreet = 0;
      player.committedTotal = 0;
      player.allIn = false;
      player.folded = false;
      player.lastAction = undefined;
    } else if (player) {
      player.inHand = false;
    }
  }

  // Reset table state
  table.board = [];
  table.burnPile = [];
  table.pots = [{ cap: Infinity, amount: 0, eligibleSeats: [] }];
  table.actionHistory = [];

  // Post antes and blinds
  postAntesAndBlinds(table);

  // Shuffle and deal hole cards
  table.deck = shuffleDeck(createDeck());
  dealHoleCards(table);

  // Enter PREFLOP
  table.handState.street = 'PREFLOP';
  startBettingRound(table);
}

function moveButton(table: Table): void {
  const activePlayers = table.seats
    .map((p, idx) => p && !p.sitOut && p.stack > 0 ? idx : -1)
    .filter(idx => idx !== -1);

  if (activePlayers.length < 2) {
    table.handState.street = 'SEATING';
    return;
  }

  // Find next button position
  let nextButton = (table.handState.buttonIndex + 1) % table.maxSeats;
  let attempts = 0;
  while (!activePlayers.includes(nextButton) && attempts < table.maxSeats) {
    nextButton = (nextButton + 1) % table.maxSeats;
    attempts++;
  }

  table.handState.buttonIndex = nextButton;
}

function postAntesAndBlinds(table: Table): void {
  const activePlayers = table.seats.filter(p => p && p.inHand) as Player[];
  if (activePlayers.length < 2) return;

  const activeSeats = activePlayers.map(p => p.seatId);
  table.pots[0].eligibleSeats = [...activeSeats];

  // Post antes
  if (table.ante > 0) {
    for (const player of activePlayers) {
      const anteAmount = Math.min(player.stack, table.ante);
      player.stack -= anteAmount;
      player.committedTotal += anteAmount;
      table.pots[0].amount += anteAmount;
      if (player.stack === 0) player.allIn = true;
    }
  }

  // Determine SB and BB positions
  const isHeadsUp = activePlayers.length === 2;
  
  if (isHeadsUp) {
    // Heads-up: Button is SB, other is BB
    table.handState.sbIndex = table.handState.buttonIndex;
    table.handState.bbIndex = getNextActiveSeat(table, table.handState.buttonIndex);
  } else {
    // Normal: SB is left of button, BB is left of SB
    table.handState.sbIndex = getNextActiveSeat(table, table.handState.buttonIndex);
    table.handState.bbIndex = getNextActiveSeat(table, table.handState.sbIndex);
  }

  // Post small blind
  const sbPlayer = table.seats[table.handState.sbIndex]!;
  const sbAmount = Math.min(sbPlayer.stack, table.smallBlind);
  sbPlayer.stack -= sbAmount;
  sbPlayer.committedThisStreet += sbAmount;
  sbPlayer.committedTotal += sbAmount;
  table.pots[0].amount += sbAmount;
  if (sbPlayer.stack === 0) sbPlayer.allIn = true;

  // Post big blind
  const bbPlayer = table.seats[table.handState.bbIndex]!;
  const bbAmount = Math.min(bbPlayer.stack, table.bigBlind);
  bbPlayer.stack -= bbAmount;
  bbPlayer.committedThisStreet += bbAmount;
  bbPlayer.committedTotal += bbAmount;
  table.pots[0].amount += bbAmount;
  if (bbPlayer.stack === 0) bbPlayer.allIn = true;

  // Set current bet to BB amount
  table.handState.currentBet = bbAmount;
  table.handState.lastRaiseSize = bbAmount - sbAmount;
  table.handState.lastAggressorSeat = table.handState.bbIndex;
}

function dealHoleCards(table: Table): void {
  const activePlayers = table.seats.filter(p => p && p.inHand) as Player[];
  
  // Deal one card to each player, twice
  for (let round = 0; round < 2; round++) {
    for (const player of activePlayers) {
      const card = table.deck.pop();
      if (card) {
        player.hole.push(card);
        player.hasCards = true;
      }
    }
  }
}

function startBettingRound(table: Table): void {
  // Reset street-specific state
  for (const player of table.seats) {
    if (player && player.inHand && !player.folded) {
      player.actedThisStreet = false;
      player.committedThisStreet = 0;
    }
  }

  table.handState.currentBet = 0;
  table.handState.lastRaiseSize = table.minBet;
  table.handState.lastAggressorSeat = -1;

  // Determine first to act
  const isHeadsUp = getActivePlayers(table).length === 2;
  
  if (table.handState.street === 'PREFLOP') {
    // Preflop: first to act is left of BB (or button in heads-up)
    if (isHeadsUp) {
      table.handState.actionCursorSeat = table.handState.buttonIndex;
    } else {
      table.handState.actionCursorSeat = getNextActiveSeat(table, table.handState.bbIndex);
    }
    // For preflop, BB is considered the aggressor
    table.handState.currentBet = table.bigBlind;
    table.handState.lastAggressorSeat = table.handState.bbIndex;
    
    // Restore committed amounts from blinds
    const bbPlayer = table.seats[table.handState.bbIndex];
    const sbPlayer = table.seats[table.handState.sbIndex];
    if (bbPlayer) bbPlayer.committedThisStreet = Math.min(bbPlayer.committedTotal, table.bigBlind);
    if (sbPlayer) sbPlayer.committedThisStreet = Math.min(sbPlayer.committedTotal, table.smallBlind);
  } else {
    // Postflop: first to act is left of button
    table.handState.actionCursorSeat = getNextActiveSeat(table, table.handState.buttonIndex);
  }

  table.handState.firstToActSeat = table.handState.actionCursorSeat;
}

// ============================================================================
// ACTION PROCESSING
// ============================================================================

export function getValidActions(table: Table, seatId: number): {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  minBet: number;
  canRaise: boolean;
  minRaise: number;
  maxBet: number;
} {
  const player = table.seats[seatId];
  if (!player || !player.inHand || player.folded || player.allIn) {
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canBet: false,
      minBet: 0,
      canRaise: false,
      minRaise: 0,
      maxBet: 0
    };
  }

  const toCall = table.handState.currentBet - player.committedThisStreet;
  const canCheck = toCall === 0;
  const canCall = toCall > 0 && player.stack >= toCall;
  const callAmount = Math.min(toCall, player.stack);

  const noBetYet = table.handState.currentBet === 0;
  const canBet = noBetYet && player.stack > 0;
  const minBet = Math.min(table.minBet, player.stack);

  const canRaise = table.handState.currentBet > 0 && player.stack > toCall;
  const minRaiseAmount = table.handState.lastRaiseSize;
  const minRaise = Math.min(
    table.handState.currentBet + minRaiseAmount,
    player.committedThisStreet + player.stack
  );

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount,
    canBet,
    minBet,
    canRaise,
    minRaise,
    maxBet: player.committedThisStreet + player.stack
  };
}

export function processAction(
  table: Table,
  seatId: number,
  action: ActionType,
  amount?: number
): { success: boolean; message: string } {
  const player = table.seats[seatId];
  
  if (!player || !player.inHand || player.folded || player.allIn) {
    return { success: false, message: 'Invalid player state' };
  }

  if (table.handState.actionCursorSeat !== seatId) {
    return { success: false, message: 'Not your turn' };
  }

  const valid = getValidActions(table, seatId);
  let success = false;
  let message = '';

  switch (action) {
    case 'FOLD':
      player.folded = true;
      player.inHand = false;
      player.lastAction = 'FOLD';
      success = true;
      message = 'Folded';
      break;

    case 'CHECK':
      if (!valid.canCheck) {
        return { success: false, message: 'Cannot check - must call or raise' };
      }
      player.actedThisStreet = true;
      player.lastAction = 'CHECK';
      success = true;
      message = 'Checked';
      break;

    case 'CALL':
      if (!valid.canCall && valid.callAmount === 0) {
        return { success: false, message: 'Nothing to call' };
      }
      const callAmt = valid.callAmount;
      player.stack -= callAmt;
      player.committedThisStreet += callAmt;
      player.committedTotal += callAmt;
      table.pots[0].amount += callAmt;
      player.actedThisStreet = true;
      player.lastAction = 'CALL';
      if (player.stack === 0) player.allIn = true;
      success = true;
      message = `Called ${callAmt}`;
      break;

    case 'BET':
      if (!valid.canBet) {
        return { success: false, message: 'Cannot bet' };
      }
      const betAmount = amount ?? valid.minBet;
      if (betAmount < valid.minBet && betAmount < player.stack) {
        return { success: false, message: `Min bet is ${valid.minBet}` };
      }
      if (betAmount > player.stack) {
        return { success: false, message: 'Bet exceeds stack' };
      }
      player.stack -= betAmount;
      player.committedThisStreet += betAmount;
      player.committedTotal += betAmount;
      table.pots[0].amount += betAmount;
      table.handState.currentBet = player.committedThisStreet;
      table.handState.lastRaiseSize = betAmount;
      table.handState.lastAggressorSeat = seatId;
      player.actedThisStreet = true;
      player.lastAction = 'BET';
      if (player.stack === 0) player.allIn = true;
      success = true;
      message = `Bet ${betAmount}`;
      break;

    case 'RAISE':
      if (!valid.canRaise && valid.callAmount === player.stack) {
        // All-in call scenario
        return processAction(table, seatId, 'CALL');
      }
      if (!valid.canRaise) {
        return { success: false, message: 'Cannot raise' };
      }
      const raiseTotal = amount ?? valid.minRaise;
      const raiseCost = raiseTotal - player.committedThisStreet;
      
      if (raiseCost > player.stack) {
        return { success: false, message: 'Raise exceeds stack' };
      }
      
      const newRaiseSize = raiseTotal - table.handState.currentBet;
      if (newRaiseSize < table.handState.lastRaiseSize && raiseCost < player.stack) {
        return { success: false, message: `Min raise is ${table.handState.currentBet + table.handState.lastRaiseSize}` };
      }

      player.stack -= raiseCost;
      player.committedThisStreet = raiseTotal;
      player.committedTotal += raiseCost;
      table.pots[0].amount += raiseCost;
      
      // Check if this reopens action (full raise)
      if (newRaiseSize >= table.handState.lastRaiseSize) {
        table.handState.lastRaiseSize = newRaiseSize;
        table.handState.lastAggressorSeat = seatId;
        // Reset acted flags for players behind
        for (const p of table.seats) {
          if (p && p.inHand && !p.folded && p.seatId !== seatId) {
            p.actedThisStreet = false;
          }
        }
      }
      
      table.handState.currentBet = raiseTotal;
      player.actedThisStreet = true;
      player.lastAction = 'RAISE';
      if (player.stack === 0) player.allIn = true;
      success = true;
      message = `Raised to ${raiseTotal}`;
      break;

    case 'ALL_IN':
      const allInAmount = player.stack;
      player.stack = 0;
      player.committedThisStreet += allInAmount;
      player.committedTotal += allInAmount;
      table.pots[0].amount += allInAmount;
      player.allIn = true;
      player.actedThisStreet = true;
      player.lastAction = 'ALL_IN';
      
      // Determine if this is a raise that reopens action
      if (player.committedThisStreet > table.handState.currentBet) {
        const raiseSize = player.committedThisStreet - table.handState.currentBet;
        if (raiseSize >= table.handState.lastRaiseSize) {
          table.handState.lastRaiseSize = raiseSize;
          table.handState.lastAggressorSeat = seatId;
          for (const p of table.seats) {
            if (p && p.inHand && !p.folded && p.seatId !== seatId) {
              p.actedThisStreet = false;
            }
          }
        }
        table.handState.currentBet = player.committedThisStreet;
      }
      
      success = true;
      message = `All-in ${allInAmount}`;
      break;
  }

  if (success) {
    logAction(table, seatId, action, amount ?? 0);
    advanceAction(table);
  }

  return { success, message };
}

function logAction(table: Table, seat: number, action: ActionType, amount: number): void {
  const player = table.seats[seat];
  if (!player) return;

  table.actionHistory.push({
    handId: table.handState.handId,
    seat,
    playerId: player.playerId,
    action,
    amount,
    street: table.handState.street,
    timestamp: Date.now()
  });
}

// ============================================================================
// ACTION FLOW & STREET PROGRESSION
// ============================================================================

function advanceAction(table: Table): void {
  // Check if betting round is complete
  if (isBettingRoundComplete(table)) {
    advanceStreet(table);
    return;
  }

  // Move to next active player
  table.handState.actionCursorSeat = getNextActiveSeat(table, table.handState.actionCursorSeat);
}

function isBettingRoundComplete(table: Table): boolean {
  const activePlayers = getActivePlayers(table);
  
  // Only one player left - immediate win
  if (activePlayers.length === 1) {
    return true;
  }

  // All players are all-in except max one
  const nonAllInPlayers = activePlayers.filter(p => !p.allIn);
  if (nonAllInPlayers.length <= 1) {
    return true;
  }

  // All active players have acted and matched the current bet
  for (const player of activePlayers) {
    if (player.allIn) continue; // All-in players don't need to act
    
    if (!player.actedThisStreet) return false;
    
    // Check if player has matched current bet
    if (player.committedThisStreet < table.handState.currentBet) {
      return false;
    }
  }

  return true;
}

function advanceStreet(table: Table): void {
  const activePlayers = getActivePlayers(table);
  
  // Check for immediate winner
  if (activePlayers.length === 1) {
    table.handState.street = 'SHOWDOWN';
    resolveHand(table);
    return;
  }

  // Create side pots if needed
  createSidePots(table);

  // Advance to next street
  switch (table.handState.street) {
    case 'PREFLOP':
      dealFlop(table);
      table.handState.street = 'FLOP';
      startBettingRound(table);
      break;
    case 'FLOP':
      dealTurn(table);
      table.handState.street = 'TURN';
      startBettingRound(table);
      break;
    case 'TURN':
      dealRiver(table);
      table.handState.street = 'RIVER';
      startBettingRound(table);
      break;
    case 'RIVER':
      table.handState.street = 'SHOWDOWN';
      resolveHand(table);
      break;
  }
}

function dealFlop(table: Table): void {
  // Burn one card
  const burn = table.deck.pop();
  if (burn) table.burnPile.push(burn);
  
  // Deal 3 cards
  for (let i = 0; i < 3; i++) {
    const card = table.deck.pop();
    if (card) table.board.push(card);
  }
}

function dealTurn(table: Table): void {
  const burn = table.deck.pop();
  if (burn) table.burnPile.push(burn);
  
  const card = table.deck.pop();
  if (card) table.board.push(card);
}

function dealRiver(table: Table): void {
  const burn = table.deck.pop();
  if (burn) table.burnPile.push(burn);
  
  const card = table.deck.pop();
  if (card) table.board.push(card);
}

// ============================================================================
// SIDE POT CREATION
// ============================================================================

function createSidePots(table: Table): void {
  const activePlayers = getActivePlayers(table);
  
  // Find all-in players sorted by contribution
  const allInPlayers = activePlayers
    .filter(p => p.allIn)
    .sort((a, b) => a.committedTotal - b.committedTotal);

  if (allInPlayers.length === 0) return;

  const newPots: Pot[] = [];
  let previousCap = 0;

  for (const allInPlayer of allInPlayers) {
    const cap = allInPlayer.committedTotal;
    if (cap <= previousCap) continue;

    let potAmount = 0;
    const eligibleSeats: number[] = [];

    for (const player of table.seats) {
      if (!player || player.folded) continue;
      
      const contribution = Math.min(player.committedTotal, cap) - previousCap;
      if (contribution > 0) {
        potAmount += contribution;
        eligibleSeats.push(player.seatId);
      }
    }

    if (potAmount > 0) {
      newPots.push({ cap, amount: potAmount, eligibleSeats });
    }

    previousCap = cap;
  }

  // Create final pot for remaining chips
  const maxContribution = Math.max(...activePlayers.map(p => p.committedTotal));
  if (maxContribution > previousCap) {
    let potAmount = 0;
    const eligibleSeats: number[] = [];

    for (const player of table.seats) {
      if (!player || player.folded) continue;
      
      const contribution = player.committedTotal - previousCap;
      if (contribution > 0) {
        potAmount += contribution;
        eligibleSeats.push(player.seatId);
      }
    }

    if (potAmount > 0) {
      newPots.push({ cap: Infinity, amount: potAmount, eligibleSeats });
    }
  }

  // Replace pots if we created side pots
  if (newPots.length > 0) {
    table.pots = newPots;
  }
}

// ============================================================================
// SHOWDOWN & POT DISTRIBUTION
// ============================================================================

function resolveHand(table: Table): void {
  const activePlayers = getActivePlayers(table);
  
  // Single player wins (everyone else folded)
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    const totalPot = table.pots.reduce((sum, pot) => sum + pot.amount, 0);
    winner.stack += totalPot;
    table.handState.street = 'CLEANUP';
    archiveHand(table);
    return;
  }

  // Create side pots if not already done
  if (table.pots.length === 1 && table.pots[0].cap === Infinity) {
    createSidePots(table);
  }

  // Showdown - evaluate hands and award pots
  for (const pot of table.pots) {
    const eligiblePlayers = pot.eligibleSeats
      .map(seat => table.seats[seat])
      .filter(p => p && !p.folded) as Player[];

    if (eligiblePlayers.length === 0) continue;

    // Evaluate all eligible hands
    const handRanks = eligiblePlayers.map(player => ({
      player,
      hand: evaluateHand([...player.hole, ...table.board])
    }));

    // Find best hand(s)
    let bestRank = handRanks[0].hand;
    let winners = [handRanks[0].player];

    for (let i = 1; i < handRanks.length; i++) {
      const comparison = compareHandRanks(handRanks[i].hand, bestRank);
      if (comparison > 0) {
        bestRank = handRanks[i].hand;
        winners = [handRanks[i].player];
      } else if (comparison === 0) {
        winners.push(handRanks[i].player);
      }
    }

    // Split pot among winners
    const potShare = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;

    for (let i = 0; i < winners.length; i++) {
      const bonus = i === 0 ? remainder : 0; // First winner gets odd chips
      winners[i].stack += potShare + bonus;
    }
  }

  table.handState.street = 'CLEANUP';
  archiveHand(table);
}

function archiveHand(table: Table): void {
  table.handHistory.push({
    handId: table.handState.handId,
    board: table.board.map(cardToString),
    pots: table.pots,
    actions: [...table.actionHistory],
    winners: [] // TODO: Track winners
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getActivePlayers(table: Table): Player[] {
  return table.seats.filter(p => p && p.inHand && !p.folded) as Player[];
}

function getNextActiveSeat(table: Table, currentSeat: number): number {
  let nextSeat = (currentSeat + 1) % table.maxSeats;
  let attempts = 0;

  while (attempts < table.maxSeats) {
    const player = table.seats[nextSeat];
    if (player && player.inHand && !player.folded && !player.allIn) {
      return nextSeat;
    }
    nextSeat = (nextSeat + 1) % table.maxSeats;
    attempts++;
  }

  return currentSeat; // Fallback
}

export function getTableState(table: Table) {
  return {
    tableId: table.tableId,
    street: table.handState.street,
    board: table.board.map(cardToString),
    pot: table.pots.reduce((sum, pot) => sum + pot.amount, 0),
    pots: table.pots,
    currentBet: table.handState.currentBet,
    actionOn: table.handState.actionCursorSeat,
    players: table.seats.map(p => p ? {
      seatId: p.seatId,
      playerId: p.playerId,
      stack: p.stack,
      inHand: p.inHand,
      folded: p.folded,
      allIn: p.allIn,
      committed: p.committedThisStreet,
      lastAction: p.lastAction
    } : null)
  };
}
