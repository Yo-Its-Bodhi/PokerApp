/**
 * Comprehensive Poker Betting Logic
 * Based on WSOP rules for button availability and sizing
 */

export interface PlayerBettingState {
  contrib: number;      // What player has put in this street
  stack: number;        // Chips player has behind
  allIn: boolean;       // Is player all-in?
  inHand: boolean;      // Is player still in the hand?
}

export interface TableBettingState {
  currentBet: number;       // Highest contrib by any player this street
  pot: number;              // Total pot size
  minBet: number;           // Min opening bet (usually 1×BB)
  lastRaiseSize: number;    // Size of the last raise
  bigBlind: number;         // Big blind amount
}

export interface BettingAction {
  type: 'check' | 'call' | 'bet' | 'raise' | 'fold' | 'allin';
  amount?: number;          // Amount for bet/raise/call
  min?: number;             // Min amount for bet/raise
  max?: number;             // Max amount (all-in cap)
  label?: string;           // Display label
  note?: string;            // Special notes (e.g., "short-raise")
  disabled?: boolean;       // Is this action available?
}

export interface BettingButtons {
  canCheck: boolean;
  canCall: boolean;
  canBet: boolean;
  canRaise: boolean;
  mustFold: boolean;
  toCall: number;
  minBetAmount: number;
  minRaiseToAmount: number;
  maxAmount: number;
  allInCap: number;
  actions: BettingAction[];
}

/**
 * Calculate all available betting actions for a player
 */
export function calculateBettingActions(
  player: PlayerBettingState,
  table: TableBettingState
): BettingButtons {
  // If player is all-in or not in hand, no actions available
  if (player.allIn || !player.inHand) {
    return {
      canCheck: false,
      canCall: false,
      canBet: false,
      canRaise: false,
      mustFold: false,
      toCall: 0,
      minBetAmount: 0,
      minRaiseToAmount: 0,
      maxAmount: 0,
      allInCap: 0,
      actions: []
    };
  }

  // Calculate key values
  const toCall = Math.max(0, table.currentBet - player.contrib);
  const minBet = table.minBet || table.bigBlind;
  const minRaiseTo = table.currentBet + (table.lastRaiseSize || table.bigBlind);
  const allInCap = player.contrib + player.stack;
  const maxAmount = player.stack;

  // Determine available actions
  const canCheck = toCall === 0;
  const canCall = toCall > 0 && player.stack > toCall;
  const mustAllInToCall = toCall > 0 && player.stack <= toCall;
  
  // Can bet if no bet exists and have enough chips
  const canBet = toCall === 0 && player.stack >= minBet;
  const canBetButOnlyAllIn = toCall === 0 && player.stack > 0 && player.stack < minBet;
  
  // Can raise if facing a bet and can meet minimum raise
  const canMinRaise = allInCap >= minRaiseTo;
  const canRaise = toCall > 0 && canMinRaise;
  const canShortRaiseAllIn = toCall > 0 && !canMinRaise && player.stack > 0;

  const actions: BettingAction[] = [];

  // A) NO BET TO YOU (can check)
  if (canCheck) {
    actions.push({
      type: 'check',
      label: 'CHECK'
    });

    if (canBet) {
      actions.push({
        type: 'bet',
        min: minBet,
        max: maxAmount,
        label: 'BET',
        amount: minBet
      });
    } else if (canBetButOnlyAllIn) {
      actions.push({
        type: 'allin',
        amount: player.stack,
        label: `ALL IN (${player.stack})`
      });
    }
  }
  
  // B) FACING A BET (must call or fold)
  else if (toCall > 0) {
    actions.push({
      type: 'fold',
      label: 'FOLD'
    });

    if (mustAllInToCall) {
      // Short stack - calling is all-in
      actions.push({
        type: 'allin',
        amount: player.stack,
        label: `ALL IN (${player.stack})`
      });
    } else {
      // Can afford to call
      actions.push({
        type: 'call',
        amount: toCall,
        label: `CALL ${toCall}`
      });

      if (canRaise) {
        // Can make legal raise
        actions.push({
          type: 'raise',
          min: minRaiseTo,
          max: allInCap,
          label: 'RAISE',
          amount: minRaiseTo
        });
      } else if (canShortRaiseAllIn) {
        // Can only all-in for less than min raise
        actions.push({
          type: 'allin',
          amount: player.stack,
          label: `ALL IN (${player.stack})`,
          note: 'Short-raise; may not reopen action'
        });
      }
    }
  }

  // Always add fold if facing a bet
  if (toCall > 0 && !actions.some(a => a.type === 'fold')) {
    actions.unshift({
      type: 'fold',
      label: 'FOLD'
    });
  }

  return {
    canCheck,
    canCall,
    canBet,
    canRaise,
    mustFold: false,
    toCall,
    minBetAmount: minBet,
    minRaiseToAmount: minRaiseTo,
    maxAmount,
    allInCap,
    actions
  };
}

/**
 * Calculate pot-based bet sizes
 */
export function calculatePotSizes(
  pot: number,
  toCall: number,
  playerStack: number,
  playerContrib: number
): { [key: string]: number } {
  const potAfterCall = pot + toCall;
  
  return {
    'third': Math.min(Math.floor(potAfterCall / 3), playerStack),
    'half': Math.min(Math.floor(potAfterCall / 2), playerStack),
    'threeQuarters': Math.min(Math.floor(potAfterCall * 0.75), playerStack),
    'pot': Math.min(potAfterCall, playerStack),
    'allIn': playerStack
  };
}

/**
 * Validate if a bet/raise amount is legal
 */
export function validateBetAmount(
  amount: number,
  player: PlayerBettingState,
  table: TableBettingState
): { valid: boolean; reason?: string; adjustedAmount?: number } {
  const toCall = Math.max(0, table.currentBet - player.contrib);
  const minRaiseTo = table.currentBet + (table.lastRaiseSize || table.bigBlind);
  const allInCap = player.contrib + player.stack;

  // Amount must be positive
  if (amount <= 0) {
    return { valid: false, reason: 'Amount must be positive' };
  }

  // Can't bet more than stack
  if (amount > player.stack) {
    return { 
      valid: true, 
      adjustedAmount: player.stack,
      reason: 'Adjusted to all-in amount' 
    };
  }

  // If facing a bet, must meet minimum raise or go all-in
  if (table.currentBet > 0) {
    const totalBet = player.contrib + amount;
    
    if (totalBet < minRaiseTo && amount < player.stack) {
      return { 
        valid: false, 
        reason: `Minimum raise to ${minRaiseTo}`,
        adjustedAmount: minRaiseTo - player.contrib
      };
    }
  } else {
    // Opening bet must be at least min bet
    if (amount < table.minBet && amount < player.stack) {
      return { 
        valid: false, 
        reason: `Minimum bet ${table.minBet}`,
        adjustedAmount: table.minBet
      };
    }
  }

  return { valid: true };
}
