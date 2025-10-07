# Dealer Button & Blind Rotation System

## Overview
Implemented proper poker dealer button rotation system with initial high card draw to determine the starting dealer.

## Features Implemented

### 1. Initial High Card Draw (First Hand Only)
When the game first starts, both players draw a card to determine who deals first:
- **LOWEST card becomes the initial dealer**
- The draw is displayed in the game log
- Shows both cards drawn and announces the winner

### 2. Dealer Button Position
In heads-up poker with 2 players:
- **Player 1 (Seat 1): Dealer + Big Blind**
- **Player 2 (Seat 4): Small Blind**
- Player 1 has the dealer button AND posts the big blind
- Player 2 posts the small blind only

### 3. Action Order

#### Pre-Flop
- **Small Blind (Player 2) acts FIRST**
- Dealer/Big Blind (Player 1) acts second

#### Post-Flop (Flop, Turn, River)
- **Small Blind (Player 2) acts FIRST**
- Dealer/Big Blind (Player 1) acts second

### 4. Betting Round Completion
- A betting round ends when:
  1. Both players have acted at least once
  2. Both players have equal bets
  3. No one just raised
- **Important**: Once a player has acted and the opponent calls, the original player does NOT get another turn unless the opponent raises
- If a player raises, the other player must respond (call, raise, or fold)

### 5. Dealer Button Rotation
After each hand completes:
- Dealer button rotates to the other player
- The player who was Small Blind becomes Dealer + Big Blind
- The player who was Dealer + Big Blind becomes Small Blind
- This ensures both players get equal turns in each position

## Code Changes

### HeadsUpPokerGame.ts
1. Added `drawForDealer()` method - draws cards to determine initial dealer
2. Added `setDealerPositions()` - sets dealer, SB, and BB flags correctly
   - Player 1: Dealer + Big Blind
   - Player 2: Small Blind
3. Added `rotateDealerButton()` - rotates positions after each hand
4. Modified `startNewHand()` - calls dealer draw on first hand, rotates on subsequent hands
5. Split hand dealing into `dealNewHand()` method
6. Fixed action order:
   - Pre-flop: Small Blind acts first
   - Post-flop: Small Blind acts first
7. Added betting round completion logic:
   - Tracks who has acted (`playerHasActed`, `opponentHasActed`)
   - Tracks last aggressor (`lastAggressor`)
   - Prevents re-checking/raising after opponent calls
   - Only allows action again if opponent raises
8. Added tracking variables:
   - `initialDealerSet` - tracks if initial dealer determined
   - `handCount` - counts hands played
   - `playerSeat` and `opponentSeat` - store seat numbers
   - `playerHasActed` / `opponentHasActed` - track action state
   - `lastAggressor` - track who raised/bet last

### App.tsx
1. Updated game initialization to handle dealer draw
2. Shows appropriate message during dealer draw
3. Delays timer start until after dealer is determined

## Game Flow

### First Hand
1. Game starts
2. High card draw happens (2 seconds delay)
3. Lowest card gets dealer button
4. Blinds are posted based on button position
5. Cards are dealt
6. Hand plays normally

### Subsequent Hands
1. Hand ends (winner determined)
2. Pot awarded to winner
3. 3-second delay
4. Dealer button rotates to other player
5. Blinds rotate with button
6. New cards dealt
7. Hand continues

## Visual Indicators

Players can see:
- **Dealer Button (D)** - White poker chip on dealer's seat
- **Small Blind (SB)** - Red poker chip on SB player
- **Big Blind (BB)** - Blue poker chip on BB player
- Game log entries showing:
  - High card draw results
  - Button rotations
  - New hand starts
  - Blind postings

## Benefits

1. ✅ Fair dealer determination (random card draw)
2. ✅ Proper poker rules enforced
3. ✅ Equal opportunities for both players
4. ✅ Correct action order (SB first pre-flop, BB first post-flop)
5. ✅ Clear visual indicators of positions
6. ✅ Automatic rotation - no manual intervention needed

## Testing

To test:
1. Start a demo game
2. Observe the high card draw message
3. Check game log for draw results
4. Note which player has the dealer button
5. Play a complete hand
6. Watch the dealer button rotate to the other player
7. Verify positions change each hand

The system ensures a fair, regulation-compliant heads-up poker experience! 🎴♠️♥️♦️♣️
