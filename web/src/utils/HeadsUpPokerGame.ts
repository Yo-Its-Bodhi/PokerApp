import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Hand } from 'pokersolver';
import { playWinPot } from './audioSystem';

interface DemoGameState {
  players: any[];
  myCards: number[];
  opponentCards: number[];
  communityCards: number[];
  pot: number;
  street: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentPlayer: number;
  dealerButton: number;
  smallBlind: number;
  bigBlind: number;
  myBet: number;
  opponentBet: number;
  currentBet: number;
  gameLog: any[];
  rake: number; // House cut from each pot
  totalRakeCollected: number; // Total rake collected this session
  showOpponentCards: boolean; // Show opponent cards at showdown
  winningHand?: string; // Description of winning hand
  flopDealt: boolean; // Track if flop was dealt (for rake rules)
  playerTimeouts: number; // Consecutive timeouts for player (0-2)
  opponentTimeouts: number; // Consecutive timeouts for opponent (0-2)
  awaitingShowMuckDecision: boolean; // Waiting for player to show or muck after fold
  showMyCardsAfterFold: boolean; // Whether to reveal player's cards after folding
  playerRemoved: boolean; // Player was removed due to timeouts
}

// Player stats tracking
export interface PlayerStats {
  address: string;
  alias: string;
  avatar: string;
  totalWon: number;
  totalLost: number;
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  totalRakePaid: number;
  winRate: number;
}

export class HeadsUpPokerGame {
  private state: DemoGameState;
  private onStateUpdate: (state: DemoGameState) => void;
  private onTurnStart?: (playerId: number) => void; // Callback when a turn starts (for timer)
  private deck: number[]; // Persistent deck for the hand
  private initialDealerSet: boolean = false; // Track if initial dealer determined
  private handCount: number = 0; // Track number of hands played
  private playerSeat: number;
  private opponentSeat: number;
  private playerHasActed: boolean = false; // Track if player acted this street
  private opponentHasActed: boolean = false; // Track if opponent acted this street
  private lastAggressor: 'player' | 'opponent' | null = null; // Who raised/bet last
  private aiActionTimeout: NodeJS.Timeout | null = null; // Track pending AI action timeouts
  
  // Helper: Get next active seat in 4-player game
  private getNextActiveSeat(currentSeat: number): number {
    let nextSeat = currentSeat;
    for (let i = 0; i < 4; i++) {
      nextSeat = (nextSeat % 4) + 1;
      const player = this.state.players.find(p => p.seat === nextSeat);
      if (player && !player.folded && (player.stack > 0 || player.allIn)) {
        return nextSeat;
      }
    }
    return currentSeat;
  }
  
  // Helper: Check if all players have acted and bets are equal
  private isRoundComplete(): boolean {
    const activePlayers = this.state.players.filter(p => !p.folded);
    if (activePlayers.length <= 1) return true;
    
    // Get highest bet
    const maxBet = Math.max(...this.state.players.map(p => p.bet));
    
    // Check if all active players have either:
    // 1. Matched the max bet OR
    // 2. Are all-in for less
    const allMatched = activePlayers.every(p => 
      p.bet === maxBet || (p.allIn && p.bet < maxBet)
    );
    
    // Check if everyone has acted at least once this street
    // (This prevents premature advance when first player checks)
    const allActed = activePlayers.every(p => {
      if (p.isMe) return this.playerHasActed;
      return this.opponentHasActed; // For now, treat all AI as one group
    });
    
    return allMatched && allActed;
  }

  constructor(playerSeat: number, onStateUpdate: (state: DemoGameState) => void, onTurnStart?: (playerId: number) => void) {
    this.onStateUpdate = onStateUpdate;
    this.onTurnStart = onTurnStart;
    this.deck = [];
    this.playerSeat = playerSeat;
    this.opponentSeat = playerSeat === 1 ? 2 : 1; // Keep for compatibility but use proper 4-player logic
    
    // Create 4-player game (you + 3 AI opponents)
    // Ensure AI players fill seats around the human player
    const aiPlayers = [
      { name: 'AI Alpha', avatar: '🤖', seat: playerSeat === 1 ? 2 : 1 },
      { name: 'AI Beta', avatar: '🎮', seat: playerSeat <= 2 ? 3 : 2 },
      { name: 'AI Gamma', avatar: '👾', seat: playerSeat <= 3 ? 4 : 3 }
    ];
    
    // Build 4-player array in seat order
    const allPlayers = [];
    for (let seat = 1; seat <= 4; seat++) {
      if (seat === playerSeat) {
        allPlayers.push({
          seat,
          stack: 100000,
          bet: 0,
          folded: false,
          allIn: false,
          isMe: true,
          isDealer: seat === 1,
          isSmallBlind: false,
          isBigBlind: false
        });
      } else {
        const aiPlayer = aiPlayers.find(ai => ai.seat === seat);
        allPlayers.push({
          seat,
          stack: 100000,
          bet: 0,
          folded: false,
          allIn: false,
          name: aiPlayer?.name || `AI ${seat}`,
          avatar: aiPlayer?.avatar || '🤖',
          isDealer: seat === 1 && playerSeat !== 1,
          isSmallBlind: false,
          isBigBlind: false
        });
      }
    }
    
    this.state = {
      players: allPlayers,
      myCards: [],
      opponentCards: [0, 0], // Hidden initially
      communityCards: [],
      pot: 0,
      street: 'preflop',
      currentPlayer: playerSeat === 1 ? 1 : 4, // SB acts first preflop
      dealerButton: 1,
      smallBlind: 500,
      bigBlind: 1000,
      myBet: 0,
      opponentBet: 0,
      currentBet: 0,
      gameLog: [],
      rake: 0,
      totalRakeCollected: 0,
      showOpponentCards: false,
      winningHand: undefined,
      flopDealt: false,
      playerTimeouts: 0,
      opponentTimeouts: 0,
      awaitingShowMuckDecision: false,
      showMyCardsAfterFold: false,
      playerRemoved: false
    };
  }

  // Public method to add chips to player's stack (for rebuy/top-up)
  public addChips(amount: number) {
    console.log(`[Rebuy] Adding ${amount} chips to player's stack`);
    
    this.state = {
      ...this.state,
      players: this.state.players.map(p => 
        p.isMe ? { ...p, stack: p.stack + amount, chips: p.chips + amount } : p
      )
    };
    
    this.onStateUpdate(this.state);
  }

  // Public method to handle show/muck decision after fold
  public handleShowMuckDecision(showCards: boolean) {
    if (!this.state.awaitingShowMuckDecision) return;
    
    this.state.awaitingShowMuckDecision = false;
    this.state.showMyCardsAfterFold = showCards;
    
    if (showCards) {
      this.state.gameLog.push({
        action: '🃏 You chose to SHOW your cards',
        type: 'info',
        timestamp: Date.now()
      });
    } else {
      this.state.gameLog.push({
        action: '🙈 You chose to MUCK your cards',
        type: 'info',
        timestamp: Date.now()
      });
    }
    
    this.onStateUpdate(this.state);
    
    // End hand after short delay
    setTimeout(() => {
      this.endHand(false); // Opponent wins
    }, 1500);
  }

  // Public method to handle timer expiry (called from App.tsx when timer hits 0)
  public handleTimerExpiry(seat: number) {
    console.log('[handleTimerExpiry] Called for seat:', seat, 'playerSeat:', this.playerSeat, 'currentPlayer:', this.state.currentPlayer, 'street:', this.state.street);
    // Determine if it's the player or opponent
    const isPlayer = seat === this.playerSeat;
    const currentPlayerState = this.state.players.find(p => p.seat === seat);
    
    if (!currentPlayerState) {
      console.log('[handleTimerExpiry] No player found for seat:', seat);
      return;
    }

    // Check if there's a bet to call
    const hasBetToCall = isPlayer 
      ? this.state.opponentBet > this.state.myBet 
      : this.state.myBet > this.state.opponentBet;

    // Increment timeout counter
    if (isPlayer) {
      this.state.playerTimeouts++;
    } else {
      this.state.opponentTimeouts++;
    }

    // Log the timeout
    this.state.gameLog.push({
      action: `⏰ ${isPlayer ? 'You' : 'Opponent'} timed out (${isPlayer ? this.state.playerTimeouts : this.state.opponentTimeouts}/2)`,
      type: 'warning',
      timestamp: Date.now()
    });

    // Check if player should be removed (2 consecutive timeouts)
    if ((isPlayer && this.state.playerTimeouts >= 2) || (!isPlayer && this.state.opponentTimeouts >= 2)) {
      this.state.gameLog.push({
        action: `🚫 ${isPlayer ? 'You have' : 'Opponent has'} been removed from the table (2 consecutive timeouts)`,
        type: 'error',
        timestamp: Date.now()
      });
      
      // Mark player as removed if it was the human player
      if (isPlayer) {
        this.state.playerRemoved = true;
      }
      
      this.onStateUpdate(this.state);
      return;
    }

    // Auto-action: Fold if there's a bet to call, otherwise check
    if (hasBetToCall) {
      this.state.gameLog.push({
        action: `${isPlayer ? 'You' : 'Opponent'} auto-fold (timed out with bet to call)`,
        type: 'action',
        timestamp: Date.now()
      });
      
      if (isPlayer) {
        this.handlePlayerAction('fold');
      } else {
        // Opponent folds - player wins
        this.endHand(true);
      }
    } else {
      this.state.gameLog.push({
        action: `${isPlayer ? 'You' : 'Opponent'} auto-check (timed out, no bet)`,
        type: 'action',
        timestamp: Date.now()
      });
      
      if (isPlayer) {
        // Player auto-check will trigger normal game flow (AI will act next)
        this.handlePlayerAction('check');
      } else {
        // Simulate opponent check
        this.opponentHasActed = true;
        this.state.currentPlayer = this.playerSeat; // Switch turn back to player
        this.onStateUpdate(this.state);
        
        // Check if round is complete (both acted, bets equal)
        if (this.playerHasActed && this.opponentHasActed && 
            this.state.myBet === this.state.opponentBet) {
          this.advanceStreet();
        } else if (this.onTurnStart) {
          // Start timer for player's next action
          this.onTurnStart(this.playerSeat);
        }
      }
    }
  }

  drawForDealer(): { playerCard: number; opponentCard: number; playerIsDealer: boolean } {
    // In 4-player game, start with dealer at seat 1
    this.initialDealerSet = true;
    const initialDealerSeat = 1;
    
    // Set initial dealer positions  
    this.setDealerPositions(initialDealerSeat);
    
    const dealerPlayer = this.state.players.find(p => p.seat === initialDealerSeat);
    
    this.state.gameLog.push({
      action: `🎴 Initial dealer set to ${dealerPlayer?.isMe ? 'You' : dealerPlayer?.name || `Seat ${initialDealerSeat}`}`,
      type: 'system',
      timestamp: Date.now()
    });
    
    this.onStateUpdate(this.state);
    
    // Return dummy values for compatibility
    return { playerCard: 0, opponentCard: 0, playerIsDealer: initialDealerSeat === this.playerSeat };
  }

  private cardToString(cardNum: number): string {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suit = suits[Math.floor(cardNum / 13)];
    const rank = ranks[cardNum % 13];
    return `${rank}${suit}`;
  }

  private setDealerPositions(dealerSeat: number) {
    // In 4-player poker:
    // - Dealer button on one player
    // - Small Blind is left of dealer (next seat clockwise)
    // - Big Blind is left of small blind (two seats left of dealer)
    // - First to act preflop is left of BB (three seats left of dealer = dealer in 4-player!)
    // - First to act postflop is small blind
    
    const sbSeat = (dealerSeat % 4) + 1; // Left of dealer
    const bbSeat = (sbSeat % 4) + 1; // Left of SB
    
    this.state.players = this.state.players.map(p => ({
      ...p,
      isDealer: p.seat === dealerSeat,
      isSmallBlind: p.seat === sbSeat,
      isBigBlind: p.seat === bbSeat
    }));
    
    console.log(`[Dealer Positions] Dealer: Seat ${dealerSeat}, SB: Seat ${sbSeat}, BB: Seat ${bbSeat}`);
  }

  private rotateDealerButton() {
    // After each hand, dealer button moves clockwise (seat 1 → 2 → 3 → 4 → 1)
    const currentDealer = this.state.players.find(p => p.isDealer);
    const newDealerSeat = currentDealer ? ((currentDealer.seat % 4) + 1) : 1;
    
    this.setDealerPositions(newDealerSeat);
    
    this.state.gameLog.push({
      action: `🔄 Dealer button moved to Seat ${newDealerSeat}`,
      type: 'system',
      timestamp: Date.now()
    });
  }

  startNewHand() {
    // If this is the first hand, draw for dealer
    if (!this.initialDealerSet) {
      this.drawForDealer();
      // Add a delay before starting the actual hand
      setTimeout(() => {
        this.dealNewHand();
      }, 2000);
      return { myCards: [], communityCards: [] };
    }
    
    // Rotate dealer button for subsequent hands
    if (this.handCount > 0) {
      this.rotateDealerButton();
    }
    
    return this.dealNewHand();
  }

  private dealNewHand() {
    this.handCount++;
    
    // Reset action tracking for new hand
    this.playerHasActed = false;
    this.opponentHasActed = false;
    this.lastAggressor = null;
    this.state.showOpponentCards = false;
    this.state.winningHand = undefined;
    this.state.rake = 0;
    this.state.flopDealt = false;
    this.state.awaitingShowMuckDecision = false;
    this.state.showMyCardsAfterFold = false;
    
    // Generate and store deck for this hand
    this.deck = this.shuffleDeck();
    
    // Deal 2 cards to each of 4 players (8 cards total)
    // Indices 0-7 for hole cards, 8-12 for community cards
    let cardIndex = 0;
    const updatedPlayers = this.state.players.map(p => {
      const card1 = this.deck[cardIndex++];
      const card2 = this.deck[cardIndex++];
      return { ...p, cards: [card1, card2], bet: 0, folded: false, allIn: false };
    });
    
    // Get my cards for state
    const myPlayer = updatedPlayers.find(p => p.isMe);
    const myCards = myPlayer?.cards || [];
    
    console.log('[Deal Cards] Dealt to all 4 players');
    
    // Post blinds
    const smallBlindAmount = this.state.smallBlind;
    const bigBlindAmount = this.state.bigBlind;
    
    const sbPlayer = updatedPlayers.find(p => p.isSmallBlind);
    const bbPlayer = updatedPlayers.find(p => p.isBigBlind);
    
    // Check if players can afford blinds
    if (sbPlayer && sbPlayer.stack <= 0) {
      console.log('[Game Over] Small Blind has no chips');
      return { myCards: [], communityCards: [] };
    }
    if (bbPlayer && bbPlayer.stack <= 0) {
      console.log('[Game Over] Big Blind has no chips');
      return { myCards: [], communityCards: [] };
    }
    
    // Post blinds
    let totalPot = 0;
    updatedPlayers.forEach(p => {
      if (p.isSmallBlind && p.stack > 0) {
        const actualSB = Math.min(p.stack, smallBlindAmount);
        p.stack -= actualSB;
        p.bet = actualSB;
        p.allIn = p.stack === 0;
        totalPot += actualSB;
        console.log(`[Blind] SB: ${p.isMe ? 'You' : p.name} posts ${actualSB}`);
      }
      if (p.isBigBlind && p.stack > 0) {
        const actualBB = Math.min(p.stack, bigBlindAmount);
        p.stack -= actualBB;
        p.bet = actualBB;
        p.allIn = p.stack === 0;
        totalPot += actualBB;
        console.log(`[Blind] BB: ${p.isMe ? 'You' : p.name} posts ${actualBB}`);
      }
    });
    
    // Get current highest bet (should be BB)
    const maxBet = Math.max(...updatedPlayers.map(p => p.bet));
    
    // First to act preflop is left of BB (which is dealer in 4-player)
    const bbSeat = bbPlayer?.seat || 1;
    const firstToAct = (bbSeat % 4) + 1;
    
    // Calculate myBet and opponentBet for compatibility
    const myBet = myPlayer?.bet || 0;
    const opponentBet = updatedPlayers.find(p => !p.isMe)?.bet || 0;
    
    this.state = {
      ...this.state,
      players: updatedPlayers,
      myCards,
      opponentCards: [0, 0], // Keep for compatibility
      communityCards: [],
      pot: totalPot,
      street: 'preflop',
      currentPlayer: firstToAct,
      myBet,
      opponentBet,
      currentBet: maxBet,
      gameLog: [
        ...this.state.gameLog,
        { action: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'system', timestamp: Date.now() },
        { action: '🃏 New hand started', type: 'system', timestamp: Date.now() },
        { action: `Dealer: Seat ${updatedPlayers.find(p => p.isDealer)?.seat}`, type: 'system', timestamp: Date.now() },
        { action: `SB: ${sbPlayer?.isMe ? 'You' : sbPlayer?.name} (${smallBlindAmount})`, type: 'blind', timestamp: Date.now() },
        { action: `BB: ${bbPlayer?.isMe ? 'You' : bbPlayer?.name} (${bigBlindAmount})`, type: 'blind', timestamp: Date.now() }
      ]
    };

    console.log(`[New Hand] First to act: Seat ${firstToAct}, Max bet: ${maxBet}`);

    this.onStateUpdate(this.state);
    
    // Start timer for first player
    if (this.onTurnStart) {
      this.onTurnStart(firstToAct);
    }
    
    // If first player is AI, trigger AI action
    const firstPlayer = updatedPlayers.find(p => p.seat === firstToAct);
    if (firstPlayer && !firstPlayer.isMe) {
      console.log('[New Hand] First player is AI, triggering AI action');
      this.aiActionTimeout = setTimeout(() => this.aiAction(), 1500);
    }
    
    return { myCards, communityCards: [] };
  }

  private shuffleDeck(): number[] {
    const deck = Array.from({ length: 52 }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Validate deck integrity - ensure all 52 unique cards
    const deckSet = new Set(deck);
    if (deckSet.size !== 52) {
      console.error('[Deck Error] Duplicate cards in shuffled deck! Size:', deckSet.size);
      // Regenerate deck if corrupted
      return Array.from({ length: 52 }, (_, i) => i).sort(() => Math.random() - 0.5);
    }
    
    console.log('[Deck] Shuffled fresh deck with 52 unique cards');
    return deck;
  }

  async handlePlayerAction(action: string, amount: number = 0) {
    const myPlayer = this.state.players.find(p => p.isMe);
    if (!myPlayer) return;

    // Verify it's actually the player's turn
    if (this.state.currentPlayer !== this.playerSeat) {
      console.warn('Not your turn!');
      return;
    }

    // Prevent betting actions when stack is 0 (all-in already)
    if (myPlayer.stack === 0 && action !== 'check' && action !== 'fold') {
      console.warn('Cannot bet/raise/call when stack is 0 (already all-in)');
      return;
    }

    // Reset player timeout counter on successful action
    this.state.playerTimeouts = 0;

    // Process action
    let newMyBet = this.state.myBet;
    let newMyStack = myPlayer.stack;
    let newPot = this.state.pot;
    let playerFolded = false;

    switch (action) {
      case 'fold':
        playerFolded = true;
        
        // Set state to await show/muck decision
        this.state.awaitingShowMuckDecision = true;
        this.state.gameLog.push({
          action: 'You folded',
          type: 'action',
          timestamp: Date.now()
        });
        this.onStateUpdate(this.state);
        return;

      case 'call':
        const callAmount = Math.min(this.state.opponentBet - this.state.myBet, myPlayer.stack);
        if (callAmount <= 0) break; // Cannot call if no bet to call or no chips
        newMyBet += callAmount;
        newMyStack -= callAmount;
        newPot += callAmount;
        // Clear lastAggressor when calling - this resolves the raise
        this.lastAggressor = null;
        break;

      case 'check':
        // Can only check if there's no bet to call
        if (this.state.opponentBet > this.state.myBet) {
          console.warn('Cannot check when facing a bet!');
          return; // Invalid action
        }
        // No change in bets
        break;

      case 'bet':
      case 'raise':
        // Raise = must CALL opponent's bet + add raise amount on top
        const minRaiseAmount = this.state.bigBlind; // Minimum raise is 1 BB
        const raiseAmount = amount || (this.state.bigBlind * 2);
        
        // Calculate what we need to add to our current bet
        const amountToCall = this.state.opponentBet - this.state.myBet;
        const totalAdditionalBet = amountToCall + raiseAmount;
        
        console.log(`[Bet/Raise] Current stack: ${myPlayer.stack}, amountToCall: ${amountToCall}, raiseAmount: ${raiseAmount}, total needed: ${totalAdditionalBet}`);
        
        // Validate minimum raise (must be at least BB)
        if (raiseAmount < minRaiseAmount && myPlayer.stack > totalAdditionalBet) {
          console.warn('Raise must be at least', minRaiseAmount);
          return; // Invalid raise
        }
        
        // Validate player has enough chips for the total bet
        if (totalAdditionalBet > myPlayer.stack) {
          console.warn(`Not enough chips to raise! Need ${totalAdditionalBet} but only have ${myPlayer.stack}. Going all-in instead.`);
          // Go all-in if trying to bet more than available
          const actualAllIn = myPlayer.stack; // What we can actually add
          console.log(`[All-In Forced] Adding ${actualAllIn} to existing bet of ${this.state.myBet}. New total bet: ${this.state.myBet + actualAllIn}`);
          newMyBet += actualAllIn;
          newPot += actualAllIn;
          newMyStack = 0;
        } else {
          // Player has enough chips
          const totalBet = this.state.opponentBet + raiseAmount;
          newMyBet = totalBet;
          newMyStack -= totalAdditionalBet;
          newPot += totalAdditionalBet;
        }
        break;

      case 'allin':
        const allInAmount = myPlayer.stack;
        if (allInAmount <= 0) break; // No chips to go all-in
        newMyBet += allInAmount;
        newMyStack = 0;
        newPot += allInAmount;
        
        // Log all-in with effective amount (what opponent can match)
        const opponent = this.state.players.find(p => !p.isMe);
        const effectiveAllIn = opponent ? Math.min(allInAmount, opponent.stack + this.state.opponentBet) : allInAmount;
        console.log(`[All-In] Player all-in: ${allInAmount}, Opponent can match: ${effectiveAllIn}`);
        break;
    }

    // Ensure stack never goes negative
    if (newMyStack < 0) {
      console.error(`[Stack Fix] Stack went negative: ${newMyStack}! Fixing... newMyBet before: ${newMyBet}, newPot before: ${newPot}`);
      const overage = Math.abs(newMyStack);
      newMyStack = 0;
      newMyBet -= overage;
      newPot -= overage;
      console.error(`[Stack Fix] After fix: newMyStack: ${newMyStack}, newMyBet: ${newMyBet}, newPot: ${newPot}, overage removed: ${overage}`);
    }

    // Track that player has acted
    this.playerHasActed = true;
    
    // Track if player raised/bet (became aggressor)
    if (action === 'bet' || action === 'raise' || (action === 'allin' && newMyBet > this.state.opponentBet)) {
      this.lastAggressor = 'player';
      this.opponentHasActed = false; // Opponent must respond to raise/bet
    }

    // Format log message properly based on action
    let logMessage = '';
    switch (action) {
      case 'call':
        const actualCallAmount = this.state.opponentBet - this.state.myBet;
        logMessage = `You call ${actualCallAmount}`;
        break;
      case 'bet':
      case 'raise':
        logMessage = `You ${action} ${amount || (this.state.bigBlind * 2)}`;
        break;
      case 'allin':
        logMessage = `You go all-in ${myPlayer.stack}`;
        break;
      case 'check':
        logMessage = 'You check';
        break;
      case 'fold':
        logMessage = 'You fold';
        break;
      default:
        logMessage = `You ${action}${amount ? ` ${amount}` : ''}`;
    }

    // Log final values before state update
    console.log(`[Pre-Update] newMyBet: ${newMyBet}, newMyStack: ${newMyStack}, newPot: ${newPot}, action: ${action}`);
    
    // Update state and switch turn to opponent
    this.state = {
      ...this.state,
      players: this.state.players.map(p => 
        p.isMe ? { ...p, stack: newMyStack, bet: newMyBet, folded: playerFolded, allIn: newMyStack === 0 } : p
      ),
      myBet: newMyBet,
      pot: newPot,
      currentBet: Math.max(newMyBet, this.state.opponentBet),
      currentPlayer: this.opponentSeat, // Switch turn to opponent
      gameLog: [
        ...this.state.gameLog,
        { action: logMessage, type: 'action', timestamp: Date.now() }
      ]
    };

    console.log(`[After State Update] action: ${action}, myBet: ${this.state.myBet}, opponentBet: ${this.state.opponentBet}, newMyBet: ${newMyBet}, playerStack: ${this.state.players.find(p => p.isMe)?.stack}`);
    // Validate pot equals sum of bets (safety check for side pot scenarios)
    const expectedPot = this.state.myBet + this.state.opponentBet;
    const initialPot = this.state.smallBlind + this.state.bigBlind;
    // In first betting round, pot includes blinds
    const streetContributions = this.state.street === 'preflop' ? expectedPot : (this.state.pot - initialPot + expectedPot);
    
    console.log(`[Pot Validation] myBet: ${this.state.myBet}, opponentBet: ${this.state.opponentBet}, pot: ${this.state.pot}, expected: ${expectedPot}`);
    
    this.onStateUpdate(this.state);

    // Check if either player is all-in (no more chips to bet)
    const myPlayerCheck = this.state.players.find(p => p.isMe);
    const opponentPlayerCheck = this.state.players.find(p => !p.isMe);
    const bothAllIn = myPlayerCheck?.stack === 0 && opponentPlayerCheck?.stack === 0;
    const oneAllInBetsEqual = (myPlayerCheck?.stack === 0 || opponentPlayerCheck?.stack === 0) && 
                               this.state.myBet === this.state.opponentBet;

    // If both all-in or one all-in with equal bets, run out the board
    if (bothAllIn || oneAllInBetsEqual) {
      this.state.gameLog.push({
        action: '🔥 All-in detected - running out the board...',
        type: 'street-change',
        timestamp: Date.now()
      });
      this.onStateUpdate(this.state);
      await this.runOutBoard();
      return;
    }

    // Check if betting round is complete BEFORE triggering AI action
    // Round complete = both acted, bets equal, and no outstanding raise
    const roundCompleteBeforeAI = this.playerHasActed && this.opponentHasActed && 
                                   this.state.myBet === this.state.opponentBet &&
                                   this.lastAggressor === null;
    
    if (roundCompleteBeforeAI) {
      console.log('[Round Complete] Both acted, bets equal, advancing street');
      await this.advanceStreet();
      return;
    }

    // AI opponent's turn
    if (!playerFolded) {
      // Cancel any pending AI action from previous setTimeout
      if (this.aiActionTimeout) {
        console.log('[AI Action] Clearing stale AI action timeout');
        clearTimeout(this.aiActionTimeout);
        this.aiActionTimeout = null;
      }
      console.log(`[Before AI Action] myBet: ${this.state.myBet}, opponentBet: ${this.state.opponentBet}, playerHasActed: ${this.playerHasActed}, opponentHasActed: ${this.opponentHasActed}`);
      await this.aiAction();
    }
  }

  private async aiAction() {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Think time

    const opponent = this.state.players.find(p => !p.isMe);
    if (!opponent) return;

    // Reset opponent timeout counter on AI action
    this.state.opponentTimeouts = 0;

    // Evaluate AI hand strength
    const handStrength = this.evaluateAIHandStrength();
    const random = Math.random();
    let action = 'check';
    let amount = 0;

    // betDifference: how much more the PLAYER bet compared to OPPONENT
    const betDifference = this.state.myBet - this.state.opponentBet;
    console.log(`[AI Decision] Street: ${this.state.street}, myBet: ${this.state.myBet}, opponentBet: ${this.state.opponentBet}, betDifference: ${betDifference}`);
    
    // CRITICAL CHECK: If player has bet more than AI, AI MUST respond (call/raise/fold)
    if (betDifference > 0) {
      console.log('[AI] Player has bet more - AI CANNOT CHECK, must call/raise/fold');
      // Player bet MORE than AI - AI is facing a bet and CANNOT CHECK
      // AI must call, fold, or raise
      // Adjust decisions based on hand strength
      const foldThreshold = handStrength < 0.3 ? 0.4 : (handStrength < 0.5 ? 0.2 : 0.05);
      const raiseThreshold = handStrength > 0.7 ? 0.3 : (handStrength > 0.5 ? 0.15 : 0.05);
      
      if (random < foldThreshold) {
        action = 'fold';
        this.endHand(true); // Player wins
        return;
      } else if (random < (1 - raiseThreshold)) {
        action = 'call';
        const callAmount = Math.min(betDifference, opponent.stack);
        this.state.opponentBet += callAmount;
        opponent.stack -= callAmount;
        this.state.pot += callAmount;
        // Clear lastAggressor when AI calls - this resolves the raise
        this.lastAggressor = null;
        
        // Check if AI went all-in on the call
        if (opponent.stack === 0) {
          action = 'allin';
        }
      } else {
        // AI raises: must match player's bet + add raise amount on top
        action = 'raise';
        const raiseAmount = this.state.bigBlind * 2; // AI raises 2 BB
        const totalBet = this.state.myBet + raiseAmount; // Match player + raise
        const additionalBet = totalBet - this.state.opponentBet;
        
        // Validate AI has enough chips
        if (additionalBet > opponent.stack) {
          // Go all-in instead
          action = 'allin';
          amount = opponent.stack;
          this.state.opponentBet += opponent.stack;
          this.state.pot += opponent.stack;
          opponent.stack = 0;
        } else {
          this.state.opponentBet = totalBet;
          opponent.stack -= additionalBet;
          this.state.pot += additionalBet;
          amount = additionalBet; // Report the total additional amount (what player needs to call)
        }
      }
    } else {
      // Betting is even, AI can check or bet
      console.log('[AI] Bets are even - AI can check or bet');
      
      // SAFETY CHECK: Verify bets are truly equal
      if (this.state.myBet !== this.state.opponentBet) {
        console.error(`[AI ERROR] betDifference is 0 but bets aren't equal! myBet: ${this.state.myBet}, opponentBet: ${this.state.opponentBet}`);
        // Force AI to call to match bets
        action = 'call';
        const callAmount = Math.abs(this.state.myBet - this.state.opponentBet);
        if (this.state.myBet > this.state.opponentBet) {
          this.state.opponentBet += callAmount;
          opponent.stack -= callAmount;
          this.state.pot += callAmount;
        }
      } else {
        // More likely to bet with strong hands
        const betThreshold = handStrength > 0.7 ? 0.6 : (handStrength > 0.5 ? 0.4 : 0.3);
        
        if (random < (1 - betThreshold)) {
          action = 'check';
        } else {
          action = 'raise';
          amount = Math.min(this.state.bigBlind * 2, opponent.stack);
          this.state.opponentBet += amount;
          opponent.stack -= amount;
          this.state.pot += amount;
          
          // Check if AI went all-in
          if (opponent.stack === 0) {
            action = 'allin';
          }
        }
      }
    }

    // Ensure AI stack never goes negative
    if (opponent.stack < 0) {
      console.error('AI stack went negative! Fixing...');
      const overage = Math.abs(opponent.stack);
      opponent.stack = 0;
      this.state.opponentBet -= overage;
      this.state.pot -= overage;
    }

    // Track that opponent has acted
    this.opponentHasActed = true;
    
    // Track if opponent raised/bet (became aggressor)
    if (action === 'raise' || action === 'allin') {
      this.lastAggressor = 'opponent';
      this.playerHasActed = false; // Player must respond to raise
    }

    // Update state with opponent's new bet amount for display on table
    this.state = {
      ...this.state,
      players: this.state.players.map(p => 
        !p.isMe ? { ...p, stack: opponent.stack, bet: this.state.opponentBet, allIn: opponent.stack === 0 } : p
      ),
      currentBet: Math.max(this.state.myBet, this.state.opponentBet),
      currentPlayer: this.playerSeat, // Switch turn back to player
      gameLog: [
        ...this.state.gameLog,
        { action: `AI Opponent ${action}${amount ? ` ${amount}` : ''}`, type: 'action', timestamp: Date.now() }
      ]
    };

    console.log(`[AI Pot Validation] myBet: ${this.state.myBet}, opponentBet: ${this.state.opponentBet}, pot: ${this.state.pot}`);
    
    // Handle side pot: If bets are unequal due to all-in, return excess to player with larger bet
    if (this.state.myBet !== this.state.opponentBet) {
      const opponentPlayer = this.state.players.find(p => !p.isMe);
      
      // Check if opponent is all-in and can't match player's bet
      if (opponentPlayer?.stack === 0 && this.state.myBet > this.state.opponentBet) {
        const uncalledBet = this.state.myBet - this.state.opponentBet;
        console.log(`[Side Pot] Opponent all-in for less. Returning ${uncalledBet} to player. myBet: ${this.state.myBet} -> ${this.state.opponentBet}`);
        
        // Return uncalled bet to player
        this.state.players = this.state.players.map(p => 
          p.isMe ? { ...p, stack: p.stack + uncalledBet } : p
        );
        
        // Adjust pot and player's bet to match opponent
        this.state.pot -= uncalledBet;
        this.state.myBet = this.state.opponentBet;
        
        // Add side pot message to log
        this.state.gameLog.push({
          action: `💰 Side pot: ${uncalledBet} returned to you (opponent all-in for less)`,
          type: 'system',
          timestamp: Date.now()
        });
      }
      // Check if player is all-in and can't match opponent's bet (shouldn't happen but safety check)
      else if (this.state.players.find(p => p.isMe)?.stack === 0 && this.state.opponentBet > this.state.myBet) {
        const uncalledBet = this.state.opponentBet - this.state.myBet;
        console.log(`[Side Pot] Player all-in for less. Returning ${uncalledBet} to opponent. opponentBet: ${this.state.opponentBet} -> ${this.state.myBet}`);
        
        // Return uncalled bet to opponent
        this.state.players = this.state.players.map(p => 
          !p.isMe ? { ...p, stack: p.stack + uncalledBet } : p
        );
        
        // Adjust pot and opponent's bet to match player
        this.state.pot -= uncalledBet;
        this.state.opponentBet = this.state.myBet;
        
        this.state.gameLog.push({
          action: `💰 Side pot: ${uncalledBet} returned to opponent (you all-in for less)`,
          type: 'system',
          timestamp: Date.now()
        });
      }
    }
    
    this.onStateUpdate(this.state);

    // Check if either player is all-in
    const myPlayerState = this.state.players.find(p => p.isMe);
    const opponentPlayerState = this.state.players.find(p => !p.isMe);
    const bothAllIn = myPlayerState?.stack === 0 && opponentPlayerState?.stack === 0;
    const oneAllInBetsEqual = (myPlayerState?.stack === 0 || opponentPlayerState?.stack === 0) && 
                               this.state.myBet === this.state.opponentBet;

    // If both all-in or one all-in with equal bets, run out the board
    if (bothAllIn || oneAllInBetsEqual) {
      this.state.gameLog.push({
        action: '🔥 All-in detected - running out the board...',
        type: 'street-change',
        timestamp: Date.now()
      });
      this.onStateUpdate(this.state);
      await this.runOutBoard();
      return;
    }

    // Check if betting round is complete
    // Both must have acted and bets must be equal (and no one just raised)
    const roundComplete = this.playerHasActed && this.opponentHasActed && 
                         this.state.myBet === this.state.opponentBet &&
                         action !== 'raise';
    
    if (roundComplete) {
      await this.advanceStreet();
    } else {
      // It's player's turn again - restart timer
      if (this.onTurnStart) {
        this.onTurnStart(this.playerSeat);
      }
    }
  }

  private async runOutBoard() {
    // When all-in, deal all remaining community cards without betting
    await new Promise(resolve => setTimeout(resolve, 1500));

    while (this.state.street !== 'river') {
      // Deal next street
      let newCommunityCards = [...this.state.communityCards];
      let newStreet: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' = this.state.street;

      switch (this.state.street) {
        case 'preflop':
          // Deal flop
          newCommunityCards = [this.deck[4], this.deck[5], this.deck[6]];
          newStreet = 'flop';
          this.state.flopDealt = true;
          this.state.gameLog.push({
            action: '━━━ 🃏 FLOP DEALT ━━━',
            type: 'street-change',
            timestamp: Date.now()
          });
          break;

        case 'flop':
          // Deal turn
          newCommunityCards.push(this.deck[7]);
          newStreet = 'turn';
          this.state.gameLog.push({
            action: '━━━ 🃏 TURN DEALT ━━━',
            type: 'street-change',
            timestamp: Date.now()
          });
          break;

        case 'turn':
          // Deal river
          newCommunityCards.push(this.deck[8]);
          newStreet = 'river';
          this.state.gameLog.push({
            action: '━━━ 🃏 RIVER DEALT ━━━',
            type: 'street-change',
            timestamp: Date.now()
          });
          break;
      }

      this.state = {
        ...this.state,
        communityCards: newCommunityCards,
        street: newStreet,
      };

      this.onStateUpdate(this.state);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // All cards dealt, go to showdown
    this.showdown();
  }

  private async advanceStreet() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reset bets and action tracking for new street
    this.state.myBet = 0;
    this.state.opponentBet = 0;
    this.state.currentBet = 0;
    this.playerHasActed = false;
    this.opponentHasActed = false;
    this.lastAggressor = null;

    // Use the same deck that was shuffled at the start of the hand
    let newCommunityCards = [...this.state.communityCards];
    let newStreet = this.state.street;

    switch (this.state.street) {
      case 'preflop':
        // Deal flop (indices 4, 5, 6 from deck)
        newCommunityCards = [this.deck[4], this.deck[5], this.deck[6]];
        newStreet = 'flop';
        this.state.flopDealt = true; // Mark that flop was dealt (for rake rules)
        this.state.gameLog.push({
          action: '━━━ 🃏 FLOP DEALT ━━━',
          type: 'street-change',
          timestamp: Date.now()
        });
        break;

      case 'flop':
        // Deal turn (index 7 from deck)
        newCommunityCards.push(this.deck[7]);
        newStreet = 'turn';
        this.state.gameLog.push({
          action: '━━━ 🃏 TURN DEALT ━━━',
          type: 'street-change',
          timestamp: Date.now()
        });
        break;

      case 'turn':
        // Deal river (index 8 from deck)
        newCommunityCards.push(this.deck[8]);
        newStreet = 'river';
        this.state.gameLog.push({
          action: '━━━ 🃏 RIVER DEALT ━━━',
          type: 'street-change',
          timestamp: Date.now()
        });
        break;

      case 'river':
        // Go to showdown
        this.showdown();
        return;
    }

    // In heads-up, Small Blind acts first post-flop (on ALL streets after preflop)
    const sbPlayer = this.state.players.find(p => p.isSmallBlind);
    const sbSeat = sbPlayer?.seat || this.playerSeat;
    
    // Reset bets for new street
    this.state = {
      ...this.state,
      communityCards: newCommunityCards,
      street: newStreet,
      myBet: 0,
      opponentBet: 0,
      players: this.state.players.map(p => ({ ...p, bet: 0 })),
      currentPlayer: sbSeat
    };

    this.onStateUpdate(this.state);
    
    // If AI is Small Blind (first to act), trigger AI action automatically
    const aiIsSmallBlind = sbPlayer && !sbPlayer.isMe;
    if (aiIsSmallBlind) {
      console.log(`[Auto-Action] AI is Small Blind on ${newStreet}, triggering AI action`);
      this.aiActionTimeout = setTimeout(() => this.aiAction(), 500);
    } else {
      // Start timer for human player
      if (this.onTurnStart) {
        this.onTurnStart(sbSeat);
      }
    }
  }

  private showdown() {
    // Reveal opponent cards and determine winner
    this.state.showOpponentCards = true;
    
    this.state.gameLog.push({
      action: '━━━ 🎯 SHOWDOWN ━━━',
      type: 'street-change',
      timestamp: Date.now()
    });

    // Evaluate hands using pokersolver
    const { playerWins, isTie } = this.evaluateHands();
    
    this.onStateUpdate(this.state);
    
    setTimeout(() => {
      this.endHand(playerWins, isTie, true); // true = isShowdown (rake eligible)
    }, 2000);
  }

  private evaluateHands(): { playerWins: boolean; isTie: boolean } {
    const myPlayer = this.state.players.find(p => p.isMe);
    const opponent = this.state.players.find(p => !p.isMe);
    
    if (!myPlayer || !opponent) return { playerWins: false, isTie: false };

    // Debug: Log raw card values
    console.log('[Hand Evaluation] Raw myCards:', this.state.myCards);
    console.log('[Hand Evaluation] Raw opponentCards:', this.state.opponentCards);
    console.log('[Hand Evaluation] Raw communityCards:', this.state.communityCards);

    // Check for duplicate cards in hole cards
    const myCardSet = new Set(this.state.myCards);
    const oppCardSet = new Set(this.state.opponentCards);
    const commCardSet = new Set(this.state.communityCards);
    
    if (myCardSet.size !== this.state.myCards.length) {
      console.error('[Hand Evaluation] ERROR: Duplicate cards in myCards!');
      return { playerWins: Math.random() > 0.5, isTie: false };
    }
    if (oppCardSet.size !== this.state.opponentCards.length) {
      console.error('[Hand Evaluation] ERROR: Duplicate cards in opponentCards!');
      return { playerWins: Math.random() > 0.5, isTie: false };
    }
    
    // Check for overlap between player cards and community cards
    for (const card of this.state.myCards) {
      if (commCardSet.has(card)) {
        console.error('[Hand Evaluation] ERROR: Card', card, 'appears in both myCards and communityCards!');
        return { playerWins: Math.random() > 0.5, isTie: false };
      }
    }
    for (const card of this.state.opponentCards) {
      if (commCardSet.has(card)) {
        console.error('[Hand Evaluation] ERROR: Card', card, 'appears in both opponentCards and communityCards!');
        return { playerWins: Math.random() > 0.5, isTie: false };
      }
    }
    // Check for overlap between player cards
    for (const card of this.state.myCards) {
      if (oppCardSet.has(card)) {
        console.error('[Hand Evaluation] ERROR: Card', card, 'appears in BOTH player hands!');
        return { playerWins: Math.random() > 0.5, isTie: false };
      }
    }

    // Convert card numbers to pokersolver format
    const myHand = this.cardsToPokersolverFormat(this.state.myCards.concat(this.state.communityCards));
    const opponentHand = this.cardsToPokersolverFormat(this.state.opponentCards.concat(this.state.communityCards));

    try {
      // Solve hands
      const myHandResult = Hand.solve(myHand);
      const opponentHandResult = Hand.solve(opponentHand);

      console.log('[Hand Evaluation] My hand:', myHand.join(', '));
      console.log('[Hand Evaluation] My result:', myHandResult.descr, 'Rank:', myHandResult.rank);
      console.log('[Hand Evaluation] Opponent hand:', opponentHand.join(', '));
      console.log('[Hand Evaluation] Opponent result:', opponentHandResult.descr, 'Rank:', opponentHandResult.rank);

      // Compare hands (pokersolver automatically handles kickers)
      const winners = Hand.winners([myHandResult, opponentHandResult]);
      
      console.log('[Hand Evaluation] Winners count:', winners.length);
      if (winners.length === 1) {
        console.log('[Hand Evaluation] Winner:', winners[0] === myHandResult ? 'Player' : 'Opponent');
      } else {
        console.log('[Hand Evaluation] TIE - Split pot');
      }
      
      // Check for tie (both hands in winners array)
      const isTie = winners.length > 1;
      const playerWins = !isTie && winners[0] === myHandResult;
      
      // Store hand descriptions
      const myHandDesc = myHandResult.descr;
      const oppHandDesc = opponentHandResult.descr;
      
      if (isTie) {
        this.state.winningHand = `Split pot! Both players have ${myHandDesc}`;
      } else {
        this.state.winningHand = playerWins 
          ? `You win with ${myHandDesc}! (Opponent had ${oppHandDesc})`
          : `Opponent wins with ${oppHandDesc}! (You had ${myHandDesc})`;
      }
      
      this.state.gameLog.push({
        action: `🃏 Your hand: ${myHandDesc}`,
        type: 'showdown',
        timestamp: Date.now()
      });
      
      this.state.gameLog.push({
        action: `🃏 Opponent hand: ${oppHandDesc}`,
        type: 'showdown',
        timestamp: Date.now()
      });

      return { playerWins, isTie };
    } catch (error) {
      console.error('Hand evaluation error:', error);
      return { playerWins: Math.random() > 0.5, isTie: false }; // Fallback
    }
  }

  private cardsToPokersolverFormat(cardNumbers: number[]): string[] {
    const suits = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    return cardNumbers.map(cardNum => {
      const suit = suits[Math.floor(cardNum / 13)];
      const rank = ranks[cardNum % 13];
      return rank + suit;
    });
  }

  private endHand(playerWins: boolean, isTie: boolean = false, isShowdown: boolean = false) {
    const myPlayer = this.state.players.find(p => p.isMe);
    const opponent = this.state.players.find(p => !p.isMe);

    if (!myPlayer || !opponent) return;

    // Rake Policy: Apply 5% rake if and only if the flop is dealt
    // Rake is collected whether hand ends by fold OR showdown, as long as flop was seen
    // Constants
    const RAKE_BPS = 500; // 5% = 500 basis points
    const MAX_RAKE = this.state.bigBlind * 2; // Cap: 2x big blind (2000 chips)
    const MIN_POT_FOR_RAKE = this.state.bigBlind; // Don't rake pots below 1 BB
    
    let rake = 0;
    
    // Only rake if flop was dealt (regardless of fold or showdown)
    if (!this.state.flopDealt) {
      // Pre-flop fold - no rake
      rake = 0;
      this.state.gameLog.push({
        action: '💰 No rake (hand ended pre-flop)',
        type: 'info',
        timestamp: Date.now()
      });
    } else if (this.state.pot < MIN_POT_FOR_RAKE) {
      // Pot too small to rake (rare case)
      rake = 0;
      this.state.gameLog.push({
        action: '💰 No rake (pot below minimum)',
        type: 'info',
        timestamp: Date.now()
      });
    } else {
      // Calculate rake: 5% of pot, capped at MAX_RAKE
      // Collected whenever flop is dealt, whether hand ends by fold or showdown
      const rakeRaw = Math.floor((this.state.pot * RAKE_BPS) / 10000);
      rake = Math.min(rakeRaw, MAX_RAKE);
      
      this.state.gameLog.push({
        action: `💰 Rake: ${rake.toLocaleString()} SHIDO (5% of pot, cap: ${MAX_RAKE.toLocaleString()})`,
        type: 'info',
        timestamp: Date.now()
      });
    }
    
    const potAfterRake = this.state.pot - rake;
    
    // Track rake
    this.state.rake = rake;
    this.state.totalRakeCollected += rake;
    
    // Handle split pot (tie) or single winner
    if (isTie) {
      // Split pot evenly between both players
      const splitAmount = Math.floor(potAfterRake / 2);
      myPlayer.stack += splitAmount;
      opponent.stack += splitAmount;
      
      // If there's an odd chip, it goes to the player in earlier position (SB)
      const oddChip = potAfterRake % 2;
      if (oddChip > 0) {
        const sbPlayer = this.state.players.find(p => p.isSmallBlind);
        if (sbPlayer) {
          sbPlayer.stack += oddChip;
        }
      }
      
      this.state.gameLog.push({
        action: `🤝 Split pot! Each player receives ${splitAmount.toLocaleString()} SHIDO`,
        type: 'result',
        timestamp: Date.now()
      });
    } else {
      // Single winner gets entire pot after rake
      const winner = playerWins ? myPlayer : opponent;
      winner.stack += potAfterRake;
      
      // Play win sound if player wins
      if (playerWins) {
        playWinPot();
      }
      
      this.state.gameLog.push({
        action: playerWins 
          ? `🎉 You won ${potAfterRake.toLocaleString()} SHIDO!` 
          : `😞 AI Opponent won ${potAfterRake.toLocaleString()} SHIDO`,
        type: 'result',
        timestamp: Date.now()
      });
    }
    
    // Show winning hand if available
    const handInfo = this.state.winningHand || '';
    if (handInfo) {
      this.state.gameLog.push({
        action: `🏆 ${handInfo}`,
        type: 'result',
        timestamp: Date.now()
      });
    }

    this.onStateUpdate(this.state);

    // Check if either player is busted before starting next hand
    if (myPlayer.stack <= 0 || opponent.stack <= 0) {
      console.log('[Game Over] Player busted - cannot continue');
      this.state.gameLog.push({
        action: '🏁 Game Over - Player busted!',
        type: 'system',
        timestamp: Date.now()
      });
      this.onStateUpdate(this.state);
      return; // Don't start a new hand
    }

    // Start new hand after delay (dealer will rotate automatically)
    setTimeout(() => {
      const result = this.startNewHand();
      // If cards were dealt immediately (not first hand), update them
      if (result.myCards.length > 0) {
        this.onStateUpdate(this.state);
      }
    }, 3000);
  }

  private evaluateAIHandStrength(): number {
    // Simple hand strength evaluation (0 = weak, 1 = strong)
    const opponentCards = this.state.opponentCards;
    const communityCards = this.state.communityCards;
    
    // Pre-flop: evaluate pocket cards
    if (communityCards.length === 0) {
      const card1 = opponentCards[0] % 13;
      const card2 = opponentCards[1] % 13;
      const isPair = card1 === card2;
      const highCard = Math.max(card1, card2);
      
      if (isPair) return highCard / 13 + 0.5; // Pairs are strong
      if (Math.abs(card1 - card2) <= 2) return highCard / 13 + 0.3; // Connected cards
      return highCard / 13; // High card value
    }
    
    // Post-flop: use pokersolver
    try {
      const allCards = this.cardsToPokersolverFormat(opponentCards.concat(communityCards));
      const hand = Hand.solve(allCards);
      const rank = hand.rank;
      
      // Rank: 1=high card, 2=pair, 3=two pair, 4=trips, 5=straight, 6=flush, 7=full house, 8=quads, 9=straight flush
      return Math.min(rank / 9, 1.0);
    } catch (error) {
      return 0.5; // Default medium strength
    }
  }

  getState() {
    return this.state;
  }
}
